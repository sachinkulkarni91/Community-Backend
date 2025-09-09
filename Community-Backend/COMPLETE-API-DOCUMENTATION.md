# Community Backend - Complete API Documentation

## Base URL
```
http://localhost:3016
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🏥 Health & System APIs

| Method | Endpoint | Description | Auth | Admin |
|--------|----------|-------------|------|-------|
| GET | `/healthz` | Health check endpoint | ❌ | ❌ |
| GET | `/readyz` | Readiness check endpoint | ❌ | ❌ |
| GET | `/ping` | Simple ping endpoint | ❌ | ❌ |

---

## 🔐 Authentication APIs

### Login (`/auth/login`)
| Method | Endpoint | Description | Auth | Admin |
|--------|----------|-------------|------|-------|
| GET | `/auth/login/` | Get login page | ❌ | ❌ |
| POST | `/auth/login/` | User login | ❌ | ❌ |
| POST | `/auth/login/logout` | User logout | ❌ | ❌ |
| POST | `/auth/login/check-invite-email` | Check if email has invite | ❌ | ❌ |
| POST | `/auth/login/temp` | Temporary login | ❌ | ❌ |

### Signup (`/auth/signup`)
| Method | Endpoint | Description | Auth | Admin |
|--------|----------|-------------|------|-------|
| GET | `/auth/signup/` | Get signup page | ❌ | ❌ |
| POST | `/auth/signup/` | Regular user signup | ❌ | ❌ |
| POST | `/auth/signup/invite` | Signup with invite | ❌ | ❌ |
| POST | `/auth/signup/admin` | Create admin user | ✅ | ✅ |
| POST | `/auth/signup/super-admin` | Create super admin | ❌ | ❌ |

### Password Reset (`/auth/forgot-password`)
| Method | Endpoint | Description | Auth | Admin |
|--------|----------|-------------|------|-------|
| POST | `/auth/forgot-password/` | Request password reset | ❌ | ❌ |
| POST | `/auth/forgot-password/verify` | Verify reset code | ❌ | ❌ |
| POST | `/auth/forgot-password/reset` | Reset password | ❌ | ❌ |

---

## 👤 User Management APIs

### Users (`/api/users`)
| Method | Endpoint | Description | Auth | Admin |
|--------|----------|-------------|------|-------|
| GET | `/api/users/` | Get all users | ✅ | ❌ |
| POST | `/api/users/change-password` | Change user password | ✅ | ❌ |

### Me (`/api/me`)
| Method | Endpoint | Description | Auth | Admin |
|--------|----------|-------------|------|-------|
| GET | `/api/me/` | Get current user profile | ✅ | ❌ |
| POST | `/api/me/` | Update current user profile | ✅ | ❌ |
| GET | `/api/me/admin-requests` | Get admin requests | ✅ | ❌ |
| GET | `/api/me/posts` | Get current user's posts | ✅ | ❌ |
| POST | `/api/me/change-password` | Change password | ✅ | ❌ |
| POST | `/api/me/photo` | Upload profile photo | ✅ | ❌ |

---

## 🏘️ Community APIs (`/api/communities`)

| Method | Endpoint | Description | Auth | Admin |
|--------|----------|-------------|------|-------|
| GET | `/api/communities/` | Get all communities | ✅ | ❌ |
| GET | `/api/communities/:id` | Get single community | ✅ | ❌ |
| POST | `/api/communities/` | Create community | ✅ | ✅ |
| POST | `/api/communities/custom` | Create custom community | ✅ | ✅ |
| PUT | `/api/communities/:id` | Update community | ✅ | ✅ |
| DELETE | `/api/communities/:id` | Delete community | ✅ | ✅ |
| PUT | `/api/communities/:id/image` | Update community image | ✅ | ✅ |
| PUT | `/api/communities/:id/join` | Join community | ✅ | ❌ |
| POST | `/api/communities/:id/join` | Request to join community | ✅ | ❌ |
| PUT | `/api/communities/:id/leave` | Leave community | ✅ | ❌ |
| POST | `/api/communities/:id/request-join` | Request to join private community | ✅ | ❌ |
| POST | `/api/communities/:id/approve-request` | Approve join request | ✅ | ❌ |
| POST | `/api/communities/:id/reject-request` | Reject join request | ✅ | ❌ |

### Community Spaces
| Method | Endpoint | Description | Auth | Admin |
|--------|----------|-------------|------|-------|
| POST | `/api/communities/:id/spaces` | Create space in community | ✅ | ❌ |
| GET | `/api/communities/:id/spaces` | Get community spaces | ✅ | ❌ |
| GET | `/api/communities/spaces/:spaceId` | Get single space | ✅ | ❌ |
| POST | `/api/communities/spaces/:id/messages` | Send message to space | ✅ | ❌ |

---

## 📝 Posts APIs (`/api/posts`)

| Method | Endpoint | Description | Auth | Admin |
|--------|----------|-------------|------|-------|
| GET | `/api/posts/` | Get all posts | ✅ | ❌ |
| GET | `/api/posts/:id` | Get single post | ✅ | ❌ |
| POST | `/api/posts/` | Create new post | ✅ | ❌ |
| DELETE | `/api/posts/:id` | Delete post | ✅ | ❌ |
| PUT | `/api/posts/:id/like` | Like a post | ✅ | ❌ |
| PUT | `/api/posts/:id/unlike` | Unlike a post | ✅ | ❌ |
| GET | `/api/posts/community/:communityId` | Get posts by community | ✅ | ❌ |

### Post Comments
| Method | Endpoint | Description | Auth | Admin |
|--------|----------|-------------|------|-------|
| GET | `/api/posts/:postId/comments` | Get post comments | ✅ | ❌ |
| POST | `/api/posts/:postId/comments` | Add comment to post | ✅ | ❌ |

---

## 💬 Comments APIs (`/api/comments`)

| Method | Endpoint | Description | Auth | Admin |
|--------|----------|-------------|------|-------|
| PUT | `/api/comments/:id` | Update comment | ✅ | ❌ |
| DELETE | `/api/comments/:id` | Delete comment | ✅ | ❌ |
| PUT | `/api/comments/:id/like` | Like a comment | ✅ | ❌ |

---

## 🎉 Events APIs (`/api/events`)

### Event Management
| Method | Endpoint | Description | Auth | Admin |
|--------|----------|-------------|------|-------|
| GET | `/api/events/` | Get events (user's communities) | ✅ | ❌ |
| GET | `/api/events/all` | Get all events | ✅ | ✅ |
| GET | `/api/events/stats` | Get event statistics | ✅ | ✅ |
| GET | `/api/events/:id` | Get single event | ✅ | ❌ |
| POST | `/api/events/` | Create new event | ✅ | ✅ |
| PUT | `/api/events/:id` | Update event | ✅ | ✅ |
| DELETE | `/api/events/:id` | Delete event | ✅ | ✅ |
| POST | `/api/events/upload-image` | Upload event image | ✅ | ✅ |

### Event Participation
| Method | Endpoint | Description | Auth | Admin |
|--------|----------|-------------|------|-------|
| POST | `/api/events/:id/enroll` | Enroll in event | ✅ | ❌ |
| DELETE | `/api/events/:id/enroll` | Unenroll from event | ✅ | ❌ |
| GET | `/api/events/my/enrolled` | Get user's enrolled events | ✅ | ❌ |

---

## 📧 Invites APIs (`/api/invites`)

| Method | Endpoint | Description | Auth | Admin |
|--------|----------|-------------|------|-------|
| GET | `/api/invites/info` | Get invite information | ❌ | ❌ |
| GET | `/api/invites/user-info/:email` | Get user info by email | ❌ | ❌ |
| GET | `/api/invites/:id` | Get invite by ID | ❌ | ❌ |
| POST | `/api/invites/` | Create invite | ✅ | ❌ |
| POST | `/api/invites/send` | Send invite | ✅ | ❌ |

### Invite Landing
| Method | Endpoint | Description | Auth | Admin |
|--------|----------|-------------|------|-------|
| GET | `/community/redirect/` | Invite landing page | ❌ | ❌ |

---

## 💬 Messages APIs

| Method | Endpoint | Description | Auth | Admin |
|--------|----------|-------------|------|-------|
| POST | `/api/spaces/:id/messages` | Send message to space | ✅ | ❌ |
| GET | `/api/spaces/:id/messages` | Get messages from space | ✅ | ❌ |

---

## 📢 Announcements APIs (`/api/announcements`)

| Method | Endpoint | Description | Auth | Admin |
|--------|----------|-------------|------|-------|
| GET | `/api/announcements` | Get all announcements (returns array of `{ header, subcontent }`) | ❌ | ❌ |
| POST | `/api/announcements` | Create new announcement (send `{ header, subcontent }`) | ✅ | ✅ |
| DELETE | `/api/announcements/:id` | Delete announcement | ✅ | ✅ |

### Request/Response Examples

#### Get Announcements
```javascript
GET /api/announcements
[
  {
    "header": "👋 Welcome to the ServiceNow COEI Leaders Community!",
    "subcontent": "We’re excited to bring together visionary leaders driving ServiceNow excellence and innovation across industries."
  },
  {
    "header": "📅 Mark your calendars! Join us at Knowledge 2025, where COEI leaders will converge to showcase impact, explore new capabilities, and shape the future of work.",
    "subcontent": ""
  }
]
```

#### Create Announcement
```javascript
POST /api/announcements
{
  "header": "👋 Welcome to the ServiceNow COEI Leaders Community!",
  "subcontent": "We’re excited to bring together visionary leaders driving ServiceNow excellence and innovation across industries."
}
```

---

## 📊 Query Parameters

### Events API Query Parameters
- `community` - Filter by community ID
- `status` - Filter by status (`published`, `draft`, `cancelled`, `completed`)
- `timeFilter` - Filter by time (`upcoming`, `past`, `live`)
- `limit` - Number of items per page
- `page` - Page number

### Posts API Query Parameters
- `community` - Filter by community ID
- `limit` - Number of posts per page
- `page` - Page number

### Communities API Query Parameters
- `search` - Search communities by name
- `limit` - Number of communities per page
- `page` - Page number

---

## 🔑 Authentication Levels

- **❌ No Auth** - Public endpoints
- **✅ User** - Requires valid JWT token
- **✅ Admin** - Requires admin role
- **✅ Super Admin** - Requires super admin role

---

## 📋 Request/Response Examples

### Create Event
```javascript
POST /api/events
{
  "title": "React Workshop",
  "description": "Learn React fundamentals",
  "community": "community_id",
  "startDateTime": "2025-09-15T10:00:00.000Z",
  "endDateTime": "2025-09-15T12:00:00.000Z",
  "platform": "Zoom",
  "meetingLink": "https://zoom.us/j/123456789",
  "maxAttendees": 50,
  "category": "Workshop",
  "tags": ["React", "JavaScript"]
}
```

### Create Community
```javascript
POST /api/communities
{
  "name": "Tech Innovators",
  "description": "A community for tech enthusiasts",
  "isPrivate": false,
  "tags": ["Technology", "Innovation"]
}
```

### Create Post
```javascript
POST /api/posts
{
  "title": "Welcome to our community",
  "content": "This is our first post!",
  "community": "community_id",
  "tags": ["welcome", "introduction"]
}
```

### User Login
```javascript
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

---

## 🚨 Error Responses

The API returns standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Error responses include details:
```javascript
{
  "error": "Error message description"
}
```

---

## 🔒 Security Notes

1. **JWT Authentication** - Most endpoints require valid JWT tokens
2. **Admin Protection** - Admin endpoints are protected by `isAdmin` middleware
3. **Community Access** - Users can only access content from joined communities
4. **CORS Enabled** - Currently allows all origins (configure for production)
5. **Rate Limiting** - Consider implementing for production use

---

## 📱 WebSocket Support

The server also supports WebSocket connections for real-time features like messaging and live updates.

---

**Total API Endpoints: 74+**
- Authentication: 11 endpoints
- Users: 7 endpoints  
- Communities: 18 endpoints
- Posts: 9 endpoints
- Comments: 3 endpoints
- Events: 11 endpoints
- Invites: 5 endpoints
- Messages: 2 endpoints
- Announcements: 3 endpoints
- Health: 3 endpoints
- Other: 5+ endpoints
