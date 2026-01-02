// ============================================================================
// FILE: src/utils/generateToken.js
// LOCATION: Create this file at: src/utils/generateToken.js
// PURPOSE: Generate and verify JWT tokens for authentication
// ============================================================================

const jwt = require('jsonwebtoken');

/**
 * WHAT ARE JWT TOKENS?
 * JWT (JSON Web Token) is a secure way to transmit information between parties.
 * In our case, we use it for user authentication.
 * 
 * HOW IT WORKS:
 * 1. User logs in with email/password
 * 2. Server verifies credentials
 * 3. Server creates a JWT token containing user ID
 * 4. Server sends token to client
 * 5. Client stores token (localStorage, cookie, etc.)
 * 6. Client sends token with every subsequent request
 * 7. Server verifies token and identifies user
 * 
 * TOKEN TYPES:
 * 1. Access Token - Short-lived (7 days), used for API requests
 * 2. Refresh Token - Long-lived (30 days), used to get new access tokens
 * 
 * WHY TWO TOKENS?
 * - Access tokens expire quickly (more secure)
 * - When access token expires, use refresh token to get new one
 * - If refresh token is stolen, less damage (can be revoked)
 * 
 * TOKEN STRUCTURE:
 * {
 *   "id": "user_id_here",
 *   "iat": 1234567890,  // Issued at timestamp
 *   "exp": 1234999999   // Expiration timestamp
 * }
 */

/**
 * FUNCTION 1: Generate JWT access token
 * Access token is short-lived and used for authenticating API requests
 * 
 * @param {String} userId - MongoDB User ID
 * @returns {String} - JWT access token
 * 
 * EXAMPLE:
 * const token = generateAccessToken(user._id);
 * // Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1M..."
 * 
 * HOW TO USE:
 * 1. When user logs in, generate token
 * 2. Send token to client
 * 3. Client includes token in Authorization header:
 *    Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 */
const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId }, // Payload (data stored in token)
    process.env.JWT_SECRET, // Secret key (keep this safe!)
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } // Token expires in 7 days
  );
};

/**
 * FUNCTION 2: Generate JWT refresh token
 * Refresh token is long-lived and used to get new access tokens
 * 
 * @param {String} userId - MongoDB User ID
 * @returns {String} - JWT refresh token
 * 
 * EXAMPLE:
 * const refreshToken = generateRefreshToken(user._id);
 * 
 * WHY SEPARATE REFRESH TOKEN?
 * - Access token expires quickly (7 days) for security
 * - Don't want user to login again every 7 days
 * - Refresh token lasts longer (30 days)
 * - When access token expires, use refresh token to get new one
 * - Refresh token is stored in database, can be revoked if compromised
 * 
 * REFRESH FLOW:
 * 1. Access token expires
 * 2. Client sends refresh token to /refresh-token endpoint
 * 3. Server verifies refresh token
 * 4. Server generates new access token
 * 5. Client uses new access token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId }, // Payload
    process.env.JWT_REFRESH_SECRET, // Different secret key for refresh tokens
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' } // Expires in 30 days
  );
};

/**
 * FUNCTION 3: Verify JWT token
 * Check if token is valid and hasn't been tampered with
 * 
 * @param {String} token - JWT token to verify
 * @param {String} secret - Secret key used to sign the token
 * @returns {Object} - Decoded token payload { id: userId, iat: ..., exp: ... }
 * @throws {Error} - If token is invalid or expired
 * 
 * EXAMPLE:
 * try {
 *   const decoded = verifyToken(token, process.env.JWT_SECRET);
 *   console.log('User ID:', decoded.id);
 * } catch (error) {
 *   console.log('Invalid token:', error.message);
 * }
 * 
 * WHAT CAN GO WRONG?
 * - Token expired: User needs to login again (or use refresh token)
 * - Token tampered: Someone tried to modify the token
 * - Wrong secret: Token was signed with different secret
 * - Malformed token: Not a valid JWT format
 */
