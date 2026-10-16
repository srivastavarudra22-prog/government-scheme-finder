/**
 * @file test_chat.js
 * @description Comprehensive automated test suite for AI Chat Assistant backend endpoints.
 * 
 * Verifies:
 * 1. Authentication enforcement:
 *    - 401 Unauthorized when POST /api/chat/message without token.
 *    - 401 Unauthorized when GET /api/chat/status without token.
 *    - 401 Unauthorized when provided invalid bearer token.
 * 2. Input validation:
 *    - 400 Bad Request when request body is empty.
 *    - 400 Bad Request when message is missing or empty whitespace.
 *    - 400 Bad Request when message is non-string.
 *    - 400 Bad Request when message exceeds 1500 characters.
 * 3. Authenticated message submission:
 *    - 200 OK returned with structured response.
 *    - Confirms `status: "NOT_IMPLEMENTED"` and `message: "AI assistant is not connected yet."`.
 *    - Confirms development placeholder notice is returned.
 *    - Confirms prompt is echoed accurately without fake scheme data.
 * 4. Authenticated status endpoint:
 *    - 200 OK returned with `available: false`, `ragConnected: false`, `model: null`.
 * 5. Regression safety:
 *    - Core API endpoints (/api/health, /api/schemes) continue functioning properly.
 */

const http = require('http');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const app = require('../src/server');

