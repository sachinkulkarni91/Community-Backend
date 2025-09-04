const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import models
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

const createTestUser = async () => {
  try {
    await connectDB();

    // Check if test user already exists
    const existingUser = await User.findOne({ username: 'testuser' });
    if (existingUser) {
      console.log('Test user already exists');
      console.log('Username: testuser');
      console.log('Password: testpass123');
      return;
    }

    // Create test community if it doesn't exist
    let testCommunity = await Community.findOne({ name: 'Test Community' });
    if (!testCommunity) {
      testCommunity = new Community({
        name: 'Test Community',
        description: 'A test community for development',
        profilePhoto: '/assets/generic1.png'
      });
      await testCommunity.save();
      console.log('Created test community');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('testpass123', saltRounds);

    // Create test user
    const testUser = new User({
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      passwordHash,
      firstLogin: false,
      role: 'user',
      joinedCommunities: [testCommunity._id]
    });

    await testUser.save();
    console.log('✅ Test user created successfully!');
    console.log('Username: testuser');
    console.log('Password: testpass123');
    console.log('Email: test@example.com');
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    mongoose.connection.close();
  }
};

createTestUser();
