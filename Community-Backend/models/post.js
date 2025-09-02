const mongoose = require('mongoose');

// Schema for posts
const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  likes: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      ],
  space: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Space',
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: []
  }],
}, { timestamps: true });

postSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString(); 
    delete ret._id;              
    delete ret.__v;              
  }
});

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

module.exports = Post;
