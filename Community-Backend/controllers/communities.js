const communityRouter = require('express').Router()
const isAdmin = require('../utils/isAdmin');
const Community = require('../models/community')
const Message = require('../models/message')
const Space = require('../models/space')
const User = require('../models/user');
const { readInviteOptional } = require('../utils/middleware');
const multer = require('multer');
const { storage, getOptimizedUrl } = require('../utils/cloudinary');
const Post = require('../models/post');


// Get all communities (publicly viewable by all users)
communityRouter.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const isUserAdmin = req.user.role === 'admin' || req.isAdminPortalRequest;
    
    // All users can now see all communities to discover and join them
    const communities = await Community.find({})
      .populate('owner', 'username name profilePhoto')
      .populate('admins', 'username name profilePhoto')
      .populate('members', 'username name profilePhoto')
      .sort({ createdAt: -1 }); // Show newest communities first
    
    // Add membership status for each community for the current user
    const user = await User.findById(userId).select('joinedCommunities');
    const userJoinedCommunities = user?.joinedCommunities || [];
    
    const communitiesWithMembershipStatus = communities.map(community => {
      const communityObj = community.toJSON();
      communityObj.isMember = userJoinedCommunities.includes(community._id);
      communityObj.memberCount = community.members ? community.members.length : 0;
      return communityObj;
    });
    
    res.json(communitiesWithMembershipStatus);
  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
})

// Get single community (publicly viewable by all users)
communityRouter.get('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const communityId = req.params.id;
    const isUserAdmin = req.user.role === 'admin' || req.isAdminPortalRequest;
    
    const community = await Community.findById(communityId)
      .populate('owner', 'username name profilePhoto')
      .populate('admins', 'username name profilePhoto')
      .populate('members', 'username name profilePhoto')
      .populate('spaces', 'name')

    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }
    
    // Check if user is a member
    const user = await User.findById(userId).select('joinedCommunities');
    const isMember = user?.joinedCommunities?.includes(communityId) || false;
    
    // Add membership status to response
    const communityObj = community.toJSON();
    communityObj.isMember = isMember;
    communityObj.memberCount = community.members ? community.members.length : 0;
    
    // For non-members and non-admins, limit some sensitive information
    if (!isMember && !isUserAdmin) {
      // Hide detailed member information for privacy
      communityObj.members = [];
      communityObj.spaces = []; // Hide spaces until they join
      communityObj.joinRequests = []; // Hide join requests
    }
    
    res.json(communityObj);
  } catch (error) {
    console.error('Error fetching community:', error);
    res.status(500).json({ error: 'Failed to fetch community' });
  }
})

const upload = multer({ storage });

// Create new community (admin only) with a custom image
communityRouter.post('/custom', isAdmin, upload.single('image'), async (req, res) => {
  const { name, description } = req.body;
  const owner = req.user.id;

  // Handle optional file upload
  const optimizedUrl = req.file ? getOptimizedUrl(req.file.filename) : null;

  if (!name || !owner) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const community = new Community({
      name,
      description,
      owner,
      admins: [owner],
      members: [owner],
      profilePhoto: optimizedUrl || null  // Use null if no image uploaded
    });

    const savedCommunity = await community.save();

    const initalSpace = new Space ({
      name: `${name} - Main Feed`,
      type: 'feed',
      community: savedCommunity._id,
      description: "Main Feed",
      members: [owner]
    })

    const savedSpace = await initalSpace.save();
    savedCommunity.spaces.push(savedSpace._id);
    await savedCommunity.save();

    await User.findByIdAndUpdate(owner, {
      $addToSet: { joinedCommunities: savedCommunity._id }
    });

    res.status(201).json(savedCommunity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create community' });
  }
});

// Create new community (admin only) with a generic image
communityRouter.post('/', isAdmin, async (req, res) => {
  const { name, description, generic } = req.body;
  const owner = req.user.id;

  if (!generic) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!name || !owner) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const community = new Community({
      name,
      description,
      owner,
      admins: [owner],
      members: [owner],
      profilePhoto: `/assets/${generic}.png`
    });

    const savedCommunity = await community.save();

    const initalSpace = new Space ({
      name: `${name} - Main Feed`,
      type: 'feed',
      community: savedCommunity._id,
      description: "Main Feed",
      members: [owner]
    })

    const savedSpace = await initalSpace.save();
    savedCommunity.spaces.push(savedSpace._id);
    await savedCommunity.save();

    await User.findByIdAndUpdate(owner, {
      $addToSet: { joinedCommunities: savedCommunity._id }
    });

    res.status(201).json(savedCommunity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create community' });
  }
});

