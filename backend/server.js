const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('./models/User');
const Profile = require('./models/Profile');

// Import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const profileSwitchRoutes = require('./routes/profileSwitch');
const friendsRoutes = require('./routes/friends'); // Add this

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/profile', profileSwitchRoutes);
app.use('/friends', friendsRoutes); // Add this

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'OnionPost API is running!' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;