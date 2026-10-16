/**
 * @file extract_application_urls.js
 * @description Extracts and validates official direct application URLs from application_process text.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

function cleanUrl(raw) {
  if (!raw) return null;
  let url = raw.trim();
  if (url.startsWith('www.')) url = 'https://' + url;
  url = url.replace(/[\)\]\>,\.\"\'\;\\]+$/, '');
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    const host = parsed.hostname.toLowerCase();
    // Ignore social networks, generic video/app platforms
    if (['google.com', 'youtube.com', 'play.google.com', 'facebook.com', 'twitter.com', 't.me', 'instagram.com'].some(d => host.includes(d))) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

function extractApplicationUrl(text) {
  if (!text || text === 'None') return null;

  // 1. Look for URL in markdown link first: [Apply / Portal](https://...)
  const mdMatches = [...text.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/gi)];
  for (const m of mdMatches) {
    const label = m[1].toLowerCase();
    const url = cleanUrl(m[2]);
    if (url && (label.includes('apply') || label.includes('portal') || label.includes('register') || label.includes('official') || label.includes('link') || label.includes('website') || label.includes('saral') || label.includes('edistrict'))) {
      return url;
    }
  }

  // 2. Look for explicit raw URLs in text
  const rawMatches = text.match(/(https?:\/\/[^\s\)\],\"\'\>]+|www\.[^\s\)\],\"\'\>]+)/gi);
  if (rawMatches) {
    // Prefer non-pdf portal links first
    for (const r of rawMatches) {
      const cleaned = cleanUrl(r);
      if (cleaned && !cleaned.toLowerCase().endsWith('.pdf') && !cleaned.includes('/pdf/')) {
        return cleaned;
      }
    }
    // If only PDF exists, check if valid link
    for (const r of rawMatches) {
      const cleaned = cleanUrl(r);
      if (cleaned) return cleaned;
    }
  }

  return null;
}

async function run() {
  console.log('Testing extraction on first 30 online schemes:');
  const { data, error } = await supabase
    .from('schemes')
    .select('id, title, application_process')
    .eq('application_method', 'online')
    .limit(30);

  if (error) {
    console.error('Query error:', error);
    return;
  }

  let extractedCount = 0;
  for (const d of data) {
    const url = extractApplicationUrl(d.application_process);
    if (url) extractedCount++;
    console.log(`[#${d.id}] ${d.title.substring(0, 32).padEnd(32)} -> ${url || 'NULL (No direct URL)'}`);
  }

  console.log(`\nExtracted: ${extractedCount} / ${data.length}`);
}

if (require.main === module) {
  run();
}

module.exports = {
  cleanUrl,
  extractApplicationUrl,
};
