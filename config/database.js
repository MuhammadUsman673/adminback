const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Check if admin user exists, if not create it
    await ensureAdminUser();
    
  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`);
    process.exit(1);
  }
};

// Function to ensure admin user exists
const ensureAdminUser = async () => {
  try {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: adminEmail, 
      role: 'admin' 
    });
    
    if (!existingAdmin) {
      // Create admin user by inserting directly to avoid pre-save hook issues
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      // Use insertOne to bypass Mongoose middleware
      await User.collection.insertOne({
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Admin user created successfully');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error ensuring admin user:', error.message);
  }
};

module.exports = connectDB;