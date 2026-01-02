// ============================================================================
// FILE: src/utils/ApiResponse.js
// LOCATION: Create this file at: src/utils/ApiResponse.js
// PURPOSE: Standard response formatter for all successful API responses
// ============================================================================

/**
 * WHAT IS THIS?
 * A class that formats all successful API responses in a consistent way.
 * Every successful response will have the same structure: status, message, data
 * 
 * WHY DO WE NEED IT?
 * - Consistency: Frontend developers always know what to expect
 * - Cleaner code: No need to manually format response every time
 * - Easy to modify: Change response structure in one place
 * 
 * RESPONSE STRUCTURE:
 * {
 *   "status": "success",
 *   "message": "User created successfully",
 *   "data": { user: {...} }
 * }
 * 
 * HOW TO USE IT?
 * new ApiResponse(201, { user }, 'User created').send(res);
 * new ApiResponse(200, { books }, 'Books retrieved').send(res);
 */

class ApiResponse {
  /**
   * Create a new API Response
   * 
   * @param {Number} statusCode - HTTP status code (200, 201, etc.)
   * @param {Object} data - Response data (user, books, etc.)
   * @param {String} message - Success message (default: 'Success')
   * 
   * EXAMPLES:
   * new ApiResponse(200, { user }, 'Login successful')
   * new ApiResponse(201, { book }, 'Book created successfully')
   * new ApiResponse(200, { books, pagination }, 'Books retrieved')
   */
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.status = 'success'; // Always 'success' for successful responses
    this.message = message;
    this.data = data;
  }

  /**
   * Send the response to client
   * 
   * @param {Object} res - Express response object
   * 
   * USAGE:
   * const response = new ApiResponse(200, { user }, 'User found');
   * response.send(res);
   * 
   * OR in one line:
   * new ApiResponse(200, { user }, 'User found').send(res);
   */
  send(res) {
    return res.status(this.statusCode).json({
      status: this.status,
      message: this.message,
      data: this.data
    });
  }
}

module.exports = ApiResponse;
