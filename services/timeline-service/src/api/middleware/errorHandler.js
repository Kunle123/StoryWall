const { logger } = require('../../utils/logger');

/**
 * Custom error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Error handled by middleware', { 
    error: err.message, 
    statusCode: err.statusCode || 500,
    stack: err.stack,
    path: req.path,
    requestId: req.id
  });
  
  // MongooseError handling
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(error => error.message);
    
    return res.status(400).json({
      success: false,
      error: { 
        code: 'VALIDATION_ERROR', 
        message: 'Validation error',
        details: messages
      }
    });
  }
  
  // Duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    
    return res.status(400).json({
      success: false,
      error: { 
        code: 'DUPLICATE_ERROR', 
        message: `${field} already exists`,
        field
      }
    });
  }
  
  // JWT errors are handled in the auth middleware
  
  // CastError for invalid IDs
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: { 
        code: 'INVALID_ID', 
        message: `Invalid ${err.path}: ${err.value}`
      }
    });
  }
  
  // Generic error response
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    error: { 
      code: err.code || 'SERVER_ERROR', 
      message: statusCode === 500 ? 'Internal server error' : err.message
    }
  });
};

module.exports = { errorHandler }; 