const express = require('express');
const { 
  getEventsByTimeline,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsByCategory
} = require('../controllers/eventController');
const { 
  authenticate,
  authorizeTimelineOwner
} = require('../middleware/auth');

const router = express.Router();

// Public routes for public timelines
router.get('/public/timeline/:timelineId', getEventsByTimeline);
router.get('/public/:id', getEventById);
router.get('/public/timeline/:timelineId/category/:category', getEventsByCategory);

// Protected routes - require authentication
router.use(authenticate);

// Get events by timeline ID
router.get('/timeline/:timelineId', getEventsByTimeline);
router.get('/timeline/:timelineId/category/:category', getEventsByCategory);

// Get single event
router.get('/:id', getEventById);

// Create event for a timeline
router.post('/timeline/:timelineId', createEvent);

// Update event
router.put('/:id', updateEvent);

// Delete event
router.delete('/:id', deleteEvent);

module.exports = router; 