const verifyToken = (token, secret) => {
  try {
    // Verify and decode token
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    // Token verification failed
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * BONUS FUNCTION: Decode token without verification
 * Useful for debugging or getting user ID without verifying signature
 * 
 * WARNING: Don't use this for authentication!
 * This doesn't verify the token's signature, so it could be fake.
 * Only use for non-security-critical operations.
 * 
 * @param {String} token - JWT token
 * @returns {Object} - Decoded payload (not verified!)
 * 
 * EXAMPLE:
 * const decoded = jwt.decode(token);
 * console.log('User ID (unverified):', decoded.id);
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

// Export all functions
module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken
};


// ============================================================================
// USAGE EXAMPLES FOR REFERENCE
// ============================================================================

/**
 * EXAMPLE 1: User Login
 * 
 * // In auth controller
 * const login = async (req, res) => {
 *   const { email, password } = req.body;
 *   
 *   // Find user and verify password
 *   const user = await User.findOne({ email }).select('+password');
 *   const isMatch = await user.comparePassword(password);
 *   
 *   if (!isMatch) {
 *     throw new ApiError(401, 'Invalid credentials');
 *   }
 *   
 *   // Generate tokens
 *   const accessToken = generateAccessToken(user._id);
 *   const refreshToken = generateRefreshToken(user._id);
 *   
 *   // Save refresh token to database
 *   user.refreshToken = refreshToken;
 *   await user.save();
 *   
 *   // Send tokens to client
 *   res.json({
 *     accessToken,
 *     refreshToken
 *   });
 * };
 */

/**
 * EXAMPLE 2: Protect Routes (Middleware)
 * 
 * // In auth middleware
 * const protect = async (req, res, next) => {
 *   // Get token from header
 *   const token = req.headers.authorization?.split(' ')[1];
 *   
 *   if (!token) {
 *     throw new ApiError(401, 'Please login');
 *   }
 *   
 *   try {
 *     // Verify token
 *     const decoded = verifyToken(token, process.env.JWT_SECRET);
 *     
 *     // Get user
 *     const user = await User.findById(decoded.id);
 *     
 *     if (!user) {
 *       throw new ApiError(401, 'User not found');
 *     }
 *     
 *     // Attach user to request
 *     req.user = user;
 *     next();
 *   } catch (error) {
 *     throw new ApiError(401, 'Invalid token');
 *   }
 * };
 */

/**
 * EXAMPLE 3: Refresh Token
 * 
 * const refreshAccessToken = async (req, res) => {
 *   const { refreshToken } = req.body;
 *   
 *   // Verify refresh token
 *   const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
 *   
 *   // Find user and check if refresh token matches
 *   const user = await User.findById(decoded.id).select('+refreshToken');
 *   
 *   if (user.refreshToken !== refreshToken) {
 *     throw new ApiError(401, 'Invalid refresh token');
 *   }
 *   
 *   // Generate new access token
 *   const newAccessToken = generateAccessToken(user._id);
 *   
 *   res.json({
 *     accessToken: newAccessToken
 *   });
 * };
 */

/**
 * SECURITY BEST PRACTICES:
 * 
 * 1. Keep JWT_SECRET and JWT_REFRESH_SECRET secure
 *    - Use long, random strings (min 32 characters)
 *    - Never commit to version control
 *    - Store in environment variables
 *    - Use different secrets for access and refresh tokens
 * 
 * 2. Token Expiration
 *    - Access tokens: Short-lived (minutes to days)
 *    - Refresh tokens: Longer (weeks to months)
 *    - Don't make tokens last forever
 * 
 * 3. Refresh Token Storage
 *    - Store refresh tokens in database
 *    - Can be revoked if compromised
 *    - Delete on logout
 * 
 * 4. HTTPS Only
 *    - Always use HTTPS in production
 *    - Tokens can be intercepted over HTTP
 * 
 * 5. Token Rotation
 *    - Generate new refresh token when access token is refreshed
 *    - Invalidate old refresh token
 * 
 * 6. Token Revocation
 *    - When user changes password, invalidate all tokens
 *    - When user logs out, delete refresh token
 *    - Option to invalidate all sessions
 */