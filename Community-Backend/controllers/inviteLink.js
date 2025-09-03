// server/routes/inviteLanding.js
const express = require('express');
const config = require('../utils/config');
const { findValidInviteByRawToken, findUserByInviteToken } = require('../utils/parseInvite');
const inviteLandingRouter = express.Router();

inviteLandingRouter.get('/', async (req, res) => {
  const raw = req.query.t;
  if (!raw) return res.status(404).send('Not found');

  // First check if it's a user-specific invite token
  const invitedUser = await findUserByInviteToken(raw);
  
  // Also check if it's a community invite token
  const invite = await findValidInviteByRawToken(raw);
  
  if (!invitedUser && !invite) return res.status(404).send('Not found');

  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('invite_token', raw, {
    httpOnly: true,
    secure: isProd,                 
    sameSite: isProd ? 'None' : 'Lax', 
  });

  const FE = config.FRONTEND_URL;
  
  if (req.user) {
    // If user is already logged in, redirect to appropriate community
    const communityId = invitedUser ? invitedUser.communities[0] : invite.community;
    return res.redirect(`${FE}/feed?invite=${communityId}`);
  }
  
  // For user-specific invites, redirect to signup with pre-filled data
  if (invitedUser) {
    return res.redirect(`${FE}/signup?invite=${invitedUser.communities[0]}`);
  }
  
  // For community invites, redirect to login
  return res.redirect(`${FE}/login?invite=${invite.community}`);
});

module.exports = inviteLandingRouter;
