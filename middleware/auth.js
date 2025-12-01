const { verifyToken, getTokenFromHeader } = require('../utils/authUtils');

// @desc    General authentication middleware
// @access  Protected routes
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = getTokenFromHeader(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided, authorization denied'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Add user info to request object
    req.user = decoded;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Server authentication error'
    });
  }
};

// @desc    Admin-only middleware
// @access  Admin protected routes
const adminAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = getTokenFromHeader(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided, authorization denied'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }

    // Add user info to request object
    req.user = decoded;
    next();

  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Server authentication error'
    });
  }
};

// @desc    Coach-only middleware
// @access  Coach protected routes
const coachAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = getTokenFromHeader(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided, authorization denied'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Check if user is coach
    if (decoded.role !== 'coach') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Coach privileges required.'
      });
    }

    // Add user info to request object
    req.user = decoded;
    next();

  } catch (error) {
    console.error('Coach auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Server authentication error'
    });
  }
};

// @desc    User-only middleware
// @access  User protected routes
const userAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = getTokenFromHeader(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided, authorization denied'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Check if user is regular user
    if (decoded.role !== 'user') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. User privileges required.'
      });
    }

    // Add user info to request object
    req.user = decoded;
    next();

  } catch (error) {
    console.error('User auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Server authentication error'
    });
  }
};

module.exports = {
  auth,
  adminAuth,
  coachAuth,
  userAuth
};