const express = require('express');
const mongoose = require('mongoose');
const config = require('./utils/config');
const middleware = require('./utils/middleware');
const userRouter = require('./controllers/users');
const loginRouter = require('./controllers/login')
const signupRouter = require('./controllers/signup');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const communityRouter = require('./controllers/communities');
const postRouter = require('./controllers/posts');
const meRouter = require('./controllers/me');
const commentRouter = require('./controllers/comments');
const healthRouter = require('./controllers/health');
const inviteLandingRouter = require('./controllers/inviteLink');
const inviteRouter = require('./controllers/invites');
const passwordRouter = require('./controllers/forgotpassword');
const detectAdminPortal = require('./utils/detectAdminPortal');


const app = express()
app.use(express.json())
app.use(cookieParser());

mongoose.connect(config.MONGO_URI, {
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  maxPoolSize: 10,
  retryWrites: true,
  retryReads: true
})
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas successfully!');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Full error:', error);
  });

// Allow all origins (useful for development/testing)
// WARNING: In production, consider restricting to specific origins for security
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));

app.use(middleware.requestLogger)
app.use('/', healthRouter)

// Public landing page
app.use('/community/redirect', inviteLandingRouter)
app.use('/community/redirect/', inviteLandingRouter)  // Handle trailing slash

app.use(middleware.tokenExtractor)
app.use(middleware.userExtractor)
app.use(detectAdminPortal)


app.use('/auth/forgot-password', passwordRouter)
app.use('/api/users', userRouter)
app.use('/api/communities', communityRouter)
app.use('/api/comments', commentRouter)
app.use('/api/posts', postRouter)
app.use('/auth/login', loginRouter)
app.use('/auth/signup', signupRouter)
app.use('/api/me', meRouter)
app.use('/api/invites', inviteRouter)
app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app