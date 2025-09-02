const Invite = require('../models/invite');

async function findValidInviteByRawToken(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') return null;

  const tokenHash = require('crypto').createHash('sha256').update(rawToken).digest('hex');

  const invite = await Invite.findOne({ tokenHash, revoked: false });
  if (!invite) return null;

  if (invite.maxUses != null && invite.uses >= invite.maxUses) return null;

  return invite;
}

module.exports = { findValidInviteByRawToken }
