const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Event = require('../models/event');
const User = require('../models/user');
const Community = require('../models/community');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

const createSingleEvent = async () => {
  try {
    await connectDB();

    // Get the first user and community
    const firstUser = await User.findOne();
    const firstCommunity = await Community.findOne();

    if (!firstUser || !firstCommunity) {
      console.log('❌ Please create at least one user and community first');
      console.log('💡 Run: node scripts/setup-local-mongodb.js');
      return;
    }

    console.log(`👤 Using user: ${firstUser.name} (${firstUser.email})`);
    console.log(`🏘️ Using community: ${firstCommunity.name}`);

    // Create a single event with current date + some days
    const today = new Date();
    const eventDate = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days from now
    const endDate = new Date(eventDate.getTime() + (2 * 60 * 60 * 1000)); // 2 hours duration

    const newEvent = {
      title: 'Full Stack Development Bootcamp',
      description: 'Comprehensive bootcamp covering frontend and backend development. Learn React, Node.js, MongoDB, and deployment strategies. Perfect for aspiring developers.',
      community: firstCommunity._id,
      organizer: firstUser._id,
      startDateTime: eventDate,
      endDateTime: endDate,
      platform: 'Zoom',
      meetingLink: 'https://zoom.us/j/987654321',
      maxAttendees: 75,
      category: 'Workshop',
      tags: ['Full Stack', 'React', 'Node.js', 'MongoDB', 'Development'],
      image: '/assets/1.png',
      status: 'published'
    };

    // Create the event
    const createdEvent = await Event.create(newEvent);
    console.log('🎉 Successfully created dummy event!');
    
    // Display event details
    console.log('\n📋 EVENT DETAILS:');
    console.log('==================');
    console.log(`📝 Title: ${createdEvent.title}`);
    console.log(`🆔 ID: ${createdEvent._id}`);
    console.log(`🏘️ Community: ${firstCommunity.name}`);
    console.log(`👤 Organizer: ${firstUser.name}`);
    console.log(`📅 Start: ${createdEvent.startDateTime.toISOString()}`);
    console.log(`🕐 End: ${createdEvent.endDateTime.toISOString()}`);
    console.log(`💻 Platform: ${createdEvent.platform}`);
    console.log(`🔗 Meeting Link: ${createdEvent.meetingLink}`);
    console.log(`👥 Max Attendees: ${createdEvent.maxAttendees}`);
    console.log(`🏷️ Category: ${createdEvent.category}`);
    console.log(`🏷️ Tags: ${createdEvent.tags.join(', ')}`);
    console.log(`📊 Status: ${createdEvent.status}`);

    // Automatically enroll the organizer
    createdEvent.attendees.push({
      user: firstUser._id,
      enrolledAt: new Date(),
      status: 'enrolled'
    });
    await createdEvent.save();
    console.log('✅ Organizer automatically enrolled in the event');

    console.log('\n🚀 Event created successfully!');
    console.log(`💡 You can now test the event at: GET /api/events/${createdEvent._id}`);
    console.log('💡 Or view all events at: GET /api/events');

  } catch (error) {
    console.error('❌ Error creating event:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
createSingleEvent();
