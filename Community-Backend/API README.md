# KPMG Community Platform API (POC)

## Base URL

```
https://<your-domain>/api/
```

## Authentication

- JWT-based authentication
- All endpoints except `/auth/*` require:

```
Authorization: Bearer <token>
```

---

## Endpoints

### Auth

#### `POST /auth/signup`

Registers a new user.

```json
Request Body:
{
  "username": "Username",
  "email": "Email",
  "password": "Password"
}
```

```json
Response:
{
  "username": "Username",
  "name": "Name",
  "email": "Email",
  "provider": "local",
  "id": "ID"
}
```

---

#### `POST /auth/login`

Logs in an existing user.

```json
Request Body:
{
  "username": "Username",
  "password": "Password"
}
```

```json
Response:
{
  "token": "Token",
  "username": "Username",
  "id": "ID"
}
```

---

#### `GET /auth/google`

Initiates Google OAuth.

---

#### `GET /auth/google/callback`

Handles Google OAuth callback.

---

### User

#### `GET /users/me`

Returns current user info.

```json
Response:
{
  "id": "u123",
  "username": "john_doe",
  "email": "john@example.com"
}
```

---

### Community

#### `GET /community`

Returns the single private community info.

```json
Response:
{
  "id": "c1",
  "name": "KPMG Tech Hub",
  "description": "A private space for internal discussions",
  "memberCount": 42
}
```

---

#### `POST /community/join`

(Optional) Join the community.

```json
Response:
{
  "message": "Joined community successfully"
}
```

---

### Posts

#### `GET /posts`

Returns a list of posts in the community.

```json
Query Params:
?limit=10&offset=0
```

```json
Response:
[
  {
    "id": "p101",
    "author": { "id": "u123", "username": "john_doe" },
    "content": "Welcome to KPMG Hub!",
    "createdAt": "2025-07-02T10:00:00Z"
  }
]
```

---

#### `POST /posts`

Creates a new post.

```json
Request Body:
{
  "content": "Excited to be here!"
}
```

```json
Response:
{
  "id": "p102",
  "message": "Post created successfully"
}
```

---

#### `GET /posts/:id`

Returns a single post.

```json
Response:
{
  "id": "p102",
  "author": {
    "id": "u123",
    "username": "john_doe"
  },
  "content": "Excited to be here!",
  "createdAt": "2025-07-02T10:00:00Z"
}
```

---

#### `DELETE /posts/:id`

Deletes a post (by the author or admin).

```json
Response:
{
  "message": "Post deleted successfully"
}
```
