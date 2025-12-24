// ============================================
// FILE: src/controllers/auth.controller.js
// ============================================
const User = require('../models/User.model');
const Token = require('../models/Token.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { generateAuthTokens, createVerificationToken, verifyAndGetUser } = require('../services/token.service');
const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../services/email.service');
const { sendNotification } = require('../config/socket');

/**
 * @desc    Register new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  // 1) Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ApiError(400, 'User with this email already exists'));
  }

  // 2) Create new user
  const user = await User.create({
    name,
    email,
    password
  });

  // 3) Generate verification token
  const verificationToken = await createVerificationToken(user._id, 'emailVerification');

  // 4) Send verification email
  try {
    await sendVerificationEmail(user.email, user.name, verificationToken);
  } catch (error) {
    console.error('Error sending verification email:', error);
    // Don't fail registration if email fails
  }

  // 5) Generate auth tokens
  const tokens = generateAuthTokens(user._id);

  // 6) Save refresh token to user
  user.refreshToken = tokens.refreshToken;
  await user.save();

  // 7) Send response
  new ApiResponse(201, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified
    },
    tokens
  }, 'Registration successful! Please check your email to verify your account.').send(res);
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if user exists and get password
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    return next(new ApiError(401, 'Invalid email or password'));
  }

  // 2) Check if user is active
  if (!user.isActive) {
    return next(new ApiError(401, 'Your account has been deactivated. Please contact support.'));
  }

  // 3) Verify password
  const isPasswordCorrect = await user.comparePassword(password);
  
  if (!isPasswordCorrect) {
    return next(new ApiError(401, 'Invalid email or password'));
  }

  // 4) Generate auth tokens
  const tokens = generateAuthTokens(user._id);

  // 5) Save refresh token
  user.refreshToken = tokens.refreshToken;
  await user.save();

  // 6) Send real-time notification
  sendNotification(user._id.toString(), 'login', {
    message: 'You have successfully logged in',
    timestamp: new Date()
  });

  // 7) Send response
  new ApiResponse(200, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar
    },
    tokens
  }, 'Login successful!').send(res);
});

/**
 * @desc    Verify email address
 * @route   GET /api/v1/auth/verify-email/:token
 * @access  Public
 */
const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;

  // 1) Verify token and get user
  const user = await verifyAndGetUser(token, 'emailVerification');

  // 2) Check if already verified
  if (user.isEmailVerified) {
    return next(new ApiError(400, 'Email is already verified'));
  }

  // 3) Update user
  user.isEmailVerified = true;
  await user.save();

  // 4) Send welcome email
  try {
    await sendWelcomeEmail(user.email, user.name);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }

  // 5) Send real-time notification
  sendNotification(user._id.toString(), 'emailVerified', {
    message: 'Your email has been verified successfully!',
    timestamp: new Date()
  });

  // 6) Send response
  new ApiResponse(200, null, 'Email verified successfully!').send(res);
});

/**
 * @desc    Resend verification email
 * @route   POST /api/v1/auth/resend-verification
 * @access  Private
 */
const resendVerificationEmail = asyncHandler(async (req, res, next) => {
  const user = req.user;

  // 1) Check if already verified
  if (user.isEmailVerified) {
    return next(new ApiError(400, 'Email is already verified'));
  }

  // 2) Generate new verification token
  const verificationToken = await createVerificationToken(user._id, 'emailVerification');

  // 3) Send verification email
  await sendVerificationEmail(user.email, user.name, verificationToken);

  // 4) Send response
  new ApiResponse(200, null, 'Verification email sent successfully!').send(res);
});

/**
 * @desc    Forgot password - Send reset email
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  // 1) Find user
  const user = await User.findOne({ email });
  
  if (!user) {
    // Don't reveal if user exists or not for security
    return new ApiResponse(200, null, 'If an account exists with that email, a password reset link has been sent.').send(res);
  }

  // 2) Generate reset token
  const resetToken = await createVerificationToken(user._id, 'passwordReset');

  // 3) Send reset email
  try {
    await sendPasswordResetEmail(user.email, user.name, resetToken);
  } catch (error) {
    console.error('Error sending reset email:', error);
    return next(new ApiError(500, 'Error sending email. Please try again later.'));
  }

  // 4) Send response
  new ApiResponse(200, null, 'If an account exists with that email, a password reset link has been sent.').send(res);
});

/**
 * @desc    Reset password with token
 * @route   POST /api/v1/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  // 1) Verify token and get user
  const user = await verifyAndGetUser(token, 'passwordReset');

  // 2) Update password
  user.password = password;
  user.passwordChangedAt = Date.now();
  await user.save();

  // 3) Send real-time notification
  sendNotification(user._id.toString(), 'passwordReset', {
    message: 'Your password has been reset successfully',
    timestamp: new Date()
  });

  // 4) Send response
  new ApiResponse(200, null, 'Password reset successful! Please login with your new password.').send(res);
});

/**
 * @desc    Change password (when logged in)
 * @route   POST /api/v1/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // 1) Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // 2) Verify current password
  const isPasswordCorrect = await user.comparePassword(currentPassword);
  
  if (!isPasswordCorrect) {
    return next(new ApiError(401, 'Current password is incorrect'));
  }

  // 3) Update password
  user.password = newPassword;
  user.passwordChangedAt = Date.now();
  await user.save();

  // 4) Generate new tokens
  const tokens = generateAuthTokens(user._id);
  user.refreshToken = tokens.refreshToken;
  await user.save();

  // 5) Send real-time notification
  sendNotification(user._id.toString(), 'passwordChanged', {
    message: 'Your password has been changed successfully',
    timestamp: new Date()
  });

  // 6) Send response
  new ApiResponse(200, { tokens }, 'Password changed successfully!').send(res);
});

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res, next) => {
  // 1) Clear refresh token
  req.user.refreshToken = undefined;
  await req.user.save();

  // 2) Send response
  new ApiResponse(200, null, 'Logged out successfully!').send(res);
});

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  new ApiResponse(200, { user }, 'User profile retrieved successfully').send(res);
});

/**
 * @desc    Update user profile
 * @route   PATCH /api/v1/auth/update-profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res, next) => {
  const { name, avatar } = req.body;

  // 1) Don't allow password or email update here
  if (req.body.password || req.body.email) {
    return next(new ApiError(400, 'This route is not for password or email updates'));
  }

  // 2) Update user
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { name, avatar },
    { new: true, runValidators: true }
  );

  // 3) Send response
  new ApiResponse(200, { user: updatedUser }, 'Profile updated successfully').send(res);
});

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
  getMe,
  updateProfile
};