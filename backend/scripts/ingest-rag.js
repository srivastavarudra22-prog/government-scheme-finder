/**
 * @file ingest-rag.js
 * @description One-time RAG ingestion script.
 * 
 * Fetches all 4,732 schemes from Supabase, chunks them into 3 semantic
 * segments (overview, eligibility, process), generates Gemini embeddings,
 * and stores everything in public.scheme_chunks with HNSW vector index.
 * 
 * Usage:
 *   node backend/scripts/ingest-rag.js              # Fresh run
 *   node backend/scripts/ingest-rag.js --resume     # Resume from last saved scheme_id
 * 
 * Requirements:
 *   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY in backend/.env
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// ─── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const EMBEDDING_MODEL = 'Xenova/bge-base-en-v1.5';
const EMBEDDING_DIMS = 768;

const PAGE_SIZE = 100;       // Schemes per Supabase page (300 chunks)
const EMBED_BATCH = 16;      // Small batches minimize padding overhead (~10x faster)
const INSERT_BATCH = 25;     // Small insert batches prevent Supabase statement timeouts
const MAX_CHUNK_CHARS = 750; // Caps sequence length for fast CPU attention
const PROGRESS_FILE = path.join(__dirname, '.ingest_progress.json');

// ─── Validation ───────────────────────────────────────────────────────────────
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('\n❌ Missing required environment variables!');
  console.error('   Please add to backend/.env:');
  if (!SUPABASE_URL) console.error('   - SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// ─── Supabase client (service role — bypasses RLS for inserts) ───────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    }
  } catch {}
  return { lastSchemeId: 0, processedCount: 0 };
}

function saveProgress(lastSchemeId, processedCount) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ lastSchemeId, processedCount }));
}

/**
 * Builds 3 text chunks per scheme using actual column names from public.schemes
 */
function buildChunks(scheme) {
  const stateParts = Array.isArray(scheme.state)
    ? scheme.state.join(', ')
    : (scheme.state || 'Central/All');

  const chunks = [
    // ── Chunk 0: Overview ───────────────────────────────────────────────────
    {
      chunk_type: 'overview',
      content: [
        `Scheme Name: ${scheme.title}`,
        scheme.ministry ? `Ministry/Department: ${scheme.ministry}` : null,
        `Government Level: ${scheme.govt_tier || 'N/A'}`,
        `State/Region: ${stateParts}`,
        `Category: ${scheme.primary_category || 'N/A'}`,
        scheme.secondary_categories?.length
          ? `Sub-categories: ${Array.isArray(scheme.secondary_categories) ? scheme.secondary_categories.join(', ') : scheme.secondary_categories}`
          : null,
        scheme.description ? `Description: ${scheme.description}` : null,
        scheme.benefits ? `Benefits: ${scheme.benefits}` : null,
        scheme.beneficiaries ? `Target Beneficiaries: ${scheme.beneficiaries}` : null,
      ].filter(Boolean).join('\n'),
    },
    // ── Chunk 1: Eligibility ────────────────────────────────────────────────
    {
      chunk_type: 'eligibility',
      content: [
        `Scheme Name: ${scheme.title}`,
        scheme.gender ? `Gender: ${scheme.gender}` : null,
        scheme.age_display ? `Age Requirement: ${scheme.age_display}` : null,
        scheme.caste_category ? `Caste/Category: ${scheme.caste_category}` : null,
        scheme.occupation ? `Occupation: ${scheme.occupation}` : null,
        scheme.education ? `Education Qualification: ${scheme.education}` : null,
        scheme.income_limit_display ? `Income Limit: ${scheme.income_limit_display}` : null,
        scheme.max_income ? `Maximum Annual Income: ₹${scheme.max_income}` : null,
        scheme.is_bpl_only ? `BPL Required: Yes (Below Poverty Line families only)` : null,
        scheme.area ? `Area: ${scheme.area}` : null,
        scheme.target_type ? `Target Type: ${scheme.target_type}` : null,
      ].filter(Boolean).join('\n'),
    },
    // ── Chunk 2: Application Process ────────────────────────────────────────
    {
      chunk_type: 'process',
      content: [
        `Scheme Name: ${scheme.title}`,
        scheme.application_process ? `How to Apply: ${scheme.application_process}` : null,
        scheme.required_documents ? `Documents Required: ${scheme.required_documents}` : null,
        scheme.application_method ? `Application Method: ${scheme.application_method}` : null,
        scheme.application_url ? `Apply Online: ${scheme.application_url}` : null,
        scheme.official_website ? `Official Website: ${scheme.official_website}` : null,
        scheme.source_url ? `More Info: ${scheme.source_url}` : null,
      ].filter(Boolean).join('\n'),
    },
  ];

  return chunks.map((chunk, i) => ({
    scheme_id: scheme.id,
    chunk_index: i,
    chunk_type: chunk.chunk_type,
    content: chunk.content,
    metadata: {
      scheme_name: scheme.title,
      slug: scheme.slug || null,
      state: stateParts,
      govt_tier: scheme.govt_tier || null,
      primary_category: scheme.primary_category || null,
      gender: scheme.gender || 'Any',
      caste_category: scheme.caste_category || 'All',
      occupation: scheme.occupation || null,
      education: scheme.education || null,
      max_income: scheme.max_income || null,
      is_bpl_only: scheme.is_bpl_only || false,
      area: scheme.area || 'Both',
    },
  }));
}

