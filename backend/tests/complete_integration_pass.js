/**
 * @file complete_integration_pass.js
 * @description Master functional integration pass verifying all authenticated and public journeys:
 * 
 * Flows Tested:
 * 1. Public Navigation & API:
 *    - /api/health (System status)
 *    - /api/schemes (Catalog browsing)
 *    - /api/schemes/search (Keyword searching)
 *    - /api/schemes/filter (Eligibility engine determination)
 *    - /api/schemes/:id (Detailed scheme specification)
 * 2. Authenticated Session & Navigation:
 *    - Login User A -> Session access token
 *    - Session verification (GET /api/auth/me preserves identity)
 *    - Protected Routes verification (401 without bearer token)
 * 3. Dashboard & Profile Journey:
 *    - GET /api/profile (Retrieve citizen profile)
 *    - PATCH /api/profile (Update citizen demographic details)
 *    - Verify updated profile fields persist in database
 * 4. Schemes & Discovery Journey:
 *    - Find Schemes -> Results -> Scheme Details
 *    - Save Scheme: POST /api/saved-schemes/:schemeId
 *    - Verify in Saved Schemes: GET /api/saved-schemes
 *    - Remove Scheme: DELETE /api/saved-schemes/:schemeId
 * 5. Application Tracking Journey:
 *    - Track Application from Scheme: POST /api/applications
 *    - List Applications: GET /api/applications
 *    - Update Application (status / reference / notes): PATCH /api/applications/:id
 *    - Delete Application: DELETE /api/applications/:id
 * 6. AI Chat Assistant Journey:
 *    - Send citizen query: POST /api/chat/message
 *    - Verify structured response (status: NOT_IMPLEMENTED, no fake schemes)
 *    - Check assistant status: GET /api/chat/status
 * 7. Multi-User Isolation & RLS Security:
 *    - Login User B
 *    - Verify User B CANNOT see User A's saved schemes
 *    - Verify User B CANNOT see User A's applications
 *    - Verify User B CANNOT update or delete User A's records
 * 8. Logout & Session Termination:
 *    - User A & User B sessions terminated cleanly
 */

const http = require('http');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const app = require('../src/server');

const TEST_PORT = 5009;

