const mongoose = require('mongoose');
const Profile = require('../models/Profile');

// More robust ObjectId validation
const isValidObjectId = (id) => {
  if (!id) return false;
  if (typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// @desc    Follow a profile
// @route   POST /friends/follow/:profileId
// @access  Private
const followProfile = async (req, res) => {
  try {
    const viewerProfileId = req.user.profileId;
    const targetProfileId = req.params.profileId;

    // Validate profile IDs
    if (!isValidObjectId(viewerProfileId) || !isValidObjectId(targetProfileId)) {
      return res.status(400).json({ message: 'Invalid profile ID format' });
    }

    // Can't follow yourself
    if (viewerProfileId === targetProfileId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    // Get viewer's profile
    const viewerProfile = await Profile.findById(viewerProfileId);
    if (!viewerProfile) {
      return res.status(404).json({ message: 'Viewer profile not found' });
    }

    // Get target profile
    const targetProfile = await Profile.findById(targetProfileId);
    if (!targetProfile) {
      return res.status(404).json({ message: 'Target profile not found' });
    }

    // Check if already following
    const existingFriend = viewerProfile.friends.find(
      friend => friend.profileId.toString() === targetProfileId
    );

    if (existingFriend) {
      // Update existing relationship to follower
      existingFriend.level = 'follower';
    } else {
      // Add new follower relationship
      viewerProfile.friends.push({
        profileId: targetProfileId,
        level: 'follower'
      });
    }

    await viewerProfile.save();

    res.json({ 
      message: 'Profile followed successfully',
      relationship: 'follower'
    });

  } catch (error) {
    console.error('Follow profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Unfollow a profile
// @route   POST /friends/unfollow/:profileId
// @access  Private
const unfollowProfile = async (req, res) => {
  try {
    const viewerProfileId = req.user.profileId;
    const targetProfileId = req.params.profileId;

    // Validate profile IDs
    if (!isValidObjectId(viewerProfileId) || !isValidObjectId(targetProfileId)) {
      return res.status(400).json({ message: 'Invalid profile ID format' });
    }

    // Get viewer's profile
    const viewerProfile = await Profile.findById(viewerProfileId);
    if (!viewerProfile) {
      return res.status(404).json({ message: 'Viewer profile not found' });
    }

    // Remove from friends array
    viewerProfile.friends = viewerProfile.friends.filter(
      friend => friend.profileId.toString() !== targetProfileId
    );

    await viewerProfile.save();

    res.json({ message: 'Profile unfollowed successfully' });

  } catch (error) {
    console.error('Unfollow profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add profile as close friend
// @route   POST /friends/close/:profileId
// @access  Private
const addCloseFriend = async (req, res) => {
  try {
    const viewerProfileId = req.user.profileId;
    const targetProfileId = req.params.profileId;

    // Validate profile IDs
    if (!isValidObjectId(viewerProfileId) || !isValidObjectId(targetProfileId)) {
      return res.status(400).json({ message: 'Invalid profile ID format' });
    }

    // Can't add yourself as close friend
    if (viewerProfileId === targetProfileId) {
      return res.status(400).json({ message: 'You cannot add yourself as close friend' });
    }

    // Get viewer's profile
    const viewerProfile = await Profile.findById(viewerProfileId);
    if (!viewerProfile) {
      return res.status(404).json({ message: 'Viewer profile not found' });
    }

    // Get target profile
    const targetProfile = await Profile.findById(targetProfileId);
    if (!targetProfile) {
      return res.status(404).json({ message: 'Target profile not found' });
    }

    // Check if already in friends list
    const existingFriend = viewerProfile.friends.find(
      friend => friend.profileId.toString() === targetProfileId
    );

    if (existingFriend) {
      // Update existing relationship to close friend
      existingFriend.level = 'close';
    } else {
      // Add new close friend relationship
      viewerProfile.friends.push({
        profileId: targetProfileId,
        level: 'close'
      });
    }

    await viewerProfile.save();

    res.json({ 
      message: 'Profile added as close friend',
      relationship: 'close'
    });

  } catch (error) {
    console.error('Add close friend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove profile as close friend
// @route   POST /friends/unclose/:profileId
// @access  Private
const removeCloseFriend = async (req, res) => {
  try {
    const viewerProfileId = req.user.profileId;
    const targetProfileId = req.params.profileId;

    // Validate profile IDs
    if (!isValidObjectId(viewerProfileId) || !isValidObjectId(targetProfileId)) {
      return res.status(400).json({ message: 'Invalid profile ID format' });
    }

    // Get viewer's profile
    const viewerProfile = await Profile.findById(viewerProfileId);
    if (!viewerProfile) {
      return res.status(404).json({ message: 'Viewer profile not found' });
    }

    // Find the friend relationship
    const friendIndex = viewerProfile.friends.findIndex(
      friend => friend.profileId.toString() === targetProfileId
    );

    if (friendIndex === -1) {
      return res.status(400).json({ message: 'Profile not in friends list' });
    }

    // If they were close friends, downgrade to follower
    if (viewerProfile.friends[friendIndex].level === 'close') {
      viewerProfile.friends[friendIndex].level = 'follower';
    } else {
      // If they were just followers, remove entirely
      viewerProfile.friends.splice(friendIndex, 1);
    }

    await viewerProfile.save();

    const newLevel = viewerProfile.friends[friendIndex] ? 
      viewerProfile.friends[friendIndex].level : 'none';

    res.json({ 
      message: 'Close friend relationship removed',
      relationship: newLevel === 'follower' ? 'follower' : 'none'
    });

  } catch (error) {
    console.error('Remove close friend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  followProfile,
  unfollowProfile,
  addCloseFriend,
  removeCloseFriend
};