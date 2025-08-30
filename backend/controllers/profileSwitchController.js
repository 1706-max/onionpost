const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Profile = require('../models/Profile');

// Generate JWT Token with profile info
const generateToken = (userId, profileId) => {
  return jwt.sign(
    { userId, profileId }, 
    process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  );
};

// More robust ObjectId validation
const isValidObjectId = (id) => {
  if (!id) return false;
  if (typeof id !== 'string') return false;
  // Check if it's a 24-character hex string
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// @desc    Switch to a different profile
// @route   POST /profile/switch/:profileId
// @access  Private
const switchProfile = async (req, res) => {
  try {
    console.log('Switch profile request received');
    console.log('User from token:', req.user);
    console.log('Profile ID param:', req.params.profileId);
    
    const userId = req.user._id;
    const targetProfileId = req.params.profileId;

    // Validate profile ID format with our custom function
    if (!isValidObjectId(targetProfileId)) {
      return res.status(400).json({ message: 'Invalid profile ID format' });
    }

    // Check if profile belongs to user
    const profile = await Profile.findOne({
      _id: targetProfileId,
      userId: userId
    });

    if (!profile) {
      return res.status(404).json({ 
        message: 'Profile not found or not authorized' 
      });
    }

    // Generate new token with switched profile
    const token = generateToken(userId, profile._id);

    res.json({
      message: 'Profile switched successfully',
      token,
      profile: {
        _id: profile._id,
        username: profile.username,
        name: profile.name,
        isAnonymous: profile.isAnonymous
      }
    });

  } catch (error) {
    console.error('Profile switch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get current active profile
// @route   GET /profile/current
// @access  Private
const getCurrentProfile = async (req, res) => {
  try {
    console.log('Get current profile request received');
    console.log('User from token:', req.user);
    
    // Get profile ID from the authenticated user object (from JWT)
    const profileId = req.user.profileId;

    console.log('Getting current profile for ID:', profileId);

    if (!profileId) {
      return res.status(400).json({ message: 'No active profile selected' });
    }

    // Validate profile ID format with our custom function
    if (!mongoose.Types.ObjectId.isValid(profileId)) {
      return res.status(400).json({ message: 'Invalid profile ID format' });
    }


    const profile = await Profile.findById(profileId);

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({
      profile: {
        _id: profile._id,
        username: profile.username,
        name: profile.name,
        isAnonymous: profile.isAnonymous
      }
    });

  } catch (error) {
    console.error('Get current profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  switchProfile,
  getCurrentProfile
};