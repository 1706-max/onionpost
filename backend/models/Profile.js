const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500
  },
  avatar: {
    type: String, // URL to avatar image
    default: ''
  },
  interests: [{
    type: String,
    trim: true
  }],
  isAnonymous: {
    type: Boolean,
    default: false
  },
  
  // Onion Layers: Who sees what
  visibility: {
    public: {
      fields: [{
        type: String,
        enum: ['username', 'avatar', 'bio', 'interests']
      }]
    },
    follower: {
      fields: [{
        type: String,
        enum: ['username', 'avatar', 'bio', 'interests']
      }]
    },
    closeFriend: {
      fields: [{
        type: String,
        enum: ['username', 'avatar', 'bio', 'interests']
      }]
    }
  },

  // Relationships
  friends: [{
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile'
    },
    level: {
      type: String,
      enum: ['close', 'follower', 'blocked'],
      default: 'follower'
    }
  }]

}, {
  timestamps: true
});

// Set default visibility if not provided
profileSchema.pre('save', function(next) {
  if (!this.visibility) {
    this.visibility = {
      public: { fields: ['username', 'avatar'] },
      follower: { fields: ['bio'] },
      closeFriend: { fields: ['interests'] }
    };
  }
  next();
});

module.exports = mongoose.model('Profile', profileSchema);