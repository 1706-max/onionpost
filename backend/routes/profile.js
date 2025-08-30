const express = require('express');
const { 
  createProfile,
  getMyProfiles,
  getProfileById,
  updateProfile
} = require('../controllers/profileController');
const auth = require('../middleware/auth');

const router = express.Router();

// All profile routes require authentication
router.use(auth);

// @route   POST /profile/create
// @desc    Create a new profile
// @access  Private
router.post('/create', createProfile);

// @route   GET /profile/me
// @desc    Get all profiles for current user
// @access  Private
router.get('/me', getMyProfiles);

// @route   GET /profile/:id
// @desc    Get specific profile by ID
// @access  Private
router.get('/:id', getProfileById);

// @route   PUT /profile/:id
// @desc    Update profile
// @access  Private
router.put('/:id', updateProfile);

module.exports = router;