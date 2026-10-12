const http = require('http');
const app = require('../src/server');

const TEST_PORT = 5001;

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: TEST_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
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

async function runTestSuite() {
  console.log('====================================================');
  console.log(' Starting Government Scheme Finder Backend Test Suite');
  console.log(' Testing directly against real Supabase database...');
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

  try {
    // 1. Health Endpoint
    await assertTest('GET /api/health returns 200 and online status', async () => {
      const res = await makeRequest('/api/health');
      if (res.status !== 200 || !res.body.success || res.body.data.status !== 'online') {
        throw new Error(`Expected 200 and online status, got: ${JSON.stringify(res.body)}`);
      }
    });

    // 2. Database Connectivity Health
    await assertTest('GET /api/health/db returns 200 and confirms connected to Supabase', async () => {
      const res = await makeRequest('/api/health/db');
      if (res.status !== 200 || !res.body.data.connected || res.body.data.schemesCount !== 4732) {
        throw new Error(`Expected 200, connected: true, schemesCount: 4732, got: ${JSON.stringify(res.body)}`);
      }
    });

    // 3. List Schemes (Pagination)
    await assertTest('GET /api/schemes?page=1&limit=5 returns 5 schemes and total=4732', async () => {
      const res = await makeRequest('/api/schemes?page=1&limit=5');
      if (res.status !== 200 || res.body.data.length !== 5 || res.body.meta.total !== 4732) {
        throw new Error(`Expected 5 items and total 4732, got: length ${res.body?.data?.length}, total ${res.body?.meta?.total}`);
      }
      if (res.body.meta.totalPages !== Math.ceil(4732 / 5) || !res.body.meta.hasNext) {
        throw new Error(`Pagination metadata incorrect: ${JSON.stringify(res.body.meta)}`);
      }
    });

    // 4. List Schemes with State Filter
    await assertTest('GET /api/schemes?state=Gujarat&limit=5 returns schemes applicable to Gujarat', async () => {
      const res = await makeRequest('/api/schemes?state=Gujarat&limit=5');
      if (res.status !== 200 || !res.body.success || res.body.data.length === 0) {
        throw new Error(`Expected schemes for Gujarat, got: ${JSON.stringify(res.body)}`);
      }
      const allApplicable = res.body.data.every((s) => s.state.includes('Gujarat') || s.state.includes('All'));
      if (!allApplicable) {
        throw new Error('Returned scheme that does not include Gujarat or All in state array');
      }
    });

    // 5. Search Schemes (Keyword: 'tractor')
    await assertTest('GET /api/schemes/search?q=tractor returns tractor-related schemes', async () => {
      const res = await makeRequest('/api/schemes/search?q=tractor&limit=5');
      if (res.status !== 200 || !res.body.success || res.body.data.length === 0) {
        throw new Error(`Expected tractor search results, got: ${JSON.stringify(res.body)}`);
      }
      if (res.body.meta.total === 0) {
        throw new Error('Search found 0 matching schemes for "tractor"');
      }
    });

    // 6. Search Schemes (Keyword: 'widow pension')
    await assertTest('GET /api/schemes/search?q=widow+pension returns widow pension schemes', async () => {
      const res = await makeRequest('/api/schemes/search?q=widow+pension&limit=5');
      if (res.status !== 200 || !res.body.success || res.body.data.length === 0) {
        throw new Error(`Expected widow pension search results, got: ${JSON.stringify(res.body)}`);
      }
    });

    // 7. Get Scheme by ID
    await assertTest('GET /api/schemes/1 returns full Stand-Up India details', async () => {
      const res = await makeRequest('/api/schemes/1');
      if (res.status !== 200 || !res.body.success || res.body.data.id !== 1 || res.body.data.title !== 'Stand-Up India') {
        throw new Error(`Expected scheme 1 (Stand-Up India), got: ${JSON.stringify(res.body)}`);
      }
      if (!res.body.data.description || !res.body.data.eligibility_criteria) {
        throw new Error('Detailed narrative fields missing in single scheme response');
      }
    });

    // 8. Get Scheme by Slug
    await assertTest('GET /api/schemes/pmsby returns scheme by slug', async () => {
      const res = await makeRequest('/api/schemes/pmsby');
      if (res.status !== 200 || !res.body.success || res.body.data.slug !== 'pmsby') {
        throw new Error(`Expected scheme with slug pmsby, got: ${JSON.stringify(res.body)}`);
      }
    });

    // 9. Get Non-Existent Scheme
    await assertTest('GET /api/schemes/99999 returns 404 Not Found', async () => {
      const res = await makeRequest('/api/schemes/99999');
      if (res.status !== 404 || res.body.success !== false) {
        throw new Error(`Expected 404 status, got: ${res.status}`);
      }
    });

    // 10. Filter Schemes by Eligibility (Age, Gender, State, Category)
    await assertTest('GET /api/schemes/filter with profile (age=25, gender=Female, state=Gujarat, category=SC)', async () => {
      const res = await makeRequest('/api/schemes/filter?age=25&gender=Female&state=Gujarat&category=SC&limit=5');
      if (res.status !== 200 || !res.body.success || res.body.data.length === 0) {
        throw new Error(`Expected eligible schemes, got: ${JSON.stringify(res.body)}`);
      }
      if (!res.body.meta.appliedFilters || res.body.meta.appliedFilters.age !== 25) {
        throw new Error('Applied filters metadata missing in response');
      }
    });

    // 11. Filter Schemes by Occupation (Farmer)
    await assertTest('GET /api/schemes/filter?occupation=Farmer returns schemes for farmers', async () => {
      const res = await makeRequest('/api/schemes/filter?occupation=Farmer&limit=5');
      if (res.status !== 200 || !res.body.success || res.body.data.length === 0) {
        throw new Error(`Expected schemes for farmers, got: ${JSON.stringify(res.body)}`);
      }
      const validOcc = res.body.data.every((s) => s.occupation === 'Farmer' || s.occupation === 'None');
      if (!validOcc) {
        throw new Error('Found scheme with mismatched occupation requirement');
      }
    });

    // 12. Filter Schemes by Education (Undergraduate)
    await assertTest('GET /api/schemes/filter?education=Undergraduate returns relevant schemes', async () => {
      const res = await makeRequest('/api/schemes/filter?education=Undergraduate&limit=5');
      if (res.status !== 200 || !res.body.success || res.body.data.length === 0) {
        throw new Error(`Expected undergraduate schemes, got: ${JSON.stringify(res.body)}`);
      }
    });

    // 13. Filter Schemes by Annual Income (income=200000)
    await assertTest('GET /api/schemes/filter?income=200000 returns schemes matching income ceiling', async () => {
      const res = await makeRequest('/api/schemes/filter?income=200000&limit=5');
      if (res.status !== 200 || !res.body.success || res.body.data.length === 0) {
        throw new Error(`Expected income filtered schemes, got: ${JSON.stringify(res.body)}`);
      }
      const validIncome = res.body.data.every((s) => s.max_income === null || s.max_income >= 200000);
      if (!validIncome) {
        throw new Error('Found scheme where user income exceeds maximum income limit');
      }
    });

    // 14. Compare Schemes (GET with ?ids=1,2,3)
    await assertTest('GET /api/schemes/compare?ids=1,2,3 returns comparison matrix for 3 schemes', async () => {
      const res = await makeRequest('/api/schemes/compare?ids=1,2,3');
      if (res.status !== 200 || !res.body.success || res.body.data.schemes.length !== 3) {
        throw new Error(`Expected comparison for 3 schemes, got: ${JSON.stringify(res.body)}`);
      }
      if (!res.body.data.comparisonMatrix || !res.body.data.comparisonMatrix.titles[1]) {
        throw new Error('Comparison matrix structure missing');
      }
    });

    // 15. Compare Schemes (POST with body { ids: [1, 14] })
    await assertTest('POST /api/schemes/compare with body { ids: [1, 14] } returns matrix', async () => {
      const res = await makeRequest('/api/schemes/compare', 'POST', { ids: [1, 14] });
      if (res.status !== 200 || !res.body.success || res.body.data.schemes.length !== 2) {
        throw new Error(`Expected comparison for 2 schemes, got: ${JSON.stringify(res.body)}`);
      }
    });

    // 16. Compare Schemes Validation (< 2 IDs)
    await assertTest('GET /api/schemes/compare?ids=1 returns 400 Bad Request', async () => {
      const res = await makeRequest('/api/schemes/compare?ids=1');
      if (res.status !== 400 || res.body.success !== false) {
        throw new Error(`Expected 400 Bad Request, got: ${res.status}`);
      }
    });

    // 17. Filter Metadata Options
    await assertTest('GET /api/schemes/metadata/filters returns dropdown options', async () => {
      const res = await makeRequest('/api/schemes/metadata/filters');
      if (res.status !== 200 || !res.body.success || !res.body.data.occupations || !res.body.data.primaryCategories) {
        throw new Error(`Expected dropdown metadata options, got: ${JSON.stringify(res.body)}`);
      }
    });

    // 18. Invalid Parameter Validation (Invalid Page)
    await assertTest('GET /api/schemes?page=-5 returns 400 Bad Request', async () => {
      const res = await makeRequest('/api/schemes?page=-5');
      if (res.status !== 400 || res.body.success !== false) {
        throw new Error(`Expected 400 Bad Request for negative page, got: ${res.status}`);
      }
    });

    // 19. Invalid Parameter Validation (Invalid Age)
    await assertTest('GET /api/schemes/filter?age=500 returns 400 Bad Request', async () => {
      const res = await makeRequest('/api/schemes/filter?age=500');
      if (res.status !== 400 || res.body.success !== false) {
        throw new Error(`Expected 400 Bad Request for age 500, got: ${res.status}`);
      }
    });

    // 20. 404 Route Not Found
    await assertTest('GET /api/nonexistent returns 404 Not Found', async () => {
      const res = await makeRequest('/api/nonexistent');
      if (res.status !== 404 || res.body.success !== false) {
        throw new Error(`Expected 404 for nonexistent route, got: ${res.status}`);
      }
    });

  } finally {
    server.close();
  }

  console.log('\n====================================================');
  console.log(` Test Suite Completed: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTestSuite().catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}

module.exports = { runTestSuite };
