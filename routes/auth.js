const express = require('express');
const router = express.Router();

// Import controllers
const {
  // Admin functions
  adminLogin,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  getAdminProfile,
  updateAdminProfile,
  changePassword,
  logout,

  // App user functions
  register,
  verifyEmail,
  loginUser,
  forgotPasswordUser,
  resetPasswordUser
} = require('../controllers/authController');

// Import middleware
const { adminAuth } = require('../middleware/auth');
const {
  validateLogin,
  validateForgotPassword,
  validateResetCode,
  validateResetPassword,
  validateChangePassword,
  validateProfileUpdate,
  validateRegistration // if you have one, otherwise remove
} = require('../middleware/validation');

// ====================================
// ADMIN AUTHENTICATION ROUTES
// ====================================

router.post('/admin/login', validateLogin, adminLogin);
router.post('/admin/forgot-password', validateForgotPassword, forgotPassword);
router.post('/admin/verify-reset-code', validateResetCode, verifyResetCode);
router.post('/admin/reset-password', validateResetPassword, resetPassword);

router.get('/admin/profile', adminAuth, getAdminProfile);
router.put('/admin/profile', adminAuth, validateProfileUpdate, updateAdminProfile);
router.put('/admin/change-password', adminAuth, validateChangePassword, changePassword);
router.post('/admin/logout', adminAuth, logout);

// ====================================
// APP USER AUTHENTICATION ROUTES
// ====================================

// Register
router.post('/register', register); // Add validation if you have validateRegistration

// Verify Email
router.post('/verify-email', verifyEmail);

// Login ← THIS WAS MISSING BEFORE!
router.post('/login', validateLogin, loginUser);

// Forgot Password (User)
router.post('/forgot-password', validateForgotPassword, forgotPasswordUser);

// Reset Password (User)
router.post('/reset-password', validateResetPassword, resetPasswordUser);

module.exports = router;