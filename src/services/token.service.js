// ============================================================================
// FILE: src/services/token.service.js
// UPDATED: Added proper error handling and token type parameter
// ============================================================================

const Token = require('../models/Token.model');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');

/**
 * Create and send verification token
 * @param {String} userId - User ID
 * @param {String} type - Token type ('emailVerification' or 'passwordReset')
 * @returns {String} Plain token (to send in email)
 */
const createVerificationToken = async (userId, type) => {
  try {
    // Call Token model's static method to create token
    const { plainToken } = await Token.createToken(userId, type);
    
    // Return the plain (unhashed) token to send in email
    return plainToken;
  } catch (error) {
    console.error('Error creating verification token:', error);
    throw new Error('Failed to create verification token');
  }
};

/**
 * Verify token and get user
 * @param {String} token - Plain token (from URL/email)
 * @param {String} type - Token type ('emailVerification' or 'passwordReset')
 * @returns {Object} User document
 */
const verifyAndGetUser = async (token, type) => {
  try {
    // Verify token using Token model's static method
    // This hashes the token and checks if it exists and hasn't expired
    const tokenDoc = await Token.verifyToken(token, type);
    
    if (!tokenDoc) {
      throw new Error('Invalid or expired token');
    }

    // Get the user from the token document
    const user = tokenDoc.user;

    // Delete token after successful verification (one-time use)
    await Token.deleteOne({ _id: tokenDoc._id });

    return user;
  } catch (error) {
    console.error('Error verifying token:', error);
    throw error; // Re-throw to be handled by controller
  }
};

/**
 * Generate authentication tokens (JWT)
 * @param {String} userId - User ID
 * @returns {Object} Access and refresh tokens
 */
const generateAuthTokens = (userId) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);

  return {
    accessToken,
    refreshToken
  };
};

/**
 * Delete all tokens for a user (useful for logout or security)
 * @param {String} userId - User ID
 * @param {String} type - Optional: specific token type to delete
 */
const deleteUserTokens = async (userId, type = null) => {
  try {
    const query = { user: userId };
    if (type) {
      query.type = type;
    }
    await Token.deleteMany(query);
  } catch (error) {
    console.error('Error deleting user tokens:', error);
    throw new Error('Failed to delete tokens');
  }
};

module.exports = {
  createVerificationToken,
  verifyAndGetUser,
  generateAuthTokens,
  deleteUserTokens
};