/**
 * @file ragRoutes.js
 * @description API Routes for future RAG (Retrieval-Augmented Generation) layer.
 * 
 * Base path: /api/rag
 */

const express = require('express');
const router = express.Router();
const ragController = require('../controllers/ragController');

/**
 * @route   GET /api/rag/status
 * @desc    Check status of future RAG service
 * @access  Public
 */
router.get('/status', ragController.getRagStatus);

/**
 * @route   POST /api/rag/ask
 * @desc    Interface for grounded natural-language questions
 * @access  Public
 */
router.post('/ask', ragController.askSchemeQuestion);

/**
 * @route   POST /api/rag/semantic-search
 * @desc    Interface for vector semantic search
 * @access  Public
 */
router.post('/semantic-search', ragController.semanticSchemeSearch);

/**
 * @route   POST /api/rag/context
 * @desc    Interface to fetch scheme context chunks for external LLM grounding
 * @access  Public
 */
router.post('/context', ragController.retrieveSchemeContext);

module.exports = router;
