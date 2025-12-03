// backend/models/ClientAssignment.js
const mongoose = require('mongoose');

const clientAssignmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
    required: true
  },
  subscription: {
    type: String,
    enum: ['Basic', 'Premium'],
    default: 'Basic'
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Overdue'],
    default: 'Pending'
  },
  assignedAt: {
    type: Date,
    default: Date.now
  }
});

// Unique constraint: one user → one coach only
clientAssignmentSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('ClientAssignment', clientAssignmentSchema);