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


const app = express()
app.use(express.json())
app.use(cookieParser());

mongoose.connect(config.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas successfully!');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:', error.message);
  });

const allowedOrigins = [
  config.FRONTEND_URL,
  config.ADMIN_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3001',
  'https://community-admin-kpmg-portal.vercel.app',
  'https://community-consumer.vercel.app',
  /^https:\/\/community-consumer.*\.vercel\.app$/,  // Regex for preview deployments
  /^https:\/\/.*\.vercel\.app$/                     // All Vercel domains (temporary)
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(middleware.requestLogger)
app.use('/', healthRouter)

// Public landing page
app.use('/community/redirect', inviteLandingRouter)

app.use(middleware.tokenExtractor)
app.use(middleware.userExtractor)


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