const mongoose = require('mongoose');
const Profile = require('../models/Profile');
const User = require('../models/User');
const { getVisibleFields } = require('../utils/onionLogic'); // Add this import

// More robust ObjectId validation
const isValidObjectId = (id) => {
  if (!id) return false;
  if (typeof id !== 'string') return false;
  // Check if it's a 24-character hex string
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// @desc    Create a new profile
// @route   POST /profile/create
// @access  Private
const createProfile = async (req, res) => {
  try {
    const { username, name, bio, interests, isAnonymous } = req.body;
    const userId = req.user._id;

    console.log('Profile creation request:', { username, name, userId });

    // Validation
    if (!username || !name) {
      return res.status(400).json({ message: 'Username and name are required' });
    }

    // Check if username is taken
    const existingProfile = await Profile.findOne({ username });
    if (existingProfile) {
      console.log('Username already taken:', username);
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Create new profile
    const profile = new Profile({
      userId,
      username,
      name,
      bio: bio || '',
      interests: interests || [],
      isAnonymous: isAnonymous || false
      // Remove visibility from here - let the pre-save hook handle it
    });

    console.log('Saving profile...');
    const savedProfile = await profile.save();
    console.log('Profile saved:', savedProfile._id);

    // Add profile to user's profiles array
    console.log('Updating user profiles array...');
    await User.findByIdAndUpdate(userId, {
      $push: { profiles: savedProfile._id }
    });

    res.status(201).json({
      _id: savedProfile._id,
      username: savedProfile.username,
      name: savedProfile.name,
      bio: savedProfile.bio,
      interests: savedProfile.interests,
      isAnonymous: savedProfile.isAnonymous
    });

  } catch (error) {
    console.error('Profile creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all profiles for current user
// @route   GET /profile/me
// @access  Private
const getMyProfiles = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user with populated profiles
    const user = await User.findById(userId).populate('profiles');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      profiles: user.profiles,
      primaryProfile: user.primaryProfile
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get specific profile by ID (with onion visibility)
// @route   GET /profile/:id
// @access  Private
const getProfileById = async (req, res) => {
  try {
    const profileId = req.params.id;
    const viewerProfileId = req.user.profileId; // Get viewer's active profile
    
    // Validate ObjectId format with our custom function
    if (!isValidObjectId(profileId)) {
      return res.status(400).json({ message: 'Invalid profile ID format' });
    }

    const profile = await Profile.findById(profileId);

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Apply onion visibility logic
    const visibleProfile = getVisibleFields(profile, viewerProfileId);
    
    // Add relationship level for frontend use
    const relationshipLevel = viewerProfileId ? 
      (viewerProfileId.toString() === profile._id.toString() ? 'owner' : 'viewer') : 
      'anonymous';

    res.json({
      profile: visibleProfile,
      relationshipLevel: relationshipLevel
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update profile
// @route   PUT /profile/:id
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const profileId = req.params.id;
    const userId = req.user._id;
    const updates = req.body;

    // Validate ObjectId format with our custom function
    if (!isValidObjectId(profileId)) {
      return res.status(400).json({ message: 'Invalid profile ID format' });
    }

    // Check if profile belongs to user
    const profile = await Profile.findOne({ _id: profileId, userId });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found or not authorized' });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'bio', 'interests', 'isAnonymous', 'avatar'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        profile[field] = updates[field];
      }
    });

    // Update visibility if provided
    if (updates.visibility) {
      profile.visibility = {
        ...profile.visibility,
        ...updates.visibility
      };
    }

    const updatedProfile = await profile.save();

    res.json({
      _id: updatedProfile._id,
      username: updatedProfile.username,
      name: updatedProfile.name,
      bio: updatedProfile.bio,
      interests: updatedProfile.interests,
      isAnonymous: updatedProfile.isAnonymous,
      visibility: updatedProfile.visibility
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createProfile,
  getMyProfiles,
  getProfileById,
  updateProfile
};