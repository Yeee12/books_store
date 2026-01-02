// ============================================================================
// FILE: src/utils/asyncHandler.js
// LOCATION: Create this file at: src/utils/asyncHandler.js
// PURPOSE: Wrapper to catch errors in async route handlers
// ============================================================================

/**
 * WHAT IS THIS?
 * A wrapper function that catches errors in async functions automatically.
 * 
 * WHY DO WE NEED IT?
 * Without this, every async controller function needs try-catch blocks:
 * 
 * BAD (repetitive):
 * const getUser = async (req, res, next) => {
 *   try {
 *     const user = await User.findById(req.params.id);
 *     res.json(user);
 *   } catch (error) {
 *     next(error);
 *   }
 * };
 * 
 * GOOD (with asyncHandler):
 * const getUser = asyncHandler(async (req, res, next) => {
 *   const user = await User.findById(req.params.id);
 *   res.json(user);
 * });
 * 
 * HOW IT WORKS?
 * 1. Wraps your async function
 * 2. If function succeeds, response is sent normally
 * 3. If function throws error, error is caught and passed to error middleware
 * 
 * USAGE IN ROUTES:
 * router.get('/users/:id', asyncHandler(async (req, res) => {
 *   const user = await User.findById(req.params.id);
 *   res.json(user);
 * }));
 */

const asyncHandler = (fn) => {
  return (req, res, next) => {
    // Execute the async function and catch any errors
    // If error occurs, pass it to next() which sends it to error middleware
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
