const Timeline = require('../../domain/models/timeline');
const { logger } = require('../../utils/logger');

/**
 * Get all timelines
 * Public/Admin: Get public timelines
 * Authenticated: Get own timelines
 */
const getTimelines = async (req, res, next) => {
  try {
    let query = {};
    
    // If admin route, get all timelines
    if (req.path.includes('/admin/all') && req.user && req.user.role === 'admin') {
      // No query filter for admin
    } 
    // If public route, get only public timelines
    else if (req.path.includes('/public')) {
      query.visibility = 'public';
    } 
    // If user route, get own timelines
    else if (req.user) {
      query.userId = req.user.id;
    } 
    // Default to public
    else {
      query.visibility = 'public';
    }
    
    const timelines = await Timeline.find(query).sort({ updatedAt: -1 });
    
    logger.info('Fetched timelines', { count: timelines.length, requestId: req.id });
    
    res.status(200).json({
      success: true,
      data: timelines
    });
  } catch (error) {
    logger.error('Error fetching timelines', { 
      error: error.message, 
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

/**
 * Get timeline by ID
 */
const getTimelineById = async (req, res, next) => {
  try {
    const timeline = await Timeline.findById(req.params.id).populate('events');
    
    if (!timeline) {
      logger.warn('Timeline not found', { id: req.params.id, requestId: req.id });
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Timeline not found' }
      });
    }
    
    // Check if timeline is public or user owns it
    const isPublic = timeline.visibility === 'public';
    const isUnlisted = timeline.visibility === 'unlisted';
    const isOwner = req.user && timeline.userId.toString() === req.user.id;
    const isAdmin = req.user && req.user.role === 'admin';
    
    if (!isPublic && !isUnlisted && !isOwner && !isAdmin) {
      logger.warn('Unauthorized access to timeline', { 
        id: req.params.id, 
        userId: req.user ? req.user.id : null,
        requestId: req.id
      });
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to view this timeline' }
      });
    }
    
    logger.info('Retrieved timeline by ID', { id: req.params.id, requestId: req.id });
    
    res.status(200).json({
      success: true,
      data: timeline
    });
  } catch (error) {
    logger.error('Error retrieving timeline', { 
      id: req.params.id, 
      error: error.message, 
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

/**
 * Get timelines by user ID
 */
const getTimelineByUserId = async (req, res, next) => {
  try {
    let query = { userId: req.params.userId };
    
    // If public route, get only public timelines
    if (req.path.includes('/public')) {
      query.visibility = 'public';
    } 
    // If not owner, get only public and unlisted
    else if (!req.user || req.user.id !== req.params.userId) {
      query.visibility = { $in: ['public', 'unlisted'] };
    }
    
    const timelines = await Timeline.find(query).sort({ updatedAt: -1 });
    
    logger.info('Fetched timelines by user ID', { 
      userId: req.params.userId, 
      count: timelines.length, 
      requestId: req.id 
    });
    
    res.status(200).json({
      success: true,
      data: timelines
    });
  } catch (error) {
    logger.error('Error fetching timelines by user ID', { 
      userId: req.params.userId, 
      error: error.message, 
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

/**
 * Create a new timeline
 */
const createTimeline = async (req, res, next) => {
  try {
    // Set the userId from the authenticated user
    req.body.userId = req.user.id;
    
    const timeline = await Timeline.create(req.body);
    
    logger.info('Timeline created', { id: timeline._id, requestId: req.id });
    
    res.status(201).json({
      success: true,
      data: timeline
    });
  } catch (error) {
    logger.error('Error creating timeline', { 
      error: error.message, 
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

/**
 * Update a timeline
 */
const updateTimeline = async (req, res, next) => {
  try {
    const timeline = await Timeline.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!timeline) {
      logger.warn('Timeline not found for update', { id: req.params.id, requestId: req.id });
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Timeline not found' }
      });
    }
    
    logger.info('Timeline updated', { id: req.params.id, requestId: req.id });
    
    res.status(200).json({
      success: true,
      data: timeline
    });
  } catch (error) {
    logger.error('Error updating timeline', { 
      id: req.params.id, 
      error: error.message, 
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

/**
 * Delete a timeline
 */
const deleteTimeline = async (req, res, next) => {
  try {
    const timeline = await Timeline.findByIdAndDelete(req.params.id);
    
    if (!timeline) {
      logger.warn('Timeline not found for deletion', { id: req.params.id, requestId: req.id });
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Timeline not found' }
      });
    }
    
    logger.info('Timeline deleted', { id: req.params.id, requestId: req.id });
    
    res.status(200).json({
      success: true,
      message: 'Timeline deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting timeline', { 
      id: req.params.id, 
      error: error.message, 
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

/**
 * Increment view count
 */
const incrementViewCount = async (req, res, next) => {
  try {
    const timeline = await Timeline.findById(req.params.id);
    
    if (!timeline) {
      logger.warn('Timeline not found for view count increment', { id: req.params.id, requestId: req.id });
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Timeline not found' }
      });
    }
    
    await timeline.incrementViewCount();
    
    logger.info('Timeline view count incremented', { id: req.params.id, requestId: req.id });
    
    res.status(200).json({
      success: true,
      data: { viewCount: timeline.viewCount }
    });
  } catch (error) {
    logger.error('Error incrementing view count', { 
      id: req.params.id, 
      error: error.message, 
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

/**
 * Increment share count
 */
const incrementShareCount = async (req, res, next) => {
  try {
    const timeline = await Timeline.findById(req.params.id);
    
    if (!timeline) {
      logger.warn('Timeline not found for share count increment', { id: req.params.id, requestId: req.id });
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Timeline not found' }
      });
    }
    
    await timeline.incrementShareCount();
    
    logger.info('Timeline share count incremented', { id: req.params.id, requestId: req.id });
    
    res.status(200).json({
      success: true,
      data: { shareCount: timeline.shareCount }
    });
  } catch (error) {
    logger.error('Error incrementing share count', { 
      id: req.params.id, 
      error: error.message, 
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

module.exports = {
  getTimelines,
  getTimelineById,
  getTimelineByUserId,
  createTimeline,
  updateTimeline,
  deleteTimeline,
  incrementViewCount,
  incrementShareCount
}; 