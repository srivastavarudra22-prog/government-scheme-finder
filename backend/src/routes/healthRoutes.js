const express = require('express');
const router = express.Router();
const { getHealth, getDatabaseHealth } = require('../controllers/healthController');

// GET /api/health - Basic service status
router.get('/', getHealth);

// GET /api/health/db - Live Supabase database connectivity check
router.get('/db', getDatabaseHealth);

module.exports = router;
