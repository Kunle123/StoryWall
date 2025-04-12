const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  timelineId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Timeline ID is required'],
    ref: 'Timeline'
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true
  },
  eventDate: {
    type: Date,
    required: [true, 'Event date is required']
  },
  endDate: {
    type: Date
  },
  mediaUrls: [{
    type: String
  }],
  location: {
    type: String,
    trim: true
  },
  importance: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  sourceUrls: [{
    type: String
  }],
  positionDegrees: {
    type: Number,
    min: -150,
    max: 150
  },
  isAiGenerated: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  color: {
    type: String
  }
}, { timestamps: true });

// Calculate position in degrees before saving if not provided
eventSchema.pre('save', async function(next) {
  if (this.positionDegrees !== undefined) {
    return next();
  }
  
  try {
    // Find the timeline to get date range
    const Timeline = mongoose.model('Timeline');
    const timeline = await Timeline.findById(this.timelineId);
    
    if (!timeline) {
      return next(new Error('Timeline not found'));
    }
    
    const startTime = timeline.startDate.getTime();
    const endTime = timeline.endDate ? timeline.endDate.getTime() : Date.now();
    const eventTime = this.eventDate.getTime();
    
    // Calculate the percentage of time elapsed
    const percentage = (eventTime - startTime) / (endTime - startTime);
    
    // Map to the angle range (-150 to 150 degrees)
    this.positionDegrees = -150 + percentage * 300;
    
    next();
  } catch (error) {
    next(error);
  }
});

// Index for faster querying
eventSchema.index({ timelineId: 1 });
eventSchema.index({ eventDate: 1 });
eventSchema.index({ importance: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ tags: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event; 