const User = require('../models/User');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin only)
const getDashboardStats = async (req, res) => {
  try {
    // Get total users count (excluding admins)
    const totalUsers = await User.countDocuments({ role: 'user' });
    
    // Get total coaches count
    const totalCoaches = await User.countDocuments({ role: 'coach' });
    
    // Get active users (verified and active status)
    const activeUsers = await User.countDocuments({ 
      role: 'user', 
      status: 'active', 
      isVerified: true 
    });
    
    // Get pending users (not verified)
    const pendingUsers = await User.countDocuments({ 
      role: 'user', 
      isVerified: false 
    });
    
    // Get users registered in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsersLast30Days = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Get users registered today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newUsersToday = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: today }
    });
    
    // Calculate growth percentage (comparing last 30 days vs previous 30 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const usersPrevious30Days = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });
    
    let userGrowthPercentage = 0;
    if (usersPrevious30Days > 0) {
      userGrowthPercentage = (((newUsersLast30Days - usersPrevious30Days) / usersPrevious30Days) * 100).toFixed(1);
    } else if (newUsersLast30Days > 0) {
      userGrowthPercentage = 100;
    }

    res.status(200).json({
      success: true,
      stats: {
        totalUsers: {
          count: totalUsers,
          growth: `${userGrowthPercentage >= 0 ? '+' : ''}${userGrowthPercentage}%`
        },
        totalCoaches: {
          count: totalCoaches
        },
        activeUsers: {
          count: activeUsers
        },
        pendingUsers: {
          count: pendingUsers
        },
        newUsersToday: {
          count: newUsersToday
        },
        newUsersLast30Days: {
          count: newUsersLast30Days
        }
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching dashboard statistics'
    });
  }
};

// @desc    Get recent activity
// @route   GET /api/admin/dashboard/recent-activity
// @access  Private (Admin only)
const getRecentActivity = async (req, res) => {
  try {
    // Get recent user registrations (last 10)
    const recentUsers = await User.find({ role: 'user' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email createdAt isVerified');
    
    // Get recent coach registrations (last 5)
    const recentCoaches = await User.find({ role: 'coach' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');
    
    // Get users who logged in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLogins = await User.countDocuments({
      lastLogin: { $gte: today }
    });
    
    // Get pending verification count
    const pendingVerifications = await User.countDocuments({
      role: 'user',
      isVerified: false
    });

    // Format activity feed
    const activities = [];
    
    // Add user registrations to activity
    recentUsers.forEach(user => {
      activities.push({
        type: 'user_registered',
        message: `${user.name} registered`,
        email: user.email,
        timestamp: user.createdAt,
        status: user.isVerified ? 'verified' : 'pending'
      });
    });
    
    // Add coach registrations to activity
    recentCoaches.forEach(coach => {
      activities.push({
        type: 'coach_added',
        message: `Coach ${coach.name} was added`,
        email: coach.email,
        timestamp: coach.createdAt
      });
    });
    
    // Sort activities by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Take only the most recent 15 activities
    const recentActivities = activities.slice(0, 15);

    res.status(200).json({
      success: true,
      activities: recentActivities,
      summary: {
        todayLogins,
        pendingVerifications
      }
    });

  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching recent activity'
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivity
};