// PUT /api/communities/:id/join
communityRouter.put('/:id/join', readInviteOptional, async (req, res) => {
  const userId = req.user._id;
  let communityId = req.params.id;
  communityId = communityId.trim();
  console.log('communityId:', communityId);

  const community = await Community.findById(communityId);
  console.log('community', community)
  if (!community) return res.status(404).json({ error: 'Community not found' });

  // Check if user already has this community in their joinedCommunities (pre-assigned via invite)
  const user = await User.findById(userId).select('joinedCommunities');
  const isAlreadyInUserCommunities = user.joinedCommunities && user.joinedCommunities.includes(communityId);
  console.log('🔍 User already in joinedCommunities:', isAlreadyInUserCommunities);

  // If user doesn't have the community pre-assigned, they need an invite
  if (!isAlreadyInUserCommunities && (!req.invite || req.invite.community.toString() !== communityId)) {
    return res.status(403).json({ error: 'Invite required' });
  }

  // idempotent join (ideally in a transaction)
  const session = await Community.startSession();
  try {
    await session.withTransaction(async () => {
      await Community.updateOne(
        { _id: communityId },
        { $addToSet: { members: userId } },
        { session }
      );
      await User.updateOne(
        { _id: userId },
        { $addToSet: { joinedCommunities: communityId } },
        { session }
      );

      // consume invite if present & limited
      if (req.invite && req.invite.maxUses != null) {
        req.invite.uses += 1;
        await req.invite.save({ session });
      }
    });
  } finally {
    session.endSession();
  }

  // clear one-time cookie whether newly joined or already a member
  res.clearCookie('invite_token', { path: '/' });

  // return lean community (avoid __v, _id)
  const updated = await Community.findById(communityId).lean();
  return res.json({
    ...updated,
    id: updated._id.toString(),
    _id: undefined,
    __v: undefined
  });
});

// POST /api/communities/:id/join (same as PUT for frontend compatibility)
communityRouter.post('/:id/join', readInviteOptional, async (req, res) => {
  const userId = req.user._id;
  let communityId = req.params.id;
  communityId = communityId.trim();
  console.log('communityId:', communityId);

  const community = await Community.findById(communityId);
  console.log('community', community)
  if (!community) return res.status(404).json({ error: 'Community not found' });

  // Check if user already has this community in their joinedCommunities (pre-assigned via invite)
  const user = await User.findById(userId).select('joinedCommunities');
  const isAlreadyInUserCommunities = user.joinedCommunities && user.joinedCommunities.includes(communityId);
  console.log('🔍 User already in joinedCommunities:', isAlreadyInUserCommunities);

  // If user doesn't have the community pre-assigned, they need an invite
  if (!isAlreadyInUserCommunities && (!req.invite || req.invite.community.toString() !== communityId)) {
    return res.status(403).json({ error: 'Invite required' });
  }

  // idempotent join (ideally in a transaction)
  const session = await Community.startSession();
  try {
    await session.withTransaction(async () => {
      await Community.updateOne(
        { _id: communityId },
        { $addToSet: { members: userId } },
        { session }
      );
      await User.updateOne(
        { _id: userId },
        { $addToSet: { joinedCommunities: communityId } },
        { session }
      );

      // consume invite if present & limited
      if (req.invite && req.invite.maxUses != null) {
        req.invite.uses += 1;
        await req.invite.save({ session });
      }
    });
  } finally {
    session.endSession();
  }

  // clear one-time cookie whether newly joined or already a member
  res.clearCookie('invite_token', { path: '/' });

  // return lean community (avoid __v, _id)
  const updated = await Community.findById(communityId).lean();
  return res.json({
    ...updated,
    id: updated._id.toString(),
    _id: undefined,
    __v: undefined
  });
});

