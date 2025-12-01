const { validatePasswordStrength } = require('../utils/authUtils');

// Validation middleware functions
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  const errors = [];

  if (!email || email.trim() === '') {
    errors.push('Email is required');
  } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    errors.push('Please enter a valid email address');
  }

  if (!password || password.trim() === '') {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;

  const errors = [];

  if (!email || email.trim() === '') {
    errors.push('Email is required');
  } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    errors.push('Please enter a valid email address');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

const validateResetCode = (req, res, next) => {
  const { email, code } = req.body;

  const errors = [];

  if (!email || email.trim() === '') {
    errors.push('Email is required');
  }

  if (!code || code.trim() === '') {
    errors.push('Reset code is required');
  } else if (!/^\d{6}$/.test(code)) {
    errors.push('Reset code must be 6 digits');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

const validateResetPassword = (req, res, next) => {
  const { resetToken, newPassword, confirmPassword } = req.body;

  const errors = [];

  if (!resetToken || resetToken.trim() === '') {
    errors.push('Reset token is required');
  }

  if (!newPassword || newPassword.trim() === '') {
    errors.push('New password is required');
  } else {
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
  }

  if (!confirmPassword || confirmPassword.trim() === '') {
    errors.push('Please confirm your new password');
  }

  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  const errors = [];

  if (!currentPassword || currentPassword.trim() === '') {
    errors.push('Current password is required');
  }

  if (!newPassword || newPassword.trim() === '') {
    errors.push('New password is required');
  } else {
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
  }

  if (!confirmPassword || confirmPassword.trim() === '') {
    errors.push('Please confirm your new password');
  }

  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    errors.push('New passwords do not match');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

const validateProfileUpdate = (req, res, next) => {
  const { name, email } = req.body;

  const errors = [];

  if (name !== undefined && (name.trim() === '' || name.length < 2)) {
    errors.push('Name must be at least 2 characters long');
  }

  if (email !== undefined) {
    if (email.trim() === '') {
      errors.push('Email is required');
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      errors.push('Please enter a valid email address');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// Validation for coach registration
const validateCoachRegistration = (req, res, next) => {
  const { fullName, email, password, specialty, phone, experience, certifications } = req.body;

  const errors = [];

  if (!fullName || fullName.trim() === '' || fullName.length < 2) {
    errors.push('Full name must be at least 2 characters long');
  }

  if (!email || email.trim() === '') {
    errors.push('Email is required');
  } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    errors.push('Please enter a valid email address');
  }

  if (!password || password.trim() === '') {
    errors.push('Password is required');
  } else {
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
  }

  if (!specialty || specialty.trim() === '') {
    errors.push('Specialty is required');
  }

  if (!phone || phone.trim() === '') {
    errors.push('Phone number is required');
  }

  if (!experience || experience.trim() === '') {
    errors.push('Experience level is required');
  }

  if (!certifications || certifications.trim() === '') {
    errors.push('Certifications are required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// Validation for recipe creation
const validateRecipe = (req, res, next) => {
  const { name, category, prepTime, servings, calories } = req.body;

  const errors = [];

  if (!name || name.trim() === '') {
    errors.push('Recipe name is required');
  }

  if (!category || category.trim() === '') {
    errors.push('Category is required');
  }

  if (!prepTime || prepTime <= 0) {
    errors.push('Prep time must be a positive number');
  }

  if (!servings || servings <= 0) {
    errors.push('Servings must be a positive number');
  }

  if (calories !== undefined && calories < 0) {
    errors.push('Calories cannot be negative');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// Validation for exercise creation
const validateExercise = (req, res, next) => {
  const { name, category, duration, difficulty } = req.body;

  const errors = [];

  if (!name || name.trim() === '') {
    errors.push('Exercise name is required');
  }

  if (!category || category.trim() === '') {
    errors.push('Category is required');
  }

  if (!duration || duration <= 0) {
    errors.push('Duration must be a positive number');
  }

  if (!difficulty || !['Beginner', 'Intermediate', 'Advanced'].includes(difficulty)) {
    errors.push('Difficulty must be Beginner, Intermediate, or Advanced');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

module.exports = {
  validateLogin,
  validateForgotPassword,
  validateResetCode,
  validateResetPassword,
  validateChangePassword,
  validateProfileUpdate,
  validateCoachRegistration,
  validateRecipe,
  validateExercise
};