/**
 * @file savedSchemeController.js
 * @description Controller for citizen saved schemes management with Supabase Row-Level Security (RLS).
 * 
 * Enforces:
 * - Authentication via citizen Bearer token (evaluated by Supabase RLS).
 * - Only authenticated users can access, save, view, and delete their own saved schemes.
 * - Validation of scheme ID.
 * - Existence check against public.schemes table.
 * - Duplicate save prevention (returns HTTP 409 Conflict).
 * - Full scheme details returned on retrieval.
 */

const { supabase, createUserClient } = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Helper to validate positive integer scheme ID from route parameters.
 * @param {string} schemeIdParam 
 * @returns {{ valid: boolean, id?: number, error?: string }}
 */
function validateSchemeIdParam(schemeIdParam) {
  if (!schemeIdParam || typeof schemeIdParam !== 'string') {
    return { valid: false, error: 'Scheme ID parameter is required.' };
  }

  const trimmed = schemeIdParam.trim();
  // Ensure digits only
  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, error: 'Invalid scheme ID. Must be a positive integer.' };
  }

  const parsed = parseInt(trimmed, 10);
  if (isNaN(parsed) || parsed <= 0) {
    return { valid: false, error: 'Invalid scheme ID. Must be a positive integer greater than zero.' };
  }

  return { valid: true, id: parsed };
}

/**
 * POST /api/saved-schemes/:schemeId
 * Saves a government scheme to the authenticated citizen's saved list.
 */
async function saveScheme(req, res) {
  try {
    const validation = validateSchemeIdParam(req.params.schemeId);
    if (!validation.valid) {
      return errorResponse(res, validation.error, null, 400);
    }
    const schemeId = validation.id;

    // 1. Verify that the scheme exists in the database
    const { data: scheme, error: schemeError } = await supabase
      .from('schemes')
      .select('id, title, slug, ministry, state, primary_category, benefits, description')
      .eq('id', schemeId)
      .maybeSingle();

    if (schemeError) {
      console.error('[SaveScheme DB Error checking scheme]', schemeError);
      return errorResponse(res, 'Database error verifying scheme existence.', schemeError.message, 500);
    }

    if (!scheme) {
      return errorResponse(res, `Scheme with ID ${schemeId} not found.`, null, 404);
    }

    // 2. Use user-authenticated Supabase client to evaluate RLS
    const userClient = createUserClient(req.token);

    // 3. Prevent duplicate saves: check if already saved
    const { data: existingSave, error: checkError } = await userClient
      .from('saved_schemes')
      .select('id, created_at')
      .eq('scheme_id', schemeId)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (checkError) {
      console.error('[SaveScheme DB Error checking duplicate]', checkError);
      return errorResponse(res, 'Database error checking existing saved scheme.', checkError.message, 500);
    }

    if (existingSave) {
      return errorResponse(
        res,
        'Scheme is already saved by this user.',
        { savedId: existingSave.id, schemeId },
        409
      );
    }

    // 4. Insert into saved_schemes table
    const { data: savedRecord, error: insertError } = await userClient
      .from('saved_schemes')
      .insert({
        user_id: req.user.id,
        scheme_id: schemeId,
      })
      .select('id, user_id, scheme_id, created_at')
      .single();

    if (insertError) {
      // Catch unique constraint violation in case of concurrent requests
      if (insertError.code === '23505') {
        return errorResponse(
          res,
          'Scheme is already saved by this user.',
          { schemeId },
          409
        );
      }

      console.error('[SaveScheme DB Insert Error]', insertError);
      return errorResponse(res, 'Failed to save scheme.', insertError.message, 500);
    }

    return successResponse(
      res,
      {
        id: savedRecord.id,
        scheme_id: savedRecord.scheme_id,
        user_id: savedRecord.user_id,
        created_at: savedRecord.created_at,
        scheme,
      },
      null,
      'Scheme saved successfully.',
      201
    );
  } catch (err) {
    console.error('[SaveScheme Unexpected Error]', err);
    return errorResponse(res, 'Unexpected error saving scheme.', err.message, 500);
  }
}

/**
 * DELETE /api/saved-schemes/:schemeId
 * Removes a saved scheme from the authenticated citizen's saved list.
 */
async function deleteSavedScheme(req, res) {
  try {
    const validation = validateSchemeIdParam(req.params.schemeId);
    if (!validation.valid) {
      return errorResponse(res, validation.error, null, 400);
    }
    const schemeId = validation.id;

    const userClient = createUserClient(req.token);

    // 1. Verify that the saved record exists for this user
    const { data: existingRecord, error: checkError } = await userClient
      .from('saved_schemes')
      .select('id, scheme_id')
      .eq('scheme_id', schemeId)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (checkError) {
      console.error('[DeleteSavedScheme DB Error checking record]', checkError);
      return errorResponse(res, 'Database error verifying saved scheme.', checkError.message, 500);
    }

    if (!existingRecord) {
      return errorResponse(
        res,
        `Saved scheme with ID ${schemeId} not found in user's saved list.`,
        null,
        404
      );
    }

    // 2. Perform deletion
    const { error: deleteError } = await userClient
      .from('saved_schemes')
      .delete()
      .eq('scheme_id', schemeId)
      .eq('user_id', req.user.id);

    if (deleteError) {
      console.error('[DeleteSavedScheme DB Error deleting record]', deleteError);
      return errorResponse(res, 'Failed to remove saved scheme.', deleteError.message, 500);
    }

    return successResponse(
      res,
      {
        scheme_id: schemeId,
        removed: true,
      },
      null,
      'Scheme removed from saved schemes successfully.',
      200
    );
  } catch (err) {
    console.error('[DeleteSavedScheme Unexpected Error]', err);
    return errorResponse(res, 'Unexpected error removing saved scheme.', err.message, 500);
  }
}

/**
 * GET /api/saved-schemes
 * Retrieves all saved schemes for the authenticated citizen with associated scheme details.
 */
async function getSavedSchemes(req, res) {
  try {
    const userClient = createUserClient(req.token);

    // Fetch saved schemes with foreign key join to public.schemes
    // RLS policy automatically filters: auth.uid() = user_id
    const { data, error } = await userClient
      .from('saved_schemes')
      .select(`
        id,
        scheme_id,
        created_at,
        schemes (
          id,
          title,
          slug,
          source_url,
          govt_tier,
          ministry,
          state,
          primary_category,
          secondary_categories,
          benefits,
          beneficiaries,
          gender,
          age_display,
          caste_category,
          occupation,
          education,
          max_income,
          is_bpl_only,
          income_limit_display,
          area,
          target_type,
          description
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GetSavedSchemes DB Error]', error);
      return errorResponse(res, 'Failed to retrieve saved schemes.', error.message, 500);
    }

    const formattedData = (data || []).map((item) => ({
      id: item.id,
      scheme_id: item.scheme_id,
      created_at: item.created_at,
      scheme: item.schemes || null,
    }));

    return successResponse(
      res,
      formattedData,
      { total: formattedData.length },
      'Saved schemes retrieved successfully.',
      200
    );
  } catch (err) {
    console.error('[GetSavedSchemes Unexpected Error]', err);
    return errorResponse(res, 'Unexpected error retrieving saved schemes.', err.message, 500);
  }
}

module.exports = {
  saveScheme,
  deleteSavedScheme,
  getSavedSchemes,
};
