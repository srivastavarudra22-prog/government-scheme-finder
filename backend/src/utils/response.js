/**
 * Standardized JSON API Response envelopes
 */

/**
 * Sends a successful JSON response
 * @param {import('express').Response} res
 * @param {any} data
 * @param {object|null} meta - e.g. pagination details { page, limit, total, totalPages }
 * @param {string} message
 * @param {number} statusCode
 */
function successResponse(res, data, meta = null, message = 'Success', statusCode = 200) {
  const responseBody = {
    success: true,
    message,
    data,
  };

  if (meta) {
    responseBody.meta = meta;
  }

  return res.status(statusCode).json(responseBody);
}

/**
 * Sends a standardized error JSON response
 * @param {import('express').Response} res
 * @param {string} message
 * @param {any} errors
 * @param {number} statusCode
 */
function errorResponse(res, message = 'An error occurred', errors = null, statusCode = 500) {
  const responseBody = {
    success: false,
    message,
  };

  if (errors) {
    responseBody.errors = errors;
  }

  return res.status(statusCode).json(responseBody);
}

module.exports = {
  successResponse,
  errorResponse,
};
