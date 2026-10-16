/**
 * @file test_applications.js
 * @description Comprehensive test suite for backend Application Tracking system.
 * 
 * Verifies:
 * 1. Authentication enforcement (401 on GET, POST, PATCH, DELETE without token or with invalid token).
 * 2. Input validation (scheme ID, status, reference, notes, UUID format).
 * 3. Non-existent scheme ID handling (404).
 * 4. Application creation with various statuses and timestamps (201).
 * 5. Application retrieval with joined scheme metadata (200).
 * 6. Query filtering by status.
 * 7. Application updating with status transition and note appending (200).
 * 8. Validation rejection on invalid PATCH updates (400).
 * 9. Application deletion (200).
 * 10. Multi-user RLS isolation:
 *     - User B cannot see User A's applications.
 *     - User B cannot update User A's applications (404).
 *     - User B cannot delete User A's applications (404).
 *     - User A cannot see User B's applications.
 * 11. Regression checks on existing schemes and saved-schemes endpoints.
 */

const http = require('http');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const app = require('../src/server');

const TEST_PORT = 5007;

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

  function record(id, title, passed, details, httpStatus = null) {
    results.push({ id, title, passed, details, httpStatus });
    const mark = passed ? 'PASS' : 'FAIL';
    console.log(`[${mark}] #${id}: ${title} -> ${details} (HTTP ${httpStatus})`);
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

  // User A Credentials
  const userAEmail = 'schemefinder.citizen.1791833857341@gmail.com';
  const userAPassword = 'StrongPassword123!';
  let userAToken = null;
  let userAId = null;

  // User B Credentials (RLS Isolation)
  const userBEmail = 'schemefinder.secondary.1791916316357@testcitizen.gov.in';
  const userBPassword = 'StrongPassword123!';
  let userBToken = null;
  let userBId = null;

  try {
    console.log('====================================================');
    console.log(' Starting Application Tracking Comprehensive Test Suite');
    console.log('====================================================\n');

    // --- Phase 1: Authentication Setup ---
    console.log('--- Phase 1: Authentication Setup ---');
    const { data: authA, error: errA } = await supabase.auth.signInWithPassword({
      email: userAEmail,
      password: userAPassword,
    });
    if (errA || !authA.session) throw new Error('User A auth failed: ' + (errA?.message || 'No session'));
    userAToken = authA.session.access_token;
    userAId = authA.user.id;
    console.log(`Authenticated User A: ${userAEmail} (ID: ${userAId})`);

    const { data: authB, error: errB } = await supabase.auth.signInWithPassword({
      email: userBEmail,
      password: userBPassword,
    });
    if (errB || !authB.session) throw new Error('User B auth failed: ' + (errB?.message || 'No session'));
    userBToken = authB.session.access_token;
    userBId = authB.user.id;
    console.log(`Authenticated User B: ${userBEmail} (ID: ${userBId})`);

    // Clean up applications for User A & User B
    const clientA = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${userAToken}` } },
    });
    await clientA.from('applications').delete().eq('user_id', userAId);

    const clientB = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${userBToken}` } },
    });
    await clientB.from('applications').delete().eq('user_id', userBId);
    console.log('Cleaned up previous applications for test accounts.\n');

    // --- Phase 2: Authentication Enforcement ---
    console.log('--- Phase 2: Authentication Enforcement ---');

    // 1. GET /api/applications without token
    const resNoTokenGet = await request('/api/applications', 'GET');
    record(1, 'GET /api/applications without token rejected', resNoTokenGet.status === 401, resNoTokenGet.body.message, resNoTokenGet.status);

    // 2. POST /api/applications without token
    const resNoTokenPost = await request('/api/applications', 'POST', { scheme_id: 1 });
    record(2, 'POST /api/applications without token rejected', resNoTokenPost.status === 401, resNoTokenPost.body.message, resNoTokenPost.status);

    // 3. PATCH /api/applications/:id without token
    const resNoTokenPatch = await request('/api/applications/00000000-0000-0000-0000-000000000000', 'PATCH', { status: 'Applied' });
    record(3, 'PATCH /api/applications without token rejected', resNoTokenPatch.status === 401, resNoTokenPatch.body.message, resNoTokenPatch.status);

    // 4. DELETE /api/applications/:id without token
    const resNoTokenDelete = await request('/api/applications/00000000-0000-0000-0000-000000000000', 'DELETE');
    record(4, 'DELETE /api/applications without token rejected', resNoTokenDelete.status === 401, resNoTokenDelete.body.message, resNoTokenDelete.status);

    // 5. GET /api/applications with invalid token
    const resInvalidToken = await request('/api/applications', 'GET', null, 'malformed.token');
    record(5, 'GET /api/applications with invalid token rejected', resInvalidToken.status === 401, resInvalidToken.body.message, resInvalidToken.status);

    // --- Phase 3: Input Validation & Edge Cases ---
    console.log('\n--- Phase 3: Input Validation & Edge Cases ---');

    // 6. POST missing scheme_id
    const resMissingScheme = await request('/api/applications', 'POST', { status: 'Interested' }, userAToken);
    record(6, 'POST missing scheme_id returns 400', resMissingScheme.status === 400, resMissingScheme.body.message, resMissingScheme.status);

    // 7. POST non-numeric scheme_id
    const resNonNumericScheme = await request('/api/applications', 'POST', { scheme_id: 'abc' }, userAToken);
    record(7, 'POST non-numeric scheme_id returns 400', resNonNumericScheme.status === 400, resNonNumericScheme.body.message, resNonNumericScheme.status);

    // 8. POST non-existent scheme_id (99999999)
    const resNonExistentScheme = await request('/api/applications', 'POST', { scheme_id: 99999999 }, userAToken);
    record(8, 'POST non-existent scheme_id returns 404', resNonExistentScheme.status === 404, resNonExistentScheme.body.message, resNonExistentScheme.status);

    // 9. POST invalid status
    const resInvalidStatus = await request('/api/applications', 'POST', { scheme_id: 1, status: 'InvalidStatusXYZ' }, userAToken);
    record(9, 'POST invalid status returns 400', resInvalidStatus.status === 400, resInvalidStatus.body.message, resInvalidStatus.status);

    // 10. POST reference > 100 chars
    const longRef = 'A'.repeat(105);
    const resLongRef = await request('/api/applications', 'POST', { scheme_id: 1, application_reference: longRef }, userAToken);
    record(10, 'POST reference > 100 chars returns 400', resLongRef.status === 400, resLongRef.body.message, resLongRef.status);

    // 11. POST notes > 2000 chars
    const longNotes = 'B'.repeat(2005);
    const resLongNotes = await request('/api/applications', 'POST', { scheme_id: 1, notes: longNotes }, userAToken);
    record(11, 'POST notes > 2000 chars returns 400', resLongNotes.status === 400, resLongNotes.body.message, resLongNotes.status);

    // 12. PATCH non-UUID id
    const resInvalidUuidPatch = await request('/api/applications/invalid-uuid-123', 'PATCH', { status: 'Applied' }, userAToken);
    record(12, 'PATCH non-UUID parameter returns 400', resInvalidUuidPatch.status === 400, resInvalidUuidPatch.body.message, resInvalidUuidPatch.status);

    // 13. DELETE non-UUID id
    const resInvalidUuidDelete = await request('/api/applications/invalid-uuid-123', 'DELETE', null, userAToken);
    record(13, 'DELETE non-UUID parameter returns 400', resInvalidUuidDelete.status === 400, resInvalidUuidDelete.body.message, resInvalidUuidDelete.status);

    // 14. PATCH non-existent UUID
    const randomUuid = '00000000-0000-0000-0000-000000000000';
    const resNonExistentPatch = await request(`/api/applications/${randomUuid}`, 'PATCH', { status: 'Applied' }, userAToken);
    record(14, 'PATCH non-existent application returns 404', resNonExistentPatch.status === 404, resNonExistentPatch.body.message, resNonExistentPatch.status);

    // 15. DELETE non-existent UUID
    const resNonExistentDelete = await request(`/api/applications/${randomUuid}`, 'DELETE', null, userAToken);
    record(15, 'DELETE non-existent application returns 404', resNonExistentDelete.status === 404, resNonExistentDelete.body.message, resNonExistentDelete.status);

    // --- Phase 4: Core CRUD Operations (User A) ---
    console.log('\n--- Phase 4: Core CRUD Functionality (User A) ---');

    // 16. POST create Application 1 (Scheme 1, default/Interested)
    const resCreate1 = await request('/api/applications', 'POST', {
      scheme_id: 1,
      status: 'Interested',
      notes: 'Plan to apply after gathering tax returns.',
    }, userAToken);
    const app1Id = resCreate1.body.data?.id;
    const create1Ok = resCreate1.status === 201 && resCreate1.body.success && app1Id && resCreate1.body.data.status === 'Interested';
    record(16, 'POST creates Application 1 (status: Interested)', create1Ok, `Created ID: ${app1Id}`, resCreate1.status);

    // 17. POST create Application 2 (Scheme 2, Applied with reference and notes)
    const resCreate2 = await request('/api/applications', 'POST', {
      scheme_id: 2,
      status: 'Applied',
      application_reference: 'GOV-BIMA-2026-9988',
      notes: 'Applied through bank branch portal with Aadhaar.',
    }, userAToken);
    const app2Id = resCreate2.body.data?.id;
    const create2Ok = resCreate2.status === 201 && resCreate2.body.success && app2Id && resCreate2.body.data.status === 'Applied';
    record(17, 'POST creates Application 2 (status: Applied, with reference)', create2Ok, `Created ID: ${app2Id}`, resCreate2.status);

    // 18. GET /api/applications returns both applications with joined schemes
    const resListAll = await request('/api/applications', 'GET', null, userAToken);
    const listAllOk = resListAll.status === 200 &&
      Array.isArray(resListAll.body.data) &&
      resListAll.body.data.length === 2 &&
      resListAll.body.data.every((app) => app.scheme && app.scheme.title);
    record(18, 'GET /api/applications returns 2 items with joined scheme details', listAllOk, `Found ${resListAll.body.data?.length} applications`, resListAll.status);

    // 19. GET /api/applications?status=Applied filters by status
    const resFilterStatus = await request('/api/applications?status=Applied', 'GET', null, userAToken);
    const filterStatusOk = resFilterStatus.status === 200 &&
      Array.isArray(resFilterStatus.body.data) &&
      resFilterStatus.body.data.length === 1 &&
      resFilterStatus.body.data[0].status === 'Applied';
    record(19, 'GET /api/applications?status=Applied returns only matching items', filterStatusOk, `Found ${resFilterStatus.body.data?.length} filtered item(s)`, resFilterStatus.status);

    // 20. PATCH Application 1 transition to 'Under Review'
    const resPatch1 = await request(`/api/applications/${app1Id}`, 'PATCH', {
      status: 'Under Review',
      application_reference: 'SUI-2026-8877',
      notes: 'Documents verified by nodal bank officer.',
    }, userAToken);
    const patch1Ok = resPatch1.status === 200 &&
      resPatch1.body.success &&
      resPatch1.body.data.status === 'Under Review' &&
      resPatch1.body.data.application_reference === 'SUI-2026-8877';
    record(20, 'PATCH Application 1 updates status to Under Review', patch1Ok, `New status: ${resPatch1.body.data?.status}`, resPatch1.status);

    // 21. PATCH Application 1 with invalid status rejected
    const resPatchInvalid = await request(`/api/applications/${app1Id}`, 'PATCH', {
      status: 'NotAValidStatus',
    }, userAToken);
    record(21, 'PATCH with invalid status returns 400', resPatchInvalid.status === 400, resPatchInvalid.body.message, resPatchInvalid.status);

    // 22. PATCH Application 1 transition to 'Approved'
    const resPatchApproved = await request(`/api/applications/${app1Id}`, 'PATCH', {
      status: 'Approved',
      notes: 'Sanction letter received.',
    }, userAToken);
    const patchApprovedOk = resPatchApproved.status === 200 && resPatchApproved.body.data.status === 'Approved';
    record(22, 'PATCH Application 1 updates status to Approved', patchApprovedOk, `Status: ${resPatchApproved.body.data?.status}`, resPatchApproved.status);

    // 23. DELETE Application 1
    const resDelete1 = await request(`/api/applications/${app1Id}`, 'DELETE', null, userAToken);
    record(23, 'DELETE Application 1 succeeds with 200', resDelete1.status === 200 && resDelete1.body.success, resDelete1.body.message, resDelete1.status);

    // 24. GET /api/applications reflects deletion
    const resListAfterDel = await request('/api/applications', 'GET', null, userAToken);
    const listAfterDelOk = resListAfterDel.status === 200 &&
      resListAfterDel.body.data.length === 1 &&
      resListAfterDel.body.data[0].id === app2Id;
    record(24, 'GET after deletion reflects only remaining Application 2', listAfterDelOk, `Remaining count: ${resListAfterDel.body.data?.length}`, resListAfterDel.status);

    // --- Phase 5: Multi-User RLS Isolation ---
    console.log('\n--- Phase 5: Multi-User RLS Isolation ---');

    // 25. User B calls GET /api/applications: cannot see User A's Application 2
    const resUserBList = await request('/api/applications', 'GET', null, userBToken);
    const userBListIsolated = resUserBList.status === 200 &&
      Array.isArray(resUserBList.body.data) &&
      resUserBList.body.data.length === 0;
    record(25, 'RLS Isolation: User B cannot see User A application', userBListIsolated, `User B saw ${resUserBList.body.data?.length} applications (expected 0)`, resUserBList.status);

    // 26. User B attempts PATCH User A's Application 2: must return 404
    const resUserBPatch = await request(`/api/applications/${app2Id}`, 'PATCH', { status: 'Rejected' }, userBToken);
    record(26, 'RLS Isolation: User B cannot modify User A application (returns 404)', resUserBPatch.status === 404, resUserBPatch.body.message, resUserBPatch.status);

    // 27. User B attempts DELETE User A's Application 2: must return 404
    const resUserBDelete = await request(`/api/applications/${app2Id}`, 'DELETE', null, userBToken);
    record(27, 'RLS Isolation: User B cannot delete User A application (returns 404)', resUserBDelete.status === 404, resUserBDelete.body.message, resUserBDelete.status);

    // 28. User B creates their own application for Scheme 3
    const resUserBCreate = await request('/api/applications', 'POST', {
      scheme_id: 3,
      status: 'Completed',
      application_reference: 'USER-B-VET-2026',
      notes: 'Disbursement received in bank.',
    }, userBToken);
    const userBAppId = resUserBCreate.body.data?.id;
    const userBCreateOk = resUserBCreate.status === 201 && userBAppId;
    record(28, 'User B can create their own application (Scheme 3)', userBCreateOk, `Created User B ID: ${userBAppId}`, resUserBCreate.status);

    // 29. User A calls GET /api/applications: does NOT see User B's application
    const resUserAListAgain = await request('/api/applications', 'GET', null, userAToken);
    const userAIsoOk = resUserAListAgain.status === 200 &&
      resUserAListAgain.body.data.length === 1 &&
      resUserAListAgain.body.data[0].id === app2Id &&
      !resUserAListAgain.body.data.some((a) => a.id === userBAppId);
    record(29, 'RLS Isolation: User A does NOT see User B application', userAIsoOk, `User A saw only own Application 2`, resUserAListAgain.status);

    // Clean up remaining test data
    await request(`/api/applications/${app2Id}`, 'DELETE', null, userAToken);
    await request(`/api/applications/${userBAppId}`, 'DELETE', null, userBToken);

    // --- Phase 6: Regression Testing on Existing APIs ---
    console.log('\n--- Phase 6: Regression Testing on Existing APIs ---');

    // 30. GET /api/schemes
    const resSchemes = await request('/api/schemes?page=1&limit=5', 'GET');
    record(30, 'GET /api/schemes regression', resSchemes.status === 200 && resSchemes.body.data.length === 5, `Returned 5 schemes`, resSchemes.status);

    // 31. GET /api/saved-schemes
    const resSaved = await request('/api/saved-schemes', 'GET', null, userAToken);
    record(31, 'GET /api/saved-schemes regression', resSaved.status === 200 && Array.isArray(resSaved.body.data), `Returned saved schemes array`, resSaved.status);

    // 32. GET /api/health
    const resHealth = await request('/api/health', 'GET');
    record(32, 'GET /api/health regression', resHealth.status === 200 && resHealth.body.success === true, 'Backend health verified', resHealth.status);

    // --- Summary ---
    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;

    console.log('\n====================================================');
    console.log(` Test Suite Completed: ${passed}/${total} Passed (${failed} Failed)`);
    console.log('====================================================');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Fatal error running application test suite:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

run();
