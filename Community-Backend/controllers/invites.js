// routes/invites.js
const express = require('express');
const inviteRouter = express.Router();
const Invite = require('../models/invite');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const config = require('../utils/config');
const nodemailer = require('nodemailer');

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
  const { communityId, email} = req.body;

  if (!communityId || !email) return res.status(400).json({error : "Missing parameters"})

  let invite = await Invite.findOne({ community: communityId });
  if (!invite) {
     invite = await Invite.issue({ communityId, maxUses: 5 });
  }

  let user = await User.findOne({ email });
  const password = user ? "" : getRandomString(12);
  const username = getRandomString(16);

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds)

  // Send email to user with nodemailer
  if (!user) {
    user = await User.create({ 
      email, 
      username, 
      passwordHash, 
      provider: "local", 
      role: "user",
      firstLogin: true
    });
    
    const mailOptions = {
      from: config.EMAIL_USER,
      to: email,
      subject: 'KPMG Community - New User Invite',
      html: `
        <h2>Welcome to KPMG Community!</h2>
        <p>You've been invited to join our community platform.</p>
        <p><strong>Your invite link:</strong> <a href="${config.BACKEND_URL}${invite.link}">Click here to join</a></p>
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
        inviteLink: `${config.BACKEND_URL}${invite.link}`
      });
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      res.status(200).json({ 
        message: 'User created but email failed. Please check logs.',
        inviteLink: `${config.BACKEND_URL}${invite.link}`,
        tempPassword: password
      });
    }
    return;
  }

  // Send invite email to existing user
  const mailOptions = {
    from: config.EMAIL_USER,
    to: user.email,
    subject: 'KPMG Community - Community Invite',
    html: `
      <h2>You're invited to join a community!</h2>
      <p>You've been invited to join a new community on our platform.</p>
      <p><strong>Click here to join:</strong> <a href="${config.BACKEND_URL}${invite.link}">Join Community</a></p>
      <br>
      <p>Best regards,<br>KPMG Community Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to: ${user.email}`);
    res.status(200).json({ 
      message: 'Invite email sent successfully!',
      inviteLink: `${config.BACKEND_URL}${invite.link}`
    });
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    res.status(200).json({ 
      message: 'Invite created but email failed. Please check logs.',
      inviteLink: `${config.BACKEND_URL}${invite.link}`
    });
  }

});

module.exports = inviteRouter;
