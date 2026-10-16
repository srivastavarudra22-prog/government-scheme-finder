const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { sendMessage, getChatStatus } = require('../controllers/chatController');

// All chat assistant endpoints require authentication
router.post('/message', requireAuth, sendMessage);
router.get('/status', requireAuth, getChatStatus);

module.exports = router;
