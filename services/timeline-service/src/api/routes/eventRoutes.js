const express = require('express');
const { 
  getEvents,
  getEventById,
  getEventsByTimelineId,
  createEvent,
  updateEvent,
  deleteEvent 
} = require('../controllers/eventController');
const { 
  authenticate, 
  authorizeTimelineOwner 
} = require('../middleware/auth');

const router = express.Router();

// Public routes for public timelines
router.get('/public/timeline/:timelineId', getEventsByTimelineId);
router.get('/public/:id', getEventById);

// Protected routes - require authentication
router.use(authenticate);

// Get all events (for admin or filtering)
router.get('/', getEvents);

// Get events by timeline ID
router.get('/timeline/:timelineId', getEventsByTimelineId);

// Get single event
router.get('/:id', getEventById);

// Create event
router.post('/', createEvent);

// Update event
router.put('/:id', updateEvent);

// Delete event
router.delete('/:id', deleteEvent);

module.exports = router; 