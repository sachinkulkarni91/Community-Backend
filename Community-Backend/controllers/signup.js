const signupRouter = require("express").Router()
const User = require("../models/user")
const bcrypt = require('bcrypt');
const config = require('../utils/config')
const jwt = require('jsonwebtoken')
const isAdmin = require('../utils/isAdmin');
const { findUserByInviteToken } = require('../utils/parseInvite');

// handle GET request to signup page (for direct access)
signupRouter.get('/', (req, res) => {
  // If this is an API request, return status
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(200).json({ message: 'Signup endpoint ready' });
  }
  // Otherwise redirect to frontend signup page
  res.redirect(`${config.FRONTEND_URL}/signup`);
});

// Handle invite-based signup
signupRouter.post('/invite', async (req, res, next) => {
  const { password } = req.body;
  
  if (!password || password.length < 3) {
    return res.status(400).json({
      error: !password ? 'Password is required' : 'Password must be at least 3 characters long'
    });
  }
  
  // Get invite token from cookie
  const inviteToken = req.cookies?.invite_token;
  if (!inviteToken) {
    return res.status(400).json({ error: 'No invite token found' });
  }
  
  try {
    // Find the invited user by token
    const invitedUser = await findUserByInviteToken(inviteToken);
    if (!invitedUser) {
      return res.status(400).json({ error: 'Invalid or expired invite token' });
    }
    
    // Check if user already has a password (already signed up)
    if (invitedUser.passwordHash) {
      return res.status(400).json({ error: 'This invite has already been used' });
    }
    
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Update the user with the password and clear the invite token
    invitedUser.passwordHash = passwordHash;
    invitedUser.provider = "local";
    invitedUser.inviteTokenHash = null; // Clear the invite token
    
    const savedUser = await invitedUser.save();
    
    // Create JWT token
    const token = jwt.sign(
      { username: savedUser.username, id: savedUser._id },
      config.SECRET,
      { expiresIn: '1h' }
    );
    
    // Set cookie
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 60 * 60 * 1000
    });
    
    res.status(200).json({
      username: savedUser.username,
      name: savedUser.name,
      id: savedUser._id,
      role: savedUser.role,
      communities: savedUser.communities
    });
    
  } catch (error) {
    console.log('Invite signup error:', error);
    next(error);
  }
});

// Handle regular user signup
signupRouter.post('', async (req, res, next) => {

  const password = req.body.password
  if (!password || password.length < 3) return res.status(400).json({
    error: !password ? 'error password is a required field' :
     `${password} is less than the minimum length of 3 characters`
  })

  // Create a hash of the password to encrypt
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds)

  try {
    const newUser = new User({
      username: req.body.username,
      name: req.body.name,
      email: req.body.email,
      passwordHash,
      provider: "local",
      role: req.body.role || "user"  // Default to user if no role specified
    })
    const savedUser = await newUser.save()
    const token = jwt.sign(
      { username: savedUser.username, id: savedUser._id },
      config.SECRET,
      { expiresIn: '1h' }
    );

    // Save token in a cookie
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 60 * 60 * 1000
    });
    res.status(201).send({username: savedUser.username, name: savedUser.name, id: savedUser._id, role: savedUser.role})
  } catch (error) {
    console.log('error', error)
    next(error)
  }
})

// Handle admin signup - only accessible by existing admins
signupRouter.post('/admin', isAdmin, async (req, res, next) => {
  const password = req.body.password
  if (!password || password.length < 3) return res.status(400).json({
    error: !password ? 'error password is a required field' :
     `${password} is less than the minimum length of 3 characters`
  })

  // Create a hash of the password to encrypt
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds)

  try {
    const newUser = new User({
      username: req.body.username,
      name: req.body.name,
      email: req.body.email,
      passwordHash,
      provider: "local",
      role: "admin",  // Always create as admin
      firstLogin: false  // Admin accounts don't need first login setup
    })
    const savedUser = await newUser.save()
    
    console.log(`✅ Admin account created: ${savedUser.username} (${savedUser.email})`);
    
    res.status(201).send({
      username: savedUser.username, 
      name: savedUser.name, 
      id: savedUser._id, 
      role: savedUser.role,
      message: "Admin account created successfully"
    })
  } catch (error) {
    console.log('error', error)
    next(error)
  }
})

// Super admin signup - creates first admin account (no auth required)
signupRouter.post('/super-admin', async (req, res, next) => {
  // Check if any admin already exists
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    return res.status(403).json({ 
      error: 'Super admin already exists. Use /auth/signup/admin to create additional admins.' 
    });
  }

  const password = req.body.password
  if (!password || password.length < 3) return res.status(400).json({
    error: !password ? 'error password is a required field' :
     `${password} is less than the minimum length of 3 characters`
  })

  // Create a hash of the password to encrypt
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds)

  try {
    const newUser = new User({
      username: req.body.username,
      name: req.body.name,
      email: req.body.email,
      passwordHash,
      provider: "local",
      role: "admin",  // Always create as admin
      firstLogin: false  // Super admin doesn't need first login setup
    })
    const savedUser = await newUser.save()
    
    console.log(`🚀 SUPER ADMIN CREATED: ${savedUser.username} (${savedUser.email})`);
    
    // Auto-login the super admin
    const token = jwt.sign(
      { username: savedUser.username, id: savedUser._id },
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
    
    res.status(201).send({
      username: savedUser.username, 
      name: savedUser.name, 
      id: savedUser._id, 
      role: savedUser.role,
      message: "Super admin account created and logged in successfully"
    })
  } catch (error) {
    console.log('error', error)
    next(error)
  }
})

module.exports = signupRouter