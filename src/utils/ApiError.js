// ============================================================================
// FILE: src/utils/ApiError.js
// LOCATION: Create this file at: src/utils/ApiError.js
// PURPOSE: Custom error class for consistent error handling across the API
// ============================================================================

/**
 * WHAT IS THIS?
 * A custom error class that extends JavaScript's built-in Error class.
 * It adds properties like statusCode and operational status to help us
 * handle errors consistently throughout the application.
 * 
 * WHY DO WE NEED IT?
 * - Standard errors don't have HTTP status codes
 * - We want to distinguish between operational errors (expected, like "user not found")
 *   and programming errors (unexpected, like syntax errors)
 * - Consistent error structure makes error handling middleware easier
 * 
 * HOW TO USE IT?
 * throw new ApiError(404, 'User not found');
 * throw new ApiError(400, 'Invalid email format');
 * throw new ApiError(401, 'Unauthorized access');
 */

class ApiError extends Error {
  /**
   * Create a new API Error
   * 
   * @param {Number} statusCode - HTTP status code (404, 400, 401, 500, etc.)
   * @param {String} message - Human-readable error message
   * @param {Boolean} isOperational - Is this an expected error? (default: true)
   * @param {String} stack - Error stack trace (optional)
   * 
   * EXAMPLES:
   * new ApiError(404, 'Book not found')
   * new ApiError(400, 'Email is required')
   * new ApiError(401, 'Please login to access this resource')
   * new ApiError(403, 'You do not have permission')
   * new ApiError(500, 'Something went wrong', false) // Non-operational error
   */
  constructor(statusCode, message, isOperational = true, stack = '') {
    // Call parent Error class constructor
    super(message);
    
    // Add custom properties
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Set status based on statusCode
    // 4xx errors = 'fail' (client error)
    // 5xx errors = 'error' (server error)
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // If custom stack trace provided, use it
    // Otherwise, capture stack trace automatically
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;