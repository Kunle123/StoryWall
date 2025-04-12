const Event = require('../../domain/models/event');
const Timeline = require('../../domain/models/timeline');
const { logger } = require('../../utils/logger');

/**
 * Get all events for a timeline
 */
const getEventsByTimeline = async (req, res, next) => {
  try {
    const { timelineId } = req.params;
    
    // First check if the timeline exists and user has access
    const timeline = await Timeline.findById(timelineId);
    
    if (!timeline) {
      logger.warn('Timeline not found', { id: timelineId, requestId: req.id });
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
      logger.warn('Unauthorized access to timeline events', { 
        timelineId, 
        userId: req.user ? req.user.id : null,
        requestId: req.id
      });
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to view events for this timeline' }
      });
    }
    
    const events = await Event.find({ timelineId }).sort({ eventDate: 1 });
    
    logger.info('Fetched timeline events', { 
      timelineId, 
      count: events.length, 
      requestId: req.id 
    });
    
    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Error fetching timeline events', { 
      timelineId: req.params.timelineId, 
      error: error.message, 
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

/**
 * Get event by ID
 */
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      logger.warn('Event not found', { id: req.params.id, requestId: req.id });
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Event not found' }
      });
    }
    
    // Check if user has access to the timeline this event belongs to
    const timeline = await Timeline.findById(event.timelineId);
    
    if (!timeline) {
      logger.warn('Associated timeline not found', { timelineId: event.timelineId, requestId: req.id });
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Associated timeline not found' }
      });
    }
    
    // Check access permissions
    const isPublic = timeline.visibility === 'public';
    const isUnlisted = timeline.visibility === 'unlisted';
    const isOwner = req.user && timeline.userId.toString() === req.user.id;
    const isAdmin = req.user && req.user.role === 'admin';
    
    if (!isPublic && !isUnlisted && !isOwner && !isAdmin) {
      logger.warn('Unauthorized access to event', { 
        id: req.params.id, 
        userId: req.user ? req.user.id : null,
        requestId: req.id
      });
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to view this event' }
      });
    }
    
    logger.info('Retrieved event by ID', { id: req.params.id, requestId: req.id });
    
    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    logger.error('Error retrieving event', { 
      id: req.params.id, 
      error: error.message, 
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

/**
 * Create a new event
 */
const createEvent = async (req, res, next) => {
  try {
    const { timelineId } = req.params;
    
    // Check if the timeline exists and user owns it
    const timeline = await Timeline.findById(timelineId);
    
    if (!timeline) {
      logger.warn('Timeline not found', { id: timelineId, requestId: req.id });
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Timeline not found' }
      });
    }
    
    // Check if user is the owner of the timeline or an admin
    const isOwner = req.user && timeline.userId.toString() === req.user.id;
    const isAdmin = req.user && req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      logger.warn('Unauthorized attempt to create event', { 
        timelineId, 
        userId: req.user ? req.user.id : null,
        requestId: req.id
      });
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to add events to this timeline' }
      });
    }
    
    // Set the timelineId from the URL params
    req.body.timelineId = timelineId;
    
    const event = await Event.create(req.body);
    
    logger.info('Event created', { id: event._id, timelineId, requestId: req.id });
    
    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    logger.error('Error creating event', { 
      timelineId: req.params.timelineId, 
      error: error.message, 
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

/**
 * Update an event
 */
const updateEvent = async (req, res, next) => {
  try {
    // First check if event exists
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      logger.warn('Event not found for update', { id: req.params.id, requestId: req.id });
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Event not found' }
      });
    }
    
    // Check if user has permission to update this event
    const timeline = await Timeline.findById(event.timelineId);
    
    if (!timeline) {
      logger.warn('Associated timeline not found', { timelineId: event.timelineId, requestId: req.id });
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Associated timeline not found' }
      });
    }
    
    // Check if user is the owner of the timeline or an admin
    const isOwner = req.user && timeline.userId.toString() === req.user.id;
    const isAdmin = req.user && req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      logger.warn('Unauthorized attempt to update event', { 
        id: req.params.id, 
        userId: req.user ? req.user.id : null,
        requestId: req.id
      });
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to update this event' }
      });
    }
    
    // Update the event
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    logger.info('Event updated', { id: req.params.id, requestId: req.id });
    
    res.status(200).json({
      success: true,
      data: updatedEvent
    });
  } catch (error) {
    logger.error('Error updating event', { 
      id: req.params.id, 
      error: error.message, 
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

/**
 * Delete an event
 */
const deleteEvent = async (req, res, next) => {
  try {
    // First check if event exists
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      logger.warn('Event not found for deletion', { id: req.params.id, requestId: req.id });
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Event not found' }
      });
    }
    
    // Check if user has permission to delete this event
    const timeline = await Timeline.findById(event.timelineId);
    
    if (!timeline) {
      logger.warn('Associated timeline not found', { timelineId: event.timelineId, requestId: req.id });
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Associated timeline not found' }
      });
    }
    
    // Check if user is the owner of the timeline or an admin
    const isOwner = req.user && timeline.userId.toString() === req.user.id;
    const isAdmin = req.user && req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      logger.warn('Unauthorized attempt to delete event', { 
        id: req.params.id, 
        userId: req.user ? req.user.id : null,
        requestId: req.id
      });
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to delete this event' }
      });
    }
    
    // Delete the event
    await Event.findByIdAndDelete(req.params.id);
    
    logger.info('Event deleted', { id: req.params.id, requestId: req.id });
    
    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting event', { 
      id: req.params.id, 
      error: error.message, 
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

/**
 * Get events by category
 */
const getEventsByCategory = async (req, res, next) => {
  try {
    const { timelineId, category } = req.params;
    
    // Check if the timeline exists and user has access
    const timeline = await Timeline.findById(timelineId);
    
    if (!timeline) {
      logger.warn('Timeline not found', { id: timelineId, requestId: req.id });
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
      logger.warn('Unauthorized access to timeline events by category', { 
        timelineId, 
        category,
        userId: req.user ? req.user.id : null,
        requestId: req.id
      });
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to view events for this timeline' }
      });
    }
    
    const events = await Event.find({ 
      timelineId, 
      category 
    }).sort({ eventDate: 1 });
    
    logger.info('Fetched timeline events by category', { 
      timelineId, 
      category,
      count: events.length, 
      requestId: req.id 
    });
    
    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Error fetching timeline events by category', { 
      timelineId: req.params.timelineId,
      category: req.params.category, 
      error: error.message, 
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

module.exports = {
  getEventsByTimeline,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsByCategory
}; 