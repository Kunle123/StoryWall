const express = require('express');
const { 
  getTimelines,
  getTimelineById,
  getTimelineByUserId,
  createTimeline,
  updateTimeline,
  deleteTimeline,
  incrementViewCount,
  incrementShareCount
} = require('../controllers/timelineController');
const { 
  authenticate, 
  authorizeTimelineOwner,
  authorizeAdmin
} = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/public', getTimelines);
router.get('/public/:id', getTimelineById);
router.get('/user/:userId/public', getTimelineByUserId);

// Protected routes - require authentication
router.use(authenticate);

// User routes
router.get('/', getTimelines); // Authenticated users get their own timelines
router.get('/:id', getTimelineById); // Will check visibility in controller
router.get('/user/:userId', getTimelineByUserId); // Will check visibility in controller
router.post('/', createTimeline);
router.put('/:id', authorizeTimelineOwner, updateTimeline);
router.delete('/:id', authorizeTimelineOwner, deleteTimeline);
router.post('/:id/view', incrementViewCount); // Increment view count
router.post('/:id/share', incrementShareCount); // Increment share count

// Admin routes
router.get('/admin/all', authorizeAdmin, getTimelines); // Admin can see all timelines

module.exports = router; 