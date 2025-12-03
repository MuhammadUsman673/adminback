// backend/routes/coaches.js → FINAL & 100% WORKING VERSION
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const {
  getAllCoaches,        // ← Now returns clientCount + pagination + search
  getCoachById,
  getCoachClients,
  assignClientToCoach,
  removeClientFromCoach
} = require('../controllers/coachController');

const Coach = require('../models/Coach');
const ClientAssignment = require('../models/ClientAssignment');
const { adminAuth } = require('../middleware/auth');

// GET ALL COACHES (with client count, search, pagination)
router.get('/', adminAuth, getAllCoaches);

// GET SINGLE COACH
router.get('/:coachId', adminAuth, getCoachById);

// GET CLIENTS OF A COACH
router.get('/:coachId/clients', adminAuth, getCoachClients);

// ASSIGN CLIENT TO COACH
router.post('/:coachId/assign-client', adminAuth, assignClientToCoach);

// REMOVE CLIENT FROM COACH
router.delete('/:coachId/clients/:userId', adminAuth, removeClientFromCoach);

// REGISTER NEW COACH
router.post('/register', adminAuth, async (req, res) => {
  try {
    const {
      name, email, password, tags = [], phone = '', experience = '', certifications = ''
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const existing = await Coach.findOne({ email: trimmedEmail });
    if (existing) {
      return res.status(400).json({ success: false, error: 'A coach with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const coach = await Coach.create({
      name: name.trim(),
      email: trimmedEmail,
      password: hashedPassword,
      tags: tags.map(t => t.trim()).filter(Boolean),
      phone: phone.trim(),
      experience,
      certifications: certifications.trim(),
      status: 'active',
      joinedDate: new Date()
    });

    const { password: _, ...coachWithoutPassword } = coach.toObject();

    res.status(201).json({
      success: true,
      message: 'Coach registered successfully!',
      coach: coachWithoutPassword
    });
  } catch (err) {
    console.error('Coach registration error:', err);
    res.status(500).json({ success: false, error: 'Failed to register coach' });
  }
});

// UPDATE COACH
router.put('/:coachId', adminAuth, async (req, res) => {
  try {
    const { coachId } = req.params;
    const updates = req.body;

    delete updates.email;
    delete updates.password;

    const coach = await Coach.findByIdAndUpdate(
      coachId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!coach) {
      return res.status(404).json({ success: false, error: 'Coach not found' });
    }

    res.json({ success: true, message: 'Coach updated successfully', coach });
  } catch (err) {
    console.error('Update coach error:', err);
    res.status(500).json({ success: false, error: 'Failed to update coach' });
  }
});

// DELETE COACH
router.delete('/:coachId', adminAuth, async (req, res) => {
  try {
    const { coachId } = req.params;

    const coach = await Coach.findById(coachId);
    if (!coach) {
      return res.status(404).json({ success: false, error: 'Coach not found' });
    }

    await ClientAssignment.deleteMany({ coachId });
    await Coach.findByIdAndDelete(coachId);

    res.json({ success: true, message: 'Coach and all assignments deleted successfully' });
  } catch (err) {
    console.error('Delete coach error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete coach' });
  }
});

module.exports = router;