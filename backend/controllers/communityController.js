// backend/controllers/communityController.js
import Community, { findOne, find } from '../models/Community';
import { find as _find } from '../models/Profile';

// @desc    Create a new community
// @route   POST /api/communities
// @access  Private
const createCommunity = async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id; // From auth middleware

  try {
    // Get the user's primary profile
    const userProfiles = await _find({ userId });
    const primaryProfile = userProfiles.find(p => p._id.toString() === req.user.primaryProfile.toString());

    if (!primaryProfile) {
      return res.status(400).json({ message: 'Primary profile not found' });
    }

    // Check if community already exists
    const existingCommunity = await findOne({ name });
    if (existingCommunity) {
      return res.status(400).json({ message: 'Community with this name already exists' });
    }

    // Create community
    const community = new Community({
      name,
      description,
      creator: primaryProfile._id,
      members: [primaryProfile._id]
    });

    const savedCommunity = await community.save();

    res.status(201).json(savedCommunity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all communities
// @route   GET /api/communities
// @access  Public
const getCommunities = async (req, res) => {
  try {
    const communities = await find().populate('creator', 'username');
    res.json(communities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default {
  createCommunity,
  getCommunities
};