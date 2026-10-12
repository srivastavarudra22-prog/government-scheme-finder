/**
 * @file ragController.js
 * @description Controller for future Retrieval-Augmented Generation (RAG) endpoints.
 * 
 * Provides HTTP endpoints conforming to the RagServiceInterface boundary.
 * RAG features remain cleanly decoupled from core SQL database queries.
 */

const { ragService } = require('../services/rag/ragService');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * GET /api/rag/status
 * Returns current readiness status and architectural configuration of the RAG layer.
 */
async function getRagStatus(req, res, next) {
  try {
    const status = await ragService.getStatus();
    return successResponse(res, status, null, 'RAG layer status retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/rag/ask
 * Interface for natural-language scheme questions with profile-grounded context.
 * 
 * Request body:
 * {
 *   "query": "Can a 22-year-old college student from Maharashtra get an education grant?",
 *   "citizenProfile": { "age": 22, "state": "Maharashtra", "occupation": "Student" },
 *   "topK": 5
 * }
 */
async function askSchemeQuestion(req, res, next) {
  try {
    const { query, citizenProfile, topK } = req.body || {};

    if (!query || typeof query !== 'string' || !query.trim()) {
      return errorResponse(res, 'Validation error: "query" is required as a non-empty string.', null, 400);
    }

    const result = await ragService.askQuestion({
      query: query.trim(),
      citizenProfile: citizenProfile || {},
      topK: Number(topK) || 5,
    });

    return successResponse(res, result, null, 'RAG query interface response (stub)');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/rag/semantic-search
 * Interface for vector similarity search over scheme chunks.
 * 
 * Request body:
 * {
 *   "query": "financial assistance for drip irrigation equipment",
 *   "topK": 10,
 *   "filters": { "state": "Gujarat", "category": "Agriculture" }
 * }
 */
async function semanticSchemeSearch(req, res, next) {
  try {
    const { query, topK, filters } = req.body || {};

    if (!query || typeof query !== 'string' || !query.trim()) {
      return errorResponse(res, 'Validation error: "query" is required as a non-empty string.', null, 400);
    }

    const result = await ragService.semanticSearch({
      query: query.trim(),
      topK: Number(topK) || 10,
      filters: filters || {},
    });

    return successResponse(res, result, null, 'RAG semantic search interface response (stub)');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/rag/context
 * Interface to retrieve text chunks for specific scheme IDs to ground AI prompts.
 * 
 * Request body:
 * {
 *   "schemeIds": [12, 45, 108],
 *   "section": "eligibility"
 * }
 */
async function retrieveSchemeContext(req, res, next) {
  try {
    const { schemeIds, section } = req.body || {};

    if (!Array.isArray(schemeIds) || schemeIds.length === 0) {
      return errorResponse(res, 'Validation error: "schemeIds" must be a non-empty array of scheme IDs.', null, 400);
    }

    const result = await ragService.retrieveContext({
      schemeIds,
      section: section || null,
    });

    return successResponse(res, result, null, 'RAG context retrieval interface response (stub)');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRagStatus,
  askSchemeQuestion,
  semanticSchemeSearch,
  retrieveSchemeContext,
};
