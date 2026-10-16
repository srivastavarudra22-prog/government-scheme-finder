/**
 * @file profileRoutes.js
 * @description API Routes for Citizen Profile management.
 * 
 * Base path: /api/profile
 */

const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/profileController');
const { requireAuth } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/profile
 * @desc    Get authenticated citizen profile attributes
 * @access  Private (Requires Bearer token)
 */
router.get('/', requireAuth, getProfile);

/**
 * @route   PATCH /api/profile
 * @desc    Update citizen profile attributes (state, age, income, caste, etc.)
 * @access  Private (Requires Bearer token)
 */
router.patch('/', requireAuth, updateProfile);

module.exports = router;
