const express = require('express');
const eventRouter = express.Router();
const Event = require('../models/event');
const Community = require('../models/community');
const User = require('../models/user');
const isAdmin = require('../utils/isAdmin');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../utils/cloudinary');

// Configure multer for image uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'events',
    allowedFormats: ['jpg', 'jpeg', 'png', 'gif'],
  },
});

const upload = multer({ storage: storage });

// GET /api/events - Get all events (filter by community if user is not admin)
eventRouter.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const isUserAdmin = req.user.role === 'admin' || req.isAdminPortalRequest;
    const { community, status = 'published', timeFilter, limit, page = 1 } = req.query;

    let filter = { status };

    // If not admin, only show events from communities user belongs to
    if (!isUserAdmin) {
      const user = await User.findById(userId).select('joinedCommunities');
      if (!user || !user.joinedCommunities?.length) {
        return res.json([]);
      }
      filter.community = { $in: user.joinedCommunities };
    }

    // Filter by specific community if provided
    if (community) {
      filter.community = community;
    }

    // Time-based filtering
    const now = new Date();
    if (timeFilter === 'upcoming') {
      filter.startDateTime = { $gte: now };
    } else if (timeFilter === 'past') {
      filter.endDateTime = { $lt: now };
    } else if (timeFilter === 'live') {
      filter.startDateTime = { $lte: now };
      filter.endDateTime = { $gte: now };
    }

    // Pagination
    const pageSize = parseInt(limit) || 10;
    const skip = (parseInt(page) - 1) * pageSize;

    const events = await Event.find(filter)
      .populate('community', 'name profilePhoto')
      .populate('organizer', 'name username profilePhoto')
      .populate('attendees.user', 'name username profilePhoto')
      .sort({ startDateTime: 1 })
      .skip(skip)
      .limit(pageSize);

    // Get total count for pagination
    const total = await Event.countDocuments(filter);

    res.json({
      events,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / pageSize),
        total,
        limit: pageSize
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/all - Get all events for admin (no filtering)
eventRouter.get('/all', isAdmin, async (req, res) => {
  try {
    const { status, timeFilter, limit, page = 1 } = req.query;

    let filter = {};
    if (status) filter.status = status;

    // Time-based filtering
    const now = new Date();
    if (timeFilter === 'upcoming') {
      filter.startDateTime = { $gte: now };
    } else if (timeFilter === 'past') {
      filter.endDateTime = { $lt: now };
    } else if (timeFilter === 'live') {
      filter.startDateTime = { $lte: now };
      filter.endDateTime = { $gte: now };
    }

    // Pagination
    const pageSize = parseInt(limit) || 20;
    const skip = (parseInt(page) - 1) * pageSize;

    const events = await Event.find(filter)
      .populate('community', 'name profilePhoto')
      .populate('organizer', 'name username profilePhoto')
      .populate('attendees.user', 'name username profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await Event.countDocuments(filter);

    res.json({
      events,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / pageSize),
        total,
        limit: pageSize
      }
    });
  } catch (error) {
    console.error('Error fetching all events:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/stats - Get event statistics (admin only)
eventRouter.get('/stats', isAdmin, async (req, res) => {
  try {
    const now = new Date();
    
    const stats = await Promise.all([
      Event.countDocuments({ status: 'published' }),
      Event.countDocuments({ status: 'draft' }),
      Event.countDocuments({ startDateTime: { $gte: now }, status: 'published' }),
      Event.countDocuments({ endDateTime: { $lt: now }, status: 'published' }),
      Event.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: null, totalAttendees: { $sum: { $size: '$attendees' } } } }
      ])
    ]);

    res.json({
      total: stats[0],
      draft: stats[1],
      upcoming: stats[2],
      past: stats[3],
      totalAttendees: stats[4][0]?.totalAttendees || 0
    });
  } catch (error) {
    console.error('Error fetching event stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/:id - Get single event
eventRouter.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('community', 'name profilePhoto')
      .populate('organizer', 'name username profilePhoto')
      .populate('attendees.user', 'name username profilePhoto');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user has access to this event's community
    const userId = req.user._id;
    const isUserAdmin = req.user.role === 'admin' || req.isAdminPortalRequest;
    
    if (!isUserAdmin) {
      const user = await User.findById(userId).select('joinedCommunities');
      if (!user || !user.joinedCommunities.includes(event.community._id)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/events/upload-image - Upload event image (admin only)
eventRouter.post('/upload-image', isAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    res.json({
      imageUrl: req.file.path,
      publicId: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/events - Create new event (admin only)
eventRouter.post('/', isAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      community,
      startDateTime,
      endDateTime,
      platform,
      meetingLink,
      location,
      maxAttendees,
      category,
      tags,
      image
    } = req.body;

    // Validate required fields
    if (!title || !description || !community || !startDateTime || !endDateTime || !platform) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate community exists
    const communityExists = await Community.findById(community);
    if (!communityExists) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Validate dates
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    if (start >= end) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const event = new Event({
      title,
      description,
      community,
      organizer: req.user._id,
      startDateTime: start,
      endDateTime: end,
      platform,
      meetingLink,
      location,
      maxAttendees,
      category,
      tags: tags || [],
      image: image || '/assets/1.png'
    });

    const savedEvent = await event.save();
    const populatedEvent = await Event.findById(savedEvent._id)
      .populate('community', 'name profilePhoto')
      .populate('organizer', 'name username profilePhoto');

    res.status(201).json(populatedEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/events/:id - Update event (admin only)
eventRouter.put('/:id', isAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      startDateTime,
      endDateTime,
      platform,
      meetingLink,
      location,
      maxAttendees,
      category,
      tags,
      image,
      status
    } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (startDateTime) updateData.startDateTime = new Date(startDateTime);
    if (endDateTime) updateData.endDateTime = new Date(endDateTime);
    if (platform) updateData.platform = platform;
    if (meetingLink !== undefined) updateData.meetingLink = meetingLink;
    if (location !== undefined) updateData.location = location;
    if (maxAttendees !== undefined) updateData.maxAttendees = maxAttendees;
    if (category) updateData.category = category;
    if (tags) updateData.tags = tags;
    if (image) updateData.image = image;
    if (status) updateData.status = status;

    // Validate dates if both are provided
    if (updateData.startDateTime && updateData.endDateTime) {
      if (updateData.startDateTime >= updateData.endDateTime) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('community', 'name profilePhoto')
      .populate('organizer', 'name username profilePhoto')
      .populate('attendees.user', 'name username profilePhoto');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/events/:id - Delete event (admin only)
eventRouter.delete('/:id', isAdmin, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/events/:id/enroll - Enroll in event
eventRouter.post('/:id/enroll', async (req, res) => {
  try {
    const userId = req.user._id;
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user has access to this event's community
    const user = await User.findById(userId).select('joinedCommunities');
    const isUserAdmin = req.user.role === 'admin' || req.isAdminPortalRequest;
    
    if (!isUserAdmin && (!user || !user.joinedCommunities.includes(event.community))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if already enrolled
    const isAlreadyEnrolled = event.attendees.some(
      attendee => attendee.user.toString() === userId.toString()
    );

    if (isAlreadyEnrolled) {
      return res.status(400).json({ error: 'Already enrolled in this event' });
    }

    // Check if event is full
    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      return res.status(400).json({ error: 'Event is full' });
    }

    // Check if event has already started
    if (new Date() > event.startDateTime) {
      return res.status(400).json({ error: 'Cannot enroll in past events' });
    }

    // Add user to attendees
    event.attendees.push({
      user: userId,
      enrolledAt: new Date(),
      status: 'enrolled'
    });

    await event.save();

    const updatedEvent = await Event.findById(eventId)
      .populate('community', 'name profilePhoto')
      .populate('organizer', 'name username profilePhoto')
      .populate('attendees.user', 'name username profilePhoto');

    res.json({
      message: 'Successfully enrolled in event',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Error enrolling in event:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/events/:id/enroll - Unenroll from event
eventRouter.delete('/:id/enroll', async (req, res) => {
  try {
    const userId = req.user._id;
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if enrolled
    const attendeeIndex = event.attendees.findIndex(
      attendee => attendee.user.toString() === userId.toString()
    );

    if (attendeeIndex === -1) {
      return res.status(400).json({ error: 'Not enrolled in this event' });
    }

    // Remove user from attendees
    event.attendees.splice(attendeeIndex, 1);
    await event.save();

    const updatedEvent = await Event.findById(eventId)
      .populate('community', 'name profilePhoto')
      .populate('organizer', 'name username profilePhoto')
      .populate('attendees.user', 'name username profilePhoto');

    res.json({
      message: 'Successfully unenrolled from event',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Error unenrolling from event:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/my/enrolled - Get user's enrolled events
eventRouter.get('/my/enrolled', async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeFilter } = req.query;

    let filter = {
      'attendees.user': userId,
      status: 'published'
    };

    // Time-based filtering
    const now = new Date();
    if (timeFilter === 'upcoming') {
      filter.startDateTime = { $gte: now };
    } else if (timeFilter === 'past') {
      filter.endDateTime = { $lt: now };
    }

    const events = await Event.find(filter)
      .populate('community', 'name profilePhoto')
      .populate('organizer', 'name username profilePhoto')
      .sort({ startDateTime: 1 });

    res.json(events);
  } catch (error) {
    console.error('Error fetching enrolled events:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = eventRouter;
