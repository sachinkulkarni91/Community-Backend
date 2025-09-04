const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDateTime: {
    type: Date,
    required: true
  },
  endDateTime: {
    type: Date,
    required: true
  },
  platform: {
    type: String,
    enum: ['Zoom', 'Teams', 'Google Meet', 'In-Person'],
    required: true
  },
  meetingLink: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  maxAttendees: {
    type: Number,
    default: null // null means unlimited
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['enrolled', 'attended', 'no-show'],
      default: 'enrolled'
    }
  }],
  category: {
    type: String,
    enum: ['Workshop', 'Webinar', 'Training', 'Meeting', 'Social', 'Other'],
    default: 'Workshop'
  },
  tags: [String],
  image: {
    type: String,
    default: '/assets/1.png' // Default event image
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'published'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly']
    },
    interval: Number, // every X days/weeks/months
    endDate: Date
  }
}, {
  timestamps: true
});

// Virtual for checking if event is past
eventSchema.virtual('isPast').get(function() {
  return new Date() > this.endDateTime;
});

// Virtual for checking if event is upcoming
eventSchema.virtual('isUpcoming').get(function() {
  return new Date() < this.startDateTime;
});

// Virtual for checking if event is live
eventSchema.virtual('isLive').get(function() {
  const now = new Date();
  return now >= this.startDateTime && now <= this.endDateTime;
});

// Virtual for attendee count
eventSchema.virtual('attendeeCount').get(function() {
  return this.attendees ? this.attendees.length : 0;
});

// Virtual for available spots
eventSchema.virtual('availableSpots').get(function() {
  if (!this.maxAttendees) return null; // unlimited
  return this.maxAttendees - this.attendeeCount;
});

eventSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Index for efficient queries
eventSchema.index({ community: 1, startDateTime: 1 });
eventSchema.index({ startDateTime: 1 });
eventSchema.index({ status: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
