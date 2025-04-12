const jwt = require('jsonwebtoken');
const User = require('../../domain/models/user');
const { logger } = require('../../utils/logger');

// Authenticate middleware
const authenticate = async (req, res, next) => {
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
    
    // Find user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      logger.warn('Authentication failed - user not found', { 
        userId: decoded.id, 
        requestId: req.id 
      });
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid authentication token' }
      });
    }
    
    // Add user to request
    req.user = {
      id: user._id.toString(),
      role: user.role
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

// Authorization middleware
const authorize = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' }
      });
    }
    
    if (req.user.role !== role) {
      logger.warn('Authorization failed - insufficient privileges', { 
        userId: req.user.id, 
        requiredRole: role, 
        userRole: req.user.role,
        requestId: req.id 
      });
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize
}; 