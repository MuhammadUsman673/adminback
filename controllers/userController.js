const User = require('../models/User');

// @desc    Get all users with pagination, search, and filters
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      subscription = 'all',
      isVerified = 'all'
    } = req.query;

    // Build query
    const query = { role: 'user' }; // Only get users, not admins or coaches

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by status
    if (status !== 'all') {
      query.status = status;
    }

    // Filter by verification
    if (isVerified !== 'all') {
      query.isVerified = isVerified === 'true';
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);

    // Get users
    const users = await User.find(query)
      .select('-password -resetPasswordCode -resetPasswordCodeExpires -verificationCode -verificationCodeExpires')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Calculate pagination info
    const totalPages = Math.ceil(totalUsers / parseInt(limit));

    res.status(200).json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        limit: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching users'
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/admin/users/stats
// @access  Private (Admin only)
const getUserStats = async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments({ role: 'user' });

    // Active users
    const activeUsers = await User.countDocuments({ 
      role: 'user', 
      status: 'active',
      isVerified: true 
    });

    // Pending verification
    const pendingVerification = await User.countDocuments({ 
      role: 'user', 
      isVerified: false 
    });

    // Suspended users
    const suspendedUsers = await User.countDocuments({ 
      role: 'user', 
      status: 'suspended' 
    });

    // Users registered this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newUsersThisMonth = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: startOfMonth }
    });

    // Calculate growth percentage (this month vs last month)
    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    const lastMonthUsers = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }
    });

    let growthPercentage = 0;
    if (lastMonthUsers > 0) {
      growthPercentage = (((newUsersThisMonth - lastMonthUsers) / lastMonthUsers) * 100).toFixed(1);
    } else if (newUsersThisMonth > 0) {
      growthPercentage = 100;
    }

    res.status(200).json({
      success: true,
      stats: {
        totalUsers: {
          count: totalUsers,
          growth: `${growthPercentage >= 0 ? '+' : ''}${growthPercentage}%`
        },
        activeUsers: {
          count: activeUsers,
          percentage: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0
        },
        pendingVerification: {
          count: pendingVerification
        },
        suspendedUsers: {
          count: suspendedUsers
        },
        newUsersThisMonth: {
          count: newUsersThisMonth
        }
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching user statistics'
    });
  }
};

// @desc    Get single user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-password -resetPasswordCode -resetPasswordCodeExpires -verificationCode -verificationCodeExpires');

    if (!user || user.role !== 'user') {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching user details'
    });
  }
};

// @desc    Update user details
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, status, isVerified } = req.body;

    const user = await User.findById(id);

    if (!user || user.role !== 'user') {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update fields if provided
    if (name) user.name = name;
    
    if (email && email !== user.email) {
      // Check if email is already taken
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email is already in use'
        });
      }
      user.email = email;
    }

    if (status) user.status = status;
    if (typeof isVerified !== 'undefined') user.isVerified = isVerified;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating user'
    });
  }
};

// @desc    Toggle user status (suspend/activate)
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin only)
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be "active" or "suspended"'
      });
    }

    const user = await User.findById(id);

    if (!user || user.role !== 'user') {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.status = status;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${status === 'suspended' ? 'suspended' : 'activated'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating user status'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user || user.role !== 'user') {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting user'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserStats,
  getUserById,
  updateUser,
  toggleUserStatus,
  deleteUser
};