const nodemailer = require('nodemailer');

/**
 * Create email transporter
 * This will be used to send verification and password reset emails
 */
const createTransporter = () => {
  // For Gmail, you need to:
  // 1. Enable 2-factor authentication
  // 2. Generate an App Password
  // 3. Use that App Password in EMAIL_PASSWORD
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // Verify connection configuration
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email configuration error:', error.message);
    } else {
      console.log('✅ Email server is ready to send messages');
    }
  });

  return transporter;
};

module.exports = createTransporter;