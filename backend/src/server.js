const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { requestLogger } = require('./middleware/logger');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');
const healthRoutes = require('./routes/healthRoutes');
const schemeRoutes = require('./routes/schemeRoutes');
const ragRoutes = require('./routes/ragRoutes');
const { testDatabaseConnection } = require('./config/supabase');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Root Index route
app.get('/', (req, res) => {
  res.json({
    service: 'Government Scheme Finder API',
    version: '1.0.0',
    documentation: {
      health: 'GET /api/health',
      databaseHealth: 'GET /api/health/db',
      listSchemes: 'GET /api/schemes?page=1&limit=20',
      searchSchemes: 'GET /api/schemes/search?q=scholarship',
      filterEligibility: 'GET /api/schemes/filter?state=Gujarat&gender=Female&age=25',
      getSchemeById: 'GET /api/schemes/:id',
      compareSchemes: 'GET /api/schemes/compare?ids=1,2,3',
      filterMetadata: 'GET /api/schemes/metadata/filters',
      ragStatus: 'GET /api/rag/status',
      ragAsk: 'POST /api/rag/ask',
      ragSemanticSearch: 'POST /api/rag/semantic-search',
    },
  });
});

// Mount Routes
app.use('/api/health', healthRoutes);
app.use('/health', healthRoutes); // convenience alias
app.use('/api/schemes', schemeRoutes);
app.use('/api/rag', ragRoutes);

// Error handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Start server if run directly
if (require.main === module) {
  const server = app.listen(PORT, async () => {
    console.log(`====================================================`);
    console.log(` Government Scheme Finder Backend API running on port ${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Local URL: http://localhost:${PORT}`);
    console.log(` Health URL: http://localhost:${PORT}/api/health`);
    console.log(` DB Health URL: http://localhost:${PORT}/api/health/db`);
    console.log(`====================================================`);

    // Verify DB connectivity on startup
    const dbTest = await testDatabaseConnection();
    if (dbTest.ok) {
      console.log(`[Database] Connected successfully to Supabase. Available schemes: ${dbTest.count}`);
    } else {
      console.error(`[Database] Warning: Could not connect to Supabase: ${dbTest.error}`);
    }
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\nShutting down server gracefully...');
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = app;
