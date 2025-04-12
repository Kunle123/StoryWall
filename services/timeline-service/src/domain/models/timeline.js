const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'User ID is required'],
    ref: 'User'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date
  },
  coverImageUrl: {
    type: String
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'private'
  },
  category: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  settings: {
    theme: {
      type: String,
      default: 'default'
    },
    colorScheme: {
      type: String,
      default: 'default'
    },
    defaultView: {
      type: String,
      enum: ['circular', 'horizontal'],
      default: 'circular'
    },
    showDates: {
      type: Boolean,
      default: true
    },
    enableComments: {
      type: Boolean,
      default: true
    },
    allowSharing: {
      type: Boolean,
      default: true
    }
  },
  viewCount: {
    type: Number,
    default: 0
  },
  shareCount: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for events
timelineSchema.virtual('events', {
  ref: 'Event',
  localField: '_id',
  foreignField: 'timelineId'
});

// Method to increment view count
timelineSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Method to increment share count
timelineSchema.methods.incrementShareCount = function() {
  this.shareCount += 1;
  return this.save();
};

// Index for faster querying
timelineSchema.index({ userId: 1 });
timelineSchema.index({ visibility: 1 });
timelineSchema.index({ category: 1 });
timelineSchema.index({ tags: 1 });

const Timeline = mongoose.model('Timeline', timelineSchema);

module.exports = Timeline; 