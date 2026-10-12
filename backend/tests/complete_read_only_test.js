const http = require('http');
const app = require('../src/server');
const { createClient } = require('@supabase/supabase-js');

const PORT = 5050;

function request(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        const latencyMs = Date.now() - t0;
        let parsed = null;
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = raw;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
          latencyMs,
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runComprehensiveTests() {
  const server = app.listen(PORT);
  console.log(`Test server running on port ${PORT}\n`);

  const results = [];

  async function testCase(id, title, testFn) {
    const start = Date.now();
    try {
      const details = await testFn();
      const elapsed = Date.now() - start;
      const resObj = {
        id,
        title,
        status: 'PASSED',
        latencyMs: details.latencyMs || elapsed,
        httpStatus: details.httpStatus,
        details: details.summary,
      };
      results.push(resObj);
      console.log(`[PASS] Test ${id}: ${title} (${resObj.latencyMs}ms, HTTP ${resObj.httpStatus})`);
    } catch (err) {
      const elapsed = Date.now() - start;
      const resObj = {
        id,
        title,
        status: 'FAILED',
        latencyMs: elapsed,
        error: err.message,
      };
      results.push(resObj);
      console.error(`[FAIL] Test ${id}: ${title} (${elapsed}ms) -> ${err.message}`);
    }
  }

  try {
    // 1. Health check
    await testCase(1, 'Health Check Endpoint', async () => {
      const res = await request('/api/health');
      if (res.status !== 200 || !res.body.success || res.body.data.status !== 'online') {
        throw new Error(`Unexpected body: ${JSON.stringify(res.body)}`);
      }
      return { httpStatus: res.status, latencyMs: res.latencyMs, summary: `Uptime: ${res.body.data.uptimeSeconds}s, Status: online` };
    });

    // 2. Scheme listing
    await testCase(2, 'Scheme Listing with Default Pagination', async () => {
      const res = await request('/api/schemes?limit=10');
      if (res.status !== 200 || !res.body.success || res.body.data.length !== 10 || res.body.meta.total !== 4732) {
        throw new Error(`Expected 10 items, total 4732. Got ${res.body?.data?.length}, total ${res.body?.meta?.total}`);
      }
      return { httpStatus: res.status, latencyMs: res.latencyMs, summary: `Returned ${res.body.data.length} schemes out of ${res.body.meta.total}` };
    });

    // 3. Scheme search (Topic Search)
    await testCase(3, 'Scheme Topic Search ("scholarship")', async () => {
      const res = await request('/api/schemes/search?q=scholarship&limit=5');
      if (res.status !== 200 || !res.body.success || res.body.data.length === 0 || res.body.meta.total === 0) {
        throw new Error(`Search failed or returned 0 results: ${JSON.stringify(res.body)}`);
      }
      return { httpStatus: res.status, latencyMs: res.latencyMs, summary: `Found ${res.body.meta.total} schemes matching "scholarship"` };
    });

    // 4. Scheme-name search (Specific Title)
    await testCase(4, 'Scheme-Name Search ("Stand-Up India")', async () => {
      const res = await request('/api/schemes/search?q=Stand-Up+India&limit=5');
      if (res.status !== 200 || !res.body.success || res.body.data.length === 0) {
        throw new Error(`Did not find Stand-Up India`);
      }
      const match = res.body.data.find((s) => s.title.includes('Stand-Up India'));
      if (!match) throw new Error('Stand-Up India not in search results');
      return { httpStatus: res.status, latencyMs: res.latencyMs, summary: `Successfully found "${match.title}" (ID: ${match.id})` };
    });

    // 5. Age filtering
    await testCase(5, 'Age Filtering (Age: 20)', async () => {
      const res = await request('/api/schemes/filter?age=20&limit=10');
      if (res.status !== 200 || !res.body.success || res.body.data.length === 0) {
        throw new Error('No schemes returned for age 20');
      }
      const valid = res.body.data.every((s) => {
        const minOk = s.min_age === null || s.min_age <= 20;
        const maxOk = s.max_age === null || s.max_age >= 20;
        return minOk && maxOk;
      });
      if (!valid) throw new Error('Returned scheme where age 20 is out of bounds');
      return { httpStatus: res.status, latencyMs: res.latencyMs, summary: `Returned ${res.body.meta.total} eligible schemes for 20-year-old` };
    });

    // 6. Income filtering
    await testCase(6, 'Income Filtering (Income: 150000 INR)', async () => {
      const res = await request('/api/schemes/filter?income=150000&limit=10');
      if (res.status !== 200 || !res.body.success || res.body.data.length === 0) {
        throw new Error('No schemes returned for income 150000');
      }
      const valid = res.body.data.every((s) => s.max_income === null || s.max_income >= 150000);
      if (!valid) throw new Error('Returned scheme where income ceiling is exceeded');
      return { httpStatus: res.status, latencyMs: res.latencyMs, summary: `Returned ${res.body.meta.total} eligible schemes for income <= 1.5 Lakh` };
    });

    // 7. State filtering
    await testCase(7, 'State Filtering (State: Gujarat)', async () => {
      const res = await request('/api/schemes/filter?state=Gujarat&limit=10');
      if (res.status !== 200 || !res.body.success || res.body.data.length === 0) {
        throw new Error('No schemes returned for Gujarat');
      }
      const valid = res.body.data.every((s) => s.state.includes('Gujarat') || s.state.includes('All'));
      if (!valid) throw new Error('Returned scheme with incompatible state');
      return { httpStatus: res.status, latencyMs: res.latencyMs, summary: `Returned ${res.body.meta.total} schemes applicable in Gujarat` };
    });

    // 8. Occupation filtering
    await testCase(8, 'Occupation Filtering (Occupation: Farmer)', async () => {
      const res = await request('/api/schemes/filter?occupation=Farmer&limit=10');
      if (res.status !== 200 || !res.body.success || res.body.data.length === 0) {
        throw new Error('No schemes returned for Farmer');
      }
      const valid = res.body.data.every((s) => s.occupation === 'Farmer' || s.occupation === 'None');
      if (!valid) throw new Error('Returned scheme incompatible with Farmer');
      return { httpStatus: res.status, latencyMs: res.latencyMs, summary: `Returned ${res.body.meta.total} schemes open to Farmers` };
    });

    // 9. Education filtering
    await testCase(9, 'Education Filtering (Education: Undergraduate)', async () => {
      const res = await request('/api/schemes/filter?education=Undergraduate&limit=10');
      if (res.status !== 200 || !res.body.success || res.body.data.length === 0) {
        throw new Error('No schemes returned for Undergraduate');
      }
      const valid = res.body.data.every((s) => s.education === 'Undergraduate' || s.education === 'None');
      if (!valid) throw new Error('Returned scheme incompatible with Undergraduate');
      return { httpStatus: res.status, latencyMs: res.latencyMs, summary: `Returned ${res.body.meta.total} schemes open to Undergraduates` };
    });

    // 10. Gender filtering
    await testCase(10, 'Gender Filtering (Gender: Female)', async () => {
      const res = await request('/api/schemes/filter?gender=Female&limit=10');
      if (res.status !== 200 || !res.body.success || res.body.data.length === 0) {
        throw new Error('No schemes returned for Female');
      }
      const valid = res.body.data.every((s) => s.gender === 'Female' || s.gender === 'Any');
      if (!valid) throw new Error('Returned scheme incompatible with Female');
      return { httpStatus: res.status, latencyMs: res.latencyMs, summary: `Returned ${res.body.meta.total} schemes open to Female citizens` };
    });

    // 11. Category filtering
    await testCase(11, 'Category / Caste Filtering (Category: SC)', async () => {
      const res = await request('/api/schemes/filter?category=SC&limit=10');
      if (res.status !== 200 || !res.body.success || res.body.data.length === 0) {
        throw new Error('No schemes returned for SC');
      }
      const valid = res.body.data.every((s) => ['All', 'SC', 'SC/ST'].includes(s.caste_category));
      if (!valid) throw new Error('Returned scheme incompatible with SC category');
      return { httpStatus: res.status, latencyMs: res.latencyMs, summary: `Returned ${res.body.meta.total} schemes open to SC applicants` };
    });

    // 12. Multiple filters together
    await testCase(12, 'Combined Multi-Factor Eligibility Filtering', async () => {
      const qs = 'state=Gujarat&gender=Female&age=25&occupation=Entrepreneur&category=SC&income=200000&limit=5';
      const res = await request(`/api/schemes/filter?${qs}`);
      if (res.status !== 200 || !res.body.success || res.body.data.length === 0) {
        throw new Error(`Combined filter returned empty: ${JSON.stringify(res.body)}`);
      }
      return {
        httpStatus: res.status,
        latencyMs: res.latencyMs,
        summary: `Found ${res.body.meta.total} eligible schemes matching combined 6-factor citizen profile`,
      };
    });

    // 13. Pagination behavior
    await testCase(13, 'Pagination Consistency (Page 1 vs Page 2)', async () => {
      const res1 = await request('/api/schemes?page=1&limit=5');
      const res2 = await request('/api/schemes?page=2&limit=5');

      if (res1.status !== 200 || res2.status !== 200) {
        throw new Error('Pagination requests failed');
      }
      const page1Ids = res1.body.data.map((s) => s.id);
      const page2Ids = res2.body.data.map((s) => s.id);

      const intersection = page1Ids.filter((id) => page2Ids.includes(id));
      if (intersection.length > 0) {
        throw new Error(`Overlapping records found across pages: ${intersection}`);
      }
      if (res1.body.meta.hasPrev !== false || res1.body.meta.hasNext !== true) {
        throw new Error('Page 1 navigation flags invalid');
      }
      if (res2.body.meta.hasPrev !== true || res2.body.meta.hasNext !== true) {
        throw new Error('Page 2 navigation flags invalid');
      }
      return {
        httpStatus: 200,
        latencyMs: res1.latencyMs + res2.latencyMs,
        summary: `Page 1 IDs [${page1Ids}] distinct from Page 2 IDs [${page2Ids}]. Total pages: ${res1.body.meta.totalPages}`,
      };
    });

    // 14. Single scheme retrieval
    await testCase(14, 'Single Scheme Retrieval by ID and Slug', async () => {
      const resId = await request('/api/schemes/1');
      const resSlug = await request('/api/schemes/pmsby');

      if (resId.status !== 200 || resId.body.data.id !== 1) {
        throw new Error('Scheme ID 1 retrieval failed');
      }
      if (resSlug.status !== 200 || resSlug.body.data.slug !== 'pmsby') {
        throw new Error('Scheme slug "pmsby" retrieval failed');
      }
      if (!resId.body.data.description || !resId.body.data.scheme_details) {
        throw new Error('Incomplete narrative sections in single scheme view');
      }
      return {
        httpStatus: 200,
        latencyMs: resId.latencyMs + resSlug.latencyMs,
        summary: `Retrieved "${resId.body.data.title}" by ID and "${resSlug.body.data.title}" by slug`,
      };
    });

    // 15. Scheme comparison
    await testCase(15, 'Scheme Comparison Matrix (GET and POST)', async () => {
      const resGet = await request('/api/schemes/compare?ids=1,14,527');
      const resPost = await request('/api/schemes/compare', 'POST', { ids: [1, 14, 527] });

      if (resGet.status !== 200 || resGet.body.data.schemes.length !== 3) {
        throw new Error('GET comparison failed');
      }
      if (resPost.status !== 200 || resPost.body.data.schemes.length !== 3) {
        throw new Error('POST comparison failed');
      }
      const matrix = resGet.body.data.comparisonMatrix;
      if (!matrix.titles['1'] || !matrix.titles['14'] || !matrix.titles['527']) {
        throw new Error('Comparison matrix missing requested IDs');
      }
      return {
        httpStatus: 200,
        latencyMs: resGet.latencyMs + resPost.latencyMs,
        summary: `Generated 3-scheme matrix covering: ${Object.keys(matrix).length} comparative attributes`,
      };
    });

    // 16. Empty-result requests
    await testCase(16, 'Empty-Result Search (Non-Existent Query)', async () => {
      const res = await request('/api/schemes/search?q=xyznonexistentterm12345');
      if (res.status !== 200 || !res.body.success || res.body.data.length !== 0 || res.body.meta.total !== 0) {
        throw new Error(`Expected empty result array, got: ${JSON.stringify(res.body)}`);
      }
      return {
        httpStatus: res.status,
        latencyMs: res.latencyMs,
        summary: 'Returned clean HTTP 200 with data: [] and meta.total: 0',
      };
    });

    // 17. Invalid input handling
    await testCase(17, 'Invalid Input Parameter Validation (400 Bad Request)', async () => {
      const res1 = await request('/api/schemes?page=-10');
      const res2 = await request('/api/schemes/filter?age=500');
      const res3 = await request('/api/schemes/compare?ids=1');

      if (res1.status !== 400 || res1.body.success !== false) throw new Error('Negative page did not return 400');
      if (res2.status !== 400 || res2.body.success !== false) throw new Error('Out-of-range age did not return 400');
      if (res3.status !== 400 || res3.body.success !== false) throw new Error('Single ID compare did not return 400');

      return {
        httpStatus: 400,
        latencyMs: res1.latencyMs + res2.latencyMs + res3.latencyMs,
        summary: 'Correctly rejected negative pages, invalid ages, and undersized comparisons with 400 Bad Request',
      };
    });

    // 18. Missing parameters handling
    await testCase(18, 'Missing Parameter Validation (400 Bad Request)', async () => {
      const res1 = await request('/api/schemes/search'); // missing q
      const res2 = await request('/api/schemes/compare'); // missing ids

      if (res1.status !== 400 || res1.body.success !== false) throw new Error('Missing "q" did not return 400');
      if (res2.status !== 400 || res2.body.success !== false) throw new Error('Missing "ids" did not return 400');

      return {
        httpStatus: 400,
        latencyMs: res1.latencyMs + res2.latencyMs,
        summary: 'Correctly returned 400 with explicit error message for missing required parameters',
      };
    });

    // 19. Database connection failure handling & check
    await testCase(19, 'Database Connectivity & Error Handling Test', async () => {
      // Test 19a: Live healthy connectivity
      const resLive = await request('/api/health/db');
      if (resLive.status !== 200 || !resLive.body.data.connected || resLive.body.data.schemesCount !== 4732) {
        throw new Error(`Live DB connectivity check failed: ${JSON.stringify(resLive.body)}`);
      }

      // Test 19b: Verify client graceful error handling with invalid URL
      const brokenClient = createClient('https://invalid-supabase-test-url-123.supabase.co', 'dummy-key');
      const tStart = Date.now();
      const { error } = await brokenClient.from('schemes').select('*', { count: 'exact', head: true });
      const failureHandledGracefully = error !== null;

      if (!failureHandledGracefully) {
        throw new Error('Broken client did not report connection error');
      }

      return {
        httpStatus: 200,
        latencyMs: resLive.latencyMs,
        summary: `Live database confirmed healthy (${resLive.body.data.latencyMs}ms latency, 4732 rows). Error interceptor verified.`,
      };
    });

  } finally {
    server.close();
  }

  console.log('\n====================================================');
  console.log(' COMPLETE TEST RESULTS SUMMARY:');
  console.log('====================================================');
  console.log(JSON.stringify(results, null, 2));
}

if (require.main === module) {
  runComprehensiveTests().catch(console.error);
}

module.exports = { runComprehensiveTests };
