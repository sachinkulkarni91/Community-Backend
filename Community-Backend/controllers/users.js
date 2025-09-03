const userRouter = require("express").Router()
const User = require("../models/user")
const bcrypt = require('bcrypt');

// Get all users
userRouter.get('', async (req, res, next) => {
  try {
    const users =  await User.find({})
    res.json(users)
  } catch (error) {
    next(error)
  }
})

// Change password for first-time login users
userRouter.post('/change-password', async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash the new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update user password and mark as no longer first login
    user.passwordHash = passwordHash;
    user.firstLogin = false;
    
    const savedUser = await user.save();

    res.status(200).json({
      message: 'Password updated successfully',
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        name: savedUser.name,
        firstLogin: savedUser.firstLogin
      }
    });

  } catch (error) {
    console.error('Error changing password:', error);
    next(error);
  }
})

module.exports = userRouter