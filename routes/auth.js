const express = require('express');
const router = express.Router();

// Import controllers
const {
  adminLogin,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  getAdminProfile,
  updateAdminProfile,
  changePassword,
  logout
} = require('../controllers/authController');

// Import middleware
const { adminAuth } = require('../middleware/auth');
const {
  validateLogin,
  validateForgotPassword,
  validateResetCode,
  validateResetPassword,
  validateChangePassword,
  validateProfileUpdate
} = require('../middleware/validation');

// ====================================
// ADMIN AUTHENTICATION ROUTES
// ====================================

// @route   POST /api/admin/login
// @desc    Admin login
// @access  Public
router.post('/admin/login', validateLogin, adminLogin);

// @route   POST /api/admin/forgot-password
// @desc    Send password reset code to admin email
// @access  Public
router.post('/admin/forgot-password', validateForgotPassword, forgotPassword);

// @route   POST /api/admin/verify-reset-code
// @desc    Verify password reset code
// @access  Public
router.post('/admin/verify-reset-code', validateResetCode, verifyResetCode);

// @route   POST /api/admin/reset-password
// @desc    Reset password with token and new password
// @access  Public
router.post('/admin/reset-password', validateResetPassword, resetPassword);

// @route   GET /api/admin/profile
// @desc    Get admin profile
// @access  Private (Admin only)
router.get('/admin/profile', adminAuth, getAdminProfile);

// @route   PUT /api/admin/profile
// @desc    Update admin profile
// @access  Private (Admin only)
router.put('/admin/profile', adminAuth, validateProfileUpdate, updateAdminProfile);

// @route   PUT /api/admin/change-password
// @desc    Change password while logged in
// @access  Private (Admin only)
router.put('/admin/change-password', adminAuth, validateChangePassword, changePassword);

// @route   POST /api/admin/logout
// @desc    Logout admin (client-side token invalidation)
// @access  Private (Admin only)
router.post('/admin/logout', adminAuth, logout);

// ====================================
// APP USER AUTHENTICATION ROUTES
// (For mobile app users - based on your requirements)
// ====================================

// Note: App user authentication will be implemented in separate userController.js
// These routes are defined here for structure reference

// @route   POST /api/auth/register
// @desc    Register new app user
// @access  Public
// router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Login app user
// @access  Public
// router.post('/login', loginUser);

// @route   POST /api/auth/verify-email
// @desc    Verify email with code
// @access  Public
// router.post('/verify-email', verifyEmail);

// @route   POST /api/auth/forgot-password
// @desc    Forgot password for app user
// @access  Public
// router.post('/forgot-password', forgotPasswordUser);

// @route   POST /api/auth/reset-password
// @desc    Reset password for app user
// @access  Public
// router.post('/reset-password', resetPasswordUser);

module.exports = router;