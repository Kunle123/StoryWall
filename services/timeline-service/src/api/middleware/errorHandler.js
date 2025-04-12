const { logger } = require('../../utils/logger');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // Log error details
  logger.error('Error handled by middleware', {
    statusCode,
    message: err.message,
    stack: err.stack,
    requestId: req.id,
    path: req.path
  });
  
  // Format error response
  const errorResponse = {
    success: false,
    error: {
      code: err.code || 'SERVER_ERROR',
      message: statusCode === 500 ? 'Internal server error' : err.message
    }
  };
  
  // Add stack trace in development environment
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }
  
  res.status(statusCode).json(errorResponse);
};

module.exports = {
  errorHandler
}; 