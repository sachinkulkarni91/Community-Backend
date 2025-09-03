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
  
  // Set invite cookies for later processing
  res.cookie('inviteToken', raw, {
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
  
  // For user-specific invites
  if (invitedUser) {
    const communityId = invitedUser.communities && invitedUser.communities.length > 0 
      ? invitedUser.communities[0] 
      : '';
    
    // Check if this user was created through invitation (firstLogin = true)
    // or if they're an existing user (firstLogin = false or undefined)
    if (invitedUser.firstLogin === true) {
      // New invited user - set invite type and redirect to login
      res.cookie('inviteType', 'user', {
        httpOnly: true,
        secure: isProd,                 
        sameSite: isProd ? 'None' : 'Lax', 
      });
      return res.redirect(`${FE}/login?invite=${communityId}&type=user`);
    } else {
      // Existing user - set invite type and redirect to regular login
      res.cookie('inviteType', 'existing', {
        httpOnly: true,
        secure: isProd,                 
        sameSite: isProd ? 'None' : 'Lax', 
      });
      return res.redirect(`${FE}/login?invite=${communityId}&type=existing`);
    }
  }
  
  // For community invites, redirect to login
  res.cookie('inviteType', 'community', {
    httpOnly: true,
    secure: isProd,                 
    sameSite: isProd ? 'None' : 'Lax', 
  });
  return res.redirect(`${FE}/login?invite=${invite.community}&type=community`);
});

module.exports = inviteLandingRouter;
