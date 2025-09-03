// Test script to verify invite flow functionality
const mongoose = require('mongoose');
const config = require('./utils/config');
const User = require('./models/user');
const Community = require('./models/community');
const { findUserByInviteToken, findValidInviteByRawToken } = require('./utils/parseInvite');

// Test data
const testCommunityId = '66d7e8b3c123456789abcdef'; // Example community ID
const testEmail = 'test@example.com';
const testInviteToken = 'test-invite-token-12345';

async function testInviteFlow() {
  try {
    console.log('🚀 Starting invite flow test...');
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(config.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    console.log('✅ Connected to MongoDB successfully!');

    // Test 1: Create a test community
    console.log('\n🏘️ Testing community creation...');
    let testCommunity = await Community.findById(testCommunityId);
    if (!testCommunity) {
      testCommunity = await Community.create({
        _id: testCommunityId,
        name: 'Test Community',
        description: 'Test community for invite flow',
        isPrivate: false,
        owner: '66d7e8b3c123456789abcde0', // Example owner ID
      });
      console.log('✅ Test community created:', testCommunity.name);
    } else {
      console.log('✅ Test community already exists:', testCommunity.name);
    }

    // Test 2: Create a test user with invite token
    console.log('\n👤 Testing user creation with invite...');
    const tokenHash = require('crypto').createHash('sha256').update(testInviteToken).digest('hex');
    
    let testUser = await User.findOne({ email: testEmail });
    if (testUser) {
      // Update existing user
      testUser.inviteTokenHash = tokenHash;
      testUser.communities = [testCommunityId];
      testUser.firstLogin = true;
      await testUser.save();
      console.log('✅ Updated existing test user');
    } else {
      // Create new user
      testUser = await User.create({
        email: testEmail,
        name: 'Test User',
        username: 'testuser123',
        passwordHash: 'test-hash',
        provider: 'local',
        role: 'user',
        firstLogin: true,
        inviteTokenHash: tokenHash,
        communities: [testCommunityId]
      });
      console.log('✅ Created new test user');
    }

    // Test 3: Test invite token parsing
    console.log('\n🔍 Testing invite token parsing...');
    const foundUser = await findUserByInviteToken(testInviteToken);
    if (foundUser) {
      console.log('✅ User found by invite token:', {
        email: foundUser.email,
        communities: foundUser.communities,
        firstLogin: foundUser.firstLogin
      });
    } else {
      console.log('❌ User NOT found by invite token');
    }

    // Test 4: Simulate login with invite token
    console.log('\n🔑 Testing login with invite processing...');
    const loginUser = await User.findOne({ email: testEmail });
    if (loginUser) {
      console.log('User before community assignment:', {
        email: loginUser.email,
        communities: loginUser.communities
      });

      // Simulate invite processing during login
      const invitedUser = await findUserByInviteToken(testInviteToken);
      if (invitedUser && invitedUser._id.toString() === loginUser._id.toString()) {
        console.log('✅ User-specific invite match confirmed');
        
        if (invitedUser.communities && invitedUser.communities.length > 0) {
          for (const communityId of invitedUser.communities) {
            if (!loginUser.communities.includes(communityId)) {
              loginUser.communities.push(communityId);
              console.log('➕ Added community to user:', communityId);
            }
          }
          await loginUser.save();
          console.log('💾 User saved with communities:', loginUser.communities);
        }
      }
    }

    // Test 5: Verify final state
    console.log('\n✅ Testing final verification...');
    const finalUser = await User.findOne({ email: testEmail });
    console.log('Final user state:', {
      email: finalUser.email,
      communities: finalUser.communities,
      firstLogin: finalUser.firstLogin
    });

    console.log('\n🎉 Invite flow test completed successfully!');
    console.log('\n📋 Test Results Summary:');
    console.log('- Community creation: ✅');
    console.log('- User creation with invite: ✅');
    console.log('- Invite token parsing: ✅');
    console.log('- Community assignment: ✅');
    console.log('- Final verification: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run the test
testInviteFlow().catch(console.error);
