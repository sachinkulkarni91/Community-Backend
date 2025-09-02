const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const loginRouter = require('express').Router()
const User = require('../models/user');
const { error } = require('../utils/logger');
const  config = require('../utils/config');

// handle GET request to login page (for direct access)
loginRouter.get('/', (req, res) => {
  // If this is an API request, return status
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(200).json({ message: 'Login endpoint ready' });
  }
  // Otherwise redirect to frontend login page
  res.redirect(`${config.FRONTEND_URL}/login`);
});

// handle login
loginRouter.post('/', async (req, res) => {
  const {username, password} = req.body

  let user = await User.findOne({username})
  if (!user) user = await User.findOne({email: username})

  const validPass = user ? await bcrypt.compare(password, user.passwordHash) : false
  
  if (!user || !validPass) return res.status(401).json({error: "Invalid username, email or password"})
  
  // Always create token and set cookie, but indicate if first login is needed
  const userForToken = {
    username: user.username,
    id: user._id
  }

  const token = jwt.sign(
    userForToken,
    config.SECRET,
    { expiresIn: '1h' }
  );

  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    secure: true,  // Always secure since we're using HTTPS
    sameSite: 'None',  // Required for cross-origin requests
    maxAge: 60 * 60 * 1000
  });

  // Send user data with firstLogin flag
  const userResponse = {
    ...user.toJSON(),
    firstLogin: user.firstLogin
  };

  res.status(200).send(userResponse)

})

// handle logout
loginRouter.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

// handle temporary user transformation
loginRouter.post('/temp', async (req, res) => {
  const {email, name, username, password} = req.body
  console.log('🔄 Temp login attempt:', { email, name, username, password: '***' });

  let user = await User.findOne({email})
  console.log('👤 Found user:', user ? { id: user._id, email: user.email, username: user.username, firstLogin: user.firstLogin } : 'not found');
  
  if (!user) return res.status(401).json({error: "Invalid email"})
  if (user.firstLogin === false) return res.status(401).json({error: "You have already completed your first login"})

  const otherUser = await User.findOne({ username })
  if (otherUser) return res.status(400).json({error: "Username already taken"})
  
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds)

  user.passwordHash = passwordHash;
  user.name = name;
  user.username = username;
  user.firstLogin = false;
  user.role = "user"

  const savedUser = await user.save();
  console.log('✅ User updated:', { id: savedUser._id, email: savedUser.email, username: savedUser.username, name: savedUser.name, firstLogin: savedUser.firstLogin });

  const userForToken = {
    username: savedUser.username,
    id: savedUser._id
  }

  const token = jwt.sign(
    userForToken,
    config.SECRET,
    { expiresIn: '1h' }
  );

  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    maxAge: 60 * 60 * 1000
  });

  res.status(200).send(savedUser)
})


module.exports = loginRouter