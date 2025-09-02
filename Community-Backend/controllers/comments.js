const express = require('express')
const Comment = require('../models/comment')
const Post = require('../models/post')

const commentRouter = express.Router()


// Like a comment
commentRouter.put('/api/comments/:id/like', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
    if (!comment) return res.status(404).json({ error: 'Comment not found' })

    comment.likes += 1
    const updated = await comment.save()
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Edit a comment
commentRouter.put('/api/comments/:id', async (req, res) => {
  const { content } = req.body
  try {
    const updated = await Comment.findByIdAndUpdate(
      req.params.id,
      { content },
      { new: true }
    )
    if (!updated) return res.status(404).json({ error: 'Comment not found' })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete a comment
commentRouter.delete('/api/comments/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
    if (!comment) return res.status(404).json({ error: 'Comment not found' })

    await Comment.findByIdAndDelete(req.params.id)

    // Remove from post's comment list
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: comment._id }
    })

    res.status(204).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = commentRouter
