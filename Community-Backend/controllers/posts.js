const postRouter = require("express").Router();
const Post = require("../models/post");
const Comment = require('../models/comment');
const Space = require("../models/space");

// GET all posts
postRouter.get('/', async (req, res) => {
  const posts = await Post.find({})
    .populate('author', 'username name profilePhoto')
    .populate('community', 'name profilePhoto')
    .populate('comments')
    .populate('likes', 'username name');
    
  res.json(posts);
});

// GET a single post
postRouter.get('/:id', async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate('author', 'username name profilePhoto')
    .populate('community', 'name profilePhoto')
    .populate('comments')
    .populate('likes', 'username name');

  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// POST a new post (any authenticated user)
postRouter.post('/', async (req, res) => {
  const { title, content, author, community, space } = req.body;

  if (!title || !content || !author || !community) {
    return res.status(400).json({ error: 'Missing required fields' });
  }


  const newPost = space ? new Post({ title, content, author, community, space}) : new Post({ title, content, author, community });
  const savedPost = await newPost.save();

  if (space) {
    await Space.findByIdAndUpdate(space, {
      $addToSet: { posts: savedPost._id }
    });
  }

  const populatedPost = await Post.findById(savedPost._id)
  .populate('author', 'username name profilePhoto')
  .populate('community', 'name profilePhoto')
  .populate('likes', 'username name');

  res.status(201).json(populatedPost);
});


// PUT like a post (any authenticated user)
postRouter.put('/:id/like', async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const userID = req.user._id
  post.likes.push(userID);

  const updated = await post.save();
  res.json(updated);
});

// PUT unlike a post
postRouter.put('/:id/unlike', async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const userID = req.user._id
  post.likes = post.likes.filter((l) => l.toString() !== userID.toString());

  const updated = await post.save();
  res.json(updated);
});

// DELETE a post
postRouter.delete('/:id', async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  if (post.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Not authorized to delete this post' });
  }

  if (post.space) {
    await Space.findByIdAndUpdate(post.space, {
      $pull: { posts: post._id }
    });
  }

  await Post.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

// Get all comments on a post
postRouter.get('/:postId/comments', async (req, res) => {
  const { postId } = req.params;

  try {
    const comments = await Comment.find({ post: postId })
      .populate('author', 'username name profilePhoto')
      .populate('likes', 'username name')
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a comment to a post (any authenticated user)
postRouter.post('/:postId/comments', async (req, res) => {
  const { content, parentComment } = req.body;
  const { postId } = req.params;
  const author = req.user?._id;

  if (!content || !author) {
    return res.status(400).json({ error: 'Missing content or author' });
  }

  try {
    // 1. Create and save the comment
    const comment = new Comment({
      content,
      author,
      post: postId,
      parentComment: parentComment || null
    });
    const savedComment = await comment.save();

    // 2. Add to post's comments array
    await Post.findByIdAndUpdate(postId, {
      $addToSet: { comments: savedComment._id }
    });

    // 3. Add to parent comment's replies array (if it's a reply)
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, {
        $addToSet: { replies: savedComment._id }
      });
    }

    const populatedComment = await Comment.findById(savedComment._id)
      .populate('author', 'username name profilePhoto');

    res.status(201).json(populatedComment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all the posts of a community

postRouter.get('/community/:communityId', async (req, res) => {
  const { communityId } = req.params;

  try {
    const posts = await Post.find({ community: communityId })
      .populate('author', 'username name profilePhoto')
      .populate('community', 'name profilePhoto')
      .populate('comments')
      .populate('likes', 'username name');

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

});

module.exports = postRouter;
