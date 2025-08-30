const express = require('express');
const { switchProfile, getCurrentProfile } = require('../controllers/profileSwitchController');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   POST /profile/switch/:profileId
// @desc    Switch to a different profile
// @access  Private
router.post('/switch/:profileId', switchProfile);

// @route   GET /profile/current
// @desc    Get current active profile
// @access  Private
router.get('/current', getCurrentProfile);

module.exports = router;