/**
 * @file authController.js
 * @description Authentication controller utilizing Supabase Auth as the identity provider.
 * 
 * Handles signup, login, logout, and retrieving current authenticated user identity.
 * Passwords are never stored, hashed, logged, or returned by this server.
 */

const { supabase, createUserClient } = require('../config/supabase');

/**
 * Standardizes and sanitizes user objects for API responses.
 * Never exposes passwords or internal hashes.
 * @param {object} user - Supabase Auth user record
 * @returns {object} Clean, citizen-facing user representation
 */
function formatUserResponse(user) {
  if (!user) return null;

  const metadata = user.user_metadata || {};

  return {
    id: user.id,
    email: user.email,
    fullName: metadata.fullName || metadata.full_name || metadata.name || null,
    profile: {
      fullName: metadata.fullName || metadata.full_name || metadata.name || null,
      phone: metadata.phone || null,
      state: metadata.state || null,
      age: metadata.age || null,
      gender: metadata.gender || null,
      occupation: metadata.occupation || null,
      education: metadata.education || null,
      casteCategory: metadata.casteCategory || metadata.caste_category || null,
      annualIncome: metadata.annualIncome || metadata.annual_income || null,
      area: metadata.area || null,
      isBpl: metadata.isBpl !== undefined ? metadata.isBpl : (metadata.is_bpl || false),
    },
    emailConfirmed: !!(user.email_confirmed_at || user.confirmed_at),
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

/**
 * Basic email format validator
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email.trim());
}

/**
 * POST /api/auth/signup
 * Register a new citizen account with Supabase Auth.
 */
async function signUp(req, res) {
  try {
    const { email, password, fullName } = req.body || {};

    // Validate inputs
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required.',
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 6 characters.',
      });
    }

    const trimmedFullName = typeof fullName === 'string' ? fullName.trim() : null;

    // Create user via Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          fullName: trimmedFullName,
        },
      },
    });

    if (error) {
      const statusCode = error.status || 400;
      return res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }

    // Supabase returns identities: [] when the user already exists (duplicate email)
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const formattedUser = formatUserResponse(data.user);
    const hasSession = !!data.session;

    const responsePayload = {
      success: true,
      message: hasSession
        ? 'User registered successfully.'
        : 'User registered successfully. If email confirmation is enabled, please verify your email before logging in.',
      user: formattedUser,
    };

    if (hasSession) {
      responsePayload.session = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type,
      };
    }

    return res.status(201).json(responsePayload);
  } catch (err) {
    console.error('[SignUp Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Unexpected error during user registration.',
    });
  }
}

/**
 * POST /api/auth/login
 * Authenticate citizen with email and password.
 */
async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Password is required.',
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      if (error.code === 'email_not_confirmed') {
        return res.status(403).json({
          success: false,
          message: 'Email address has not been confirmed yet. Please verify your email.',
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const formattedUser = formatUserResponse(data.user);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: formattedUser,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type,
      },
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Unexpected error during login.',
    });
  }
}

/**
 * GET /api/auth/me
 * Retrieves current authenticated citizen identity from verified JWT.
 */
async function getMe(req, res) {
  try {
    const formattedUser = formatUserResponse(req.user);
    return res.status(200).json({
      success: true,
      message: 'Current user retrieved successfully.',
      user: formattedUser,
    });
  } catch (err) {
    console.error('[GetMe Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Unexpected error retrieving user profile.',
    });
  }
}

/**
 * POST /api/auth/logout
 * Signs out authenticated citizen session.
 */
async function logout(req, res) {
  try {
    // Sign out user session using isolated request client
    if (req.token) {
      try {
        const userClient = createUserClient(req.token);
        await userClient.auth.signOut();
      } catch (_) {
        // Ignore background signOut failure in stateless mode
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (err) {
    console.error('[Logout Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Unexpected error during logout.',
    });
  }
}

/**
 * POST /api/auth/change-password
 * Securely updates citizen password using official Supabase Auth flow.
 * Validates current password if supplied, and updates via Supabase Auth session.
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const email = req.user.email;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Authenticated user email not found.',
      });
    }

    // If currentPassword provided, verify identity via Supabase Auth
    if (currentPassword) {
      const { data: verifyData, error: verifyErr } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (verifyErr || !verifyData.session) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.',
        });
      }

      // Update password using the verified session
      const { data: updatedData, error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateErr) {
        return res.status(400).json({
          success: false,
          message: updateErr.message || 'Failed to update password.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Password changed successfully.',
      });
    }

    // Direct update via user token if current password not required
    const { createClient } = require('@supabase/supabase-js');
    const userClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    await userClient.auth.setSession({
      access_token: req.token,
      refresh_token: '',
    }).catch(() => {});

    const { error: directErr } = await userClient.auth.updateUser({
      password: newPassword,
    });

    if (directErr) {
      return res.status(400).json({
        success: false,
        message: directErr.message || 'Failed to update password.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (err) {
    console.error('[ChangePassword Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Unexpected error changing password.',
    });
  }
}

/**
 * POST /api/auth/reset-password-email
 * Sends official Supabase Auth password reset link to user's registered email.
 */
async function sendPasswordResetEmail(req, res) {
  try {
    const email = req.user ? req.user.email : req.body?.email;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Valid registered email address is required.',
      });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to send password reset email.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Password reset link sent to ${email}.`,
    });
  } catch (err) {
    console.error('[SendPasswordResetEmail Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Unexpected error sending password reset email.',
    });
  }
}

module.exports = {
  signUp,
  login,
  getMe,
  logout,
  changePassword,
  sendPasswordResetEmail,
  formatUserResponse,
};
