const express = require('express');
const router = express.Router();
const {
  listSchemes,
  searchSchemes,
  filterEligibility,
  getSchemeById,
  compareSchemes,
  getFilterOptions,
} = require('../controllers/schemeController');
const {
  validatePagination,
  validateSearchQuery,
  validateEligibilityFilters,
  validateCompare,
} = require('../middleware/validator');

// Static routes before parameterized routes

// 1. Search schemes by keyword
router.get('/search', validateSearchQuery, validatePagination, searchSchemes);

// 2. Filter schemes by citizen eligibility profile
router.get('/filter', validateEligibilityFilters, validatePagination, filterEligibility);

// 3. Side-by-side comparison of 2-5 schemes (supports GET and POST)
router.get('/compare', validateCompare, compareSchemes);
router.post('/compare', validateCompare, compareSchemes);

// 4. Metadata filter options for frontend dropdowns
router.get('/metadata/filters', getFilterOptions);

// 5. List all schemes with pagination and basic filters
router.get('/', validatePagination, listSchemes);

// 6. Get scheme by ID or slug
router.get('/:id', getSchemeById);

module.exports = router;
