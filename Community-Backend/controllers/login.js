const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const loginRouter = require('express').Router()
const User = require('../models/user');
const { error } = require('../utils/logger');
const  config = require('../utils/config');
const { findUserByInviteToken, findValidInviteByRawToken } = require('../utils/parseInvite');

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
  const cookies = req.cookies;
  const inviteType = cookies.inviteType
  const inviteToken = cookies.invite_token

  let user = await User.findOne({username})
  if (!user) user = await User.findOne({email: username})

  const validPass = user ? await bcrypt.compare(password, user.passwordHash) : false
  
  if (!user || !validPass) return res.status(401).json({error: "Invalid username, email or password"})
  
  // Check if this is an invite login and user needs to be added to community
  if (inviteType && inviteToken) {
    console.log('🔍 Processing invite login:', { inviteType, inviteToken: inviteToken.substring(0, 8) + '...' });
    try {
      // For user-specific invites, check if the invited user matches the current user
      const invitedUser = await findUserByInviteToken(inviteToken);
      console.log('👤 Found invited user:', invitedUser ? { id: invitedUser._id, email: invitedUser.email, joinedCommunities: invitedUser.joinedCommunities } : 'null');
      
      if (invitedUser && invitedUser._id.toString() === user._id.toString()) {
        console.log('✅ User-specific invite match');
        // User-specific invite - joinedCommunities should already be assigned, but ensure they're there
        if (invitedUser.joinedCommunities && invitedUser.joinedCommunities.length > 0) {
          console.log('🏘️ Adding communities to user:', invitedUser.joinedCommunities);
          // Make sure all invited communities are in the user's joinedCommunities
          for (const communityId of invitedUser.joinedCommunities) {
            if (!user.joinedCommunities.includes(communityId)) {
              user.joinedCommunities.push(communityId);
              console.log('➕ Added community:', communityId);
            }
          }
          await user.save();
          console.log('💾 User saved with communities:', user.joinedCommunities);
        }
      } else {
        console.log('🌐 General community invite');
        // General community invite
        const inviteData = await findValidInviteByRawToken(inviteToken);
        console.log('📧 Found invite data:', inviteData ? { community: inviteData.community } : 'null');
        if (inviteData && inviteData.community) {
          // Add user to community if not already a member
          if (!user.joinedCommunities.includes(inviteData.community)) {
            user.joinedCommunities.push(inviteData.community);
            await user.save();
            console.log('➕ Added user to community:', inviteData.community);
          }
        }
      }
      
      // Clear invite cookies after successful community assignment
      res.clearCookie('inviteType');
      res.clearCookie('inviteToken');
      console.log('🧹 Cleared invite cookies');
    } catch (error) {
      console.error('❌ Error processing invite during login:', error);
      // Don't fail login if invite processing fails
    }
  }
  
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

// Check if email was invited (validation endpoint)
loginRouter.post('/check-invite-email', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const user = await User.findOne({ email, firstLogin: true });
    
    if (!user) {
      return res.status(400).json({ 
        error: "This email address was not invited or has already completed signup. Please check the email address or contact your administrator." 
      });
    }

    return res.status(200).json({ 
      message: "Email is valid for invite signup",
      canProceed: true 
    });
  } catch (error) {
    console.error('Error checking invite email:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// handle temporary user transformation
loginRouter.post('/temp', async (req, res) => {
  const {email, name, username, password} = req.body
  console.log('🔄 Temp login attempt:', { email, name, username, password: '***' });

  let user = await User.findOne({email})
  console.log('👤 Found user:', user ? { id: user._id, email: user.email, username: user.username, firstLogin: user.firstLogin } : 'not found');
  
  if (!user) return res.status(401).json({error: "This email address was not invited or has already completed signup. Please check the email address or contact your administrator."})
  if (user.firstLogin === false) return res.status(401).json({error: "This account has already been activated. Please try logging in instead."})

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