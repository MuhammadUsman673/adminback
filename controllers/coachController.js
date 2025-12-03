// backend/controllers/coachController.js
const Coach = require('../models/Coach');
const ClientAssignment = require('../models/ClientAssignment');
const User = require('../models/User');

// @desc    Get all coaches with pagination, search, and client count
// @route   GET /api/admin/coaches
// @access  Private (Admin)
const getAllCoaches = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    // Build query
    const query = {};

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const totalCoaches = await Coach.countDocuments(query);

    // Get coaches
    const coaches = await Coach.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Get client count for each coach
    const coachesWithClientCount = await Promise.all(
      coaches.map(async (coach) => {
        const clientCount = await ClientAssignment.countDocuments({
          coachId: coach._id
        });

        return {
          _id: coach._id,
          name: coach.name,
          email: coach.email,
          phone: coach.phone,
          experience: coach.experience,
          certifications: coach.certifications,
          tags: coach.tags,
          status: coach.status,
          joinedDate: coach.joinedDate || coach.createdAt,
          createdAt: coach.createdAt,
          clientCount
        };
      })
    );

    // Calculate pagination info
    const totalPages = Math.ceil(totalCoaches / parseInt(limit));

    res.status(200).json({
      success: true,
      coaches: coachesWithClientCount,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCoaches,
        limit: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get all coaches error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching coaches'
    });
  }
};

// @desc    Get single coach details
// @route   GET /api/admin/coaches/:coachId
// @access  Private (Admin)
const getCoachById = async (req, res) => {
  try {
    const coach = await Coach.findById(req.params.coachId)
      .select('name email avatar tags joinedDate createdAt');

    if (!coach) {
      return res.status(404).json({ success: false, error: 'Coach not found' });
    }

    // Count active clients
    const activeClients = await ClientAssignment.countDocuments({
      coachId: coach._id
    });

    res.status(200).json({
      success: true,
      coach: {
        ...coach._doc,
        activeClients
      }
    });
  } catch (error) {
    console.error('Get coach error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get clients of a specific coach (with search & pagination)
// @route   GET /api/admin/coaches/:coachId/clients
// @access  Private (Admin)
const getCoachClients = async (req, res) => {
  try {
    const { coachId } = req.params;
    const { page = 1, limit = 10, search = '' } = req.query;

    const query = { coachId };

    // Search in user's name/email
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      const userIds = users.map(u => u._id);
      query.userId = { $in: userIds };
    }

    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      ClientAssignment.find(query)
        .populate('userId', 'name email avatar')
        .sort({ assignedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ClientAssignment.countDocuments(query)
    ]);

    const formattedClients = clients.map(c => ({
      _id: c._id,
      userId: c.userId._id,
      name: c.userId.name,
      email: c.userId.email,
      avatar: c.userId.avatar?.slice(0, 2).toUpperCase() || 'NA',
      subscription: c.subscription,
      paymentStatus: c.paymentStatus,
      joinDate: c.assignedAt.toISOString().split('T')[0]
    }));

    res.status(200).json({
      success: true,
      clients: formattedClients,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalClients: total
      }
    });
  } catch (error) {
    console.error('Get coach clients error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Assign client to coach
// @route   POST /api/admin/coaches/:coachId/assign-client
// @access  Private (Admin)
const assignClientToCoach = async (req, res) => {
  try {
    const { coachId } = req.params;
    const { userId, subscription = 'Basic', paymentStatus = 'Pending' } = req.body;

    // Validate coach exists
    const coach = await Coach.findById(coachId);
    if (!coach) return res.status(404).json({ success: false, error: 'Coach not found' });

    // Validate user exists and is a normal user
    const user = await User.findById(userId);
    if (!user || user.role !== 'user') {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if already assigned
    const existing = await ClientAssignment.findOne({ userId });
    if (existing) {
      return res.status(400).json({ success: false, error: 'User already assigned to a coach' });
    }

    const assignment = await ClientAssignment.create({
      userId,
      coachId,
      subscription,
      paymentStatus
    });

    await assignment.populate('userId', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Client assigned successfully',
      client: {
        _id: assignment._id,
        name: assignment.userId.name,
        email: assignment.userId.email,
        avatar: assignment.userId.avatar?.slice(0, 2).toUpperCase() || 'NA',
        subscription,
        paymentStatus,
        joinDate: assignment.assignedAt.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Assign client error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Remove client from coach
// @route   DELETE /api/admin/coaches/:coachId/clients/:userId
// @access  Private (Admin)
const removeClientFromCoach = async (req, res) => {
  try {
    const { userId } = req.params;

    const assignment = await ClientAssignment.findOneAndDelete({ userId });

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Client removed from coach successfully'
    });
  } catch (error) {
    console.error('Remove client error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = {
  getAllCoaches,
  getCoachById,
  getCoachClients,
  assignClientToCoach,
  removeClientFromCoach
};