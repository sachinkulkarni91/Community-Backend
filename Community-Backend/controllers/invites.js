// routes/invites.js
const express = require('express');
const inviteRouter = express.Router();
const Invite = require('../models/invite');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const config = require('../utils/config');
const nodemailer = require('nodemailer');
const { findValidInviteByRawToken, findUserByInviteToken } = require('../utils/parseInvite');

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS
  }
});

const getRandomString = (length = 16) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (x) => chars[x % chars.length]).join("");
}


// GET /api/invites/info - Get invite information from token
inviteRouter.get('/info', async (req, res) => {
  const raw = req.cookies?.invite_token;
  if (!raw) {
    return res.status(400).json({ error: 'No invite token found' });
  }

  try {
    // First check if it's a user-specific invite token
    const invitedUser = await findUserByInviteToken(raw);
    if (invitedUser) {
      return res.json({ 
        type: 'user',
        hasValidInvite: true,
        invitedEmail: invitedUser.email,
        invitedName: invitedUser.name || '',
        invitedUsername: invitedUser.username || '',
        communities: invitedUser.communities,
        message: 'User-specific invite found'
      });
    }

    // Fallback to community invite check
    const invite = await findValidInviteByRawToken(raw);
    if (invite) {
      return res.json({ 
        type: 'community',
        hasValidInvite: true,
        communityId: invite.community,
        message: 'Community invite found'
      });
    }

    return res.status(404).json({ error: 'Invalid or expired invite' });
  } catch (error) {
    console.error('Error getting invite info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/invites/user-info/:email - Get invited user info by email
inviteRouter.get('/user-info/:email', async (req, res) => {
  const { email } = req.params;
  
  try {
    const user = await User.findOne({ email, firstLogin: true });
    
    if (!user) {
      return res.status(404).json({ 
        error: "No invited user found with this email address" 
      });
    }

    res.json({
      email: user.email,
      name: user.name || '',
      hasValidInvite: true
    });
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/invites/:id
inviteRouter.get('/:id', async (req, res) => {
  const {id} = req.params;
  const invite = await Invite.findOne({community: id});
  if (!invite) {
    return res.json({ message: 'This community does not have a custom invite yet' });
  }
  console.log('invite', invite)
  res.json(invite);
});

// POST /api/invites  { communityId, maxUses }
inviteRouter.post('/', async (req, res) => {
  const { communityId, maxUses = null } = req.body;


  // Issue the invite
  const invite = await Invite.issue({ communityId, maxUses });
  console.log('invite', invite)
  res.send(invite);
});

// POST /api/invites/send
inviteRouter.post('/send', async (req, res) => {
  const { communityId, email, name} = req.body;

  if (!communityId || !email) return res.status(400).json({error : "Missing parameters"})

  let user = await User.findOne({ email });
  const password = user ? "" : getRandomString(12);
  const username = getRandomString(16);

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds)

  // Create user-specific invite token
  const userInviteToken = getRandomString(32);
  const tokenHash = require('crypto').createHash('sha256').update(userInviteToken).digest('hex');

  // Send email to user with nodemailer
  if (!user) {
    user = await User.create({ 
      email, 
      name: name || '', 
      username, 
      passwordHash, 
      provider: "local", 
      role: "user",
      firstLogin: true,
      inviteTokenHash: tokenHash, // Store the invite token hash with the user
      communities: [communityId] // Add the community to the user
    });
    
    const mailOptions = {
      from: config.EMAIL_USER,
      to: email,
      subject: 'KPMG Community - New User Invite',
      html: `
        <h2>Welcome to KPMG Community, ${name || 'there'}!</h2>
        <p>You've been invited to join our community platform.</p>
        <p><strong>Your invite link:</strong> <a href="${config.BACKEND_URL}/community/redirect/?t=${encodeURIComponent(userInviteToken)}">Click here to join</a></p>
        <p><strong>Your temporary password:</strong> <code>${password}</code></p>
        <p>Please use this password to login for the first time, then change it in your profile settings.</p>
        <br>
        <p>Best regards,<br>KPMG Community Team</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to: ${email}`);
      res.status(200).json({ 
        message: 'User created and invite email sent successfully!',
        inviteLink: `${config.BACKEND_URL}/community/redirect/?t=${encodeURIComponent(userInviteToken)}`
      });
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      res.status(200).json({ 
        message: 'User created but email failed. Please check logs.',
        inviteLink: `${config.BACKEND_URL}/community/redirect/?t=${encodeURIComponent(userInviteToken)}`,
        tempPassword: password
      });
    }
    return;
  }

  // Handle existing user - update their invite token
  user.inviteTokenHash = tokenHash;
  
  // Add user to community if not already a member
  if (!user.communities.includes(communityId)) {
    user.communities.push(communityId);
  }
  
  await user.save();

  // Send invite email to existing user
  const mailOptions = {
    from: config.EMAIL_USER,
    to: user.email,
    subject: 'KPMG Community - Community Invite',
    html: `
      <h2>You're invited to join a community!</h2>
      <p>You've been invited to join a new community on our platform.</p>
      <p><strong>Click here to join:</strong> <a href="${config.BACKEND_URL}/community/redirect/?t=${encodeURIComponent(userInviteToken)}">Join Community</a></p>
      <br>
      <p>Best regards,<br>KPMG Community Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to: ${user.email}`);
    res.status(200).json({ 
      message: 'Invite email sent successfully!',
      inviteLink: `${config.BACKEND_URL}/community/redirect/?t=${encodeURIComponent(userInviteToken)}`
    });
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    res.status(200).json({ 
      message: 'Invite created but email failed. Please check logs.',
      inviteLink: `${config.BACKEND_URL}/community/redirect/?t=${encodeURIComponent(userInviteToken)}`
    });
  }

});

module.exports = inviteRouter;
