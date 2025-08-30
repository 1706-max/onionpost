// Utility functions for onion visibility logic

/**
 * Get visible fields based on relationship level
 * @param {Object} targetProfile - The profile being viewed
 * @param {String} viewerProfileId - ID of the viewer's profile (null if anonymous)
 * @returns {Object} - Object with only visible fields
 */
const getVisibleFields = (targetProfile, viewerProfileId) => {
  try {
    console.log('Onion visibility check:', {
      targetProfileId: targetProfile._id,
      viewerProfileId: viewerProfileId
    });

    // If viewer is anonymous or not logged in
    if (!viewerProfileId) {
      const allowedFields = targetProfile.visibility?.public?.fields || ['username', 'avatar'];
      return filterProfileFields(targetProfile, allowedFields);
    }

    // If viewer is the profile owner
    if (viewerProfileId.toString() === targetProfile._id.toString()) {
      // Owner sees everything except password
      return {
        _id: targetProfile._id,
        username: targetProfile.username,
        name: targetProfile.name,
        bio: targetProfile.bio,
        avatar: targetProfile.avatar,
        interests: targetProfile.interests,
        isAnonymous: targetProfile.isAnonymous,
        createdAt: targetProfile.createdAt,
        visibility: targetProfile.visibility
      };
    }

    // Check relationship level
    const relationship = targetProfile.friends?.find(friend => 
      friend.profileId?.toString() === viewerProfileId.toString()
    );

    let allowedFields = [];
    
    if (relationship?.level === 'close') {
      // Close friends see more
      allowedFields = [
        ...(targetProfile.visibility?.public?.fields || []),
        ...(targetProfile.visibility?.follower?.fields || []),
        ...(targetProfile.visibility?.closeFriend?.fields || [])
      ];
    } else if (relationship?.level === 'follower') {
      // Followers see medium amount
      allowedFields = [
        ...(targetProfile.visibility?.public?.fields || []),
        ...(targetProfile.visibility?.follower?.fields || [])
      ];
    } else {
      // Public viewers see basic info
      allowedFields = targetProfile.visibility?.public?.fields || ['username', 'avatar'];
    }

    // Remove duplicates
    allowedFields = [...new Set(allowedFields)];
    
    console.log('Allowed fields for viewer:', allowedFields);
    
    return filterProfileFields(targetProfile, allowedFields);

  } catch (error) {
    console.error('Error in getVisibleFields:', error);
    // Fallback to public fields only
    const publicFields = targetProfile.visibility?.public?.fields || ['username', 'avatar'];
    return filterProfileFields(targetProfile, publicFields);
  }
};

/**
 * Filter profile fields based on allowed fields array
 * @param {Object} profile - The full profile object
 * @param {Array} allowedFields - Array of field names that are allowed
 * @returns {Object} - Profile object with only allowed fields
 */
const filterProfileFields = (profile, allowedFields) => {
  const filteredProfile = {};
  
  // Always include _id
  filteredProfile._id = profile._id;
  
  // Add allowed fields
  if (allowedFields.includes('username')) {
    filteredProfile.username = profile.username;
  }
  if (allowedFields.includes('name')) {
    filteredProfile.name = profile.name;
  }
  if (allowedFields.includes('bio')) {
    filteredProfile.bio = profile.bio;
  }
  if (allowedFields.includes('avatar')) {
    filteredProfile.avatar = profile.avatar;
  }
  if (allowedFields.includes('interests')) {
    filteredProfile.interests = profile.interests;
  }
  if (allowedFields.includes('isAnonymous')) {
    filteredProfile.isAnonymous = profile.isAnonymous;
  }
  if (allowedFields.includes('createdAt')) {
    filteredProfile.createdAt = profile.createdAt;
  }
  
  return filteredProfile;
};

/**
 * Get relationship level between two profiles
 * @param {Object} targetProfile - The profile being viewed
 * @param {String} viewerProfileId - ID of the viewer's profile
 * @returns {String} - Relationship level: 'owner', 'close', 'follower', 'public'
 */
const getRelationshipLevel = (targetProfile, viewerProfileId) => {
  if (!viewerProfileId) return 'public';
  
  if (viewerProfileId.toString() === targetProfile._id.toString()) {
    return 'owner';
  }
  
  const relationship = targetProfile.friends?.find(friend => 
    friend.profileId?.toString() === viewerProfileId.toString()
  );
  
  return relationship?.level || 'public';
};

module.exports = {
  getVisibleFields,
  getRelationshipLevel
};