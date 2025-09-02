const mongoose = require('mongoose');
const User = require('../models/user');
const Community = require('../models/community');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const res = await User.updateMany({},
    { $set: { firstLogin: false } }
  );
  console.log(`Updated ${res.modifiedCount} users.`);
  mongoose.disconnect();
});
