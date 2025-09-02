const express = require('express');
const messageRouter = express.Router();
const Message = require('../models/message');
const Space = require('../models/space');

// Send a message to a chat space
messageRouter.post('/api/spaces/:id/messages', async (req, res) => {
  const spaceId = req.params.id;
  const { content } = req.body;

  try {
    const space = await Space.findById(spaceId);
    if (!space) return res.status(404).json({ error: 'Space not found' });
    if (space.type !== 'chat') return res.status(400).json({ error: 'Not a chat space' });

    const message = new Message({
      sender: req.user.id,
      space: spaceId,
      content
    });

    const saved = await message.save();
    const populated = await saved.populate('sender', 'name username'); 
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all messages in a chat space (latest first)
messageRouter.get('/api/spaces/:id/messages', async (req, res) => {
  const spaceId = req.params.id;

  try {
    const space = await Space.findById(spaceId);
    if (!space) return res.status(404).json({ error: 'Space not found' });
    if (space.type !== 'chat') return res.status(400).json({ error: 'Not a chat space' });

    const messages = await Message.find({ space: spaceId })
      .sort({ sentAt: -1 })
      .limit(100)
      .populate('sender', 'name username');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = messageRouter;
