// backend/controllers/commentController.js
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Profile = require('../models/Profile');

// @desc    Add a comment to a post
// @route   POST /api/comments
// @access  Private
const addComment = async (req, res) => {
  const { text, postId, parentCommentId } = req.body;
  const userId = req.user.id;

  try {
    // Get the user's primary profile
    const userProfiles = await Profile.find({ userId });
    const primaryProfile = userProfiles.find(p => p._id.toString() === req.user.primaryProfile.toString());

    if (!primaryProfile) {
      return res.status(400).json({ message: 'Primary profile not found' });
    }

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // If parentCommentId is provided, verify it exists and belongs to the same post
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment || parentComment.post.toString() !== postId) {
        return res.status(400).json({ message: 'Invalid parent comment' });
      }
    }

    // Create comment
    const comment = new Comment({
      text,
      author: primaryProfile._id,
      post: postId,
      parentComment: parentCommentId || null
    });

    const savedComment = await comment.save();

    // Populate author for response
    await savedComment.populate('author', 'username');

    res.status(201).json(savedComment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get comments for a post
// @route   GET /api/posts/:id/comments
// @access  Public
const getCommentsByPost = async (req, res) => {
  const postId = req.params.id;

  try {
    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Get all top-level comments for the post
    const topLevelComments = await Comment.find({
      post: postId,
      parentComment: null
    }).populate('author', 'username').sort({ createdAt: -1 });

    // For each top-level comment, recursively get its replies
    const buildCommentTree = async (commentId) => {
      const replies = await Comment.find({ parentComment: commentId })
        .populate('author', 'username')
        .sort({ createdAt: -1 });

      for (let reply of replies) {
        reply.replies = await buildCommentTree(reply._id);
      }

      return replies;
    };

    for (let comment of topLevelComments) {
      comment.replies = await buildCommentTree(comment._id);
    }

    res.json(topLevelComments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  addComment,
  getCommentsByPost
};