// Change the profile photo of a community
communityRouter.put('/:id/image', isAdmin, upload.single('image'), async (req, res) => {
  const communityId = req.params.id;

  try {

    if (!req.file || !req.file.filename) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const optimizedUrl = getOptimizedUrl(req.file.filename);

    const community = await Community.findById(communityId);
    if (!community) return res.status(404).json({ error: 'Community not found' });

    community.profilePhoto = optimizedUrl;
    const updatedCommunity = await community.save();
    res.json(updatedCommunity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit the name or description of a community
communityRouter.put('/:id', isAdmin, async (req, res) => {
  const { name, description } = req.body;
  const communityId = req.params.id;

  try {
    const community = await Community.findById(communityId);
    if (!community) return res.status(404).json({ error: 'Community not found' });

    community.name = name || community.name;
    community.description = description || community.description;

    const updatedCommunity = await community.save();
    res.json(updatedCommunity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a community
communityRouter.delete('/:id', isAdmin, async (req, res) => {
  const communityId = req.params.id;
  const community = await Community.findById(communityId);
  if (!community) return res.status(404).json({ error: 'Community not found' });

  const posts = await Post.find({ community: communityId });
  const spaces = await Space.find({ community: communityId });
  const users = await User.find({ joinedCommunities: communityId });
  for (user of users) {
    user.joinedCommunities = user.joinedCommunities.filter(
      id => id.toString() !== communityId
    );
    await user.save();
  }

  await Promise.all([
    Post.deleteMany({ community: communityId }),
    Space.deleteMany({ community: communityId }),
    Community.findByIdAndDelete(communityId)
  ]);

  res.status(204).end();
});

// Leave a community
communityRouter.put('/:id/leave', async (req, res) => {
  const { userId } = req.body
  const community = await Community.findById(req.params.id)

  if (!community) return res.status(404).json({ error: 'Community not found' })

  community.members = community.members.filter(
    id => id.toString() !== userId
  )

  await community.save()
  res.json(community)
})

// Create a new space in a community
communityRouter.post('/:id/spaces', async (req, res) => {
  const communityId = req.params.id;
  const { name, type, description } = req.body;

  try {
    const community = await Community.findById(communityId);
    if (!community) return res.status(404).json({ error: 'Community not found' });

    const space = new Space({
      name,
      type,
      description,
      community: communityId,
      members: [req.user.id]
    });

    const savedSpace = await space.save();

    await Community.findByIdAndUpdate(communityId, {
      $addToSet: { spaces: savedSpace._id }
    });

    const populatedSpace = await Space.findById(savedSpace._id)
      .populate('community', 'name')
      .populate('members', 'username name')
      .populate({
        path: 'posts',
        select: 'title content likes author',
        populate: [
          {
            path: 'author',
            select: 'username name profilePhoto'
          },
          {
            path: 'likes',
            select: 'username name'
          }
        ]
      });

    res.status(201).json(populatedSpace);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});



// Get all spaces in a community (any community for admins, only joined ones for regular users)
communityRouter.get('/:id/spaces', async (req, res) => {
  const communityId = req.params.id;
  const userId = req.user._id;
  const isUserAdmin = req.user.role === 'admin' || req.isAdminPortalRequest;

  try {
    if (!isUserAdmin) {
      // Check if regular user is a member of this community
      const user = await User.findById(userId).select('joinedCommunities');
      if (!user || !user.joinedCommunities.includes(communityId)) {
        return res.status(403).json({ error: 'Access denied. You are not a member of this community.' });
      }
    }

    const spaces = await Space.find({ community: communityId });
    res.json(spaces);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get one space in a community
communityRouter.get('/spaces/:spaceId', async (req, res) => {
  try {
    const space = await Space.findById(req.params.spaceId)
    .populate('community', 'name profilePhoto')
    .populate('members', 'username name')
    .populate({
      path: 'posts',
      select: 'title content likes author comments',
      populate: [
        { path: 'author', select: 'username name profilePhoto' },
        { path: 'likes', select: 'username name' }
      ]
    })
    .populate({
      path: 'messages',
      select: 'content sender',
      populate: {
        path: 'sender',
        select: 'username name profilePhoto'
      }
    });


    if (!space) return res.status(404).json({ error: 'Space not found' });

    res.json(space);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a message to a space
communityRouter.post('/spaces/:id/messages', async (req, res) => {
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

    await Space.findByIdAndUpdate(spaceId, {
      $addToSet: { messages: saved._id }
    });

    const populated = await saved.populate('sender', 'username name profilePhoto');

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Request to join a community
communityRouter.post('/:id/request-join', async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) return res.status(404).json({ error: 'Community not found' });

  const userId = req.user.id;

  if (
    community.members.includes(userId) ||
    community.joinRequests.includes(userId)
  ) {
    console.log('community.members', community.members)
    return res.status(400).json({ error: 'Already a member or requested' });
  }

  community.joinRequests.push(userId);
  await community.save();
  res.status(200).json({ message: 'Join request sent' });
});

// Approve a join request
communityRouter.post('/:id/approve-request', async (req, res) => {
  const { userId } = req.body;
  const community = await Community.findById(req.params.id);
  if (!community) return res.status(404).json({ error: 'Community not found' });
  if (!community.admins.includes(req.user.id)) return res.status(403).json({ error: 'Not authorized' });

  // Remove user from joinRequests
  community.joinRequests = community.joinRequests.filter(id => id.toString() !== userId);

  // Add user to members if not already added
  if (!community.members.includes(userId)) {
    community.members.push(userId);
  }

  await community.save();

  // Add community to user.communities
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const isAlreadyJoined = user.joinedCommunities.includes(community._id);
  if (!isAlreadyJoined) {
    user.joinedCommunities.push(community._id);
    await user.save();
  }

  // Return the list of all communities the user is a member of
  const userCommunities = await Community.find({ members: userId });
  res.status(200).json({ message: 'User approved and added to community', communities: userCommunities });
});



// Deny a join request
communityRouter.post('/:id/reject-request', async (req, res) => {
  const { userId } = req.body;
  const community = await Community.findById(req.params.id);
  if (!community.admins.includes(req.user.id)) return res.status(403).json({ error: 'Not authorized' });

  community.joinRequests = community.joinRequests.filter(id => id.toString() !== userId);
  await community.save();
  res.status(200).json({ message: 'User rejected' });
});



module.exports = communityRouter
