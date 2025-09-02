// server/routes/inviteLanding.js
const express = require('express');
const config = require('../utils/config');
const { findValidInviteByRawToken } = require('../utils/parseInvite');
const inviteLandingRouter = express.Router();

inviteLandingRouter.get('/', async (req, res) => {
  const raw = req.query.t;
  if (!raw) return res.status(404).send('Not found');

  const invite = await findValidInviteByRawToken(raw);
  if (!invite) return res.status(404).send('Not found');

  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('invite_token', raw, {
    httpOnly: true,
    secure: isProd,                 
    sameSite: isProd ? 'None' : 'Lax', 
  });

  const FE = config.FRONTEND_URL;
  if (req.user) {
    return res.redirect(`${FE}/dashboard?invite=${invite.community}`);
  }
  return res.redirect(`${FE}/auth/login?invite=${invite.community}`);
});

module.exports = inviteLandingRouter;
