-- ============================================================
-- RAG Vector Store Migration for Government Scheme Finder
-- Run this ONCE in your Supabase project SQL Editor:
-- https://supabase.com/dashboard → SQL Editor → New Query
-- ============================================================

-- Step 1: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Create the semantic chunk storage table
CREATE TABLE IF NOT EXISTS public.scheme_chunks (
    id          BIGSERIAL PRIMARY KEY,
    scheme_id   INTEGER NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL CHECK (chunk_index BETWEEN 0 AND 2),
    chunk_type  VARCHAR(32) NOT NULL CHECK (chunk_type IN ('overview', 'eligibility', 'process')),
    content     TEXT NOT NULL,
    metadata    JSONB DEFAULT '{}'::jsonb,
    embedding   vector(768),    -- Gemini text-embedding-004: 768 dimensions
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: HNSW index for fast approximate nearest-neighbour (ANN) cosine similarity
-- m=16 and ef_construction=64 are well-balanced for ~14k vectors
CREATE INDEX IF NOT EXISTS idx_scheme_chunks_embedding_hnsw
ON public.scheme_chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Step 4: Index for efficient scheme_id joins (used when fetching full scheme details)
CREATE INDEX IF NOT EXISTS idx_scheme_chunks_scheme_id
ON public.scheme_chunks(scheme_id);

-- Step 5: GIN index on JSONB metadata for fast filter queries (state, category, etc.)
CREATE INDEX IF NOT EXISTS idx_scheme_chunks_metadata_gin
ON public.scheme_chunks
USING gin(metadata);

-- Step 6: Composite index for chunk_type filtering
CREATE INDEX IF NOT EXISTS idx_scheme_chunks_type
ON public.scheme_chunks(chunk_type);

-- Step 7: Supabase RPC function for hybrid vector + metadata search
-- Called by GeminiRagService.semanticSearch() and askQuestion()
CREATE OR REPLACE FUNCTION search_scheme_chunks(
    query_embedding  vector(768),
    match_threshold  FLOAT    DEFAULT 0.4,
    match_count      INT      DEFAULT 20,
    filter_state     TEXT     DEFAULT NULL,
    filter_category  TEXT     DEFAULT NULL
)
RETURNS TABLE (
    id          BIGINT,
    scheme_id   INTEGER,
    chunk_type  VARCHAR,
    content     TEXT,
    metadata    JSONB,
    similarity  FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER   -- Runs as table owner, bypasses RLS for read-only search
AS $$
BEGIN
    RETURN QUERY
    SELECT
        sc.id,
        sc.scheme_id,
        sc.chunk_type,
        sc.content,
        sc.metadata,
        (1 - (sc.embedding <=> query_embedding))::FLOAT AS similarity
    FROM public.scheme_chunks sc
    WHERE
        -- Cosine similarity threshold (0 = unrelated, 1 = identical)
        (1 - (sc.embedding <=> query_embedding)) > match_threshold

        -- Optional: hard filter by state
        AND (
            filter_state IS NULL
            OR sc.metadata->>'state' ILIKE '%' || filter_state || '%'
            OR sc.metadata->>'state' ILIKE '%All%'
            OR sc.metadata->>'govt_tier' = 'Central Government'
        )

        -- Optional: hard filter by category
        AND (
            filter_category IS NULL
            OR sc.metadata->>'primary_category' ILIKE '%' || filter_category || '%'
        )

    ORDER BY sc.embedding <=> query_embedding   -- ORDER BY distance (ascending = most similar first)
    LIMIT match_count;
END;
$$;

-- Step 8: Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION search_scheme_chunks TO anon, authenticated;

-- ✅ Done! Verify by running:
-- SELECT COUNT(*) FROM public.scheme_chunks;  -- Should be 0 until ingest-rag.js runs
-- SELECT * FROM pg_extension WHERE extname = 'vector';  -- Should show vector extension
