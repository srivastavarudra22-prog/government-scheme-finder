const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase Config] Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables.');
  process.exit(1);
}

// Client configured exclusively with publishable / anon credentials
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Tests live connection to Supabase database.
 * @returns {Promise<{ ok: boolean, latencyMs: number, count?: number, error?: string }>}
 */
async function testDatabaseConnection() {
  const startTime = Date.now();
  try {
    const { count, error } = await supabase
      .from('schemes')
      .select('*', { count: 'exact', head: true });

    const latencyMs = Date.now() - startTime;

    if (error) {
      return { ok: false, latencyMs, error: error.message };
    }

    return { ok: true, latencyMs, count };
  } catch (err) {
    return { ok: false, latencyMs: Date.now() - startTime, error: err.message };
  }
}

module.exports = {
  supabase,
  testDatabaseConnection,
};
