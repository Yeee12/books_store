// ============================================================================
// FILE: src/models/Token.model.js
// UPDATED: Added better error handling and documentation
// ============================================================================

const mongoose = require('mongoose');
const crypto = require('crypto');

const tokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  token: {
    type: String,
    required: true,
    // Token is hashed before storing for security
  },
  
  type: {
    type: String,
    enum: ['emailVerification', 'passwordReset'],
    required: true
  },
  
  expiresAt: {
    type: Date,
    required: true,
    // Default: 1 hour from creation
    default: () => Date.now() + 3600000 // 60 minutes
  }
}, {
  timestamps: true
});

// Indexes for faster queries
tokenSchema.index({ user: 1, type: 1 }); // Find tokens by user and type
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired tokens

/**
 * Create a new token
 * @param {ObjectId} userId - User ID
 * @param {String} type - Token type ('emailVerification' or 'passwordReset')
 * @returns {Object} { token: tokenDocument, plainToken: string }
 */
tokenSchema.statics.createToken = async function(userId, type) {
  try {
    // 1. Generate random token (32 bytes = 64 hex characters)
    const plainToken = crypto.randomBytes(32).toString('hex');
    
    // 2. Hash the token using SHA-256 for security
    // We store the HASHED version in database
    // We send the PLAIN version in email
    const hashedToken = crypto
      .createHash('sha256')
      .update(plainToken)
      .digest('hex');
    
    // 3. Delete any existing tokens of same type for this user
    // This ensures only one active verification/reset token exists
    await this.deleteMany({ user: userId, type });
    
    // 4. Create new token in database
    const token = await this.create({
      user: userId,
      token: hashedToken, // Store HASHED token
      type,
      expiresAt: Date.now() + 3600000 // 1 hour expiry
    });
    
    // 5. Return both the document and PLAIN token
    return { token, plainToken }; // plainToken goes in email
  } catch (error) {
    console.error('Error in createToken:', error);
    throw new Error('Failed to create token');
  }
};

/**
 * Verify a token and return token document with populated user
 * @param {String} plainToken - Plain token from URL/email
 * @param {String} type - Token type ('emailVerification' or 'passwordReset')
 * @returns {Object|null} Token document with populated user, or null if invalid
 */
tokenSchema.statics.verifyToken = async function(plainToken, type) {
  try {
    // 1. Hash the incoming plain token
    // We need to hash it to compare with database
    const hashedToken = crypto
      .createHash('sha256')
      .update(plainToken)
      .digest('hex');
    
    // 2. Find token in database that matches:
    //    - Hashed token
    //    - Type (emailVerification or passwordReset)
    //    - Not expired (expiresAt > now)
    const token = await this.findOne({
      token: hashedToken,
      type,
      expiresAt: { $gt: Date.now() } // Must not be expired
    }).populate('user'); // Populate user document
    
    // 3. Return token document (or null if not found)
    return token;
  } catch (error) {
    console.error('Error in verifyToken:', error);
    return null;
  }
};

const Token = mongoose.model('Token', tokenSchema);
module.exports = Token;