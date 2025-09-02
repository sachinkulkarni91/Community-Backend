const mongoose = require('mongoose');

// Schema for communities
const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
],
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  profilePhoto: {
    type: String,
    default: '1'
  },
  spaces: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Space',
      default:[]
    }
  ]
  ,
  joinRequests: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }
  ]
}, { timestamps: true });

communitySchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString(); 
    delete ret._id;              
    delete ret.__v;              
  }
});


const Community = mongoose.model('Community', communitySchema);
module.exports = Community;