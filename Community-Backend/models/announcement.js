const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  header: {
    type: String,
    required: true,
    trim: true
  },
  subcontent: {
    type: String,
    required: false,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
