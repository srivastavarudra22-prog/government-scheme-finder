/**
 * @file ragService.js
 * @description Abstract Interface and Placeholder Implementation for Future RAG (Retrieval-Augmented Generation).
 * 
 * DESIGN PRINCIPLE:
 * This module defines the architectural boundary and contract for future semantic search
 * and grounded AI question-answering over government schemes.
 * 
 * Database filtering and standard REST APIs operate completely independently of this service.
 * RAG remains unimplemented until embedding models and vector stores are enabled.
 */

class RagServiceInterface {
  /**
   * Status and capabilities of the RAG integration layer
   * @returns {Promise<{ isReady: boolean, provider: string, vectorStore: string, message: string }>}
   */
  async getStatus() {
    throw new Error('Method getStatus() must be implemented.');
  }

  /**
   * Ask a natural-language question grounded in retrieved scheme knowledge
   * @param {object} params
   * @param {string} params.query - The citizen's natural-language query
   * @param {object} [params.citizenProfile] - Optional user profile (age, income, state, etc.)
   * @param {number} [params.topK=5] - Number of candidate schemes to retrieve for grounding
   * @returns {Promise<{ answer: string, sources: Array<object>, confidence?: number }>}
   */
  async askQuestion(params) {
    throw new Error('Method askQuestion() must be implemented.');
  }

  /**
   * Perform semantic vector similarity search
   * @param {object} params
   * @param {string} params.query - Semantic search text
   * @param {number} [params.topK=10] - Number of results to retrieve
   * @param {object} [params.filters] - Hard SQL pre-filters (e.g. state, category)
   * @returns {Promise<Array<{ schemeId: number, title: string, similarity: number, excerpt: string }>>}
   */
  async semanticSearch(params) {
    throw new Error('Method semanticSearch() must be implemented.');
  }

  /**
   * Retrieve structured text chunks for specific schemes to build grounding context
   * @param {object} params
   * @param {Array<number>} params.schemeIds - List of scheme IDs
   * @param {string} [params.section] - Specific section (e.g., 'eligibility', 'benefits')
   * @returns {Promise<Array<{ schemeId: number, section: string, content: string }>>}
   */
  async retrieveContext(params) {
    throw new Error('Method retrieveContext() must be implemented.');
  }
}

/**
 * Placeholder / Stub implementation of the RAG Service.
 * Safely returns informative 'unimplemented' status without generating embeddings or calling external AI APIs.
 */
class RagServiceStub extends RagServiceInterface {
  constructor() {
    super();
    this.provider = process.env.RAG_PROVIDER || 'none';
    this.vectorStore = process.env.RAG_VECTOR_STORE || 'none';
  }

  /**
   * Reports the current status of the RAG subsystem
   */
  async getStatus() {
    return {
      isReady: false,
      provider: this.provider,
      vectorStore: this.vectorStore,
      message: 'RAG subsystem interface is prepared but unimplemented. Database-first filtering and standard REST APIs are active and operating independently.',
      capabilities: {
        naturalLanguageQnA: false,
        semanticSearch: false,
        hybridFiltering: false,
      },
      futureIntegrationGuide: '/docs/RAG_INTEGRATION_ARCHITECTURE.md',
    };
  }

  /**
   * Unimplemented placeholder for grounded Q&A
   */
  async askQuestion({ query, citizenProfile, topK = 5 }) {
    return {
      isReady: false,
      query,
      answer: 'RAG question-answering is not yet enabled. The backend architecture interface is prepared for future AI provider and vector store integration.',
      sources: [],
      suggestedFallback: {
        keywordSearchUrl: `/api/schemes/search?q=${encodeURIComponent(query)}`,
        eligibilityFilterUrl: '/api/schemes/filter',
      },
    };
  }

  /**
   * Unimplemented placeholder for semantic vector search
   */
  async semanticSearch({ query, topK = 10, filters = {} }) {
    return {
      isReady: false,
      query,
      results: [],
      suggestedFallback: {
        keywordSearchUrl: `/api/schemes/search?q=${encodeURIComponent(query)}`,
      },
    };
  }

  /**
   * Unimplemented placeholder for context retrieval
   */
  async retrieveContext({ schemeIds, section }) {
    return {
      isReady: false,
      chunks: [],
    };
  }
}

// Export singleton instance of the stub
const ragService = new RagServiceStub();

module.exports = {
  RagServiceInterface,
  RagServiceStub,
  ragService,
};
