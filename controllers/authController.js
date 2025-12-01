const User = require('../models/User');
const { generateToken, generateResetToken, verifyToken, validatePasswordStrength } = require('../utils/authUtils');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../utils/emailUtils');

// @desc    Admin Login
// @route   POST /api/admin/login
// @access  Public
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    // Find admin user (role must be 'admin')
    const admin = await User.findOne({ email, role: 'admin' }).select('+password');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials - Admin not found'
      });
    }

    // Check if admin is active
    if (admin.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Account is suspended. Please contact administrator.'
      });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials - Incorrect password'
      });
    }

    // Update last login
    await admin.updateLastLogin();

    // Generate token
    const token = generateToken(admin._id, admin.role);

    // Return response (without password)
    const adminData = {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar,
      isVerified: admin.isVerified,
      lastLogin: admin.lastLogin
    };

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: adminData
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
};

// @desc    Forgot Password - Send reset code
// @route   POST /api/admin/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email address'
      });
    }

    // Find admin by email
    const admin = await User.findOne({ email, role: 'admin' });
    
    if (!admin) {
      // For security, don't reveal if admin exists or not
      return res.status(200).json({
        success: true,
        message: 'If an admin account exists with this email, a reset code will be sent'
      });
    }

    // Generate reset code
    const resetCode = admin.generateResetCode();
    await admin.save();

    // Send reset code via email
    const emailResult = await sendPasswordResetEmail(email, resetCode);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send reset email. Please try again.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset code sent to your email',
      // In development, you might want to return the code for testing
      // code: process.env.NODE_ENV === 'development' ? resetCode : undefined
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during password reset'
    });
  }
};

// @desc    Verify Reset Code
// @route   POST /api/admin/verify-reset-code
// @access  Public
const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and reset code'
      });
    }

    // Find admin with reset code
    const admin = await User.findOne({ 
      email, 
      role: 'admin',
      resetPasswordCode: code,
      resetPasswordCodeExpires: { $gt: Date.now() }
    }).select('+resetPasswordCode +resetPasswordCodeExpires');

    if (!admin) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset code'
      });
    }

    // Generate reset token (short-lived)
    const resetToken = generateResetToken(admin._id);

    res.status(200).json({
      success: true,
      message: 'Reset code verified successfully',
      resetToken
    });

  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during code verification'
    });
  }
};

// @desc    Reset Password
// @route   POST /api/admin/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide reset token and new password'
      });
    }

    // Verify reset token
    const decoded = verifyToken(resetToken);
    if (!decoded || decoded.type !== 'reset') {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match'
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Password validation failed',
        details: passwordValidation.errors
      });
    }

    // Find admin
    const admin = await User.findById(decoded.userId);
    if (!admin || admin.role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Admin not found'
      });
    }

    // Update password
    admin.password = newPassword;
    admin.resetPasswordCode = undefined;
    admin.resetPasswordCodeExpires = undefined;
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during password reset'
    });
  }
};

// @desc    Get Admin Profile
// @route   GET /api/admin/profile
// @access  Private (Admin only)
const getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user.userId);

    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    const adminData = {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar,
      isVerified: admin.isVerified,
      status: admin.status,
      lastLogin: admin.lastLogin,
      createdAt: admin.createdAt
    };

    res.status(200).json({
      success: true,
      admin: adminData
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching profile'
    });
  }
};

// @desc    Update Admin Profile
// @route   PUT /api/admin/profile
// @access  Private (Admin only)
const updateAdminProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const admin = await User.findById(req.user.userId);

    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    // Update fields
    if (name) admin.name = name;
    if (email && email !== admin.email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: admin._id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email is already in use'
        });
      }
      admin.email = email;
      admin.isVerified = false; // Require re-verification if email changes
    }

    await admin.save();

    const adminData = {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar,
      isVerified: admin.isVerified
    };

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      admin: adminData
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating profile'
    });
  }
};

// @desc    Change Password
// @route   PUT /api/admin/change-password
// @access  Private (Admin only)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all password fields'
      });
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'New passwords do not match'
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Password validation failed',
        details: passwordValidation.errors
      });
    }

    // Find admin with password
    const admin = await User.findById(req.user.userId).select('+password');
    
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current
    const isSamePassword = await admin.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        error: 'New password must be different from current password'
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error changing password'
    });
  }
};

// @desc    Logout (client-side token invalidation)
// @route   POST /api/admin/logout
// @access  Private (Admin only)
const logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

module.exports = {
  adminLogin,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  getAdminProfile,
  updateAdminProfile,
  changePassword,
  logout
};