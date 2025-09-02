const mongoose = require('mongoose');

/*
  User Schema:
    username - string (3 or more characters unique)
    email - string (unique)
    role - string (user or admin)
    joinedCommunities - array of community IDs
    adminCommunities - array of community IDs
    profilePhoto - string (URL to the profile photo)
    name - string
    passwordHash - encrypted string (null for google)
    provider - string (google or local)
*/
const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minLength: 3,
  },
  name: String,
  passwordHash: String,
  email: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  provider: String,
  joinedCommunities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        default: []
      }
    ],
  adminCommunities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        default: []
      }
    ],
  profilePhoto: {
    type: String,
    default: ''
  },
  forgotPasswordCode: {
    code: {
      type: String,
    },
    expires: {
      type: Date
    }
  },
  firstLogin: {
    type: Boolean,
    default: true,
    required: true
  }

}, { timestamps: true })

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    if (returnedObject && returnedObject._id) {
      returnedObject.id = returnedObject._id.toString();
    }
    // Ensure role is included
    if (document.role) {
      returnedObject.role = document.role;
    }
    delete returnedObject.passwordHash;
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});


const User = mongoose.model('User', userSchema)

module.exports= User