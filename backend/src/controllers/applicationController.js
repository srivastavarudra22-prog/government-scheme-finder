/**
 * @file applicationController.js
 * @description Controller for citizen welfare scheme application tracking with Supabase RLS.
 * 
 * Tracks citizen application stages ('Interested', 'Not Applied', 'Applied', 'Under Review',
 * 'Approved', 'Rejected', 'Completed') with application reference numbers and personal notes.
 * 
 * Enforces:
 * - Bearer token authentication evaluated via Supabase Row-Level Security (RLS).
 * - Multi-user isolation: Citizens can only access, create, update, and delete their own applications.
 * - Validation:
 *   - scheme_id: Must be valid positive integer and exist in schemes table.
 *   - status: Must be one of the 7 allowed statuses.
 *   - application_reference: String, max 100 characters.
 *   - notes: String, max 2000 characters.
 *   - id: Valid UUID for PATCH and DELETE operations.
 */

const { supabase, createUserClient } = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/response');

const ALLOWED_STATUSES = [
  'Interested',
  'Not Applied',
  'Applied',
  'Under Review',
  'Approved',
  'Rejected',
  'Completed',
];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Normalizes and validates application status.
 * @param {string} status 
 * @returns {string|null} Normalized status string or null if invalid.
 */
function normalizeStatus(status) {
  if (!status || typeof status !== 'string') return null;
  const trimmed = status.trim();
  const match = ALLOWED_STATUSES.find((s) => s.toLowerCase() === trimmed.toLowerCase());
  return match || null;
}

/**
 * Validates positive integer scheme ID.
 * @param {any} schemeId 
 * @returns {{ valid: boolean, id?: number, error?: string }}
 */
function validateSchemeId(schemeId) {
  if (schemeId === undefined || schemeId === null || schemeId === '') {
    return { valid: false, error: 'Field "scheme_id" is required.' };
  }
  const str = String(schemeId).trim();
  if (!/^\d+$/.test(str)) {
    return { valid: false, error: 'Field "scheme_id" must be a positive integer.' };
  }
  const parsed = parseInt(str, 10);
  if (isNaN(parsed) || parsed <= 0) {
    return { valid: false, error: 'Field "scheme_id" must be a positive integer greater than zero.' };
  }
  return { valid: true, id: parsed };
}

/**
 * Validates UUID parameter.
 * @param {string} idParam 
 * @returns {boolean}
 */
function isValidUUID(idParam) {
  return typeof idParam === 'string' && UUID_REGEX.test(idParam.trim());
}

/**
 * GET /api/applications
 * Lists all tracked applications for the authenticated citizen.
 * 
 * Supports query params:
 * - status: Filter by specific application status
 * - scheme_id: Filter by scheme ID
 * - sortBy: 'updated_at' (default), 'created_at', or 'applied_at'
 * - sortOrder: 'desc' (default) or 'asc'
 */
