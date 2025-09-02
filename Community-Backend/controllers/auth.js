const authRouter = require('express').Router()
const passport = require('passport');

authRouter.get('/', passport.authenticate('google', { scope: ['profile', 'email'] }))

// Handle auth through Google (deprecated)
authRouter.get('/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const { user, token } = req.user;
  
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'None',
      maxAge: 60 * 60 * 1000
    });
  
    res.redirect("http://localhost:5173/feed")
  }
);

module.exports = authRouter