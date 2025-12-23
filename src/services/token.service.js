const Token = require('../models/Token.model');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');

/**
 * Create and send verification token
 * @param {String} userId - User ID
 * @param {String} type - Token type
 * @returns {String} Plain token
 */
const createVerificationToken = async (userId, type) => {
  const { plainToken } = await Token.createToken(userId, type);
  return plainToken;
};

/**
 * Verify token and get user
 * @param {String} token - Plain token
 * @param {String} type - Token type
 * @returns {Object} User document
 */
const verifyAndGetUser = async (token, type) => {
  const tokenDoc = await Token.verifyToken(token, type);
  
  if (!tokenDoc) {
    throw new Error('Invalid or expired token');
  }

  // Delete token after verification
  await Token.deleteOne({ _id: tokenDoc._id });

  return tokenDoc.user;
};

/**
 * Generate authentication tokens
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

module.exports = {
  createVerificationToken,
  verifyAndGetUser,
  generateAuthTokens
};