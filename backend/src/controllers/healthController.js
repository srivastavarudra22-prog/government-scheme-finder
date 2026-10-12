const { successResponse, errorResponse } = require('../utils/response');
const { testDatabaseConnection } = require('../config/supabase');

/**
 * Basic API health status
 */
function getHealth(req, res) {
  return successResponse(res, {
    status: 'online',
    service: 'Government Scheme Finder Backend API',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  }, null, 'API service is healthy and operational');
}

/**
 * Live Database connectivity healthcheck
 */
async function getDatabaseHealth(req, res) {
  try {
    const dbStatus = await testDatabaseConnection();

    if (!dbStatus.ok) {
      return errorResponse(res, 'Database connection failed', {
        database: 'Supabase PostgreSQL',
        connected: false,
        latencyMs: dbStatus.latencyMs,
        error: dbStatus.error,
      }, 503);
    }

    return successResponse(res, {
      database: 'Supabase PostgreSQL',
      connected: true,
      latencyMs: dbStatus.latencyMs,
      schemesCount: dbStatus.count,
      status: 'healthy',
      timestamp: new Date().toISOString(),
    }, null, 'Database connection is active and healthy');
  } catch (err) {
    return errorResponse(res, 'Unexpected error checking database health', err.message, 500);
  }
}

module.exports = {
  getHealth,
  getDatabaseHealth,
};
