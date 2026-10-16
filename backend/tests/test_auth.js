/**
 * @file test_auth.js
 * @description Comprehensive automated test suite for Supabase Authentication & Profile endpoints.
 */

const http = require('http');
const app = require('../src/server');

const TEST_PORT = 5002;

function makeRequest(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: 'localhost',
      port: TEST_PORT,
      path,
      method,
      headers,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runAuthTests() {
  console.log('====================================================');
  console.log(' Starting Supabase Auth & Profile Integration Tests');
  console.log('====================================================\n');

  const server = app.listen(TEST_PORT);
  let passed = 0;
  let failed = 0;

  async function assertTest(name, fn) {
    try {
      await fn();
      console.log(`  PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  FAIL: ${name} -> ${err.message}`);
      failed++;
    }
  }

  // Pre-created verified test user credentials
  const verifiedEmail = 'schemefinder.citizen.1791833857341@gmail.com';
  const verifiedPassword = 'StrongPassword123!';
  let activeToken = null;

  try {
    // 1. Validation: Missing body on signup
    await assertTest('POST /api/auth/signup with empty body returns 400', async () => {
      const res = await makeRequest('/api/auth/signup', 'POST', {});
      if (res.status !== 400 || res.body.success !== false) {
        throw new Error(`Expected 400 Bad Request, got: ${res.status}`);
      }
    });

    // 2. Validation: Short password on signup
    await assertTest('POST /api/auth/signup with short password returns 400', async () => {
      const res = await makeRequest('/api/auth/signup', 'POST', {
        email: 'test@gmail.com',
        password: '123',
      });
      if (res.status !== 400 || res.body.success !== false) {
        throw new Error(`Expected 400 Bad Request for short password, got: ${res.status}`);
      }
    });

    // 3. Validation: Missing email on login
    await assertTest('POST /api/auth/login with missing email returns 400', async () => {
      const res = await makeRequest('/api/auth/login', 'POST', { password: 'SomePassword' });
      if (res.status !== 400 || res.body.success !== false) {
        throw new Error(`Expected 400 Bad Request for missing email, got: ${res.status}`);
      }
    });

    // 4. Invalid credentials on login
    await assertTest('POST /api/auth/login with wrong password returns 401', async () => {
      const res = await makeRequest('/api/auth/login', 'POST', {
        email: verifiedEmail,
        password: 'WrongPassword999!',
      });
      if (res.status !== 401 || res.body.success !== false) {
        throw new Error(`Expected 401 Unauthorized, got: ${res.status}`);
      }
    });

    // 5. Successful login
    await assertTest('POST /api/auth/login with valid credentials returns 200 and JWT', async () => {
      const res = await makeRequest('/api/auth/login', 'POST', {
        email: verifiedEmail,
        password: verifiedPassword,
      });
      if (res.status !== 200 || !res.body.success || !res.body.session?.access_token) {
        throw new Error(`Expected 200 with access_token, got: ${JSON.stringify(res.body)}`);
      }
      activeToken = res.body.session.access_token;
      if (!res.body.user?.email || res.body.user.email !== verifiedEmail) {
        throw new Error('User email mismatch in login response');
      }
    });

    // 6. GET /api/auth/me without token (401)
    await assertTest('GET /api/auth/me without Authorization header returns 401', async () => {
      const res = await makeRequest('/api/auth/me');
      if (res.status !== 401 || res.body.success !== false) {
        throw new Error(`Expected 401 Unauthorized, got: ${res.status}`);
      }
    });

    // 7. GET /api/auth/me with invalid token (401)
    await assertTest('GET /api/auth/me with fake token returns 401', async () => {
      const res = await makeRequest('/api/auth/me', 'GET', null, 'fake-invalid-jwt-token');
      if (res.status !== 401 || res.body.success !== false) {
        throw new Error(`Expected 401 Unauthorized for fake token, got: ${res.status}`);
      }
    });

    // 8. GET /api/auth/me with valid Bearer token (200)
    await assertTest('GET /api/auth/me with valid token returns current citizen', async () => {
      const res = await makeRequest('/api/auth/me', 'GET', null, activeToken);
      if (res.status !== 200 || !res.body.success || res.body.user.email !== verifiedEmail) {
        throw new Error(`Expected 200 and user email, got: ${JSON.stringify(res.body)}`);
      }
    });

    // 9. GET /api/profile with valid token (200)
    await assertTest('GET /api/profile returns citizen demographic profile', async () => {
      const res = await makeRequest('/api/profile', 'GET', null, activeToken);
      if (res.status !== 200 || !res.body.success || !res.body.profile) {
        throw new Error(`Expected 200 and profile object, got: ${JSON.stringify(res.body)}`);
      }
    });

    // 10. PATCH /api/profile without token (401)
    await assertTest('PATCH /api/profile without token returns 401', async () => {
      const res = await makeRequest('/api/profile', 'PATCH', { state: 'Maharashtra' });
      if (res.status !== 401 || res.body.success !== false) {
        throw new Error(`Expected 401 Unauthorized, got: ${res.status}`);
      }
    });

    // 11. PATCH /api/profile with invalid age (400)
    await assertTest('PATCH /api/profile with age > 125 returns 400', async () => {
      const res = await makeRequest('/api/profile', 'PATCH', { age: 300 }, activeToken);
      if (res.status !== 400 || res.body.success !== false) {
        throw new Error(`Expected 400 Bad Request for age 300, got: ${res.status}`);
      }
    });

    // 12. PATCH /api/profile with valid demographic criteria (200)
    await assertTest('PATCH /api/profile updates citizen state, age, and occupation', async () => {
      const updates = {
        fullName: 'Aarav Sharma',
        state: 'Rajasthan',
        age: 27,
        gender: 'Male',
        occupation: 'Farmer',
        annualIncome: 120000,
        casteCategory: 'OBC',
        isBpl: true,
      };

      const res = await makeRequest('/api/profile', 'PATCH', updates, activeToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Expected 200 OK on profile update, got: ${JSON.stringify(res.body)}`);
      }
      if (res.body.profile.state !== 'Rajasthan' || res.body.profile.age !== 27 || res.body.profile.occupation !== 'Farmer' || res.body.profile.category !== 'OBC') {
        throw new Error(`Profile fields not updated correctly: ${JSON.stringify(res.body.profile)}`);
      }
    });

    // 13. POST /api/auth/logout without token (401)
    await assertTest('POST /api/auth/logout without token returns 401', async () => {
      const res = await makeRequest('/api/auth/logout', 'POST');
      if (res.status !== 401 || res.body.success !== false) {
        throw new Error(`Expected 401 Unauthorized, got: ${res.status}`);
      }
    });

    // 14. POST /api/auth/logout with valid token (200)
    await assertTest('POST /api/auth/logout with valid token returns 200', async () => {
      const res = await makeRequest('/api/auth/logout', 'POST', {}, activeToken);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Expected 200 OK on logout, got: ${JSON.stringify(res.body)}`);
      }
    });

    // 15. POST /api/auth/signup creates new citizen (201 or 429 Supabase rate limit)
    await assertTest('POST /api/auth/signup registers account (or hits Supabase hourly rate limit)', async () => {
      const uniqueEmail = `citizen.test.${Date.now()}@gmail.com`;
      const res = await makeRequest('/api/auth/signup', 'POST', {
        email: uniqueEmail,
        password: 'Password123!',
        fullName: 'New Test Citizen',
      });
      if (res.status === 201 && res.body.success && res.body.user) {
        if (res.body.user.email !== uniqueEmail) {
          throw new Error('Registered user email mismatch');
        }
      } else if (res.status === 429 && res.body.message?.includes('rate limit')) {
        // Supabase free tier rate-limits confirmation emails to ~3-4/hr
        console.log('    [Notice: Supabase free-tier email rate limit reached (HTTP 429) - handled gracefully]');
      } else {
        throw new Error(`Expected 201 Created or 429 Rate Limit, got: ${res.status} - ${JSON.stringify(res.body)}`);
      }
    });

  } finally {
    server.close();
  }

  console.log('\n====================================================');
  console.log(` Auth Test Suite Completed: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runAuthTests().catch((err) => {
    console.error('Fatal auth test error:', err);
    process.exit(1);
  });
}

module.exports = { runAuthTests };
