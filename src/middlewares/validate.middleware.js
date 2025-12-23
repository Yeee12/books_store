const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Middleware to validate request using express-validator
 * Checks if there are validation errors and returns them
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Extract error messages
    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));

    // Return first error message
    const firstError = errorMessages[0];
    return next(new ApiError(400, firstError.message));
  }
  
  next();
};

module.exports = validate;