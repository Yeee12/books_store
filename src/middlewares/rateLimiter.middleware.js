const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');

/**
 * General API rate limiter
 * Limits requests from same IP
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many requests from this IP, please try again later.'));
  }
});

/**
 * Strict rate limiter for authentication routes
 * Prevents brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again after 15 minutes.',
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many authentication attempts, please try again after 15 minutes.'));
  }
});

/**
 * Upload rate limiter
 * Limits file uploads to prevent abuse
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Too many file uploads, please try again later.',
  handler: (req, res, next) => {
    next(new ApiError(429, 'Upload limit exceeded. Please try again later.'));
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter
};