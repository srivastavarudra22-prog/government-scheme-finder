const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const {
  saveScheme,
  deleteSavedScheme,
  getSavedSchemes,
} = require('../controllers/savedSchemeController');

// All saved schemes endpoints require authentication
router.post('/:schemeId', requireAuth, saveScheme);
router.delete('/:schemeId', requireAuth, deleteSavedScheme);
router.get('/', requireAuth, getSavedSchemes);

module.exports = router;
