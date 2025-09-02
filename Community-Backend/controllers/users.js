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

module.exports = userRouter