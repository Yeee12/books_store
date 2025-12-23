const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Protect routes - Check if user is authenticated
 * Verifies JWT token and attaches user to request object
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1) Check if token exists in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2) Check if token exists
  if (!token) {
    return next(new ApiError(401, 'You are not logged in. Please log in to access this resource.'));
  }

  // 3) Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid token. Please log in again.'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Your token has expired. Please log in again.'));
    }
    return next(new ApiError(401, 'Authentication failed.'));
  }

  // 4) Check if user still exists
  const user = await User.findById(decoded.id).select('+passwordChangedAt');
  if (!user) {
    return next(new ApiError(401, 'The user belonging to this token no longer exists.'));
  }

  // 5) Check if user is active
  if (!user.isActive) {
    return next(new ApiError(401, 'Your account has been deactivated. Please contact support.'));
  }

  // 6) Check if user changed password after token was issued
  if (user.changedPasswordAfter(decoded.iat)) {
    return next(new ApiError(401, 'User recently changed password. Please log in again.'));
  }

  // 7) Grant access to protected route
  req.user = user;
  next();
});

/**
 * Restrict access to specific roles
 * Usage: router.post('/admin-only', protect, restrictTo('admin'), handler)
 * 
 * @param  {...String} roles - Allowed roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array like ['admin', 'user']
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, 'You do not have permission to perform this action.')
      );
    }
    next();
  };
};

/**
 * Optional authentication - Attaches user if token is valid, but doesn't fail if not
 * Useful for routes that have different behavior for authenticated vs non-authenticated users
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (user && user.isActive && !user.changedPasswordAfter(decoded.iat)) {
      req.user = user;
    }
  } catch (error) {
    // Silently fail - user just won't be authenticated
  }

  next();
});

module.exports = {
  protect,
  restrictTo,
  optionalAuth
};