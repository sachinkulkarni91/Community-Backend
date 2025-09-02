# 📚 KPMG Community Platform - Database Schema (POC)

This document outlines the MongoDB/Mongoose schema design for the KPMG internal community-based social media POC.

## 🛠 Tech Stack

- **Database**: MongoDB
- **ODM**: Mongoose (Node.js)

---

## 👤 User Schema

```js
const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minLength: 3,
  },
  name: String,
  passwordHash: String, // For local auth only
  email: {
    type: String,
    required: true,
    unique: true,
  },
  provider: String, // 'google' or 'local'
  googleID: String, // only for google users
  createdAt: {
    type: Date,
    default: Date.now,
  },
  joinedCommunities: {
    type: mongoose.Schema.Types.ObjectId,
    ref: `Community`
  },
  adminCommunities: {
    type: mongoose.Schema.Types.ObjectId,
    ref: `Community`
  }
})
```

### Fields

| Field             | Type     | Description                           |
|-------------------|----------|---------------------------------------|
| username          | String   | Unique username                       |
| name              | String   | Full name                             |
| passwordHash      | String   | Hashed password                       |
| email             | String   | Unique email                          |
| provider          | String   | Auth provider ('google', 'local')     |
| googleID          | String   | Google user ID                        |
| joinedCommunities | ObjectId | Reference to `Community`              |
| joinedCommunities | ObjectId | Reference to `Community`              |

---

## 🏘️ Community Schema

```js
const communitySchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: String,
  isPrivate: {
    type: Boolean,
    default: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  admins: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],
  members: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  }
})
```

### Fields

| Field       | Type     | Description                              |
|-------------|----------|------------------------------------------|
| name        | String   | Community name                           |
| description | String   | About the community                      |
| isPrivate   | Boolean  | Visibility                               |
| owner       | ObjectId | Creator/Owner of the community (required)|
| admins      | Array    | Admin users (optional)                   |
| members     | Array    | Users who joined                         |

---

## 🧵 Post Schema

```js
const postSchema = mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxLength: 500,
  },
  likes: {
    type: number.
    requiredL true,
    default: 0,
  },
  comments: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
})
```

### Fields

| Field      | Type     | Description              |
|------------|----------|--------------------------|
| author     | ObjectId | Ref to `User`            |
| community  | ObjectId | Ref to `Community`       |
| content    | String   | Post text                |
| likes      | Number   | Number of likes          |
| comments   | ObjectId | Ref to `Comment`         |
| createdAt  | Date     | Timestamp                |

---

## 💬 Comment Schema

```js
const commentSchema = mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: String,
  createdAt: {
    type: Date,
    default: Date.now,
  }
})
```

### Fields

| Field     | Type     | Description     |
|-----------|----------|-----------------|
| post      | ObjectId | Ref to `Post`   |
| author    | ObjectId | Ref to `User`   |
| content   | String   | Comment body    |
| createdAt | Date     | Timestamp       |

---

## 🔁 Relationships Overview

- `User` ↔ `Community`: one-to-many (via `joinedCommunities` and `members`)
- `Community` → `owner`: one-to-one (owner is a `User`)
- `Community` → `admins`: many-to-many (via `adminCommunities` and `users`)
- `Post` → `User`, `Community`
- `Comment` → `Post`, `User`

---

## 🧪 Notes

- All timestamps default to `createdAt` and have an `updatedAt` tracked by mongoose
- Mongoose automatically creates `_id` for each document
