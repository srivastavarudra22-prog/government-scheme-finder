/**
 * @file authRoutes.js
 * @description API Routes for Supabase Authentication.
 * 
 * Base path: /api/auth
 */

const express = require('express');
const router = express.Router();
const { 
  signUp, 
  login, 
  getMe, 
  logout, 
  changePassword, 
  sendPasswordResetEmail 
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new citizen account
 * @access  Public
 */
router.post('/signup', signUp);

/**
 * @route   POST /api/auth/login
 * @desc    Login citizen with email and password
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated citizen user
 * @access  Private (Requires Bearer token)
 */
router.get('/me', requireAuth, getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout authenticated citizen
 * @access  Private (Requires Bearer token)
 */
router.post('/logout', requireAuth, logout);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change authenticated citizen password via Supabase Auth
 * @access  Private (Requires Bearer token)
 */
router.post('/change-password', requireAuth, changePassword);

/**
 * @route   POST /api/auth/reset-password-email
 * @desc    Send password reset email via Supabase Auth
 * @access  Public / Private
 */
router.post('/reset-password-email', sendPasswordResetEmail);

module.exports = router;
