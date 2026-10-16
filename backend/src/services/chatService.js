/**
 * @file chatService.js
 * @description Service abstraction layer for AI Chat Assistant.
 * 
 * ARCHITECTURE DESIGN:
 * User Message -> Chat Controller -> chatService -> [Future RAG / AI Pipeline] -> Schemes Dataset -> Response
 * 
 * CURRENT STATUS:
 * RAG is not integrated yet.
 * This service provides a clean, decoupled boundary returning a structured NOT_IMPLEMENTED response.
 * Future RAG implementation will plug into `processMessage()` without modifying the frontend or API contract.
 */

/**
 * Service interface for chat message processing.
 * Ready for future RAG / LLM integration:
 * - Vector retrieval over scheme documents
 * - Profile context injection
 * - Embedding generation
 * - Source citation extraction
 */
class ChatService {
  /**
   * Processes a user chat message.
   * @param {object} params
   * @param {string} params.userId - Authenticated citizen ID
   * @param {string} params.message - User prompt text
   * @param {object} [params.context] - Optional conversation context or profile data
   * @returns {Promise<{ success: boolean, status: string, message: string, data?: any }>}
   */
  async processMessage({ userId, message, context = {} }) {
    // Intentionally un-integrated placeholder
    // RAG will be implemented in a subsequent dedicated task.
    return {
      success: false,
      status: 'NOT_IMPLEMENTED',
      message: 'AI assistant is not connected yet.',
      notice: 'Development placeholder: AI/RAG system is not connected yet. Dataset grounding will be enabled in the upcoming RAG integration task.',
      userId,
      query: message,
    };
  }

  /**
   * Returns current health and capability status of the AI/RAG subsystem.
   * @returns {Promise<{ available: boolean, model: string|null, ragConnected: boolean }>}
   */
  async getStatus() {
    return {
      available: false,
      ragConnected: false,
      model: null,
      message: 'AI Chat Assistant service is in pre-integration phase. RAG grounding is not connected.',
    };
  }
}

const chatService = new ChatService();

module.exports = {
  chatService,
  ChatService,
};
