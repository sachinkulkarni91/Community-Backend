const express = require('express')
const User = require('../models/user')
const Community = require('../models/community')
const Post = require('../models/post')
const multer = require('multer');
const bcrypt = require('bcrypt');
const { storage, getOptimizedUrl } = require('../utils/cloudinary');

const meRouter = express.Router()

// Get current user's info
meRouter.get('/', async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = await User.findById(req.user._id).select('-passwordHash') 
    if (!user) return res.status(404).json({ error: 'User not found' })
    const populatedUser = await user.populate('joinedCommunities', 'name description profilePhoto members');

    res.json(populatedUser)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get all requests to join communities
meRouter.get('/admin-requests', async (req, res) => {
  const userId = req.user.id;

  const communities = await Community.find({
    admins: userId
  }).populate('joinRequests', 'name email username profilePic')
  .select('name joinRequests');


  res.json(communities);
});

// Get all posts of a user
meRouter.get('/posts', async (req, res) => {
  const userID = req.user.id;

  const posts = await Post.find({
    author: userID
  }).populate('author', 'username name profilePhoto')
    .populate('community', 'name profilePhoto')
    .populate('comments')
    .populate('likes', 'username name');

  res.json(posts)
})

// Edit a user
meRouter.post('/', async (req, res) => {
  try {
    const userID = req.user.id;
    const { email, password } = req.body;

    const user = await User.findById(userID);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (email && email !== '') {
      const otherUser = await User.findOne({ email });
      if (otherUser && otherUser.id !== userID) {
        return res.status(400).json({
          error: 'A user already exists with this email',
        });
      }
    }

    let passwordHash = null;
    if (password && password !== '') {
      if (password.length < 3) {
        return res.status(400).json({
          error: `${password} is less than the minimum length of 3 characters`,
        });
      }
      const saltRounds = 10;
      passwordHash = await bcrypt.hash(password, saltRounds);
    }

    if (email && email !== '') user.email = email;
    if (passwordHash) user.passwordHash = passwordHash;

    const savedUser = await user.save();
    const populatedUser = await savedUser.populate('joinedCommunities', 'name _id');

    const { passwordHash: _, ...userWithoutPassword } = populatedUser.toObject();
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


const upload = multer({ storage });
// Change user's profile photo
meRouter.post('/photo', upload.single('image'), async (req, res) => {
  try {
    
    if (!req.file || !req.file.filename) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const optimizedUrl = getOptimizedUrl(req.file.filename);

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.profilePhoto = optimizedUrl;

    const updated = await user.save();
    console.log('updated', updated)
    res.json(updated);
  } catch (err) {
    console.error('Error uploading photo:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = meRouter
