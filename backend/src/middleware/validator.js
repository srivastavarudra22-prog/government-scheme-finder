const { errorResponse } = require('../utils/response');

/**
 * Validates pagination parameters (page, limit)
 */
function validatePagination(req, res, next) {
  let { page, limit } = req.query;

  if (page !== undefined) {
    const parsedPage = parseInt(page, 10);
    if (isNaN(parsedPage) || parsedPage < 1) {
      return errorResponse(res, 'Invalid query parameter: "page" must be a positive integer starting from 1.', null, 400);
    }
    req.query.page = parsedPage;
  } else {
    req.query.page = 1;
  }

  if (limit !== undefined) {
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return errorResponse(res, 'Invalid query parameter: "limit" must be an integer between 1 and 100.', null, 400);
    }
    req.query.limit = parsedLimit;
  } else {
    req.query.limit = 20;
  }

  next();
}

/**
 * Validates single scheme ID in URL params (:id)
 */
function validateSchemeId(req, res, next) {
  const { id } = req.params;
  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId) || parsedId < 1) {
    return errorResponse(res, 'Invalid path parameter: "id" must be a positive integer.', null, 400);
  }

  req.params.id = parsedId;
  next();
}

/**
 * Validates search query parameter (:q)
 */
function validateSearchQuery(req, res, next) {
  const { q } = req.query;

  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return errorResponse(res, 'Missing or empty search query parameter: "q" is required.', null, 400);
  }

  req.query.q = q.trim();
  next();
}

/**
 * Validates scheme comparison parameters
 * Accepts query param ?ids=1,2,3 or POST body { ids: [1, 2, 3] }
 */
function validateCompare(req, res, next) {
  let ids = [];

  if (req.method === 'GET') {
    const idsQuery = req.query.ids;
    if (!idsQuery) {
      return errorResponse(res, 'Missing "ids" parameter. Provide comma-separated scheme IDs, e.g., ?ids=1,2,3', null, 400);
    }
    ids = idsQuery.split(',').map((id) => parseInt(id.trim(), 10));
  } else if (req.method === 'POST') {
    if (!req.body || !Array.isArray(req.body.ids)) {
      return errorResponse(res, 'Missing or invalid request body: "ids" must be an array of integers, e.g., { "ids": [1, 2, 3] }', null, 400);
    }
    ids = req.body.ids.map((id) => parseInt(id, 10));
  }

  if (ids.length < 2 || ids.length > 5) {
    return errorResponse(res, 'Scheme comparison requires between 2 and 5 scheme IDs.', null, 400);
  }

  const invalidIds = ids.filter((id) => isNaN(id) || id < 1);
  if (invalidIds.length > 0) {
    return errorResponse(res, 'All scheme IDs in the comparison request must be positive integers.', null, 400);
  }

  // Deduplicate IDs
  req.comparisonIds = Array.from(new Set(ids));
  next();
}

/**
 * Validates eligibility filtering parameters
 * Checks types and bounds for age, income, state, gender, etc.
 */
function validateEligibilityFilters(req, res, next) {
  const errors = [];

  // Age validation
  if (req.query.age !== undefined && req.query.age !== '') {
    const age = parseInt(req.query.age, 10);
    if (isNaN(age) || age < 0 || age > 120) {
      errors.push('"age" must be an integer between 0 and 120.');
    } else {
      req.query.age = age;
    }
  }

  // Annual Income validation
  if (req.query.income !== undefined && req.query.income !== '') {
    const income = parseFloat(req.query.income);
    if (isNaN(income) || income < 0) {
      errors.push('"income" must be a positive number representing annual income in INR.');
    } else {
      req.query.income = income;
    }
  }

  // Gender validation
  if (req.query.gender !== undefined && req.query.gender !== '') {
    const validGenders = ['Any', 'Female', 'Male', 'any', 'female', 'male'];
    if (!validGenders.includes(req.query.gender)) {
      errors.push('"gender" must be one of: "Any", "Female", "Male".');
    } else {
      // Capitalize first letter
      req.query.gender = req.query.gender.charAt(0).toUpperCase() + req.query.gender.slice(1).toLowerCase();
    }
  }

  // Category validation
  if (req.query.category !== undefined && req.query.category !== '') {
    const validCategories = ['All', 'SC', 'ST', 'SC/ST', 'OBC', 'Minority', 'General', 'all', 'sc', 'st', 'obc', 'minority', 'general'];
    if (!validCategories.includes(req.query.category.toUpperCase())) {
      // Allow flexible caste string but warn if completely malformed
    }
  }

  // Area validation
  if (req.query.area !== undefined && req.query.area !== '') {
    const validAreas = ['Both', 'Rural', 'Urban', 'both', 'rural', 'urban'];
    if (!validAreas.includes(req.query.area)) {
      errors.push('"area" must be one of: "Both", "Rural", "Urban".');
    } else {
      req.query.area = req.query.area.charAt(0).toUpperCase() + req.query.area.slice(1).toLowerCase();
    }
  }

  if (errors.length > 0) {
    return errorResponse(res, 'Invalid eligibility query parameters.', errors, 400);
  }

  next();
}

module.exports = {
  validatePagination,
  validateSchemeId,
  validateSearchQuery,
  validateCompare,
  validateEligibilityFilters,
};
