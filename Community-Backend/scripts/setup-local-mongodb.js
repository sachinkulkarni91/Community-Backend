const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import models
const User = require('../models/user');
const Community = require('../models/community');
const Event = require('../models/event');

let mongod;

const startLocalMongo = async () => {
  try {
    console.log('🚀 Starting local MongoDB instance...');
    mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017, // Use default MongoDB port
        dbName: 'kpmg-community-local'
      }
    });
    
    const uri = mongod.getUri();
    console.log('📍 Local MongoDB URI:', uri);
    
    // Connect to local instance
    await mongoose.connect(uri);
    console.log('✅ Connected to local MongoDB');
    
    // Create sample data
    await createSampleData();
    
    console.log('\n🎉 Local MongoDB setup complete!');
    console.log('📝 Update your .env file:');
    console.log(`MONGO_URI=${uri}`);
    console.log('\n🔐 Test Login Credentials:');
    console.log('Email: Sachinkulkarni108@gmail.com');
    console.log('Password: Sachin@');
    console.log('\nPress Ctrl+C to stop MongoDB server');
    
    // Keep server running
    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping MongoDB server...');
      await mongoose.disconnect();
      await mongod.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error starting local MongoDB:', error);
    process.exit(1);
  }
};

const createSampleData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Community.deleteMany({});
    await Event.deleteMany({});
    
    // Create KPMG community
    const kpmgCommunity = new Community({
      name: 'KPMG Community',
      description: 'KPMG Knowledge and Innovation Community',
      profilePhoto: '/assets/kpmg.png'
    });
    await kpmgCommunity.save();
    
    // Create Service Now community
    const serviceNowCommunity = new Community({
      name: 'Service Now',
      description: 'Service Now Professional Community',
      profilePhoto: '/assets/servicenow.png'
    });
    await serviceNowCommunity.save();
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('Sachin@', saltRounds);
    
    // Create your user
    const yourUser = new User({
      name: 'Sachin Kulkarni',
      username: 'sachin',
      email: 'Sachinkulkarni108@gmail.com',
      passwordHash,
      firstLogin: false,
      role: 'admin',
      joinedCommunities: [kpmgCommunity._id, serviceNowCommunity._id]
    });
    await yourUser.save();
    
    // Create test user
    const testPasswordHash = await bcrypt.hash('testpass123', saltRounds);
    const testUser = new User({
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: testPasswordHash,
      firstLogin: false,
      role: 'user',
      joinedCommunities: [kpmgCommunity._id]
    });
    await testUser.save();
    
    // Create sample events
    const sampleEvents = [
      {
        title: 'AI Unlocked: A Comprehensive Workshop Series Covering Foundations',
        description: 'Join us for a comprehensive workshop series that covers the foundations of artificial intelligence and machine learning.',
        community: kpmgCommunity._id,
        organizer: yourUser._id,
        startDateTime: new Date('2025-09-15T10:00:00Z'),
        endDateTime: new Date('2025-09-15T12:00:00Z'),
        platform: 'Zoom',
        category: 'Workshop',
        tags: ['AI', 'Machine Learning'],
        image: '/assets/1.png',
        maxAttendees: 50,
        status: 'published'
      },
      {
        title: 'Data Science Fundamentals: From Theory to Practice',
        description: 'Learn the core concepts of data science including statistics, data visualization, and predictive modeling.',
        community: kpmgCommunity._id,
        organizer: yourUser._id,
        startDateTime: new Date('2025-09-20T14:00:00Z'),
        endDateTime: new Date('2025-09-20T17:00:00Z'),
        platform: 'Teams',
        category: 'Training',
        tags: ['Data Science', 'Analytics'],
        image: '/assets/2.png',
        maxAttendees: 30,
        status: 'published'
      },
      {
        title: 'Cloud Computing Workshop: AWS Essentials',
        description: 'Discover the power of cloud computing with AWS. Learn about EC2, S3, Lambda, and other essential services.',
        community: serviceNowCommunity._id,
        organizer: testUser._id,
        startDateTime: new Date('2025-09-25T09:00:00Z'),
        endDateTime: new Date('2025-09-25T13:00:00Z'),
        platform: 'Google Meet',
        category: 'Workshop',
        tags: ['AWS', 'Cloud Computing'],
        image: '/assets/3.png',
        maxAttendees: 40,
        status: 'published'
      }
    ];
    
    await Event.insertMany(sampleEvents);
    
    console.log('✅ Sample data created:');
    console.log('  - 2 Communities (KPMG, Service Now)');
    console.log('  - 2 Users (Your account + Test user)');
    console.log('  - 3 Sample events');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
};

startLocalMongo();
