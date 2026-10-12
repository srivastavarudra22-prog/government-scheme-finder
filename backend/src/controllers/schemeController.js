const { supabase } = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * 1. List Schemes with pagination, sorting, and optional high-level filters
 * GET /api/schemes
 */
async function listSchemes(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      primary_category,
      state,
      govt_tier,
      gender,
      caste_category,
      sortBy = 'id',
      sortOrder = 'asc',
    } = req.query;

    const allowedSortFields = ['id', 'title', 'primary_category', 'govt_tier', 'created_at'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'id';
    const isAscending = sortOrder.toLowerCase() !== 'desc';

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('schemes')
      .select(
        'id, title, slug, source_url, govt_tier, ministry, state, primary_category, secondary_categories, benefits, beneficiaries, gender, age_display, caste_category, occupation, education, max_income, is_bpl_only, income_limit_display, area, target_type, description',
        { count: 'exact' }
      );

    if (primary_category) {
      query = query.eq('primary_category', primary_category.trim());
    }

    if (govt_tier) {
      query = query.eq('govt_tier', govt_tier.trim());
    }

    if (gender) {
      query = query.eq('gender', gender.trim());
    }

    if (caste_category) {
      query = query.eq('caste_category', caste_category.trim());
    }

    if (state) {
      const stateTrimmed = state.trim();
      query = query.overlaps('state', [stateTrimmed, 'All']);
    }

    query = query.order(safeSortBy, { ascending: isAscending }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      return errorResponse(res, 'Database error while retrieving schemes', error.message, 500);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return successResponse(
      res,
      data,
      {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      'Schemes retrieved successfully'
    );
  } catch (err) {
    return errorResponse(res, 'Unexpected error in listSchemes', err.message, 500);
  }
}

/**
 * 2. Search Schemes by keyword / text
 * GET /api/schemes/search?q=tractor&page=1&limit=20
 */
async function searchSchemes(req, res) {
  try {
    const { q, page = 1, limit = 20, state, primary_category } = req.query;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Use textSearch on generated fts_doc vector or fallback to ILIKE
    let query = supabase
      .from('schemes')
      .select(
        'id, title, slug, source_url, govt_tier, ministry, state, primary_category, secondary_categories, benefits, beneficiaries, gender, age_display, caste_category, occupation, education, income_limit_display, description',
        { count: 'exact' }
      );

    // Filter by FTS on fts_doc column using websearch format
    query = query.or(`title.ilike.%${q}%,primary_category.ilike.%${q}%,description.ilike.%${q}%,fts_doc.wfts.${q}`);

    if (state) {
      query = query.overlaps('state', [state.trim(), 'All']);
    }

    if (primary_category) {
      query = query.eq('primary_category', primary_category.trim());
    }

    query = query.order('id', { ascending: true }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      return errorResponse(res, 'Database error while searching schemes', error.message, 500);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return successResponse(
      res,
      data,
      {
        query: q,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      `Search completed: found ${total} matching schemes for "${q}"`
    );
  } catch (err) {
    return errorResponse(res, 'Unexpected error in searchSchemes', err.message, 500);
  }
}

/**
 * 3. Filter Schemes by Citizen Eligibility Profile
 * GET /api/schemes/filter
 */
async function filterEligibility(req, res) {
  try {
    const {
      age,
      income,
      state,
      occupation,
      education,
      gender,
      category,
      area,
      target_type = 'Individual',
      is_bpl,
      primary_category,
      page = 1,
      limit = 20,
    } = req.query;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('schemes')
      .select(
        'id, title, slug, source_url, govt_tier, ministry, state, primary_category, secondary_categories, benefits, beneficiaries, gender, min_age, max_age, age_display, caste_category, occupation, education, max_income, is_bpl_only, income_limit_display, area, target_type, description',
        { count: 'exact' }
      );

    const appliedFilters = {};

    // 1. State filter: citizen's state OR Central schemes ('All')
    if (state && state.trim()) {
      const stateName = state.trim();
      query = query.overlaps('state', [stateName, 'All']);
      appliedFilters.state = stateName;
    }

    // 2. Gender filter:
    if (gender && gender.trim()) {
      const g = gender.trim();
      if (g.toLowerCase() === 'female') {
        query = query.in('gender', ['Any', 'Female']);
      } else if (g.toLowerCase() === 'male') {
        query = query.in('gender', ['Any', 'Male']);
      }
      appliedFilters.gender = g;
    }

    // 3. Age filter: scheme matches if citizen age is within [min_age, max_age] or unconstrained
    if (age !== undefined && age !== '') {
      const numAge = parseInt(age, 10);
      query = query
        .or(`min_age.is.null,min_age.lte.${numAge}`)
        .or(`max_age.is.null,max_age.gte.${numAge}`);
      appliedFilters.age = numAge;
    }

    // 4. Annual Income filter:
    if (income !== undefined && income !== '') {
      const numIncome = parseFloat(income);
      query = query.or(`max_income.is.null,max_income.gte.${numIncome}`);
      appliedFilters.income = numIncome;
    }

    // 5. BPL Cardholder constraint:
    if (is_bpl !== undefined && is_bpl !== '') {
      const isBplBool = is_bpl === true || is_bpl === 'true';
      if (!isBplBool) {
        query = query.eq('is_bpl_only', false);
      }
      appliedFilters.is_bpl = isBplBool;
    }

    // 6. Caste / Social Category filter:
    if (category && category.trim()) {
      const cat = category.trim().toUpperCase();
      if (cat === 'SC') {
        query = query.in('caste_category', ['All', 'SC', 'SC/ST']);
      } else if (cat === 'ST') {
        query = query.in('caste_category', ['All', 'ST', 'SC/ST']);
      } else if (cat === 'SC/ST') {
        query = query.in('caste_category', ['All', 'SC', 'ST', 'SC/ST']);
      } else if (cat === 'OBC') {
        query = query.in('caste_category', ['All', 'OBC']);
      } else if (cat === 'MINORITY') {
        query = query.in('caste_category', ['All', 'Minority']);
      } else if (cat === 'GENERAL') {
        query = query.in('caste_category', ['All', 'General']);
      }
      appliedFilters.category = cat;
    }

    // 7. Occupation filter: matches scheme for occupation OR open to all ('None')
    if (occupation && occupation.trim()) {
      const occ = occupation.trim();
      query = query.in('occupation', ['None', occ]);
      appliedFilters.occupation = occ;
    }

    // 8. Education filter: matches scheme for education OR no prerequisite ('None')
    if (education && education.trim()) {
      const edu = education.trim();
      query = query.in('education', ['None', edu]);
      appliedFilters.education = edu;
    }

    // 9. Area filter: matches area OR open everywhere ('Both')
    if (area && area.trim()) {
      const a = area.trim();
      query = query.in('area', ['Both', a]);
      appliedFilters.area = a;
    }

    // 10. Target Type filter (default: Individual citizens)
    if (target_type && target_type.trim()) {
      query = query.eq('target_type', target_type.trim());
      appliedFilters.target_type = target_type.trim();
    }

    // 11. Optional Primary Category domain filter:
    if (primary_category && primary_category.trim()) {
      query = query.eq('primary_category', primary_category.trim());
      appliedFilters.primary_category = primary_category.trim();
    }

    query = query.order('id', { ascending: true }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      return errorResponse(res, 'Database error during eligibility filtering', error.message, 500);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return successResponse(
      res,
      data,
      {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        appliedFilters,
      },
      `Eligibility filter complete: ${total} eligible schemes found`
    );
  } catch (err) {
    return errorResponse(res, 'Unexpected error in filterEligibility', err.message, 500);
  }
}

/**
 * 4. Get Scheme by ID (or slug)
 * GET /api/schemes/:id
 */
async function getSchemeById(req, res) {
  try {
    const { id } = req.params;

    let query = supabase.from('schemes').select('*');

    // Support lookup by integer ID or slug string
    if (!isNaN(parseInt(id, 10)) && String(parseInt(id, 10)) === String(id)) {
      query = query.eq('id', parseInt(id, 10));
    } else {
      query = query.eq('slug', id);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse(res, `Scheme with identifier "${id}" was not found`, null, 404);
      }
      return errorResponse(res, 'Database error while fetching scheme details', error.message, 500);
    }

    if (!data) {
      return errorResponse(res, `Scheme with identifier "${id}" was not found`, null, 404);
    }

    return successResponse(res, data, null, 'Scheme details retrieved successfully');
  } catch (err) {
    return errorResponse(res, 'Unexpected error in getSchemeById', err.message, 500);
  }
}

/**
 * 5. Compare Schemes Side-by-Side
 * GET /api/schemes/compare?ids=1,2,3
 * POST /api/schemes/compare with body { "ids": [1, 2, 3] }
 */
async function compareSchemes(req, res) {
  try {
    const ids = req.comparisonIds;

    const { data, error } = await supabase
      .from('schemes')
      .select('*')
      .in('id', ids)
      .order('id', { ascending: true });

    if (error) {
      return errorResponse(res, 'Database error while retrieving schemes for comparison', error.message, 500);
    }

    if (!data || data.length === 0) {
      return errorResponse(res, 'None of the requested scheme IDs were found', null, 404);
    }

    const foundIds = data.map((s) => s.id);
    const missingIds = ids.filter((id) => !foundIds.includes(id));

    // Construct side-by-side comparison matrix
    const matrix = {
      titles: {},
      govt_tier: {},
      ministry: {},
      state: {},
      primary_category: {},
      benefits: {},
      beneficiaries: {},
      gender: {},
      age: {},
      caste_category: {},
      occupation: {},
      education: {},
      income_limit: {},
      area: {},
      financial_benefits_details: {},
      required_documents: {},
      application_process: {},
    };

    data.forEach((s) => {
      matrix.titles[s.id] = s.title;
      matrix.govt_tier[s.id] = s.govt_tier;
      matrix.ministry[s.id] = s.ministry || 'N/A';
      matrix.state[s.id] = s.state;
      matrix.primary_category[s.id] = s.primary_category;
      matrix.benefits[s.id] = s.benefits;
      matrix.beneficiaries[s.id] = s.beneficiaries;
      matrix.gender[s.id] = s.gender;
      matrix.age[s.id] = s.age_display;
      matrix.caste_category[s.id] = s.caste_category;
      matrix.occupation[s.id] = s.occupation;
      matrix.education[s.id] = s.education;
      matrix.income_limit[s.id] = s.income_limit_display;
      matrix.area[s.id] = s.area;
      matrix.financial_benefits_details[s.id] = s.scheme_details || 'N/A';
      matrix.required_documents[s.id] = s.required_documents || 'None';
      matrix.application_process[s.id] = s.application_process || 'N/A';
    });

    return successResponse(
      res,
      {
        schemes: data,
        comparisonMatrix: matrix,
      },
      {
        requestedIds: ids,
        foundCount: data.length,
        missingIds: missingIds.length > 0 ? missingIds : undefined,
      },
      `Side-by-side comparison generated for ${data.length} schemes`
    );
  } catch (err) {
    return errorResponse(res, 'Unexpected error in compareSchemes', err.message, 500);
  }
}

/**
 * 6. Get Available Filter Options & Metadata for Frontend Dropdowns
 * GET /api/schemes/metadata/filters
 */
async function getFilterOptions(req, res) {
  try {
    return successResponse(res, {
      occupations: [
        'None',
        'Student',
        'Farmer',
        'Entrepreneur',
        'Unorganized Worker / Labour',
        'Artisan / Weaver',
        'Fisherman',
        'Unemployed',
        'Street Vendor',
      ],
      educationLevels: [
        'None',
        'Primary / Elementary',
        'Secondary (Class 9-10)',
        'Higher Secondary (Class 11-12)',
        'ITI / Diploma',
        'Undergraduate',
        'Postgraduate',
        'PhD / Doctorate',
      ],
      casteCategories: ['All', 'SC', 'ST', 'SC/ST', 'OBC', 'Minority', 'General'],
      genders: ['Any', 'Female', 'Male'],
      areas: ['Both', 'Rural', 'Urban'],
      govtTiers: ['Central Government', 'State Government'],
      primaryCategories: [
        'Scholarship & Education',
        'Social Welfare & Other Benefits',
        'Financial Assistance',
        'Workers & Labour',
        'Farmers & Agriculture',
        'Senior Citizens & Pension',
        'Business & Entrepreneurship',
        'Animal Husbandry & Fisheries',
        'Disability & Special Needs',
        'Women & Girls',
        'Health & Medical',
        'Employment & Jobs',
        'Loans & Credit',
        'Housing & Shelter',
        'Children & Family Welfare',
        'Skill Development & Training',
        'Insurance & Social Security',
        'Urban Development',
        'Environment & Energy',
        'Rural Development',
      ],
    }, null, 'Filter metadata options retrieved successfully');
  } catch (err) {
    return errorResponse(res, 'Unexpected error in getFilterOptions', err.message, 500);
  }
}

module.exports = {
  listSchemes,
  searchSchemes,
  filterEligibility,
  getSchemeById,
  compareSchemes,
  getFilterOptions,
};
