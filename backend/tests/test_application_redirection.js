/**
 * @file test_application_redirection.js
 * @description Comprehensive automated test suite verifying the 5 intelligent application redirection rules
 * across unit helper resolution and live API endpoint integration.
 * 
 * Rules tested:
 * 1. Direct application URL exists:
 *    - Redirects to verified direct application_url.
 *    - Button: "Apply on Official Portal", secondary link to official scheme info.
 * 2. Direct application URL is unavailable:
 *    - Fallback redirects to verified official MyScheme details page.
 *    - Notice: "A verified direct online application link is currently unavailable. Please visit the official scheme information page to view the application procedure."
 * 3. Online application is unavailable (Confirmed Offline):
 *    - Notice: "Online application is not available for this scheme. Please visit the official scheme information page for eligibility details and offline application instructions."
 *    - Button: "View Offline Instructions".
 * 4. Application method is unknown:
 *    - Does NOT assume offline.
 *    - Notice: "A verified online application link is currently unavailable. Please visit the official scheme information page for more details."
 *    - Button: "Check Application Details".
 * 5. No verified official URL exists:
 *    - No fabricated or guessed URLs.
 *    - Button disabled / "Official Link Unavailable".
 *    - Displays official administering department/authority information.
 */

const http = require('http');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { resolveApplicationRedirection, isValidExternalUrl } = require('../src/utils/redirectionHelper');
const { supabase } = require('../src/config/supabase');

