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

const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const getRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const addHoursToDate = (date, hours) => {
  const newDate = new Date(date);
  newDate.setHours(newDate.getHours() + hours);
  return newDate;
};

const createDummyEvents = async () => {
  try {
    await connectDB();

    // Get all users and communities
    const users = await User.find();
    const communities = await Community.find();

    if (!users.length || !communities.length) {
      console.log('❌ Please create at least one user and community first');
      console.log('💡 Run: node scripts/setup-local-mongodb.js');
      return;
    }

    console.log(`📊 Found ${users.length} users and ${communities.length} communities`);

    // Event templates for variety
    const eventTemplates = [
      {
        title: 'JavaScript Fundamentals Workshop',
        description: 'Master the basics of JavaScript programming including variables, functions, objects, and DOM manipulation.',
        category: 'Workshop',
        tags: ['JavaScript', 'Programming', 'Web Development'],
        platform: 'Zoom',
        duration: 3 // hours
      },
      {
        title: 'React Native Mobile Development',
        description: 'Build cross-platform mobile applications using React Native. Learn navigation, state management, and deployment.',
        category: 'Training',
        tags: ['React Native', 'Mobile', 'Cross-Platform'],
        platform: 'Teams',
        duration: 4
      },
      {
        title: 'Digital Marketing Masterclass',
        description: 'Comprehensive guide to digital marketing including SEO, social media, content marketing, and analytics.',
        category: 'Webinar',
        tags: ['Marketing', 'SEO', 'Social Media'],
        platform: 'Google Meet',
        duration: 2
      },
      {
        title: 'Python Data Analysis Workshop',
        description: 'Learn data analysis with Python using pandas, numpy, and matplotlib. Perfect for beginners in data science.',
        category: 'Workshop',
        tags: ['Python', 'Data Analysis', 'Data Science'],
        platform: 'Zoom',
        duration: 5
      },
      {
        title: 'UX/UI Design Principles',
        description: 'Understanding user experience and interface design principles. Learn design thinking and prototyping.',
        category: 'Training',
        tags: ['UX', 'UI', 'Design', 'Prototyping'],
        platform: 'Teams',
        duration: 3
      },
      {
        title: 'Blockchain and Cryptocurrency Basics',
        description: 'Introduction to blockchain technology, cryptocurrencies, smart contracts, and decentralized applications.',
        category: 'Webinar',
        tags: ['Blockchain', 'Cryptocurrency', 'Web3'],
        platform: 'Zoom',
        duration: 2
      },
      {
        title: 'DevOps and CI/CD Pipeline',
        description: 'Learn DevOps practices including continuous integration, deployment automation, and infrastructure as code.',
        category: 'Training',
        tags: ['DevOps', 'CI/CD', 'Automation'],
        platform: 'Google Meet',
        duration: 4
      },
      {
        title: 'Cybersecurity Best Practices',
        description: 'Essential cybersecurity concepts including threat assessment, secure coding, and incident response.',
        category: 'Workshop',
        tags: ['Cybersecurity', 'Security', 'Best Practices'],
        platform: 'Teams',
        duration: 3
      },
      {
        title: 'Artificial Intelligence Ethics',
        description: 'Exploring ethical considerations in AI development, bias prevention, and responsible AI implementation.',
        category: 'Webinar',
        tags: ['AI', 'Ethics', 'Responsible Tech'],
        platform: 'Zoom',
        duration: 2
      },
      {
        title: 'Agile Project Management',
        description: 'Master agile methodologies including Scrum, Kanban, and lean principles for effective project delivery.',
        category: 'Training',
        tags: ['Agile', 'Scrum', 'Project Management'],
        platform: 'Teams',
        duration: 4
      },
      {
        title: 'Community Networking Meetup',
        description: 'Informal networking event for community members to connect, share ideas, and build relationships.',
        category: 'Social',
        tags: ['Networking', 'Community', 'Social'],
        platform: 'In-Person',
        duration: 2
      },
      {
        title: 'Startup Pitch Competition',
        description: 'Present your startup ideas to a panel of investors and industry experts. Win prizes and funding opportunities.',
        category: 'Other',
        tags: ['Startup', 'Pitch', 'Competition'],
        platform: 'Zoom',
        duration: 3
      }
    ];

    const platforms = ['Zoom', 'Teams', 'Google Meet'];
    const meetingLinks = {
      'Zoom': 'https://zoom.us/j/',
      'Teams': 'https://teams.microsoft.com/l/meetup-join/',
      'Google Meet': 'https://meet.google.com/'
    };

    // Generate random events
    const numberOfEvents = 10; // You can change this number
    const dummyEvents = [];

    for (let i = 0; i < numberOfEvents; i++) {
      const template = getRandomElement(eventTemplates);
      const randomUser = getRandomElement(users);
      const randomCommunity = getRandomElement(communities);
      
      // Generate random dates (mix of past, current, and future events)
      const today = new Date();
      const pastDate = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago
      const futureDate = new Date(today.getTime() + (60 * 24 * 60 * 60 * 1000)); // 60 days from now
      
      const startDateTime = getRandomDate(pastDate, futureDate);
      const endDateTime = addHoursToDate(startDateTime, template.duration);

      // Generate meeting link
      let meetingLink = null;
      let location = null;
      
      if (template.platform === 'In-Person') {
        const locations = [
          'Conference Room A, Tech Hub Building',
          'Community Center, Main Street',
          'Innovation Lab, University Campus',
          'Coworking Space, Downtown',
          'Hotel Conference Hall, Business District'
        ];
        location = getRandomElement(locations);
      } else {
        const baseUrl = meetingLinks[template.platform];
        meetingLink = baseUrl + Math.random().toString(36).substring(2, 12);
      }

      const event = {
        title: template.title + (i > 0 ? ` - Session ${i + 1}` : ''),
        description: template.description,
        community: randomCommunity._id,
        organizer: randomUser._id,
        startDateTime: startDateTime,
        endDateTime: endDateTime,
        platform: template.platform,
        meetingLink: meetingLink,
        location: location,
        maxAttendees: Math.floor(Math.random() * 80) + 20, // 20-100 attendees
        category: template.category,
        tags: template.tags,
        image: `/assets/${Math.floor(Math.random() * 3) + 1}.png`,
        status: getRandomElement(['published', 'published', 'published', 'draft']) // 75% published, 25% draft
      };

      dummyEvents.push(event);
    }

    // Create events in database
    const createdEvents = await Event.insertMany(dummyEvents);
    console.log(`🎉 Created ${createdEvents.length} dummy events successfully!`);

    // Add some random enrollments to upcoming events
    const upcomingEvents = createdEvents.filter(event => new Date(event.startDateTime) > new Date());
    console.log(`📅 Found ${upcomingEvents.length} upcoming events`);

    for (const event of upcomingEvents) {
      // Randomly enroll 0-5 users in each upcoming event
      const numberOfEnrollments = Math.floor(Math.random() * 6);
      const enrolledUsers = [];
      
      for (let j = 0; j < numberOfEnrollments && j < users.length; j++) {
        const randomUser = getRandomElement(users);
        if (!enrolledUsers.some(u => u.user.toString() === randomUser._id.toString())) {
          enrolledUsers.push({
            user: randomUser._id,
            enrolledAt: new Date(),
            status: 'enrolled'
          });
        }
      }

      if (enrolledUsers.length > 0) {
        event.attendees = enrolledUsers;
        await event.save();
        console.log(`👥 Added ${enrolledUsers.length} enrollments to "${event.title}"`);
      }
    }

    // Display summary
    console.log('\n📊 EVENT CREATION SUMMARY:');
    console.log('========================');
    console.log(`✅ Total events created: ${createdEvents.length}`);
    console.log(`📅 Upcoming events: ${upcomingEvents.length}`);
    console.log(`📈 Past events: ${createdEvents.length - upcomingEvents.length}`);
    
    const publishedCount = createdEvents.filter(e => e.status === 'published').length;
    const draftCount = createdEvents.filter(e => e.status === 'draft').length;
    console.log(`📝 Published: ${publishedCount}, Draft: ${draftCount}`);

    const categoryCounts = {};
    createdEvents.forEach(event => {
      categoryCounts[event.category] = (categoryCounts[event.category] || 0) + 1;
    });
    
    console.log('\n📋 Events by Category:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   ${category}: ${count}`);
    });

    console.log('\n🚀 Dummy events created successfully!');
    console.log('💡 You can now test the events API endpoints');
    
  } catch (error) {
    console.error('❌ Error creating dummy events:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
createDummyEvents();
