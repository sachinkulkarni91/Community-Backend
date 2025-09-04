const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Event = require('../models/event');
const User = require('../models/user');
const Community = require('../models/community');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

const seedEvents = async () => {
  try {
    await connectDB();

    // Get the first user and community to use as organizer
    const firstUser = await User.findOne();
    const firstCommunity = await Community.findOne();

    if (!firstUser || !firstCommunity) {
      console.log('Please create at least one user and community first');
      return;
    }

    // Clear existing events
    await Event.deleteMany({});

    const sampleEvents = [
      {
        title: 'AI Unlocked: A Comprehensive Workshop Series Covering Foundations',
        description: 'Join us for a comprehensive workshop series that covers the foundations of artificial intelligence and machine learning. Perfect for beginners and intermediate learners.',
        community: firstCommunity._id,
        organizer: firstUser._id,
        startDateTime: new Date('2025-09-15T10:00:00Z'),
        endDateTime: new Date('2025-09-15T12:00:00Z'),
        platform: 'Zoom',
        meetingLink: 'https://zoom.us/j/123456789',
        category: 'Workshop',
        tags: ['AI', 'Machine Learning', 'Technology'],
        image: '/assets/1.png',
        maxAttendees: 50,
        status: 'published'
      },
      {
        title: 'Data Science Fundamentals: From Theory to Practice',
        description: 'Learn the core concepts of data science including statistics, data visualization, and predictive modeling in this hands-on workshop.',
        community: firstCommunity._id,
        organizer: firstUser._id,
        startDateTime: new Date('2025-09-20T14:00:00Z'),
        endDateTime: new Date('2025-09-20T17:00:00Z'),
        platform: 'Teams',
        meetingLink: 'https://teams.microsoft.com/l/meetup-join/123',
        category: 'Training',
        tags: ['Data Science', 'Analytics', 'Python'],
        image: '/assets/2.png',
        maxAttendees: 30,
        status: 'published'
      },
      {
        title: 'Cloud Computing Workshop: AWS Essentials',
        description: 'Discover the power of cloud computing with AWS. Learn about EC2, S3, Lambda, and other essential services in this practical workshop.',
        community: firstCommunity._id,
        organizer: firstUser._id,
        startDateTime: new Date('2025-09-25T09:00:00Z'),
        endDateTime: new Date('2025-09-25T13:00:00Z'),
        platform: 'Google Meet',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        category: 'Workshop',
        tags: ['AWS', 'Cloud Computing', 'DevOps'],
        image: '/assets/3.png',
        maxAttendees: 40,
        status: 'published'
      },
      {
        title: 'Cybersecurity Awareness Training',
        description: 'Essential cybersecurity training covering threat awareness, secure coding practices, and incident response procedures.',
        community: firstCommunity._id,
        organizer: firstUser._id,
        startDateTime: new Date('2025-08-15T10:00:00Z'),
        endDateTime: new Date('2025-08-15T12:00:00Z'),
        platform: 'Zoom',
        category: 'Training',
        tags: ['Security', 'Compliance', 'Best Practices'],
        image: '/assets/1.png',
        maxAttendees: 100,
        status: 'published'
      },
      {
        title: 'Project Management Best Practices',
        description: 'Learn agile project management methodologies and tools to improve team productivity and project success rates.',
        community: firstCommunity._id,
        organizer: firstUser._id,
        startDateTime: new Date('2025-08-20T13:00:00Z'),
        endDateTime: new Date('2025-08-20T16:00:00Z'),
        platform: 'Teams',
        category: 'Training',
        tags: ['Project Management', 'Agile', 'Leadership'],
        image: '/assets/2.png',
        maxAttendees: 60,
        status: 'published'
      }
    ];

    const createdEvents = await Event.insertMany(sampleEvents);
    console.log(`Created ${createdEvents.length} sample events`);

    // Add some sample enrollments
    const upcomingEvents = createdEvents.filter(event => new Date(event.startDateTime) > new Date());
    for (const event of upcomingEvents.slice(0, 2)) {
      event.attendees.push({
        user: firstUser._id,
        enrolledAt: new Date(),
        status: 'enrolled'
      });
      await event.save();
    }

    console.log('Added sample enrollments');
    console.log('Sample events created successfully!');
    
  } catch (error) {
    console.error('Error seeding events:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedEvents();