const TEST_PORT = 5008;

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
  const userEmail = 'schemefinder.citizen.1791833857341@gmail.com';
  const userPassword = 'StrongPassword123!';
  let userToken = null;
  let userId = null;

  try {
    console.log('====================================================');
    console.log(' Starting AI Chat Assistant Backend Test Suite');
    console.log('====================================================\n');

    // --- Phase 1: Authentication ---
    console.log('--- Phase 1: Authenticating Citizen User ---');
    const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: userPassword,
    });

    if (authErr || !auth.session) {
      throw new Error('Citizen auth failed: ' + (authErr?.message || 'No session'));
    }
    userToken = auth.session.access_token;
    userId = auth.user.id;
    console.log(`Authenticated Citizen: ${userEmail} (ID: ${userId})\n`);

    // --- Phase 2: Authentication Enforcement Tests ---
    console.log('--- Phase 2: Authentication Security & Middleware Tests ---');
    
    // Test 1: POST /api/chat/message without token
    const unauthPost = await request('/api/chat/message', 'POST', { message: 'Hello' });
    record(
      1,
      'POST /api/chat/message rejects unauthenticated request with 401',
      unauthPost.status === 401,
      `Received status ${unauthPost.status}`,
      unauthPost.status
    );

    // Test 2: GET /api/chat/status without token
    const unauthGet = await request('/api/chat/status', 'GET');
    record(
      2,
      'GET /api/chat/status rejects unauthenticated request with 401',
      unauthGet.status === 401,
      `Received status ${unauthGet.status}`,
      unauthGet.status
    );

    // Test 3: POST /api/chat/message with invalid bearer token
    const invalidTokenPost = await request(
      '/api/chat/message',
      'POST',
      { message: 'Hello' },
      'invalid.mock.jwt.token'
    );
    record(
      3,
      'POST /api/chat/message rejects invalid bearer token with 401',
      invalidTokenPost.status === 401,
      `Received status ${invalidTokenPost.status}`,
      invalidTokenPost.status
    );

    // --- Phase 3: Input Validation Tests ---
    console.log('\n--- Phase 3: Input Validation Tests ---');

    // Test 4: Empty body
    const emptyBody = await request('/api/chat/message', 'POST', {}, userToken);
    record(
      4,
      'POST /api/chat/message rejects empty body with 400',
      emptyBody.status === 400 && emptyBody.body?.success === false,
      `Message: "${emptyBody.body?.message}"`,
      emptyBody.status
    );

    // Test 5: Whitespace-only message
    const whitespaceMsg = await request('/api/chat/message', 'POST', { message: '    ' }, userToken);
    record(
      5,
      'POST /api/chat/message rejects whitespace message with 400',
      whitespaceMsg.status === 400 && whitespaceMsg.body?.success === false,
      `Message: "${whitespaceMsg.body?.message}"`,
      whitespaceMsg.status
    );

    // Test 6: Non-string message
    const nonStringMsg = await request('/api/chat/message', 'POST', { message: 12345 }, userToken);
    record(
      6,
      'POST /api/chat/message rejects non-string message with 400',
      nonStringMsg.status === 400 && nonStringMsg.body?.success === false,
      `Message: "${nonStringMsg.body?.message}"`,
      nonStringMsg.status
    );

    // Test 7: Exceeds maximum 1500 characters
    const overlongMsg = await request(
      '/api/chat/message',
      'POST',
      { message: 'A'.repeat(1501) },
      userToken
    );
    record(
      7,
      'POST /api/chat/message rejects message exceeding 1500 chars with 400',
      overlongMsg.status === 400 && overlongMsg.body?.success === false,
      `Message: "${overlongMsg.body?.message}"`,
      overlongMsg.status
    );

    // --- Phase 4: Chat Assistant Processing & Structured Placeholder ---
    console.log('\n--- Phase 4: Chat Assistant Endpoint Functionality ---');

    // Test 8: Valid question prompt
    const userPrompt = 'Which schemes can I apply for as a student?';
    const validChatRes = await request(
      '/api/chat/message',
      'POST',
      { message: userPrompt },
      userToken
    );

    const isNotImplemented =
      validChatRes.body?.status === 'NOT_IMPLEMENTED' &&
      validChatRes.body?.message === 'AI assistant is not connected yet.' &&
      validChatRes.body?.notice?.includes('Development placeholder') &&
      validChatRes.body?.data?.echo === userPrompt &&
      validChatRes.body?.data?.connected === false;

    record(
      8,
      'POST /api/chat/message returns structured NOT_IMPLEMENTED response without fake data',
      validChatRes.status === 200 && isNotImplemented,
      `Status: "${validChatRes.body?.status}", Msg: "${validChatRes.body?.message}", Notice: "${validChatRes.body?.notice}"`,
      validChatRes.status
    );

    // Test 9: Verify no fake scheme answer fabricated
    const containsNoFakeSchemes =
      !validChatRes.body?.data?.schemes &&
      !validChatRes.body?.data?.recommendations &&
      validChatRes.body?.success === false;

    record(
      9,
      'Ensures response does NOT fabricate fake scheme dataset answers',
      containsNoFakeSchemes,
      `Confirmed: success=${validChatRes.body?.success}, no hallucinated scheme lists`,
      validChatRes.status
    );

    // Test 10: GET /api/chat/status
    const statusRes = await request('/api/chat/status', 'GET', null, userToken);
    const isStatusOk =
      statusRes.status === 200 &&
      statusRes.body?.success === true &&
      statusRes.body?.data?.available === false &&
      statusRes.body?.data?.ragConnected === false &&
      statusRes.body?.data?.model === null;

    record(
      10,
      'GET /api/chat/status reports pre-integration status cleanly',
      isStatusOk,
      `Available: ${statusRes.body?.data?.available}, RAG Connected: ${statusRes.body?.data?.ragConnected}`,
      statusRes.status
    );

    // --- Phase 5: Regression & Health Checks ---
    console.log('\n--- Phase 5: Regression Tests on Core APIs ---');

    // Test 11: GET /api/health
    const health = await request('/api/health', 'GET');
    record(
      11,
      'GET /api/health is healthy and operational',
      health.status === 200 && (health.body?.data?.status === 'online' || health.body?.success === true),
      `Health status: ${health.body?.data?.status || health.body?.status}`,
      health.status
    );

    // Test 12: GET /api/schemes
    const schemes = await request('/api/schemes?page=1&limit=5', 'GET');
    record(
      12,
      'GET /api/schemes returns catalog correctly (unaffected)',
      schemes.status === 200 && Array.isArray(schemes.body?.data),
      `Returned ${schemes.body?.data?.length} schemes`,
      schemes.status
    );

    // --- Summary ---
    console.log('\n====================================================');
    console.log(' Test Suite Summary:');
    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    console.log(` Total Tests:  ${totalCount}`);
    console.log(` Passed:       ${passedCount}`);
    console.log(` Failed:       ${totalCount - passedCount}`);
    console.log('====================================================\n');

    if (passedCount !== totalCount) {
      console.error('Some tests failed!');
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Test suite error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

run();
