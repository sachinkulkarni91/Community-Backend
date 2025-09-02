const passwordRouter = require('express').Router();
const config = require('../utils/config')
const User  = require('../models/user');
const sgMail = require('@sendgrid/mail')
const bcrypt = require('bcrypt');
const crypto = require("crypto")

function genOtp6() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

passwordRouter.post('/', async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ error: 'Invalid email' });
  }

  user.forgotPasswordCode = {
    code: genOtp6(),
    expires: Date.now() + 3600000
  };

  await user.save();

  // Send email to user with the reset link
  sgMail.setApiKey(config.SENDGRID_API_KEY)
  // sgMail.setDataResidency('eu'); 
  // uncomment the above line if you are sending mail using a regional EU subuser

  const msg = {
    to: user.email,
    from: 'utkarsh.majithia13@gmail.com',
    subject: 'OTP for password reset',
    text: `Your OTP is ${user.forgotPasswordCode.code}`,
    html: `<strong>Your OTP is ${user.forgotPasswordCode.code}</strong>`,
  }
  sgMail
    .send(msg)
    .then(() => {
      res.status(200).json({ message: 'Password reset email sent'});
    })
    .catch((error) => {
      console.error(error)
    })

  
});

passwordRouter.post('/verify', async (req, res) => {
  const { email, code } = req.body;

  const user = await User.findOne({ email });

  if (!user || !user.forgotPasswordCode || user.forgotPasswordCode.code !== code) {
    return res.status(400).json({ error: 'Invalid email or OTP' });
  }

  if (user.forgotPasswordCode.expires < Date.now()) {
    return res.status(400).json({ error: 'OTP has expired' });
  }

  user.forgotPasswordCode = undefined;
  await user.save();

  res.status(200).json({ message: 'OTP verified successfully' });
});

passwordRouter.post('/reset', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (!password || password.length < 3) return res.status(400).json({
      error: !password ? 'error password is a required field' :
       `${password} is less than the minimum length of 3 characters`
    })
  
    // Create a hash of the password to encrypt
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  user.passwordHash = passwordHash;
  user.forgotPasswordCode = undefined;
  await user.save();

  res.status(200).json({ message: 'Password reset successfully' });
});

module.exports = passwordRouter;
