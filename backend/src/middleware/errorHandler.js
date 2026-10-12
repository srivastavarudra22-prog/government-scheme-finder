const { errorResponse } = require('../utils/response');

/**
 * 404 Route Not Found middleware
 */
function notFoundHandler(req, res, next) {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, null, 404);
}

/**
 * Centralized Global Error Handler middleware
 */
function globalErrorHandler(err, req, res, next) {
  console.error('[Global Error]', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(res, message, process.env.NODE_ENV === 'development' ? err.stack : null, statusCode);
}

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};
