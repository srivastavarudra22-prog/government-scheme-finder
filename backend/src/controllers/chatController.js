/**
 * @file chatController.js
 * @description Controller for AI Chat Assistant endpoints with authentication.
 * 
 * Enforces:
 * - Bearer token authentication via authMiddleware.
 * - Authenticated Supabase user ID validation (req.user.id).
 * - Input validation for chat message prompts.
 * - Service abstraction via chatService.
 * - Explicit NOT_IMPLEMENTED response while RAG is pending integration.
 */

const { chatService } = require('../services/chatService');
const { ragService } = require('../services/rag/ragService');
const { errorResponse } = require('../utils/response');

/**
 * POST /api/chat/message
 * Submits a citizen message to the AI Chat Assistant.
 * 
 * Request body:
 * {
 *   "message": "Which schemes can I apply for as a B.Tech student?"
 * }
 */
async function sendMessage(req, res) {
  try {
    const { message } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Field "message" is required as a non-empty string.',
      });
    }

    const trimmed = message.trim();
    if (trimmed.length > 1500) {
      return res.status(400).json({
        success: false,
        message: 'Field "message" cannot exceed 1500 characters.',
      });
    }

    // Extract optional citizen profile from request context
    const citizenProfile = req.body.context?.profile || {};

    // Extract conversation history for multi-turn context
    const conversationHistory = req.body.context?.history || [];

    // Check if RAG is live
    const ragStatus = await ragService.getStatus();

    if (ragStatus.isReady) {
      // ── Live RAG Path ────────────────────────────────────────────────────────
      const ragResult = await ragService.askQuestion({
        query: trimmed,
        citizenProfile,
        topK: 10,
        conversationHistory,
      });

      return res.status(200).json({
        success: true,
        status: 'OK',
        message: 'Response generated from verified government scheme catalog.',
        data: {
          answer: ragResult.answer,
          sources: ragResult.sources || [],
          confidence: ragResult.confidence || 'medium',
          isReady: true,
          connected: true,
        },
      });
    }

    // ── Fallback: RAG not yet ingested — return helpful stub ─────────────────
    return res.status(200).json({
      success: false,
      status: 'NOT_IMPLEMENTED',
      message: 'AI assistant is being set up. Please run the ingestion script first.',
      data: {
        echo: trimmed,
        connected: false,
        hint: 'Run: node backend/scripts/ingest-rag.js to populate the vector database.',
      },
    });
  } catch (err) {
    console.error('[ChatController Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Unexpected error in chat assistant service.',
    });
  }
}

/**
 * GET /api/chat/status
 * Returns current capability and readiness status of the AI Chat Assistant.
 */
async function getChatStatus(req, res) {
  try {
    const status = await chatService.getStatus();
    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (err) {
    console.error('[ChatController getStatus Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Unexpected error checking chat assistant status.',
    });
  }
}

module.exports = {
  sendMessage,
  getChatStatus,
};