const API_BASE = 'http://localhost:5000';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('====================================================');
  console.log(' INTELLIGENT APPLICATION REDIRECTION TEST SUITE');
  console.log('====================================================\n');

  // =========================================================================
  // 1. UNIT TESTS: RESOLVER HELPER RULES
  // =========================================================================
  console.log('--- PART 1: Helper Resolution Unit Tests ---');

  // Case 1: Direct application URL exists
  {
    const scheme1 = {
      id: 'test-1',
      title: 'Direct Portal Scheme',
      application_method: 'online',
      application_url: 'https://standupmitra.in/Login/Register',
      source_url: 'https://www.myscheme.gov.in/schemes/sui',
      ministry: 'Ministry of Finance',
    };
    const res = resolveApplicationRedirection(scheme1);
    assert(res.action_type === 'DIRECT_ONLINE', 'Rule 1: action_type is DIRECT_ONLINE');
    assert(res.target_url === 'https://standupmitra.in/Login/Register', 'Rule 1: target_url points to direct application URL');
    assert(res.secondary_url === 'https://www.myscheme.gov.in/schemes/sui', 'Rule 1: secondary_url points to scheme details page');
    assert(res.button_text === 'Apply on Official Portal', 'Rule 1: button_text is "Apply on Official Portal"');
    assert(res.is_direct_portal === true, 'Rule 1: is_direct_portal is true');
    assert(res.notice_message === null, 'Rule 1: notice_message is null (clean portal link)');
  }

  // Case 2: Online scheme with direct application URL unavailable (fallback to MyScheme)
  {
    const scheme2 = {
      id: 'test-2',
      title: 'Online Scheme without Direct Portal',
      application_method: 'online',
      application_url: null,
      source_url: 'https://www.myscheme.gov.in/schemes/pmajy',
      ministry: 'Ministry of Social Justice and Empowerment',
    };
    const res = resolveApplicationRedirection(scheme2);
    assert(res.action_type === 'MYSCHEME_DETAILS', 'Rule 2: action_type is MYSCHEME_DETAILS');
    assert(res.target_url === 'https://www.myscheme.gov.in/schemes/pmajy', 'Rule 2: target_url points to MyScheme details page');
    assert(res.button_text === 'View Official Application Guide', 'Rule 2: button_text is "View Official Application Guide"');
    assert(res.is_direct_portal === false, 'Rule 2: is_direct_portal is false');
    assert(res.notice_message && res.notice_message.includes('A verified direct online application link is currently unavailable'), 'Rule 2: clear fallback notice displayed');
  }

  // Case 3: Online application is confirmed unavailable (Offline Only)
  {
    const scheme3 = {
      id: 'test-3',
      title: 'Confirmed Offline Scheme',
      application_method: 'offline',
      application_url: null,
      source_url: 'https://www.myscheme.gov.in/schemes/pmksy',
      ministry: 'Ministry of Agriculture',
    };
    const res = resolveApplicationRedirection(scheme3);
    assert(res.action_type === 'OFFLINE_GUIDE', 'Rule 3: action_type is OFFLINE_GUIDE');
    assert(res.target_url === 'https://www.myscheme.gov.in/schemes/pmksy', 'Rule 3: target_url points to MyScheme details guide');
    assert(res.button_text === 'View Offline Instructions', 'Rule 3: button_text is "View Offline Instructions"');
    assert(res.is_online === false, 'Rule 3: is_online is false');
    assert(res.notice_message && res.notice_message.includes('Online application is not available for this scheme'), 'Rule 3: clear confirmed offline notice displayed');
  }

  // Case 4: Application method is unknown (do NOT assume offline)
  {
    const scheme4 = {
      id: 'test-4',
      title: 'Unclassified Method Scheme',
      application_method: 'unknown',
      application_url: null,
      source_url: 'https://www.myscheme.gov.in/schemes/unknown-scheme',
      ministry: 'Ministry of Tribal Affairs',
    };
    const res = resolveApplicationRedirection(scheme4);
    assert(res.action_type === 'UNKNOWN_GUIDE', 'Rule 4: action_type is UNKNOWN_GUIDE');
    assert(res.target_url === 'https://www.myscheme.gov.in/schemes/unknown-scheme', 'Rule 4: target_url points to info page');
    assert(res.button_text === 'Check Application Details', 'Rule 4: button_text is "Check Application Details"');
    assert(res.notice_message && res.notice_message.includes('A verified online application link is currently unavailable'), 'Rule 4: does NOT claim offline, displays unknown notice');
  }

  // Case 5: No verified official URL exists (Edge Case)
  {
    const scheme5 = {
      id: 'test-5',
      title: 'Missing URL Scheme',
      application_method: 'offline',
      application_url: null,
      source_url: null,
      official_website: null,
      ministry: 'Department of Animal Husbandry and Dairying',
    };
    const res = resolveApplicationRedirection(scheme5);
    assert(res.action_type === 'NO_URL', 'Rule 5: action_type is NO_URL');
    assert(res.target_url === null, 'Rule 5: target_url is strictly null (no fabrication)');
    assert(res.button_text === 'Official Link Unavailable', 'Rule 5: button_text is "Official Link Unavailable"');
    assert(res.department_info === 'Department of Animal Husbandry and Dairying', 'Rule 5: preserves administering department contact');
    assert(res.notice_message && res.notice_message.includes('Verified official online links are currently unavailable'), 'Rule 5: informs user to contact department');
  }

  // URL Security & Sanitization Checks
  {
    console.log('\n--- PART 2: URL Sanitization & Security ---');
    assert(isValidExternalUrl('https://india.gov.in') === true, 'Valid HTTPS URL accepted');
    assert(isValidExternalUrl('http://delhigovt.nic.in') === true, 'Valid HTTP URL accepted');
    assert(isValidExternalUrl('javascript:alert(1)') === false, 'XSS javascript: URI rejected');
    assert(isValidExternalUrl('myscheme.gov.in') === false, 'Protocol-less string rejected');
    assert(isValidExternalUrl('/relative/path') === false, 'Relative path rejected');
    assert(isValidExternalUrl(null) === false, 'Null rejected');
  }

  // =========================================================================
  // 3. LIVE DATABASE & API INTEGRATION TESTS
  // =========================================================================
  console.log('\n--- PART 3: Live Backend API & Database Verification ---');

  try {
    // 3a. Find an online scheme with direct portal URL
    const { data: directOnlineSchemes } = await supabase
      .from('schemes')
      .select('id, title, application_method, application_url, source_url')
      .eq('application_method', 'online')
      .not('application_url', 'is', null)
      .limit(1);

    if (directOnlineSchemes && directOnlineSchemes.length > 0) {
      const target = directOnlineSchemes[0];
      const res = await fetchJson(`${API_BASE}/api/schemes/${target.id}`);
      assert(res.status === 200, `GET /api/schemes/${target.id} returns 200 OK`);
      assert(res.body.data.application_method === 'online', 'Live scheme application_method is "online"');
      assert(res.body.data.application_url === target.application_url, 'Live scheme application_url returned');
      assert(res.body.data.application_redirection && res.body.data.application_redirection.action_type === 'DIRECT_ONLINE', 'Live API attaches DIRECT_ONLINE redirection');
      assert(res.body.data.application_redirection.target_url === target.application_url, 'Live API target_url matches direct application_url');
    } else {
      console.warn('  ⚠ No direct online scheme found in test DB');
    }

    // 3b. Find an online scheme with NO direct application URL (fallback to MyScheme)
    const { data: fallbackOnlineSchemes } = await supabase
      .from('schemes')
      .select('id, title, application_method, application_url, source_url')
      .eq('application_method', 'online')
      .is('application_url', null)
      .limit(1);

    if (fallbackOnlineSchemes && fallbackOnlineSchemes.length > 0) {
      const target = fallbackOnlineSchemes[0];
      const res = await fetchJson(`${API_BASE}/api/schemes/${target.id}`);
      assert(res.status === 200, `GET /api/schemes/${target.id} returns 200 OK`);
      assert(res.body.data.application_redirection && res.body.data.application_redirection.action_type === 'MYSCHEME_DETAILS', 'Live API attaches MYSCHEME_DETAILS fallback');
      assert(res.body.data.application_redirection.target_url === target.source_url, 'Live API target_url points to MyScheme scheme details');
    }

    // 3c. Find a confirmed offline scheme
    const { data: offlineSchemes } = await supabase
      .from('schemes')
      .select('id, title, application_method, application_url, source_url')
      .eq('application_method', 'offline')
      .limit(1);

    if (offlineSchemes && offlineSchemes.length > 0) {
      const target = offlineSchemes[0];
      const res = await fetchJson(`${API_BASE}/api/schemes/${target.id}`);
      assert(res.status === 200, `GET /api/schemes/${target.id} returns 200 OK`);
      assert(res.body.data.application_method === 'offline', 'Live scheme application_method is "offline"');
      assert(res.body.data.application_redirection && res.body.data.application_redirection.action_type === 'OFFLINE_GUIDE', 'Live API attaches OFFLINE_GUIDE');
      assert(res.body.data.application_redirection.notice_message.includes('Online application is not available for this scheme'), 'Live API attaches offline notice');
    }

    // 3d. Find an unknown scheme
    const { data: unknownSchemes } = await supabase
      .from('schemes')
      .select('id, title, application_method, application_url, source_url')
      .eq('application_method', 'unknown')
      .limit(1);

    if (unknownSchemes && unknownSchemes.length > 0) {
      const target = unknownSchemes[0];
      const res = await fetchJson(`${API_BASE}/api/schemes/${target.id}`);
      assert(res.status === 200, `GET /api/schemes/${target.id} returns 200 OK`);
      assert(res.body.data.application_method === 'unknown', 'Live scheme application_method is "unknown"');
      assert(res.body.data.application_redirection && res.body.data.application_redirection.action_type === 'UNKNOWN_GUIDE', 'Live API attaches UNKNOWN_GUIDE');
      assert(!res.body.data.application_redirection.notice_message.includes('Online application is not available'), 'Live API does not claim unknown scheme is offline');
    }

  } catch (err) {
    console.error('Integration test error:', err);
    failed++;
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n====================================================');
  console.log(` RESULTS: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
