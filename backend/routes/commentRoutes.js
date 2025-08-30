// backend/routes/commentRoutes.js
const express = require('express');
const router = express.Router();
const { addComment, getCommentsByPost } = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');

// Private route
router.route('/')
  .post(authMiddleware, addComment);

// Public route
router.route('/post/:id')
  .get(getCommentsByPost);

module.exports = router;