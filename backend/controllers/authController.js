const jwt = require('jsonwebtoken');
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

// @desc    Register user
// @route   POST /auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { email, password, username, name } = req.body;

    // Validation
    if (!email || !password || !username || !name) {
      return res.status(400).json({ message: 'Please include all fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if username is taken
    const usernameExists = await Profile.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Create user
    const user = new User({
      email,
      password
    });

    // Create default profile
    const profile = new Profile({
      userId: user._id,
      username,
      name,
      isAnonymous: false
    });

    // Link profile to user
    user.profiles = [profile._id];
    user.primaryProfile = profile._id;

    // Save both
    await profile.save();
    await user.save();

    // Generate token with primary profile
    const token = generateToken(user._id, profile._id);

    res.status(201).json({
      _id: user._id,
      email: user.email,
      primaryProfile: {
        _id: profile._id,
        username: profile.username,
        name: profile.name
      },
      token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login user
// @route   POST /auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please include email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email }).populate('primaryProfile');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token with primary profile
    const token = generateToken(user._id, user.primaryProfile._id);

    res.json({
      _id: user._id,
      email: user.email,
      primaryProfile: user.primaryProfile,
      token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser
};