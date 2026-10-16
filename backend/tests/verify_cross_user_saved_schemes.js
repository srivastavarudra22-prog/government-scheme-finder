/**
 * @file verify_cross_user_saved_schemes.js
 * @description End-to-end multi-user isolation verification script.
 * 
 * Specifically validates the required test flow:
 * 1. User A logs in -> sees User A saves
 * 2. User A logs out
 * 3. User B logs in -> does NOT see User A saves
 * 4. User B saves their own scheme -> only User B sees it
 * 5. User B logs out
 * 6. User A logs back in -> sees User A saves, does NOT see User B saves
 * 7. User A deletes a saved scheme -> accurately reflected
 */

const http = require('http');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const PORT = 5000; // Live running backend server

function apiCall(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (_) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function verifyFlow() {
  console.log('====================================================');
  console.log(' Cross-User Saved Schemes Isolation Verification');
  console.log('====================================================\n');

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

  // User A Credentials
  const userAEmail = 'schemefinder.citizen.1791833857341@gmail.com';
  const userAPassword = 'StrongPassword123!';

  // User B Credentials
  const userBEmail = 'schemefinder.secondary.1791916316357@testcitizen.gov.in';
  const userBPassword = 'StrongPassword123!';

  // 1. Authenticate User A
  console.log('Step 1: Logging in User A (' + userAEmail + ')...');
  const loginARes = await apiCall('/api/auth/login', 'POST', {
    email: userAEmail,
    password: userAPassword,
  });

  if (!loginARes.body.success || !loginARes.body.session?.access_token) {
    throw new Error('User A login failed: ' + JSON.stringify(loginARes.body));
  }
  const tokenA = loginARes.body.session.access_token;
  console.log('✓ User A logged in successfully. Token acquired.\n');

  // Clean up any existing saves for User A
  const existingA = await apiCall('/api/saved-schemes', 'GET', null, tokenA);
  if (existingA.body.data && existingA.body.data.length > 0) {
    for (const item of existingA.body.data) {
      await apiCall(`/api/saved-schemes/${item.scheme_id}`, 'DELETE', null, tokenA);
    }
  }

  // 2. User A saves Scheme 1 and Scheme 2
  console.log('Step 2: User A saving Scheme 1 and Scheme 2...');
  const save1 = await apiCall('/api/saved-schemes/1', 'POST', null, tokenA);
  console.log('  POST /api/saved-schemes/1 -> HTTP ' + save1.status + ' (' + (save1.body.data?.scheme?.title || 'Saved') + ')');

  const save2 = await apiCall('/api/saved-schemes/2', 'POST', null, tokenA);
  console.log('  POST /api/saved-schemes/2 -> HTTP ' + save2.status + ' (' + (save2.body.data?.scheme?.title || 'Saved') + ')');

  // 3. User A verifies seeing Scheme 1 and Scheme 2
  console.log('\nStep 3: User A fetching GET /api/saved-schemes...');
  const listA1 = await apiCall('/api/saved-schemes', 'GET', null, tokenA);
  console.log('  User A saved count: ' + listA1.body.data.length);
  const userASchemeIds = listA1.body.data.map((s) => s.scheme_id);
  console.log('  User A saved scheme IDs: ' + JSON.stringify(userASchemeIds));

  if (!userASchemeIds.includes(1) || !userASchemeIds.includes(2)) {
    throw new Error('User A does not see expected saved schemes 1 and 2!');
  }
  console.log('✓ Verified: User A sees User A saves.\n');

  // 4. User A logs out
  console.log('Step 4: User A logging out...');
  const logoutARes = await apiCall('/api/auth/logout', 'POST', null, tokenA);
  console.log('  POST /api/auth/logout -> HTTP ' + logoutARes.status);
  console.log('✓ User A session terminated.\n');

  // 5. Authenticate User B
  console.log('Step 5: Logging in User B (' + userBEmail + ')...');
  const loginBRes = await apiCall('/api/auth/login', 'POST', {
    email: userBEmail,
    password: userBPassword,
  });

  if (!loginBRes.body.success || !loginBRes.body.session?.access_token) {
    throw new Error('User B login failed: ' + JSON.stringify(loginBRes.body));
  }
  const tokenB = loginBRes.body.session.access_token;
  console.log('✓ User B logged in successfully. Token acquired.\n');

  // Clean up any existing saves for User B
  const existingB = await apiCall('/api/saved-schemes', 'GET', null, tokenB);
  if (existingB.body.data && existingB.body.data.length > 0) {
    for (const item of existingB.body.data) {
      await apiCall(`/api/saved-schemes/${item.scheme_id}`, 'DELETE', null, tokenB);
    }
  }

  // 6. User B fetches GET /api/saved-schemes
  console.log('Step 6: User B fetching GET /api/saved-schemes (Checking isolation)...');
  const listB1 = await apiCall('/api/saved-schemes', 'GET', null, tokenB);
  console.log('  User B saved count: ' + listB1.body.data.length);
  console.log('  User B saved scheme IDs: ' + JSON.stringify(listB1.body.data.map((s) => s.scheme_id)));

  if (listB1.body.data.length !== 0) {
    throw new Error('SECURITY VIOLATION: User B can see User A saved schemes!');
  }
  console.log('✓ Verified: User B does NOT see User A saves (Count: 0).\n');

  // 7. User B saves their own Scheme 3
  console.log('Step 7: User B saving Scheme 3...');
  const saveB3 = await apiCall('/api/saved-schemes/3', 'POST', null, tokenB);
  console.log('  POST /api/saved-schemes/3 -> HTTP ' + saveB3.status + ' (' + (saveB3.body.data?.scheme?.title || 'Saved') + ')');

  const listB2 = await apiCall('/api/saved-schemes', 'GET', null, tokenB);
  console.log('  User B saved count now: ' + listB2.body.data.length);
  const userBSchemeIds = listB2.body.data.map((s) => s.scheme_id);
  console.log('  User B saved scheme IDs: ' + JSON.stringify(userBSchemeIds));

  if (userBSchemeIds.length !== 1 || userBSchemeIds[0] !== 3) {
    throw new Error('User B saved list mismatch! Expected only Scheme 3.');
  }
  console.log('✓ Verified: User B sees ONLY their own Scheme 3.\n');

  // 8. User B logs out
  console.log('Step 8: User B logging out...');
  await apiCall('/api/auth/logout', 'POST', null, tokenB);
  console.log('✓ User B session terminated.\n');

  // 9. User A logs back in
  console.log('Step 9: User A logging back in...');
  const loginA2 = await apiCall('/api/auth/login', 'POST', {
    email: userAEmail,
    password: userAPassword,
  });
  const tokenA2 = loginA2.body.session.access_token;
  console.log('✓ User A logged in again.\n');

  // 10. User A checks saved schemes
  console.log('Step 10: User A checking saved schemes again...');
  const listA2 = await apiCall('/api/saved-schemes', 'GET', null, tokenA2);
  const finalASchemeIds = listA2.body.data.map((s) => s.scheme_id);
  console.log('  User A saved scheme IDs: ' + JSON.stringify(finalASchemeIds));

  if (!finalASchemeIds.includes(1) || !finalASchemeIds.includes(2) || finalASchemeIds.includes(3)) {
    throw new Error('User A saved schemes compromised! Must have 1 and 2, but not 3.');
  }
  console.log('✓ Verified: User A still has Schemes 1 and 2, and DOES NOT see User B Scheme 3.\n');

  // 11. User A removes Scheme 1
  console.log('Step 11: User A removing Scheme 1...');
  const delete1Res = await apiCall('/api/saved-schemes/1', 'DELETE', null, tokenA2);
  console.log('  DELETE /api/saved-schemes/1 -> HTTP ' + delete1Res.status);

  const listA3 = await apiCall('/api/saved-schemes', 'GET', null, tokenA2);
  const remainingIds = listA3.body.data.map((s) => s.scheme_id);
  console.log('  User A remaining saved IDs: ' + JSON.stringify(remainingIds));

  if (remainingIds.includes(1) || !remainingIds.includes(2)) {
    throw new Error('User A deletion failed to reflect in GET /api/saved-schemes!');
  }
  console.log('✓ Verified: User A successfully removed Scheme 1; Scheme 2 remains.\n');

  // 12. Cleanup remaining test schemes
  await apiCall('/api/saved-schemes/2', 'DELETE', null, tokenA2);
  await apiCall('/api/saved-schemes/3', 'DELETE', null, tokenB);
  console.log('Cleaned up test data.\n');

  console.log('====================================================');
  console.log(' SUCCESS: All Cross-User Isolation Requirements Met!');
  console.log('====================================================');
}

verifyFlow().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
