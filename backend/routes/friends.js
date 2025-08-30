const express = require('express');
const { followProfile, unfollowProfile, addCloseFriend, removeCloseFriend } = require('../controllers/friendController');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   POST /friends/follow/:profileId
// @desc    Follow a profile
// @access  Private
router.post('/follow/:profileId', followProfile);

// @route   POST /friends/unfollow/:profileId
// @desc    Unfollow a profile
// @access  Private
router.post('/unfollow/:profileId', unfollowProfile);

// @route   POST /friends/close/:profileId
// @desc    Add profile as close friend
// @access  Private
router.post('/close/:profileId', addCloseFriend);

// @route   POST /friends/unclose/:profileId
// @desc    Remove profile as close friend
// @access  Private
router.post('/unclose/:profileId', removeCloseFriend);

module.exports = router;