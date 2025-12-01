const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = 'uploads/images';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp + random string + extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, webp, gif) are allowed'), false);
  }
};

// Create upload instance with limits
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file per upload
  },
  fileFilter: fileFilter
});

// Middleware for single image upload
const uploadSingleImage = (fieldName) => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        // Handle multer errors
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              error: 'File size too large. Maximum size is 5MB'
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              success: false,
              error: 'Too many files. Only one file is allowed'
            });
          }
        }
        
        // Handle file filter errors
        if (err.message.includes('Only image files')) {
          return res.status(400).json({
            success: false,
            error: err.message
          });
        }

        // Handle other errors
        return res.status(500).json({
          success: false,
          error: 'File upload error'
        });
      }

      // If file was uploaded, add file info to request
      if (req.file) {
        req.file.path = req.file.path.replace(/\\/g, '/'); // Convert Windows path
        req.file.url = `/uploads/images/${req.file.filename}`;
      }

      next();
    });
  };
};

// Middleware for multiple image upload (for future use)
const uploadMultipleImages = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err) {
        // Handle multer errors
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              error: 'File size too large. Maximum size is 5MB per file'
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              success: false,
              error: `Too many files. Maximum ${maxCount} files are allowed`
            });
          }
        }
        
        // Handle file filter errors
        if (err.message.includes('Only image files')) {
          return res.status(400).json({
            success: false,
            error: err.message
          });
        }

        // Handle other errors
        return res.status(500).json({
          success: false,
          error: 'File upload error'
        });
      }

      // If files were uploaded, add file info to request
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          file.path = file.path.replace(/\\/g, '/'); // Convert Windows path
          file.url = `/uploads/images/${file.filename}`;
        });
      }

      next();
    });
  };
};

// Helper function to delete uploaded file
const deleteUploadedFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
  return false;
};

// Middleware to clean up uploaded files on error
const cleanupUploads = (req, res, next) => {
  // Store original send function
  const originalSend = res.send;

  // Override send function
  res.send = function(data) {
    // If response indicates an error (4xx or 5xx), cleanup uploaded files
    if (res.statusCode >= 400) {
      if (req.file) {
        deleteUploadedFile(req.file.path);
      }
      if (req.files) {
        req.files.forEach(file => {
          deleteUploadedFile(file.path);
        });
      }
    }
    
    // Call original send
    originalSend.call(this, data);
  };

  next();
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  deleteUploadedFile,
  cleanupUploads
};