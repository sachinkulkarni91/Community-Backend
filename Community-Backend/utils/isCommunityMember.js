// Middleware to check if the user is a member of the community
const Community = require('../models/community');
const Post = require('../models/post');

module.exports = async function isCommunityMember(req, res, next) {
  let communityId = req.body.community || req.params.communityId || req.params.id;

  // If the route is for a post (like, comment), get community from the post
  if (!communityId && (req.params.postId || req.params.id)) {
    const postId = req.params.postId || req.params.id;
    const post = await Post.findById(postId);
    if (post) {
      communityId = post.community;
    }
  }

  if (!communityId) {
    return res.status(400).json({ error: 'Community ID is required' });
  }

  const community = await Community.findById(communityId);
  if (!community) {
    return res.status(404).json({ error: 'Community not found' });
  }

  // Allow anyone to comment/like if this is the general feed (My Feed)
  if (community.name === 'My Feed') {
    return next();
  }

  const userId = req.user?._id || req.user?.id;
  if (!userId || !community.members.map(id => id.toString()).includes(userId.toString())) {
    return res.status(403).json({ error: 'You must be a member of this community' });
  }

  next();
};
