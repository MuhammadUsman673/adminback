const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false // For development only
    }
  });
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetCode) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Password Reset Request - Fitness Admin',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>You have requested to reset your password for the Fitness Admin Panel.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0; color: #333;">Your Reset Code:</h3>
            <div style="font-size: 32px; font-weight: bold; color: #f59e0b; letter-spacing: 5px; margin: 10px 0;">
              ${resetCode}
            </div>
            <p style="color: #666; font-size: 14px; margin: 5px 0;">This code will expire in 15 minutes</p>
          </div>
          
          <p>Enter this code on the password reset page to create a new password.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <p style="color: #666; font-size: 12px;">
            This is an automated message from Fitness Admin Panel. Please do not reply to this email.
          </p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// Send verification email (for app users)
const sendVerificationEmail = async (email, verificationCode) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Verify Your Email - Fitness App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Welcome to Fitness App!</h2>
          <p>Thank you for registering. Please verify your email address to activate your account.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0; color: #333;">Verification Code:</h3>
            <div style="font-size: 32px; font-weight: bold; color: #f59e0b; letter-spacing: 5px; margin: 10px 0;">
              ${verificationCode}
            </div>
            <p style="color: #666; font-size: 14px; margin: 5px 0;">Enter this code to verify your email</p>
          </div>
          
          <p>This code will expire in 24 hours.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <p style="color: #666; font-size: 12px;">
            If you didn't create an account, please ignore this email.
          </p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email to coach
const sendCoachWelcomeEmail = async (email, name, temporaryPassword) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Welcome Coach - Fitness Admin Panel',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Welcome to Fitness Admin Panel!</h2>
          <p>Hello ${name},</p>
          <p>Your coach account has been created successfully.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Login Credentials:</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${temporaryPassword}</p>
          </div>
          
          <p><strong>Important:</strong> Please change your password after first login.</p>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #f59e0b; padding: 10px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>Security Tip:</strong> Never share your password with anyone.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <p style="color: #666; font-size: 12px;">
            This account has been created by Fitness Admin Panel administrator.
          </p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Coach welcome email sent to ${email}`);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error sending coach welcome email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendCoachWelcomeEmail
};