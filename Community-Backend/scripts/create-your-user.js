const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import models
const User = require('../models/user');
const Community = require('../models/community');

const connectDB = async () => {
  try {
    // Try connecting for longer since Atlas may be slow initially
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

const createYourUser = async () => {
  try {
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'sachinkulkarni108@gmail.com' });
    if (existingUser) {
      console.log('User with your email already exists');
      console.log('Email: sachinkulkarni108@gmail.com');
      console.log('Try the existing password or reset it');
      return;
    }

    // Create test community if it doesn't exist
    let testCommunity = await Community.findOne({ name: 'KPMG Community' });
    if (!testCommunity) {
      testCommunity = new Community({
        name: 'KPMG Community',
        description: 'KPMG Knowledge and Innovation Community',
        profilePhoto: '/assets/kpmg.png'
      });
      await testCommunity.save();
      console.log('Created KPMG community');
    }

    // Hash your password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('Sachin', saltRounds);

    // Create your user
    const yourUser = new User({
      name: 'Sachin Kulkarni',
      username: 'sachin',
      email: 'sachinkulkarni108@gmail.com',
      passwordHash,
      firstLogin: false,
      role: 'admin', // Making you admin
      joinedCommunities: [testCommunity._id]
    });

    await yourUser.save();
    console.log('✅ Your user created successfully!');
    console.log('Email: sachinkulkarni108@gmail.com');
    console.log('Username: sachin');
    console.log('Password: Sachin');
    console.log('Role: admin');
    
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    mongoose.connection.close();
  }
};

createYourUser();
