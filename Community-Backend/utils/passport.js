const passport = require('passport')
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const config = require('../utils/config')

passport.use(new GoogleStrategy({
  clientID: config.GOOGLE_CLIENT_ID,
  clientSecret: config.GOOGLE_CLIENT_SECRET,
  callbackURL: config.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Lookup or create user
    console.log('profile', profile)
    let user = await User.findOne({
      email: { $regex: new RegExp(`^${profile.emails[0].value}$`, 'i') }
    });    
    console.log('user', user)


    if (!user) {
      user = await User.create({
        googleID: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        // TEMPORARY USE EMAIL AS USERNAME
        // @TODO: CREATE USERNAME WORKFLOW
        username: profile.emails[0].value,
        provider: 'google'
      });
    }

    const userForToken = {
      username: user.username,
      id: user._id
    }


    const token = jwt.sign(
      userForToken,
      config.SECRET,
      { expiresIn: '1h' }
    );

    // Send both user and token to callback
    return done(null, { user, token });
  } catch (err) {
    return done(err);
  }
}));