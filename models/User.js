const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password in queries by default
  },
  
  // Role Management
  role: {
    type: String,
    enum: ['admin', 'coach', 'user'],
    default: 'user'
  },
  
  // Profile
  avatar: {
    type: String,
    default: ''
  },
  
  // Verification & Status
  isVerified: {
    type: Boolean,
    default: false
  },
  
  verificationCode: {
    type: String,
    select: false
  },
  
  verificationCodeExpires: {
    type: Date,
    select: false
  },
  
  resetPasswordCode: {
    type: String,
    select: false
  },
  
  resetPasswordCodeExpires: {
    type: Date,
    select: false
  },
  
  status: {
    type: String,
    enum: ['active', 'suspended', 'pending'],
    default: 'active'
  },
  
  lastLogin: {
    type: Date,
    default: null
  }
  
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Hash password before saving - SIMPLIFIED VERSION
userSchema.pre('save', async function() {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return;
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate password reset code
userSchema.methods.generateResetCode = function() {
  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  this.resetPasswordCode = code;
  this.resetPasswordCodeExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  
  return code;
};

// Check if reset code is valid
userSchema.methods.isResetCodeValid = function(code) {
  return this.resetPasswordCode === code && 
         this.resetPasswordCodeExpires > Date.now();
};

// Update last login
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

const User = mongoose.model('User', userSchema);

module.exports = User;