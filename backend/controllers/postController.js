// backend/controllers/postController.js
const Post = require('../models/Post');
const Community = require('../models/Community');
const Profile = require('../models/Profile');

// Helper function to calculate hotness score
// Simplified version of Reddit's hotness algorithm
function calculateHotScore(upvotes, downvotes, date) {
  const s = upvotes - downvotes; // Score
  const order = Math.log10(Math.max(Math.abs(s), 1));
  const sign = s > 0 ? 1 : s < 0 ? -1 : 0;
  const seconds = date.getTime() / 1000 - 1134028003; // Epoch time offset
  return Math.round(order + sign * seconds / 45000);
}

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  const { title, body, communityId, tags } = req.body; // tags expected as array or comma-separated string
  const userId = req.user.id;

  try {
    // Get the user's primary profile
    const userProfiles = await Profile.find({ userId });
    const primaryProfile = userProfiles.find(p => p._id.toString() === req.user.primaryProfile.toString());

    if (!primaryProfile) {
      return res.status(400).json({ message: 'Primary profile not found' });
    }

    // Verify community exists
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Process tags: if string, split by comma and trim
    let processedTags = [];
    if (Array.isArray(tags)) {
        processedTags = tags.map(tag => tag.trim()).filter(tag => tag.length > 0);
    } else if (typeof tags === 'string') {
        processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }

    // Create post
    const post = new Post({
      title,
      body,
      author: primaryProfile._id,
      community: communityId,
      tags: processedTags // Use processed tags
    });

    const savedPost = await post.save();

    // Populate author and community for response
    await savedPost.populate('author', 'username');
    await savedPost.populate('community', 'name');

    res.status(201).json(savedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get posts (optionally filtered by community)
// @route   GET /api/posts?community=xyz&sort=hot|new|top
// @access  Public
const getPosts = async (req, res) => {
  const { community, sort = 'new' } = req.query; // Default to 'new'

  try {
    let filter = {};
    if (community) {
      // Allow filtering by community name or ID
      const communityDoc = await Community.findOne({
        $or: [{ name: community }, { _id: community }]
      });
      if (!communityDoc) {
        return res.status(404).json({ message: 'Community not found' });
      }
      filter.community = communityDoc._id;
    }

    let sortOption = {};
    let posts;

    if (sort === 'hot') {
      // Fetch posts and calculate hot score for sorting
      posts = await Post.find(filter)
        .populate('author', 'username')
        .populate('community', 'name');

      // Add hotScore to each post temporarily for sorting
      posts = posts.map(post => {
        post.hotScore = calculateHotScore(post.upvotes, post.downvotes, post.createdAt);
        return post;
      });

      // Sort by hotScore descending
      posts.sort((a, b) => b.hotScore - a.hotScore);

    } else if (sort === 'top') {
      sortOption = { upvotes: -1 }; // Simple top by upvotes
      posts = await Post.find(filter)
        .populate('author', 'username')
        .populate('community', 'name')
        .sort(sortOption);

    } else { // 'new' or default
      sortOption = { createdAt: -1 };
      posts = await Post.find(filter)
        .populate('author', 'username')
        .populate('community', 'name')
        .sort(sortOption);
    }

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Vote on a post (upvote/downvote)
// @route   POST /api/posts/:id/vote
// @access  Private
const votePost = async (req, res) => {
  const { vote } = req.body; // 'up' or 'down'
  const postId = req.params.id;
  const userId = req.user.id;

  try {
    // Get the user's primary profile
    const userProfiles = await Profile.find({ userId });
    const primaryProfile = userProfiles.find(p => p._id.toString() === req.user.primaryProfile.toString());

    if (!primaryProfile) {
      return res.status(400).json({ message: 'Primary profile not found' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Simple vote logic (in a real app, you'd track who voted to prevent double voting)
    // For MVP, we'll just increment/decrement
    if (vote === 'up') {
      post.upvotes += 1;
    } else if (vote === 'down') {
      post.downvotes += 1;
    } else {
      return res.status(400).json({ message: 'Invalid vote type. Use "up" or "down".' });
    }

    const updatedPost = await post.save();
    await updatedPost.populate('author', 'username');
    await updatedPost.populate('community', 'name');

    res.json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createPost,
  getPosts,
  votePost
};