let extractorPromise = null;
async function getExtractor() {
  if (!extractorPromise) {
    const { pipeline } = await import('@huggingface/transformers');
    extractorPromise = pipeline('feature-extraction', EMBEDDING_MODEL, { dtype: 'q8' });
  }
  return extractorPromise;
}

/**
 * Embeds a batch of chunks locally using Xenova/bge-base-en-v1.5 (768-dim)
 */
async function embedBatch(chunks) {
  const extractor = await getExtractor();
  const texts = chunks.map((c) => c.content.slice(0, MAX_CHUNK_CHARS));
  const output = await extractor(texts, { pooling: 'cls', normalize: true });
  const dims = output.dims[1];
  const data = output.data;

  return chunks.map((chunk, idx) => {
    const start = idx * dims;
    const vec = Array.from(data.subarray(start, start + dims));
    return {
      ...chunk,
      embedding: `[${vec.join(',')}]`,
    };
  });
}

/**
 * Inserts rows into Supabase in smaller sub-batches with retry logic
 */
async function insertWithRetry(rows) {
  for (let i = 0; i < rows.length; i += INSERT_BATCH) {
    const slice = rows.slice(i, i + INSERT_BATCH);
    let attempts = 0;
    while (attempts < 6) {
      const { error } = await supabase.from('scheme_chunks').insert(slice);
      if (!error) break;
      attempts++;
      if (attempts >= 6) {
        throw new Error(`Supabase insert failed after 6 attempts: ${error.message}`);
      }
      const waitMs = 2000 * attempts;
      console.warn(`   ⚠ Insert retry ${attempts}/3 (${error.message}), waiting ${waitMs / 1000}s...`);
      await sleep(waitMs);
    }
  }
}

// ─── Main Ingestion ───────────────────────────────────────────────────────────

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && process.argv[idx + 1] ? parseInt(process.argv[idx + 1], 10) : null;
}

