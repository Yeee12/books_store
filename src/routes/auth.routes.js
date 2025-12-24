const express = require('express');
const router = express.Router();

const {
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
} = require('../controllers/auth.controller');

const { protect } = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimiter.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation
} = require('../validators/auth.validator');

// Public routes
router.post('/register', authLimiter, registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', authLimiter, forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPasswordValidation, validate, resetPassword);

// Protected routes (require authentication)
router.use(protect); // All routes below this require authentication

router.post('/resend-verification', resendVerificationEmail);
router.post('/change-password', changePasswordValidation, validate, changePassword);
router.post('/logout', logout);
router.get('/me', getMe);
router.patch('/update-profile', updateProfile);

module.exports = router;