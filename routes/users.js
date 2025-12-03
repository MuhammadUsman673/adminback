const express = require('express');
const router = express.Router();

// Import user controller
const {
  getAllUsers,
  getUserStats,
  getUserById,
  updateUser,
  toggleUserStatus,
  deleteUser
} = require('../controllers/userController');

// Import admin authentication middleware
const { adminAuth } = require('../middleware/auth');

// ====================================
// USER MANAGEMENT ROUTES
// ====================================

// @route   GET /api/admin/users/stats
// @desc    Get user statistics
// @access  Private (Admin only)
router.get('/stats', adminAuth, getUserStats);

// @route   GET /api/admin/users
// @desc    Get all users with pagination, search, filters
// @access  Private (Admin only)
router.get('/', adminAuth, getAllUsers);

// @route   GET /api/admin/users/:id
// @desc    Get single user by ID
// @access  Private (Admin only)
router.get('/:id', adminAuth, getUserById);

// @route   PUT /api/admin/users/:id
// @desc    Update user details
// @access  Private (Admin only)
router.put('/:id', adminAuth, updateUser);

// @route   PATCH /api/admin/users/:id/status
// @desc    Toggle user status (suspend/activate)
// @access  Private (Admin only)
router.patch('/:id/status', adminAuth, toggleUserStatus);

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', adminAuth, deleteUser);

module.exports = router;