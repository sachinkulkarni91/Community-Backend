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

const createTestDataAndEvent = async () => {
  try {
    await connectDB();

    // Check if we already have users and communities
    let user = await User.findOne();
    let community = await Community.findOne();

    // Create a test user if none exists
    if (!user) {
      console.log('👤 Creating test user...');
      user = await User.create({
        name: 'Test User',
        email: 'testuser@example.com',
        username: 'testuser',
        password: '$2b$10$example', // This is just a placeholder hash
        role: 'admin' // Make them admin so they can create events
      });
      console.log(`✅ Created user: ${user.name} (${user.email})`);
    } else {
      console.log(`👤 Using existing user: ${user.name} (${user.email})`);
    }

    // Create a test community if none exists
    if (!community) {
      console.log('🏘️ Creating test community...');
      community = await Community.create({
        name: 'Tech Community',
        description: 'A community for technology enthusiasts and developers',
        owner: user._id,
        admins: [user._id],
        members: [user._id],
        profilePhoto: '1'
      });
      console.log(`✅ Created community: ${community.name}`);
    } else {
      console.log(`🏘️ Using existing community: ${community.name}`);
      
      // Make sure the user is a member of the community
      if (!community.members.includes(user._id)) {
        community.members.push(user._id);
        await community.save();
        console.log('✅ Added user to community members');
      }
    }

    // Now create the dummy event
    console.log('🎉 Creating dummy event...');
    
    const today = new Date();
    const eventDate = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days from now
    const endDate = new Date(eventDate.getTime() + (3 * 60 * 60 * 1000)); // 3 hours duration

    const newEvent = {
      title: 'JavaScript & React Masterclass 2025',
      description: 'Join us for an intensive masterclass covering modern JavaScript ES6+ features and React development. Learn hooks, context API, state management, and best practices. This workshop includes hands-on coding exercises and real-world projects.',
      community: community._id,
      organizer: user._id,
      startDateTime: eventDate,
      endDateTime: endDate,
      platform: 'Zoom',
      meetingLink: 'https://zoom.us/j/123456789?pwd=abcdef',
      maxAttendees: 50,
      category: 'Workshop',
      tags: ['JavaScript', 'React', 'Frontend', 'Web Development', 'ES6'],
      image: '/assets/1.png',
      status: 'published'
    };

    const createdEvent = await Event.create(newEvent);
    
    // Auto-enroll the organizer
    createdEvent.attendees.push({
      user: user._id,
      enrolledAt: new Date(),
      status: 'enrolled'
    });
    await createdEvent.save();

    console.log('🎉 Successfully created dummy event!');
    
    // Display event details
    console.log('\n📋 EVENT DETAILS:');
    console.log('==================');
    console.log(`📝 Title: ${createdEvent.title}`);
    console.log(`🆔 Event ID: ${createdEvent._id}`);
    console.log(`🏘️ Community: ${community.name} (ID: ${community._id})`);
    console.log(`👤 Organizer: ${user.name} (ID: ${user._id})`);
    console.log(`📅 Start: ${createdEvent.startDateTime.toLocaleString()}`);
    console.log(`🕐 End: ${createdEvent.endDateTime.toLocaleString()}`);
    console.log(`💻 Platform: ${createdEvent.platform}`);
    console.log(`🔗 Meeting Link: ${createdEvent.meetingLink}`);
    console.log(`👥 Max Attendees: ${createdEvent.maxAttendees}`);
    console.log(`🏷️ Category: ${createdEvent.category}`);
    console.log(`🏷️ Tags: ${createdEvent.tags.join(', ')}`);
    console.log(`📊 Status: ${createdEvent.status}`);
    console.log(`👥 Current Attendees: ${createdEvent.attendees.length}`);

    console.log('\n🚀 Setup complete!');
    console.log('\n💡 You can now test the Events API:');
    console.log(`   GET  /api/events - View all events`);
    console.log(`   GET  /api/events/${createdEvent._id} - View this event`);
    console.log(`   POST /api/events/${createdEvent._id}/enroll - Enroll in this event`);
    console.log('\n🔐 Test User Credentials:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);

  } catch (error) {
    console.error('❌ Error creating test data and event:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
createTestDataAndEvent();
