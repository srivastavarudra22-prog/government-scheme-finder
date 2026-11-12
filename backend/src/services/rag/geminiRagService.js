/**
 * @file geminiRagService.js
 * @description Live RAG implementation using Google Gemini embeddings + Supabase pgvector.
 * 
 * Implements RagServiceInterface with:
 *   - Gemini text-embedding-004 (768-dim) for query vectorization
 *   - Supabase RPC search_scheme_chunks for HNSW cosine similarity search
 *   - Gemini 1.5 Flash/Pro for grounded, cited answer generation
 * 
 * Drop-in replacement for RagServiceStub — no other files need changes
 * beyond setting RAG_PROVIDER=gemini in .env.
 */

const https = require('https');
const { createClient } = require('@supabase/supabase-js');
const { RagServiceInterface } = require('./ragService');

// ─── Supabase client (service role for vector search RPC) ────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// ─── Gemini API helper ────────────────────────────────────────────────────────

/**
 * Makes an HTTPS POST request to the Gemini API and returns parsed JSON.
 * Automatically retries up to 2 times on transient 429/503 errors.
 */
async function geminiRequest(path, body, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const options = {
          hostname: 'generativelanguage.googleapis.com',
          path: `${path}?key=${process.env.GEMINI_API_KEY}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                const err = new Error(`Gemini API error (${parsed.error.code}): ${parsed.error.message}`);
                err.code = parsed.error.code;
                reject(err);
              } else {
                resolve(parsed);
              }
            } catch (e) {
              reject(new Error(`Gemini JSON parse error: ${e.message}. Response: ${data.slice(0, 300)}`));
            }
          });
        });

        req.on('error', reject);
        req.setTimeout(30000, () => {
          req.destroy(new Error('Gemini API request timed out'));
        });
        req.write(payload);
        req.end();
      });
    } catch (err) {
      const isTransient = err.code === 503 || err.code === 429 || /timed out|ECONNRESET/i.test(err.message);
      if (!isTransient || attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
}

// ─── GeminiRagService ────────────────────────────────────────────────────────

class GeminiRagService extends RagServiceInterface {
  constructor() {
    super();
    this.embeddingModel = 'Xenova/bge-base-en-v1.5';
    this.embeddingDims = 768;
    this.chatModel = process.env.GEMINI_CHAT_MODEL || 'gemini-flash-lite-latest';
    this.provider = 'gemini';
    this.vectorStore = 'pgvector';
    this._extractorPromise = null;

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required in environment variables.');
    }
  }

  async _getExtractor() {
    if (!this._extractorPromise) {
      const { pipeline } = await import('@huggingface/transformers');
      this._extractorPromise = pipeline('feature-extraction', this.embeddingModel, { dtype: 'q8' });
    }
    return this._extractorPromise;
  }

  // ── Status ──────────────────────────────────────────────────────────────────

  async getStatus() {
    try {
      // Quick check: count rows in scheme_chunks
      const { count, error } = await supabase
        .from('scheme_chunks')
        .select('*', { count: 'exact', head: true });

      if (error) {
        return {
          isReady: false,
          provider: this.provider,
          vectorStore: this.vectorStore,
          message: `pgvector table not ready: ${error.message}`,
          capabilities: { naturalLanguageQnA: false, semanticSearch: false, hybridFiltering: false },
        };
      }

      return {
        isReady: count > 0,
        provider: this.provider,
        vectorStore: this.vectorStore,
        embeddingModel: this.embeddingModel,
        chatModel: this.chatModel,
        chunkCount: count,
        message: count > 0
          ? `RAG active: ${count.toLocaleString()} semantic chunks indexed across 4,732 schemes.`
          : 'RAG provider configured but scheme_chunks table is empty. Run the ingestion script.',
        capabilities: {
          naturalLanguageQnA: count > 0,
          semanticSearch: count > 0,
          hybridFiltering: count > 0,
        },
      };
    } catch (err) {
      return {
        isReady: false,
        provider: this.provider,
        vectorStore: this.vectorStore,
        message: `Status check failed: ${err.message}`,
        capabilities: { naturalLanguageQnA: false, semanticSearch: false, hybridFiltering: false },
      };
    }
  }

  // ── Embedding ────────────────────────────────────────────────────────────────

  async embedText(text) {
    const extractor = await this._getExtractor();
    const queryText = `Represent this sentence for searching relevant passages: ${text}`;
    const output = await extractor(queryText, { pooling: 'cls', normalize: true });
    return Array.from(output.data);
  }

  // ── Semantic Search ──────────────────────────────────────────────────────────

  async semanticSearch({ query, topK = 10, filters = {} }) {
    // 1. Embed the query
    const queryEmbedding = await this.embedText(query);

    // 2. Call Supabase RPC for HNSW cosine similarity search
    const { data: chunks, error } = await supabase.rpc('search_scheme_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.4,
      match_count: topK,
      filter_state: filters.state || null,
      filter_category: filters.primary_category || null,
    });

    if (error) {
      throw new Error(`Vector search RPC failed: ${error.message}`);
    }

    // 3. De-duplicate by scheme_id (keep highest similarity per scheme)
    const seen = new Map();
    for (const chunk of (chunks || [])) {
      const existing = seen.get(chunk.scheme_id);
      if (!existing || chunk.similarity > existing.similarity) {
        seen.set(chunk.scheme_id, chunk);
      }
    }

    const results = Array.from(seen.values()).map((chunk) => ({
      schemeId: chunk.scheme_id,
      title: chunk.metadata?.scheme_name || `Scheme #${chunk.scheme_id}`,
      similarity: parseFloat(chunk.similarity.toFixed(4)),
      excerpt: chunk.content.slice(0, 300) + (chunk.content.length > 300 ? '...' : ''),
      chunkType: chunk.chunk_type,
      metadata: chunk.metadata,
    }));

    return {
      isReady: true,
      query,
      results,
      totalFound: results.length,
    };
  }

  // ── Retrieve Context ─────────────────────────────────────────────────────────

  async retrieveContext({ schemeIds, section }) {
    let query = supabase
      .from('scheme_chunks')
      .select('scheme_id, chunk_type, content, metadata')
      .in('scheme_id', schemeIds);

    if (section) {
      query = query.eq('chunk_type', section);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Context retrieval failed: ${error.message}`);
    }

    return {
      isReady: true,
      chunks: (data || []).map((c) => ({
        schemeId: c.scheme_id,
        section: c.chunk_type,
        content: c.content,
        metadata: c.metadata,
      })),
    };
  }

  // ── Ask Question (Full RAG Q&A Pipeline) ─────────────────────────────────────

  async askQuestion({ query, citizenProfile = {}, topK = 10, conversationHistory = [] }) {
    // ── Step 1: Embed the question ─────────────────────────────────────────────
    const queryEmbedding = await this.embedText(query);

    // ── Step 2: Hybrid vector search with profile-based pre-filtering ──────────
    const { data: chunks, error: searchErr } = await supabase.rpc('search_scheme_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.35,
      match_count: topK * 2,   // Fetch more, then de-dup by scheme
      filter_state: citizenProfile.state || null,
      filter_category: citizenProfile.primary_category || null,
    });

    if (searchErr) {
      throw new Error(`Vector search failed: ${searchErr.message}`);
    }

    if (!chunks || chunks.length === 0) {
      return {
        isReady: true,
        answer: "I could not find any matching government schemes for your question in the verified catalog of 4,732 schemes. Please try rephrasing your question, or use the **Filter Schemes** tool with specific eligibility criteria.",
        sources: [],
        confidence: 'low',
      };
    }

    // ── Step 3: De-duplicate chunks → keep top scheme per scheme_id ────────────
    const schemeMap = new Map();
    for (const chunk of chunks) {
      const existing = schemeMap.get(chunk.scheme_id);
      if (!existing || chunk.similarity > existing.bestSimilarity) {
        schemeMap.set(chunk.scheme_id, {
          ...chunk,
          bestSimilarity: chunk.similarity,
          allChunks: [chunk],
        });
      } else {
        existing.allChunks.push(chunk);
      }
    }

    // Take top-K unique schemes by similarity
    const topSchemes = Array.from(schemeMap.values())
      .sort((a, b) => b.bestSimilarity - a.bestSimilarity)
      .slice(0, topK);

    // ── Step 4: Build grounded context string ──────────────────────────────────
    const contextBlocks = topSchemes.map((scheme, i) => {
      // Collect the best chunks for this scheme (prefer overview + eligibility)
      const sortedChunks = scheme.allChunks
        .sort((a, b) => {
          const order = { overview: 0, eligibility: 1, process: 2 };
          return (order[a.chunk_type] ?? 3) - (order[b.chunk_type] ?? 3);
        })
        .slice(0, 2);  // Max 2 chunks per scheme in context

      const content = sortedChunks.map((c) => c.content).join('\n');
      return `[Source ${i + 1} | ID: ${scheme.scheme_id} | Similarity: ${(scheme.bestSimilarity * 100).toFixed(0)}%]\n${content}`;
    });

    const context = contextBlocks.join('\n\n---\n\n');

    // ── Step 5: Build citizen profile string ───────────────────────────────────
    const profileParts = [
      citizenProfile.age ? `Age: ${citizenProfile.age}` : null,
      citizenProfile.gender ? `Gender: ${citizenProfile.gender}` : null,
      citizenProfile.state ? `State: ${citizenProfile.state}` : null,
      citizenProfile.occupation ? `Occupation: ${citizenProfile.occupation}` : null,
      citizenProfile.education ? `Education: ${citizenProfile.education}` : null,
      citizenProfile.caste_category ? `Category: ${citizenProfile.caste_category}` : null,
      citizenProfile.income ? `Annual Income: ₹${citizenProfile.income}` : null,
      citizenProfile.area ? `Area: ${citizenProfile.area}` : null,
    ].filter(Boolean);

    const profileText = profileParts.length > 0
      ? `\n\nCitizen Profile:\n${profileParts.join('\n')}`
      : '';

    // ── Step 6: Build conversation history context ─────────────────────────────
    const historyContext = conversationHistory.length > 0
      ? '\n\nPrevious conversation:\n' +
        conversationHistory
          .slice(-6)  // Last 3 exchanges
          .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
          .join('\n')
      : '';

    // ── Step 7: Call Gemini with strict anti-hallucination prompt ─────────────
    const systemPrompt = `You are an official Indian Government Welfare Scheme Advisor for the Government Scheme Finder platform.

RULES (follow strictly):
1. Answer ONLY using information found in the provided Context below.
2. NEVER invent, guess, or extrapolate scheme names, eligibility figures, amounts, or application steps.
3. If the context does not contain a sufficient answer, say exactly: "I could not find a matching scheme in the verified catalog. Please use the Filter Schemes tool for more options."
4. Always cite schemes by their exact name AND ID number from the Source references.
5. Use simple language (grade 8 reading level). Keep answers under 400 words.
6. Format responses with bullet points and clear headings when listing multiple schemes.
7. If a citizen profile is provided, highlight schemes that best match their profile.
8. At the end, always mention 1-2 key eligibility requirements the user should verify.`;

    const userContent = `Context (verified government scheme data):
${context}
${profileText}
${historyContext}

User's Question: ${query}

Please provide a helpful, grounded answer citing the relevant scheme IDs from the context.`;

    // Build Gemini generateContent request
    const geminiBody = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userContent }] }],
      generationConfig: {
        temperature: 0.1,     // Low temperature = more factual
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    };

    const response = await geminiRequest(
      `/v1beta/models/${this.chatModel}:generateContent`,
      geminiBody
    );

    const answer = response.candidates?.[0]?.content?.parts?.[0]?.text
      || "I'm sorry, I couldn't generate a response. Please try again.";

    // ── Step 8: Build structured source citations ─────────────────────────────
    const sources = topSchemes.slice(0, 5).map((scheme) => ({
      schemeId: scheme.scheme_id,
      schemeName: scheme.metadata?.scheme_name || `Scheme #${scheme.scheme_id}`,
      similarity: parseFloat(scheme.bestSimilarity.toFixed(4)),
      state: scheme.metadata?.state || 'N/A',
      category: scheme.metadata?.primary_category || 'N/A',
      slug: scheme.metadata?.slug || null,
    }));

    return {
      isReady: true,
      answer,
      sources,
      confidence: topSchemes[0]?.bestSimilarity > 0.7 ? 'high' : topSchemes[0]?.bestSimilarity > 0.5 ? 'medium' : 'low',
      chunksRetrieved: chunks.length,
    };
  }
}

module.exports = { GeminiRagService };
