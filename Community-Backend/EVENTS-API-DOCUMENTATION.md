# Events API Documentation

The Events API provides comprehensive functionality for creating, managing, and participating in community events. All endpoints require authentication, and some require admin privileges.

## Base URL
```
http://localhost:3016/api/events
```

## Authentication
All endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Event Data Structure

Events have the following structure:

```javascript
{
  "id": "event_id",
  "title": "Event Title",
  "description": "Event description",
  "community": {
    "_id": "community_id",
    "name": "Community Name",
    "profilePhoto": "photo_url"
  },
  "organizer": {
    "_id": "user_id",
    "name": "Organizer Name",
    "username": "organizer_username",
    "profilePhoto": "photo_url"
  },
  "startDateTime": "2025-09-15T10:00:00.000Z",
  "endDateTime": "2025-09-15T12:00:00.000Z",
  "platform": "Zoom", // "Zoom", "Teams", "Google Meet", "In-Person"
  "meetingLink": "https://zoom.us/j/123456789",
  "location": "Physical address (for in-person events)",
  "maxAttendees": 50, // null for unlimited
  "attendees": [
    {
      "user": { user_object },
      "enrolledAt": "enrollment_date",
      "status": "enrolled" // "enrolled", "attended", "no-show"
    }
  ],
  "category": "Workshop", // "Workshop", "Webinar", "Training", "Meeting", "Social", "Other"
  "tags": ["AI", "Technology"],
  "image": "/assets/event-image.png",
  "status": "published", // "draft", "published", "cancelled", "completed"
  "isPast": false,
  "isUpcoming": true,
  "isLive": false,
  "attendeeCount": 15,
  "availableSpots": 35,
  "createdAt": "creation_date",
  "updatedAt": "update_date"
}
```

## Endpoints

### 1. Get Events (GET /api/events)
Retrieves events visible to the current user (from communities they've joined).

**Query Parameters:**
- `community` - Filter by specific community ID
- `status` - Filter by status (default: "published")
- `timeFilter` - "upcoming", "past", or "live"
- `limit` - Number of events per page (default: 10)
- `page` - Page number (default: 1)

**Response:**
```javascript
{
  "events": [event_objects],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 50,
    "limit": 10
  }
}
```

### 2. Get All Events - Admin (GET /api/events/all)
**Admin Only** - Retrieves all events without community filtering.

**Query Parameters:** Same as above

### 3. Get Single Event (GET /api/events/:id)
Retrieves a specific event by ID. Users can only access events from communities they've joined.

### 4. Create Event (POST /api/events)
**Admin Only** - Creates a new event.

**Required Fields:**
- `title` - Event title
- `description` - Event description
- `community` - Community ID
- `startDateTime` - Start date and time
- `endDateTime` - End date and time
- `platform` - Event platform

**Optional Fields:**
- `meetingLink` - Meeting URL (required for virtual events)
- `location` - Physical location (for in-person events)
- `maxAttendees` - Maximum attendees (null for unlimited)
- `category` - Event category
- `tags` - Array of tags
- `image` - Event image URL

### 5. Update Event (PUT /api/events/:id)
**Admin Only** - Updates an existing event.

### 6. Delete Event (DELETE /api/events/:id)
**Admin Only** - Deletes an event.

### 7. Upload Event Image (POST /api/events/upload-image)
**Admin Only** - Uploads an image for events.

### 8. Enroll in Event (POST /api/events/:id/enroll)
Enrolls the current user in an event.

**Restrictions:**
- User must be a member of the event's community
- Event must not be full
- Event must not have started
- User cannot be already enrolled

### 9. Unenroll from Event (DELETE /api/events/:id/enroll)
Removes the current user from an event.

### 10. Get My Enrolled Events (GET /api/events/my/enrolled)
Retrieves events the current user is enrolled in.

**Query Parameters:**
- `timeFilter` - "upcoming" or "past"

### 11. Get Event Statistics (GET /api/events/stats)
**Admin Only** - Returns event statistics.

**Response:**
```javascript
{
  "total": 50,
  "draft": 5,
  "upcoming": 20,
  "past": 25,
  "totalAttendees": 1250
}
```

## Event Platforms
- **Zoom** - Virtual meeting via Zoom
- **Teams** - Virtual meeting via Microsoft Teams
- **Google Meet** - Virtual meeting via Google Meet
- **In-Person** - Physical meeting (requires location)

## Event Categories
- **Workshop** - Hands-on learning sessions
- **Webinar** - Presentation-style events
- **Training** - Educational programs
- **Meeting** - Regular meetings or discussions
- **Social** - Networking and social events
- **Other** - Miscellaneous events

## Event Status
- **draft** - Event is being prepared
- **published** - Event is live and visible
- **cancelled** - Event has been cancelled
- **completed** - Event has finished

## Time-based Filtering
- **upcoming** - Events that haven't started yet
- **past** - Events that have ended
- **live** - Events currently in progress

## Error Responses
The API returns standard HTTP status codes:
- `200` - Success
- `201` - Created successfully
- `400` - Bad request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden (access denied)
- `404` - Not found
- `500` - Internal server error

## Usage Examples

### Creating a Workshop Event
```javascript
{
  "title": "React Development Workshop",
  "description": "Learn React fundamentals and best practices",
  "community": "community_id_here",
  "startDateTime": "2025-09-15T10:00:00.000Z",
  "endDateTime": "2025-09-15T12:00:00.000Z",
  "platform": "Zoom",
  "meetingLink": "https://zoom.us/j/123456789",
  "maxAttendees": 30,
  "category": "Workshop",
  "tags": ["React", "JavaScript", "Frontend"]
}
```

### Creating an In-Person Event
```javascript
{
  "title": "Community Networking Event",
  "description": "Meet fellow community members in person",
  "community": "community_id_here",
  "startDateTime": "2025-09-20T18:00:00.000Z",
  "endDateTime": "2025-09-20T20:00:00.000Z",
  "platform": "In-Person",
  "location": "Conference Room A, Tech Hub, Downtown",
  "maxAttendees": 25,
  "category": "Social",
  "tags": ["Networking", "Community"]
}
```

## Security Notes
- Admin routes are protected by the `isAdmin` middleware
- Users can only access events from communities they're members of
- Event enrollment is restricted to community members
- All dates are stored and returned in ISO 8601 format (UTC)
