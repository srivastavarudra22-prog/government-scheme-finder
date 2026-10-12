/**
 * HTTP Request Logger middleware
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const { statusCode } = res;
    const logLine = `[${new Date().toISOString()}] ${method} ${originalUrl} -> ${statusCode} (${durationMs}ms)`;
    
    if (statusCode >= 500) {
      console.error(logLine);
    } else if (statusCode >= 400) {
      console.warn(logLine);
    } else {
      console.log(logLine);
    }
  });

  next();
}

module.exports = {
  requestLogger,
};
