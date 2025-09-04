const https = require('https');
const http = require('http');

// Test login endpoint
const testLogin = () => {
  const postData = JSON.stringify({
    username: 'Admin@gmail.com',
    password: 'Admin@108'
  });

  const options = {
    hostname: 'localhost',
    port: 3016,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('🔐 Testing login...');
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      try {
        const response = JSON.parse(data);
        if (response.token) {
          console.log('✅ Login successful!');
          console.log('🎟️ JWT Token:', response.token.substring(0, 50) + '...');
          
          // Test events endpoint
          testEvents(response.token);
        } else {
          console.log('❌ Login failed:', response);
        }
      } catch (error) {
        console.log('❌ Error parsing response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Login request error:', error.message);
  });

  req.write(postData);
  req.end();
};

// Test events endpoint
const testEvents = (token) => {
  const options = {
    hostname: 'localhost',
    port: 3016,
    path: '/api/events',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  console.log('\n🎉 Testing events endpoint...');
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      try {
        const response = JSON.parse(data);
        if (response.events) {
          console.log('✅ Events endpoint working!');
          console.log(`📊 Found ${response.events.length} events`);
          
          if (response.events.length > 0) {
            const firstEvent = response.events[0];
            console.log(`📝 First event: "${firstEvent.title}"`);
            console.log(`🆔 Event ID: ${firstEvent.id}`);
            console.log(`📅 Start: ${new Date(firstEvent.startDateTime).toLocaleString()}`);
            
            // Test specific event
            testSpecificEvent(token, firstEvent.id);
          }
        } else {
          console.log('❌ Unexpected response:', response);
        }
      } catch (error) {
        console.log('❌ Error parsing events response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Events request error:', error.message);
  });

  req.end();
};

// Test specific event endpoint
const testSpecificEvent = (token, eventId) => {
  const options = {
    hostname: 'localhost',
    port: 3016,
    path: `/api/events/${eventId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  console.log(`\n🎯 Testing specific event: ${eventId}...`);
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      try {
        const event = JSON.parse(data);
        if (event.title) {
          console.log('✅ Single event endpoint working!');
          console.log(`📝 Title: ${event.title}`);
          console.log(`🏘️ Community: ${event.community?.name || 'N/A'}`);
          console.log(`👤 Organizer: ${event.organizer?.name || 'N/A'}`);
          console.log(`💻 Platform: ${event.platform}`);
          console.log(`👥 Attendees: ${event.attendees?.length || 0}`);
          console.log('\n🎊 All tests passed! API is working correctly.');
        } else {
          console.log('❌ Unexpected event response:', event);
        }
      } catch (error) {
        console.log('❌ Error parsing event response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Single event request error:', error.message);
  });

  req.end();
};

// Run tests
console.log('🚀 Starting API tests...');
console.log('🌐 Server: http://localhost:3016');
console.log('===============================\n');

testLogin();
