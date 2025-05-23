const jwt = require('jsonwebtoken');
const Timeline = require('../../domain/models/timeline');
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
    
    // Add user to request
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

// Authorization middleware for timeline owners
const authorizeTimelineOwner = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' }
      });
    }
    
    const timelineId = req.params.timelineId || req.params.id;
    
    // Find the timeline
    const timeline = await Timeline.findById(timelineId);
    
    if (!timeline) {
      logger.warn('Timeline not found for authorization', { 
        timelineId,
        requestId: req.id 
      });
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Timeline not found' }
      });
    }
    
    // Check if user is the owner of the timeline or an admin
    const isOwner = timeline.userId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      logger.warn('Authorization failed - insufficient privileges', { 
        userId: req.user.id, 
        timelineId,
        requestId: req.id 
      });
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }
    
    // Add timeline to request
    req.timeline = timeline;
    
    next();
  } catch (error) {
    logger.error('Authorization error', { 
      error: error.message, 
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

// Admin authorization middleware
const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' }
    });
  }
  
  if (req.user.role !== 'admin') {
    logger.warn('Authorization failed - not an admin', { 
      userId: req.user.id, 
      role: req.user.role,
      requestId: req.id 
    });
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Admin access required' }
    });
  }
  
  next();
};

module.exports = {
  authenticate,
  authorizeTimelineOwner,
  authorizeAdmin
}; 