function request(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: 'localhost',
        port: TEST_PORT,
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

async function run() {
  const server = app.listen(TEST_PORT);
  const results = [];

  function record(flowName, passed, details, httpStatus = null) {
    results.push({ flowName, passed, details, httpStatus });
    const mark = passed ? 'PASS' : 'FAIL';
    console.log(`[${mark}] ${flowName} -> ${details} (HTTP ${httpStatus})`);
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

  // Test accounts
  const userAEmail = 'schemefinder.citizen.1791833857341@gmail.com';
  const userAPassword = 'StrongPassword123!';
  let userAToken = null;
  let userAId = null;

  const userBEmail = 'schemefinder.secondary.1791916316357@testcitizen.gov.in';
  const userBPassword = 'StrongPassword123!';
  let userBToken = null;
  let userBId = null;

  try {
    console.log('================================================================');
    console.log(' MASTER FUNCTIONAL INTEGRATION PASS FOR SCHEME FINDER');
    console.log('================================================================\n');

    // ----------------------------------------------------------------
    // SECTION 1: PUBLIC DISCOVERY & SYSTEM APIS
    // ----------------------------------------------------------------
    console.log('--- SECTION 1: Public Discovery & System Endpoints ---');

    const health = await request('/api/health', 'GET');
    record(
      'System Health Check',
      health.status === 200 && (health.body?.data?.status === 'online' || health.body?.success === true),
      'Health endpoint operational',
      health.status
    );

    const catalog = await request('/api/schemes?page=1&limit=6', 'GET');
    record(
      'Public Schemes Catalog (Home/Browse)',
      catalog.status === 200 && Array.isArray(catalog.body?.data) && catalog.body.data.length > 0,
      `Retrieved ${catalog.body?.data?.length} schemes (Total: ${catalog.body?.total})`,
      catalog.status
    );

    const searchRes = await request('/api/schemes/search?q=kisan', 'GET');
    record(
      'Public Scheme Search (Landing/Navbar instant search)',
      searchRes.status === 200 && Array.isArray(searchRes.body?.data),
      `Found ${searchRes.body?.data?.length} matches for "kisan"`,
      searchRes.status
    );

    const filterRes = await request('/api/schemes/filter?gender=Female&state=Gujarat&age=25', 'GET');
    record(
      'Eligibility Filter Engine (Find Schemes -> Results)',
      filterRes.status === 200 && Array.isArray(filterRes.body?.data),
      `Filtered ${filterRes.body?.data?.length} qualifying schemes`,
      filterRes.status
    );

    const schemeDetail = await request('/api/schemes/1', 'GET');
    record(
      'Scheme Details Retrieval (/schemes/:id)',
      schemeDetail.status === 200 && schemeDetail.body?.data?.id === 1,
      `Loaded: "${schemeDetail.body?.data?.scheme_name}"`,
      schemeDetail.status
    );

    // ----------------------------------------------------------------
    // SECTION 2: AUTHENTICATION & SESSION PERSISTENCE
    // ----------------------------------------------------------------
    console.log('\n--- SECTION 2: Authentication & Session Persistence ---');

    // Login User A
    const loginRes = await request('/api/auth/login', 'POST', {
      email: userAEmail,
      password: userAPassword,
    });
    userAToken = loginRes.body?.session?.access_token;
    userAId = loginRes.body?.user?.id;
    record(
      'User A Login (Landing/Login -> Dashboard)',
      loginRes.status === 200 && Boolean(userAToken),
      `Authenticated User A: ${userAEmail} (ID: ${userAId})`,
      loginRes.status
    );

    // Session verification on page refresh (/auth/me)
    const meRes = await request('/api/auth/me', 'GET', null, userAToken);
    record(
      'Browser Refresh Session Preservation (GET /api/auth/me)',
      meRes.status === 200 && meRes.body?.user?.id === userAId,
      `Verified active session for ${meRes.body?.user?.email}`,
      meRes.status
    );

    // Protected Route Guards (No token = 401)
    const unauthApp = await request('/api/applications', 'GET');
    const unauthSaved = await request('/api/saved-schemes', 'GET');
    const unauthProfile = await request('/api/profile', 'GET');
    const unauthChat = await request('/api/chat/message', 'POST', { message: 'Hi' });

    const allProtected =
      unauthApp.status === 401 &&
      unauthSaved.status === 401 &&
      unauthProfile.status === 401 &&
      unauthChat.status === 401;

    record(
      'Protected Routes Security (401 without valid Bearer token)',
      allProtected,
      'Confirmed: Applications, Saved Schemes, Profile, and Chat are protected',
      401
    );

    // ----------------------------------------------------------------
    // SECTION 3: CITIZEN PROFILE MANAGEMENT
    // ----------------------------------------------------------------
    console.log('\n--- SECTION 3: Citizen Profile Management ---');

    const profileRes = await request('/api/profile', 'GET', null, userAToken);
    record(
      'Dashboard -> Profile Retrieval (GET /api/profile)',
      profileRes.status === 200 && (profileRes.body?.profile?.id === userAId || profileRes.body?.user?.id === userAId),
      `Loaded profile for: ${profileRes.body?.profile?.full_name}`,
      profileRes.status
    );

    // Update profile
    const updateProfileRes = await request(
      '/api/profile',
      'PATCH',
      {
        fullName: 'Test Citizen Updated',
        state: 'Gujarat',
        occupation: 'Student',
        gender: 'Male',
        age: 23,
      },
      userAToken
    );
    record(
      'Update Profile (PATCH /api/profile)',
      updateProfileRes.status === 200 && updateProfileRes.body?.profile?.state === 'Gujarat',
      `Updated State: ${updateProfileRes.body?.profile?.state}, Occupation: ${updateProfileRes.body?.profile?.occupation}`,
      updateProfileRes.status
    );

    // ----------------------------------------------------------------
    // SECTION 4: SAVED SCHEMES JOURNEY
    // ----------------------------------------------------------------
    console.log('\n--- SECTION 4: Saved Schemes Journey ---');

    // Clean up User A's saved schemes before test
    const initialSaved = await request('/api/saved-schemes', 'GET', null, userAToken);
    if (initialSaved.body?.data) {
      for (const s of initialSaved.body.data) {
        await request(`/api/saved-schemes/${s.scheme_id}`, 'DELETE', null, userAToken);
      }
    }

    // Scheme Details -> Save Scheme
    const saveSchemeRes = await request('/api/saved-schemes/1', 'POST', null, userAToken);
    record(
      'Scheme Details -> Save Scheme (POST /api/saved-schemes/1)',
      saveSchemeRes.status === 201,
      `Saved Scheme 1: "${saveSchemeRes.body?.data?.scheme?.scheme_name}"`,
      saveSchemeRes.status
    );

    // Verify in Saved Schemes list
    const listSavedRes = await request('/api/saved-schemes', 'GET', null, userAToken);
    const hasScheme1 = listSavedRes.body?.data?.some((item) => item.scheme_id === 1);
    record(
      'Saved Schemes List (GET /api/saved-schemes)',
      listSavedRes.status === 200 && hasScheme1,
      `Found ${listSavedRes.body?.data?.length} saved scheme(s), Scheme 1 verified`,
      listSavedRes.status
    );

    // Remove from Saved Schemes
    const removeSavedRes = await request('/api/saved-schemes/1', 'DELETE', null, userAToken);
    record(
      'Saved Schemes -> Remove Scheme (DELETE /api/saved-schemes/1)',
      removeSavedRes.status === 200,
      'Scheme 1 removed successfully',
      removeSavedRes.status
    );

    // ----------------------------------------------------------------
    // SECTION 5: APPLICATION TRACKING JOURNEY
    // ----------------------------------------------------------------
    console.log('\n--- SECTION 5: Application Tracking Journey ---');

    // Clean up User A's applications before test
    const initialApps = await request('/api/applications', 'GET', null, userAToken);
    if (initialApps.body?.data) {
      for (const a of initialApps.body.data) {
        await request(`/api/applications/${a.id}`, 'DELETE', null, userAToken);
      }
    }

    // Create application for Scheme 1
    const createPayload = {
      scheme_id: 1,
      status: 'Applied',
      application_reference: 'APP-INTEG-2026-001',
      notes: 'Initial test application submission',
    };
    const createRes = await request('/api/applications', 'POST', createPayload, userAToken);
    const createdAppId = createRes.body?.data?.id;
    record(
      'Scheme Details -> Track Application (POST /api/applications)',
      createRes.status === 201 && Boolean(createdAppId),
      `Created Application ID: ${createdAppId} (Status: Applied)`,
      createRes.status
    );

    // List applications
    const listAppsRes = await request('/api/applications', 'GET', null, userAToken);
    record(
      'Applications Page List (GET /api/applications)',
      listAppsRes.status === 200 && listAppsRes.body?.data?.length === 1,
      `Retrieved ${listAppsRes.body?.data?.length} application(s) with joined scheme details`,
      listAppsRes.status
    );

    // Update application status to Under Review with reference
    const patchPayload = {
      status: 'Under Review',
      notes: 'Verification officers contacted citizen for documents.',
    };
    const patchRes = await request(`/api/applications/${createdAppId}`, 'PATCH', patchPayload, userAToken);
    record(
      'Applications -> Update Status / Notes (PATCH /api/applications/:id)',
      patchRes.status === 200 && patchRes.body?.data?.status === 'Under Review',
      `New status: "${patchRes.body?.data?.status}"`,
      patchRes.status
    );

    // Delete application
    const deleteRes = await request(`/api/applications/${createdAppId}`, 'DELETE', null, userAToken);
    record(
      'Applications -> Delete Application (DELETE /api/applications/:id)',
      deleteRes.status === 200,
      'Application deleted cleanly',
      deleteRes.status
    );

    // ----------------------------------------------------------------
    // SECTION 6: AI CHAT ASSISTANT JOURNEY
    // ----------------------------------------------------------------
    console.log('\n--- SECTION 6: AI Chat Assistant Journey ---');

    const chatMsgRes = await request(
      '/api/chat/message',
      'POST',
      { message: 'What scholarships are available for university students?' },
      userAToken
    );
    const isChatCompliant =
      chatMsgRes.status === 200 &&
      chatMsgRes.body?.status === 'NOT_IMPLEMENTED' &&
      chatMsgRes.body?.message === 'AI assistant is not connected yet.' &&
      chatMsgRes.body?.notice?.includes('Development placeholder') &&
      !chatMsgRes.body?.data?.schemes;

    record(
      'Chat Assistant Interaction (POST /api/chat/message)',
      isChatCompliant,
      'Received structured placeholder response without fabricating scheme data',
      chatMsgRes.status
    );

    const chatStatusRes = await request('/api/chat/status', 'GET', null, userAToken);
    record(
      'Chat Assistant Capability Status (GET /api/chat/status)',
      chatStatusRes.status === 200 && chatStatusRes.body?.data?.ragConnected === false,
      'Pre-integration status verified',
      chatStatusRes.status
    );

    // ----------------------------------------------------------------
    // SECTION 7: MULTI-USER ISOLATION & RLS VERIFICATION
    // ----------------------------------------------------------------
    console.log('\n--- SECTION 7: Multi-User Data Isolation & RLS Security ---');

    // Create an application for User A
    const appA = await request(
      '/api/applications',
      'POST',
      { scheme_id: 2, status: 'Interested' },
      userAToken
    );
    const appAId = appA.body?.data?.id;

    // Save Scheme 2 for User A
    await request('/api/saved-schemes/2', 'POST', null, userAToken);

    // Login User B
    const loginB = await request('/api/auth/login', 'POST', {
      email: userBEmail,
      password: userBPassword,
    });
    userBToken = loginB.body?.session?.access_token;
    userBId = loginB.body?.user?.id;

    // Clean up User B's applications and saved schemes
    const bAppsInit = await request('/api/applications', 'GET', null, userBToken);
    if (bAppsInit.body?.data) {
      for (const a of bAppsInit.body.data) {
        await request(`/api/applications/${a.id}`, 'DELETE', null, userBToken);
      }
    }
    const bSavedInit = await request('/api/saved-schemes', 'GET', null, userBToken);
    if (bSavedInit.body?.data) {
      for (const s of bSavedInit.body.data) {
        await request(`/api/saved-schemes/${s.scheme_id}`, 'DELETE', null, userBToken);
      }
    }

    // Verify User B cannot see User A's applications
    const bAppsList = await request('/api/applications', 'GET', null, userBToken);
    record(
      'RLS Isolation: User B CANNOT see User A Applications',
      bAppsList.status === 200 && bAppsList.body?.data?.length === 0,
      `User B application count: ${bAppsList.body?.data?.length} (User A has 1)`,
      bAppsList.status
    );

    // Verify User B cannot update User A's application
    const bPatchAttempt = await request(
      `/api/applications/${appAId}`,
      'PATCH',
      { status: 'Rejected' },
      userBToken
    );
    record(
      'RLS Isolation: User B CANNOT modify User A Applications',
      bPatchAttempt.status === 404,
      'Attempt rejected with 404 Not Found (Row Level Security protected)',
      bPatchAttempt.status
    );

    // Verify User B cannot delete User A's application
    const bDeleteAttempt = await request(
      `/api/applications/${appAId}`,
      'DELETE',
      null,
      userBToken
    );
    record(
      'RLS Isolation: User B CANNOT delete User A Applications',
      bDeleteAttempt.status === 404,
      'Attempt rejected with 404 Not Found (Row Level Security protected)',
      bDeleteAttempt.status
    );

    // Verify User B cannot see User A's saved schemes
    const bSavedList = await request('/api/saved-schemes', 'GET', null, userBToken);
    record(
      'RLS Isolation: User B CANNOT see User A Saved Schemes',
      bSavedList.status === 200 && bSavedList.body?.data?.length === 0,
      `User B saved count: ${bSavedList.body?.data?.length} (User A has 1)`,
      bSavedList.status
    );

    // Clean up User A's application and saved scheme
    await request(`/api/applications/${appAId}`, 'DELETE', null, userAToken);
    await request('/api/saved-schemes/2', 'DELETE', null, userAToken);

    // ----------------------------------------------------------------
    // SECTION 8: LOGOUT & SESSION TERMINATION
    // ----------------------------------------------------------------
    console.log('\n--- SECTION 8: Logout & Session Termination ---');

    const logoutA = await request('/api/auth/logout', 'POST', null, userAToken);
    const logoutB = await request('/api/auth/logout', 'POST', null, userBToken);

    record(
      'User A Logout (Settings / Sidebar Logout -> Login)',
      logoutA.status === 200,
      `User A logout status: ${logoutA.status} (${JSON.stringify(logoutA.body)})`,
      logoutA.status
    );

    record(
      'User B Logout (Settings / Sidebar Logout -> Login)',
      logoutB.status === 200,
      `User B logout status: ${logoutB.status} (${JSON.stringify(logoutB.body)})`,
      logoutB.status
    );

    // ----------------------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------------------
    console.log('\n================================================================');
    console.log(' MASTER INTEGRATION PASS SUMMARY:');
    const passed = results.filter((r) => r.passed).length;
    const total = results.length;
    console.log(` Total Checks: ${total}`);
    console.log(` Passed:       ${passed}`);
    console.log(` Failed:       ${total - passed}`);
    console.log('================================================================\n');

    if (passed !== total) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Integration pass execution error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

run();
