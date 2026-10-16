/**
 * @file profileController.js
 * @description Citizen Profile management controller using PostgreSQL public.profiles table.
 * 
 * Manages demographic attributes (state, age, gender, occupation, education, category, etc.)
 * in the public.profiles database table linked to auth.users.id.
 * 
 * Access is protected by Row-Level Security (RLS) using the verified citizen JWT Bearer token.
 */

const { createUserClient } = require('../config/supabase');
const { formatUserResponse } = require('./authController');

/**
 * GET /api/profile
 * Retrieves citizen profile record from public.profiles table.
 */
async function getProfile(req, res) {
  try {
    const userClient = createUserClient(req.token);

    // Query public.profiles with user's token (RLS enforced: auth.uid() = id)
    let { data: profile, error } = await userClient
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) {
      console.error('[GetProfile DB Error]', error);
      return res.status(500).json({
        success: false,
        message: 'Database error retrieving profile.',
      });
    }

    // If profile does not exist yet for this user (edge case), create it
    if (!profile) {
      const meta = req.user.user_metadata || {};
      const { data: newProfile, error: insertError } = await userClient
        .from('profiles')
        .insert({
          id: req.user.id,
          email: req.user.email,
          full_name: meta.fullName || meta.full_name || meta.name || null,
          state: meta.state || null,
          phone: meta.phone || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[GetProfile Insert Error]', insertError);
      } else {
        profile = newProfile;
      }
    }

    const formattedUser = formatUserResponse(req.user);

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully.',
      user: formattedUser,
      profile: profile || formattedUser.profile,
    });
  } catch (err) {
    console.error('[GetProfile Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Unexpected error retrieving profile.',
    });
  }
}

/**
 * PATCH /api/profile
 * Updates citizen profile in public.profiles table with RLS enforcement.
 * 
 * Accepted body fields:
 * - full_name / fullName (string)
 * - phone (string)
 * - state (string)
 * - gender (string)
 * - age (number)
 * - occupation (string)
 * - education (string)
 * - category / casteCategory (string)
 * - avatar_url / avatarUrl (string)
 */
async function updateProfile(req, res) {
  try {
    const updates = req.body || {};

    if (typeof updates !== 'object' || Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request body. Expected a JSON object.',
      });
    }

    const dbUpdates = {};

    // 1. full_name
    if (updates.full_name !== undefined) {
      dbUpdates.full_name = typeof updates.full_name === 'string' ? updates.full_name.trim() : null;
    } else if (updates.fullName !== undefined) {
      dbUpdates.full_name = typeof updates.fullName === 'string' ? updates.fullName.trim() : null;
    }

    // 2. phone
    if (updates.phone !== undefined) {
      dbUpdates.phone = typeof updates.phone === 'string' ? updates.phone.trim() : null;
    }

    // 3. state
    if (updates.state !== undefined) {
      dbUpdates.state = typeof updates.state === 'string' ? updates.state.trim() : null;
    }

    // 4. gender
    if (updates.gender !== undefined) {
      dbUpdates.gender = typeof updates.gender === 'string' ? updates.gender.trim() : null;
    }

    // 5. age
    if (updates.age !== undefined && updates.age !== null && updates.age !== '') {
      const parsedAge = parseInt(updates.age, 10);
      if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 125) {
        return res.status(400).json({
          success: false,
          message: 'Field "age" must be a valid integer between 0 and 125.',
        });
      }
      dbUpdates.age = parsedAge;
    } else if (updates.age === null) {
      dbUpdates.age = null;
    }

    // 6. occupation
    if (updates.occupation !== undefined) {
      dbUpdates.occupation = typeof updates.occupation === 'string' ? updates.occupation.trim() : null;
    }

    // 7. education
    if (updates.education !== undefined) {
      dbUpdates.education = typeof updates.education === 'string' ? updates.education.trim() : null;
    }

    // 8. category / casteCategory
    if (updates.category !== undefined) {
      dbUpdates.category = typeof updates.category === 'string' ? updates.category.trim() : null;
    } else if (updates.casteCategory !== undefined) {
      dbUpdates.category = typeof updates.casteCategory === 'string' ? updates.casteCategory.trim() : null;
    }

    // 9. avatar_url
    if (updates.avatar_url !== undefined) {
      dbUpdates.avatar_url = typeof updates.avatar_url === 'string' ? updates.avatar_url.trim() : null;
    } else if (updates.avatarUrl !== undefined) {
      dbUpdates.avatar_url = typeof updates.avatarUrl === 'string' ? updates.avatarUrl.trim() : null;
    }

    if (Object.keys(dbUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid profile fields provided to update.',
      });
    }

    // Execute update in public.profiles using authenticated client
    // PostgREST evaluates RLS: auth.uid() = id
    const userClient = createUserClient(req.token);

    const { data: updatedProfile, error: updateError } = await userClient
      .from('profiles')
      .update(dbUpdates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('[UpdateProfile DB Error]', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile in database.',
        error: updateError.message,
      });
    }

    const formattedUser = formatUserResponse(req.user);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: formattedUser,
      profile: updatedProfile,
    });
  } catch (err) {
    console.error('[UpdateProfile Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Unexpected error updating profile.',
    });
  }
}

module.exports = {
  getProfile,
  updateProfile,
};
