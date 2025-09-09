const express = require('express');
const Announcement = require('../models/announcement');
const isAdmin = require('../utils/isAdmin');

const announcementRouter = express.Router();

// Get all announcements (public)
// Get all announcements (public)
announcementRouter.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    // Return only { header, subcontent } for each announcement
    res.json(announcements.map(a => ({ header: a.header, subcontent: a.subcontent })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new announcement (admin only)
announcementRouter.post('/', isAdmin, async (req, res) => {
  try {
    const { header, subcontent } = req.body;
    if (!header) return res.status(400).json({ error: 'Header is required' });
    const announcement = new Announcement({
      header,
      subcontent,
      createdBy: req.user?._id
    });
    const saved = await announcement.save();
    res.status(201).json({ header: saved.header, subcontent: saved.subcontent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an announcement (admin only)
announcementRouter.delete('/:id', isAdmin, async (req, res) => {
  try {
    const deleted = await Announcement.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Announcement not found' });
    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = announcementRouter;
