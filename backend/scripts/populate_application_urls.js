/**
 * @file populate_application_urls.js
 * @description Extracts and updates application_url for all online schemes in Supabase database.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { extractApplicationUrl } = require('./extract_application_urls');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function run() {
  console.log('Fetching online schemes from Supabase...');
  
  let page = 0;
  const batchSize = 500;
  let totalProcessed = 0;
  let totalUpdated = 0;

  while (true) {
    const from = page * batchSize;
    const to = from + batchSize - 1;

    const { data, error } = await supabase
      .from('schemes')
      .select('id, title, application_process')
      .eq('application_method', 'online')
      .range(from, to);

    if (error) {
      console.error('Error fetching batch:', error);
      break;
    }

    if (!data || data.length === 0) {
      break;
    }

    console.log(`Processing batch ${page + 1}: schemes ${from + 1} to ${from + data.length}...`);

    for (const scheme of data) {
      totalProcessed++;
      const appUrl = extractApplicationUrl(scheme.application_process);

      if (appUrl) {
        const { error: updateErr } = await supabase
          .from('schemes')
          .update({ application_url: appUrl })
          .eq('id', scheme.id);

        if (!updateErr) {
          totalUpdated++;
        } else {
          console.warn(`Failed to update scheme #${scheme.id}:`, updateErr.message);
        }
      }
    }

    page++;
    if (data.length < batchSize) break;
  }

  console.log('\n====================================================');
  console.log(` Finished URL Population:`);
  console.log(` Processed Online Schemes: ${totalProcessed}`);
  console.log(` Populated with Direct Portal URLs: ${totalUpdated}`);
  console.log(` Kept as NULL (MyScheme Guide fallback): ${totalProcessed - totalUpdated}`);
  console.log('====================================================');
}

run();