async function main() {
  const fromId = getArgValue('--from');
  const toId = getArgValue('--to');
  const isRange = fromId !== null || toId !== null;
  const isResume = process.argv.includes('--resume');
  const progress = isRange
    ? { lastSchemeId: (fromId || 1) - 1, processedCount: 0 }
    : (isResume ? loadProgress() : { lastSchemeId: 0, processedCount: 0 });

  console.log('\n🚀 Government Scheme RAG Ingestion Script');
  console.log('==========================================');
  console.log(`Mode: ${isRange ? `⚡ Parallel worker (${fromId ?? 1} → ${toId ?? 'end'})` : (isResume ? '▶ Resume from scheme_id > ' + progress.lastSchemeId : '🆕 Fresh run')}`);
  console.log(`Embedding model: ${EMBEDDING_MODEL} (${EMBEDDING_DIMS} dims)`);
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log('');

  // Step 1: Count total schemes
  const { count: totalSchemes, error: countErr } = await supabase
    .from('schemes')
    .select('*', { count: 'exact', head: true });

  if (countErr) {
    console.error('❌ Failed to count schemes:', countErr.message);
    process.exit(1);
  }

  console.log(`📊 Total schemes in Supabase: ${totalSchemes}`);
  console.log(`📦 Already processed: ${progress.processedCount}`);
  console.log('');

  // Step 2: Clear existing chunks ONLY on a fresh non-range run
  if (!isResume && !isRange) {
    console.log('🗑  Clearing existing scheme_chunks (fresh run)...');
    const { error: delErr } = await supabase.from('scheme_chunks').delete().neq('id', 0);
    if (delErr) {
      console.error('❌ Failed to clear scheme_chunks:', delErr.message);
      process.exit(1);
    }
    console.log('   ✓ Cleared.\n');
  }

  // Step 3: Page through all schemes and embed
  let page = 0;
  let totalProcessed = progress.processedCount;
  let lastSchemeId = progress.lastSchemeId;
  let hasMore = true;
  const startTime = Date.now();

  while (hasMore) {
    // Fetch next page using cursor-based pagination (resilient to resume & gaps)
    let schemes = null;
    let fetchErr = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      let q = supabase
        .from('schemes')
        .select('id, title, slug, description, benefits, beneficiaries, ministry, govt_tier, state, primary_category, secondary_categories, gender, age_display, caste_category, occupation, education, max_income, income_limit_display, is_bpl_only, area, target_type, application_process, required_documents, application_method, application_url, official_website, source_url')
        .gt('id', lastSchemeId);
      if (toId !== null) q = q.lte('id', toId);
      const res = await q.order('id', { ascending: true }).limit(PAGE_SIZE);
      schemes = res.data;
      fetchErr = res.error;
      if (!fetchErr) break;
      console.warn(`⚠ Fetch retry ${attempt}/3 for page ${page + 1}: ${fetchErr.message}`);
      await sleep(2000 * attempt);
    }

    if (fetchErr) {
      console.error(`❌ Error fetching page ${page + 1}:`, fetchErr.message);
      saveProgress(lastSchemeId, totalProcessed);
      process.exit(1);
    }

    if (!schemes || schemes.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`📄 Page ${page + 1}: Processing schemes ${schemes[0].id} → ${schemes[schemes.length - 1].id} (${schemes.length} schemes)`);

    // Build all chunks for this page
    const allChunks = schemes.flatMap((scheme) => buildChunks(scheme));
    console.log(`   Built ${allChunks.length} chunks (${schemes.length} × 3)`);

    // Embed in sub-batches locally
    const embeddedChunks = [];
    for (let i = 0; i < allChunks.length; i += EMBED_BATCH) {
      const batch = allChunks.slice(i, i + EMBED_BATCH);
      process.stdout.write(`   Embedding batch ${Math.floor(i / EMBED_BATCH) + 1}/${Math.ceil(allChunks.length / EMBED_BATCH)} (${batch.length} chunks)...`);
      const embedded = await embedBatch(batch);
      embeddedChunks.push(...embedded);
      process.stdout.write(` ✓\n`);
    }

    // Insert into Supabase in resilient sub-batches
    try {
      await insertWithRetry(embeddedChunks);
    } catch (insertErr) {
      console.error(`   ❌ Insert failed for page ${page + 1}:`, insertErr.message);
      saveProgress(lastSchemeId, totalProcessed);
      process.exit(1);
    }

    totalProcessed += schemes.length;
    lastSchemeId = schemes[schemes.length - 1].id;
    saveProgress(lastSchemeId, totalProcessed);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const pct = ((totalProcessed / totalSchemes) * 100).toFixed(1);
    console.log(`   ✅ Inserted. Total: ${totalProcessed}/${totalSchemes} (${pct}%) — ${elapsed}s elapsed\n`);

    // If we got a full page, there's likely more
    hasMore = schemes.length === PAGE_SIZE;
    page++;
  }

  // Done!
  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log('==============================================');
  console.log(`✅ Ingestion complete!`);
  console.log(`   Schemes processed : ${totalProcessed}`);
  console.log(`   Chunks stored     : ~${totalProcessed * 3}`);
  console.log(`   Time taken        : ${totalTime} minutes`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Set RAG_PROVIDER=gemini in backend/.env');
  console.log('  2. Restart your backend: npm run dev');
  console.log('  3. Test: curl http://localhost:5000/api/rag/status');
  console.log('');

  // Clean up progress file on success
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
  }
}

main().catch((err) => {
  console.error('\n💥 Fatal error:', err.message);
  process.exit(1);
});
