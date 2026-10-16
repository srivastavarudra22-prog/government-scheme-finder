/**
 * @file generate_sql_batches.js
 * @description Generates batch UPDATE SQL files for all online schemes with verified application URLs.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { extractApplicationUrl } = require('./extract_application_urls');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

function escapeSqlString(str) {
  if (!str) return 'NULL';
  return "'" + str.replace(/'/g, "''") + "'";
}

async function run() {
  console.log('Fetching all online schemes...');
  
  let allSchemes = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('schemes')
      .select('id, application_process')
      .eq('application_method', 'online')
      .range(from, to);

    if (error) {
      console.error('Error fetching schemes:', error);
      break;
    }

    if (!data || data.length === 0) break;
    allSchemes.push(...data);
    if (data.length < pageSize) break;
    page++;
  }

  console.log(`Fetched ${allSchemes.length} online schemes.`);

  const updates = [];
  for (const s of allSchemes) {
    const url = extractApplicationUrl(s.application_process);
    if (url) {
      updates.push({ id: s.id, url });
    }
  }

  console.log(`Extracted verified application URLs for ${updates.length} schemes.`);

  const outDir = path.join(__dirname, 'updates');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Split into batches of 400
  const batchSize = 400;
  let batchIndex = 0;

  for (let i = 0; i < updates.length; i += batchSize) {
    const chunk = updates.slice(i, i + batchSize);
    const valuesClause = chunk
      .map((item) => `(${item.id}, ${escapeSqlString(item.url)})`)
      .join(',\n    ');

    const sql = `UPDATE schemes AS s\nSET application_url = v.url\nFROM (VALUES\n    ${valuesClause}\n) AS v(id, url)\nWHERE s.id = v.id;\n`;

    const filePath = path.join(outDir, `batch_${batchIndex + 1}.sql`);
    fs.writeFileSync(filePath, sql, 'utf-8');
    console.log(`Wrote ${chunk.length} updates to batch_${batchIndex + 1}.sql`);
    batchIndex++;
  }

  console.log(`Generated ${batchIndex} batch SQL files successfully.`);
}

run();
