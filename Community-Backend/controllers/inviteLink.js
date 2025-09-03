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
    const communityId = invitedUser && invitedUser.communities && invitedUser.communities.length > 0 
      ? invitedUser.communities[0] 
      : invite?.community;
    return res.redirect(`${FE}/feed?invite=${communityId}`);
  }
  
  // For user-specific invites, redirect to login (not signup)
  if (invitedUser) {
    const communityId = invitedUser.communities && invitedUser.communities.length > 0 
      ? invitedUser.communities[0] 
      : '';
    return res.redirect(`${FE}/login?invite=${communityId}&type=user`);
  }
  
  // For community invites, redirect to login
  return res.redirect(`${FE}/login?invite=${invite.community}&type=community`);
});

module.exports = inviteLandingRouter;
