const mongoose = require('mongoose');
const crypto = require('crypto');

const { Schema, model } = mongoose;

const InviteSchema = new Schema({
  community: { type: Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  maxUses: { type: Number, default: null },
  revoked: { type: Boolean, default: false, index: true },
  link: { type: String, required: true }
}, { timestamps: true });

InviteSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    if (ret && ret._id) {
      ret.id = String(ret._id);
      delete ret._id;
    }
  },
});

// URL-safe token that works on all Node LTS
function makeUrlToken(bytes = 32) {
  const buf = crypto.randomBytes(bytes);
  // try base64url if available; otherwise, manual URL-safe base64
  try { return buf.toString('base64url'); } catch { /* older Node */ }
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'');
}

InviteSchema.statics.issue = async function ({ communityId, maxUses = null }) {
  const rawToken = makeUrlToken(32);
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const link = `/community/redirect/?t=${encodeURIComponent(rawToken)}`;

  const doc = await this.create({ community: communityId, tokenHash, maxUses, link });
  return doc.toJSON();
};

module.exports = model('Invite', InviteSchema);
