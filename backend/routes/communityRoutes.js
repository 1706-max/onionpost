// backend/routes/communityRoutes.js
const express = require('express');
const router = express.Router();
const { createCommunity, getCommunities } = require('../controllers/communityController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.route('/')
  .get(getCommunities)

// Private routes
router.route('/')
  .post(authMiddleware, createCommunity);

module.exports = router;