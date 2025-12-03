const express = require('express');
const router = express.Router();

// Import dashboard controller
const {
  getDashboardStats,
  getRecentActivity
} = require('../controllers/dashboardController');

// Import admin authentication middleware
const { adminAuth } = require('../middleware/auth');

// ====================================
// DASHBOARD ROUTES
// ====================================

// @route   GET /api/admin/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private (Admin only)
router.get('/stats', adminAuth, getDashboardStats);

// @route   GET /api/admin/dashboard/recent-activity
// @desc    Get recent activity feed
// @access  Private (Admin only)
router.get('/recent-activity', adminAuth, getRecentActivity);

module.exports = router;