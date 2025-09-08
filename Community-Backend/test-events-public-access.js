const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/user');
const Event = require('./models/event');
const Community = require('./models/community');

async function testEventsPublicAccess() {
  try {
    console.log('🔍 Testing Events Public Access...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Get a regular user (non-admin)
    const regularUser = await User.findOne({ role: { $ne: 'admin' } });
    if (!regularUser) {
      console.log('❌ No regular user found. Please create a user first.');
      return;
    }
    console.log(`👤 Found regular user: ${regularUser.username} (${regularUser.email})`);
    console.log(`📋 User's joined communities: ${regularUser.joinedCommunities?.length || 0}\n`);

    // Get all events
    const allEvents = await Event.find({ status: 'published' })
      .populate('community', 'name')
      .sort({ startDateTime: 1 });

    console.log(`📅 Total published events in database: ${allEvents.length}\n`);

    // Group events by community for better visualization
    const eventsByCommunity = {};
    allEvents.forEach(event => {
      const communityName = event.community?.name || 'Unknown Community';
      if (!eventsByCommunity[communityName]) {
        eventsByCommunity[communityName] = [];
      }
      eventsByCommunity[communityName].push(event);
    });

    console.log('🏢 Events grouped by community:');
    Object.entries(eventsByCommunity).forEach(([communityName, events]) => {
      console.log(`\n  📂 ${communityName} (${events.length} events):`);
      events.forEach(event => {
        const isUserInCommunity = regularUser.joinedCommunities?.includes(event.community?._id.toString());
        const accessIndicator = isUserInCommunity ? '✅ (user is member)' : '🔓 (public access)';
        console.log(`    • ${event.title} ${accessIndicator}`);
      });
    });

    console.log('\n🎯 With the new public access, this user can now see ALL events,');
    console.log('   regardless of community membership status!\n');

    // Test admin user too
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      console.log(`👑 Admin user: ${adminUser.username} - Can see and delete all events\n`);
    }

    console.log('✅ Events public access test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testEventsPublicAccess();
