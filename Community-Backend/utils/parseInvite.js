const Invite = require('../models/invite');
const User = require('../models/user');

async function findValidInviteByRawToken(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') return null;

  const tokenHash = require('crypto').createHash('sha256').update(rawToken).digest('hex');

  const invite = await Invite.findOne({ tokenHash, revoked: false });
  if (!invite) return null;

  if (invite.maxUses != null && invite.uses >= invite.maxUses) return null;

  return invite;
}

async function findUserByInviteToken(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') return null;

  const tokenHash = require('crypto').createHash('sha256').update(rawToken).digest('hex');

  const user = await User.findOne({ inviteTokenHash: tokenHash });
  return user;
}

module.exports = { findValidInviteByRawToken, findUserByInviteToken }
