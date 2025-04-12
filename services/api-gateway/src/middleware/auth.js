const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

/**
 * Middleware to verify JWT tokens
 */
const verifyToken = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Authentication failed - no token provided', { 
        requestId: req.id 
      });
      return res.status(401).json({
        success: false,
        error: { code: 'NO_TOKEN', message: 'Authentication token is required' }
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'fallback-secret-for-development-only'
    );
    
    // Add user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      logger.warn('Authentication failed - invalid token', { 
        error: error.message, 
        requestId: req.id 
      });
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
      });
    }
    
    logger.error('Authentication error', { 
      error: error.message, 
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

module.exports = {
  verifyToken
}; 