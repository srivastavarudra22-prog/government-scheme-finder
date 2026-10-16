/**
 * @file authMiddleware.js
 * @description Authentication middleware using Supabase Auth JWT validation.
 * 
 * Verifies JWT access tokens issued by Supabase Auth and attaches the verified user
 * object to the Express request (req.user). Never trusts client-supplied user IDs.
 */

const { supabase, createUserClient } = require('../config/supabase');

/**
 * Middleware that requires a valid Supabase Auth Bearer token.
 * Rejects requests without valid tokens with HTTP 401.
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Missing Authorization header.',
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format. Format must be "Bearer <access_token>".',
      });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is empty.',
      });
    }

    // Verify token with isolated client instance (avoids singleton state conflicts)
    const client = createUserClient(token);
    const { data, error } = await client.auth.getUser(token);

    if (error || !data || !data.user) {
      return res.status(401).json({
        success: false,
        message: error ? error.message : 'Invalid or expired authentication token.',
      });
    }

    // Attach validated identity to request
    req.user = data.user;
    req.token = token;
    next();
  } catch (err) {
    console.error('[AuthMiddleware Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Internal authentication error.',
    });
  }
}

/**
 * Optional authentication middleware.
 * If a valid Bearer token is provided, attaches req.user.
 * If no token or invalid, allows the request to continue with req.user = null.
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token) {
        const client = createUserClient(token);
        const { data, error } = await client.auth.getUser(token);
        if (!error && data && data.user) {
          req.user = data.user;
          req.token = token;
        }
      }
    }

    if (!req.user) {
      req.user = null;
      req.token = null;
    }

    next();
  } catch (err) {
    req.user = null;
    req.token = null;
    next();
  }
}

module.exports = {
  requireAuth,
  optionalAuth,
};