async function getApplications(req, res) {
  try {
    const userClient = createUserClient(req.token);
    const { status, scheme_id, sortBy = 'updated_at', sortOrder = 'desc' } = req.query;

    const allowedSortFields = ['updated_at', 'created_at', 'applied_at', 'status'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'updated_at';
    const isAscending = String(sortOrder).toLowerCase() === 'asc';

    let query = userClient
      .from('applications')
      .select(`
        id,
        user_id,
        scheme_id,
        status,
        application_reference,
        notes,
        applied_at,
        updated_at,
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
      .order(safeSortBy, { ascending: isAscending });

    if (status) {
      const normalized = normalizeStatus(status);
      if (normalized) {
        query = query.eq('status', normalized);
      }
    }

    if (scheme_id) {
      const schemeValidation = validateSchemeId(scheme_id);
      if (schemeValidation.valid) {
        query = query.eq('scheme_id', schemeValidation.id);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('[GetApplications DB Error]', error);
      return errorResponse(res, 'Failed to retrieve applications.', error.message, 500);
    }

    const formattedData = (data || []).map((item) => ({
      id: item.id,
      user_id: item.user_id,
      scheme_id: item.scheme_id,
      status: item.status,
      application_reference: item.application_reference,
      notes: item.notes,
      applied_at: item.applied_at,
      updated_at: item.updated_at,
      created_at: item.created_at,
      scheme: item.schemes || null,
    }));

    return successResponse(
      res,
      formattedData,
      { total: formattedData.length },
      'Applications retrieved successfully.',
      200
    );
  } catch (err) {
    console.error('[GetApplications Unexpected Error]', err);
    return errorResponse(res, 'Unexpected error retrieving applications.', err.message, 500);
  }
}

/**
 * POST /api/applications
 * Creates a new tracked application record for the authenticated citizen.
 * 
 * Body fields:
 * - scheme_id: (required) Integer ID of the scheme
 * - status: (optional) One of the 7 allowed statuses (default: 'Interested')
 * - application_reference: (optional) Reference/tracking number (string, max 100)
 * - notes: (optional) Citizen notes (string, max 2000)
 * - applied_at: (optional) ISO timestamp
 */
async function createApplication(req, res) {
  try {
    const { scheme_id, status, application_reference, notes, applied_at } = req.body || {};

    // 1. Validate scheme_id
    const schemeValidation = validateSchemeId(scheme_id);
    if (!schemeValidation.valid) {
      return errorResponse(res, schemeValidation.error, null, 400);
    }
    const schemeId = schemeValidation.id;

    // Verify scheme exists in DB
    const { data: scheme, error: schemeError } = await supabase
      .from('schemes')
      .select('id, title, slug, ministry, state, primary_category, source_url')
      .eq('id', schemeId)
      .maybeSingle();

    if (schemeError) {
      console.error('[CreateApplication DB Error checking scheme]', schemeError);
      return errorResponse(res, 'Database error verifying scheme.', schemeError.message, 500);
    }

    if (!scheme) {
      return errorResponse(res, `Scheme with ID ${schemeId} does not exist.`, null, 404);
    }

    // 2. Validate status
    let finalStatus = 'Interested';
    if (status !== undefined && status !== null && status !== '') {
      const normalized = normalizeStatus(status);
      if (!normalized) {
        return errorResponse(
          res,
          `Invalid status "${status}". Allowed statuses are: ${ALLOWED_STATUSES.join(', ')}.`,
          null,
          400
        );
      }
      finalStatus = normalized;
    }

    // 3. Validate application_reference
    let finalReference = null;
    if (application_reference !== undefined && application_reference !== null) {
      if (typeof application_reference !== 'string') {
        return errorResponse(res, 'Field "application_reference" must be a string.', null, 400);
      }
      const trimmedRef = application_reference.trim();
      if (trimmedRef.length > 100) {
        return errorResponse(res, 'Field "application_reference" cannot exceed 100 characters.', null, 400);
      }
      finalReference = trimmedRef || null;
    }

    // 4. Validate notes
    let finalNotes = null;
    if (notes !== undefined && notes !== null) {
      if (typeof notes !== 'string') {
        return errorResponse(res, 'Field "notes" must be a string.', null, 400);
      }
      const trimmedNotes = notes.trim();
      if (trimmedNotes.length > 2000) {
        return errorResponse(res, 'Field "notes" cannot exceed 2000 characters.', null, 400);
      }
      finalNotes = trimmedNotes || null;
    }

    // 5. Validate applied_at
    let finalAppliedAt = null;
    if (applied_at !== undefined && applied_at !== null && applied_at !== '') {
      const parsedDate = new Date(applied_at);
      if (isNaN(parsedDate.getTime())) {
        return errorResponse(res, 'Field "applied_at" must be a valid ISO date timestamp.', null, 400);
      }
      finalAppliedAt = parsedDate.toISOString();
    } else if (['Applied', 'Under Review', 'Approved', 'Rejected', 'Completed'].includes(finalStatus)) {
      finalAppliedAt = new Date().toISOString();
    }

    // 6. Insert application using authenticated client (RLS enforces auth.uid() = user_id)
    const userClient = createUserClient(req.token);
    const { data: createdRecord, error: insertError } = await userClient
      .from('applications')
      .insert({
        user_id: req.user.id,
        scheme_id: schemeId,
        status: finalStatus,
        application_reference: finalReference,
        notes: finalNotes,
        applied_at: finalAppliedAt,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('[CreateApplication DB Insert Error]', insertError);
      return errorResponse(res, 'Failed to create application record.', insertError.message, 500);
    }

    return successResponse(
      res,
      {
        ...createdRecord,
        scheme,
      },
      null,
      'Application tracked successfully.',
      201
    );
  } catch (err) {
    console.error('[CreateApplication Unexpected Error]', err);
    return errorResponse(res, 'Unexpected error creating application.', err.message, 500);
  }
}

/**
 * PATCH /api/applications/:id
 * Updates an existing tracked application record.
 * 
 * Body fields:
 * - status: (optional) Updated status
 * - application_reference: (optional) Updated reference number
 * - notes: (optional) Updated notes
 * - applied_at: (optional) Updated timestamp
 * - scheme_id: (optional) Updated scheme ID
 */
async function updateApplication(req, res) {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return errorResponse(res, 'Invalid application ID. Must be a valid UUID.', null, 400);
    }

    const updates = req.body || {};
    if (typeof updates !== 'object' || Array.isArray(updates)) {
      return errorResponse(res, 'Request body must be a JSON object.', null, 400);
    }

    const userClient = createUserClient(req.token);

    // 1. Verify existence and ownership for the authenticated citizen
    const { data: existingApp, error: fetchError } = await userClient
      .from('applications')
      .select('id, user_id, status, scheme_id')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('[UpdateApplication DB Check Error]', fetchError);
      return errorResponse(res, 'Database error verifying application.', fetchError.message, 500);
    }

    if (!existingApp) {
      return errorResponse(
        res,
        'Application not found or you do not have permission to modify it.',
        null,
        404
      );
    }

    const dbUpdates = {};

    // 2. Validate status if provided
    if (updates.status !== undefined) {
      const normalized = normalizeStatus(updates.status);
      if (!normalized) {
        return errorResponse(
          res,
          `Invalid status "${updates.status}". Allowed statuses are: ${ALLOWED_STATUSES.join(', ')}.`,
          null,
          400
        );
      }
      dbUpdates.status = normalized;
    }

    // 3. Validate application_reference if provided
    if (updates.application_reference !== undefined) {
      if (updates.application_reference === null || updates.application_reference === '') {
        dbUpdates.application_reference = null;
      } else if (typeof updates.application_reference === 'string') {
        const trimmed = updates.application_reference.trim();
        if (trimmed.length > 100) {
          return errorResponse(res, 'Field "application_reference" cannot exceed 100 characters.', null, 400);
        }
        dbUpdates.application_reference = trimmed;
      } else {
        return errorResponse(res, 'Field "application_reference" must be a string or null.', null, 400);
      }
    }

    // 4. Validate notes if provided
    if (updates.notes !== undefined) {
      if (updates.notes === null || updates.notes === '') {
        dbUpdates.notes = null;
      } else if (typeof updates.notes === 'string') {
        const trimmed = updates.notes.trim();
        if (trimmed.length > 2000) {
          return errorResponse(res, 'Field "notes" cannot exceed 2000 characters.', null, 400);
        }
        dbUpdates.notes = trimmed;
      } else {
        return errorResponse(res, 'Field "notes" must be a string or null.', null, 400);
      }
    }

    // 5. Validate applied_at if provided
    if (updates.applied_at !== undefined) {
      if (updates.applied_at === null || updates.applied_at === '') {
        dbUpdates.applied_at = null;
      } else {
        const parsedDate = new Date(updates.applied_at);
        if (isNaN(parsedDate.getTime())) {
          return errorResponse(res, 'Field "applied_at" must be a valid ISO date timestamp.', null, 400);
        }
        dbUpdates.applied_at = parsedDate.toISOString();
      }
    }

    // 6. Validate scheme_id if updated
    if (updates.scheme_id !== undefined) {
      const schemeValidation = validateSchemeId(updates.scheme_id);
      if (!schemeValidation.valid) {
        return errorResponse(res, schemeValidation.error, null, 400);
      }
      // Verify scheme exists
      const { data: schemeExists } = await supabase
        .from('schemes')
        .select('id')
        .eq('id', schemeValidation.id)
        .maybeSingle();

      if (!schemeExists) {
        return errorResponse(res, `Scheme with ID ${schemeValidation.id} does not exist.`, null, 404);
      }
      dbUpdates.scheme_id = schemeValidation.id;
    }

    if (Object.keys(dbUpdates).length === 0) {
      return errorResponse(res, 'No valid application fields provided to update.', null, 400);
    }

    dbUpdates.updated_at = new Date().toISOString();

    // 7. Execute update with RLS enforcement
    const { data: updatedRecord, error: updateError } = await userClient
      .from('applications')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select(`
        *,
        schemes (
          id,
          title,
          slug,
          ministry,
          source_url
        )
      `)
      .single();

    if (updateError) {
      console.error('[UpdateApplication DB Error]', updateError);
      return errorResponse(res, 'Failed to update application.', updateError.message, 500);
    }

    return successResponse(
      res,
      {
        ...updatedRecord,
        scheme: updatedRecord.schemes || null,
      },
      null,
      'Application updated successfully.',
      200
    );
  } catch (err) {
    console.error('[UpdateApplication Unexpected Error]', err);
    return errorResponse(res, 'Unexpected error updating application.', err.message, 500);
  }
}

/**
 * DELETE /api/applications/:id
 * Removes a tracked application for the authenticated citizen.
 */
async function deleteApplication(req, res) {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return errorResponse(res, 'Invalid application ID. Must be a valid UUID.', null, 400);
    }

    const userClient = createUserClient(req.token);

    // 1. Verify existence and ownership
    const { data: existingApp, error: fetchError } = await userClient
      .from('applications')
      .select('id, scheme_id, application_reference')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('[DeleteApplication DB Check Error]', fetchError);
      return errorResponse(res, 'Database error verifying application.', fetchError.message, 500);
    }

    if (!existingApp) {
      return errorResponse(
        res,
        'Application not found or you do not have permission to delete it.',
        null,
        404
      );
    }

    // 2. Perform deletion
    const { error: deleteError } = await userClient
      .from('applications')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (deleteError) {
      console.error('[DeleteApplication DB Delete Error]', deleteError);
      return errorResponse(res, 'Failed to delete application.', deleteError.message, 500);
    }

    return successResponse(
      res,
      {
        id,
        removed: true,
      },
      null,
      'Application deleted successfully.',
      200
    );
  } catch (err) {
    console.error('[DeleteApplication Unexpected Error]', err);
    return errorResponse(res, 'Unexpected error deleting application.', err.message, 500);
  }
}

module.exports = {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  ALLOWED_STATUSES,
};
