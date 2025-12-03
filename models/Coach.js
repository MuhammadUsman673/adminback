// backend/models/Coach.js → FINAL VERSION (100% Working with Register Modal)
const mongoose = require('mongoose');

const coachSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false // Never return password by default
  },
  avatar: {
    type: String,
    default: ''
  },
  tags: {
    type: [String],
    default: []
  },
  phone: {
    type: String,
    default: ''
  },
  experience: {
    type: String,
    default: ''
  },
  certifications: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  joinedDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
coachSchema.index({ email: 1 });
coachSchema.index({ status: 1 });

module.exports = mongoose.model('Coach', coachSchema);