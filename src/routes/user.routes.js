const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const User = require('../models/User.model');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// All routes are protected and admin-only
router.use(protect, restrictTo('admin'));

/**
 * @desc    Get all users
 * @route   GET /api/v1/users
 * @access  Private (Admin)
 */
router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const users = await User.find()
    .select('-refreshToken')
    .skip(skip)
    .limit(limit)
    .sort('-createdAt');

  const totalUsers = await User.countDocuments();

  new ApiResponse(200, {
    users,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
      limit
    }
  }, 'Users retrieved successfully').send(res);
}));

/**
 * @desc    Get single user
 * @route   GET /api/v1/users/:id
 * @access  Private (Admin)
 */
router.get('/:id', asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-refreshToken');

  if (!user) {
    return next(new ApiError(404, 'User not found'));
  }

  new ApiResponse(200, { user }, 'User retrieved successfully').send(res);
}));

/**
 * @desc    Update user role
 * @route   PATCH /api/v1/users/:id/role
 * @access  Private (Admin)
 */
router.patch('/:id/role', asyncHandler(async (req, res, next) => {
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return next(new ApiError(400, 'Invalid role'));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  );

  if (!user) {
    return next(new ApiError(404, 'User not found'));
  }

  new ApiResponse(200, { user }, 'User role updated successfully').send(res);
}));

/**
 * @desc    Deactivate user
 * @route   PATCH /api/v1/users/:id/deactivate
 * @access  Private (Admin)
 */
router.patch('/:id/deactivate', asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!user) {
    return next(new ApiError(404, 'User not found'));
  }

  new ApiResponse(200, { user }, 'User deactivated successfully').send(res);
}));

/**
 * @desc    Activate user
 * @route   PATCH /api/v1/users/:id/activate
 * @access  Private (Admin)
 */
router.patch('/:id/activate', asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: true },
    { new: true }
  );

  if (!user) {
    return next(new ApiError(404, 'User not found'));
  }

  new ApiResponse(200, { user }, 'User activated successfully').send(res);
}));

/**
 * @desc    Delete user
 * @route   DELETE /api/v1/users/:id
 * @access  Private (Admin)
 */
router.delete('/:id', asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ApiError(404, 'User not found'));
  }

  // Prevent deleting yourself
  if (user._id.toString() === req.user._id.toString()) {
    return next(new ApiError(400, 'You cannot delete your own account'));
  }

  await user.deleteOne();

  new ApiResponse(200, null, 'User deleted successfully').send(res);
}));

module.exports = router;