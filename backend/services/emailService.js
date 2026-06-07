/**
 * Email Service for Thrift-Link
 * In a real production environment, you would use Nodemailer with an SMTP server
 * or a service like SendGrid, Mailgun, or AWS SES.
 */

const isProd = process.env.NODE_ENV === 'production';

const sendEmail = async ({ to, subject, text, html }) => {
  console.log('--------------------------------------------');
  console.log(`SENDING EMAIL TO: ${to}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`BODY: ${text}`);
  console.log('--------------------------------------------');
  
  // If we had nodemailer configured, it would look like this:
  /*
  const transporter = nodemailer.createTransport({...});
  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, text, html });
  */
  
  return { success: true, message: 'Email sent (simulated)' };
};

const templates = {
  registration: (name) => ({
    subject: 'Welcome to Thrift-Link!',
    text: `Hi ${name},\n\nWelcome to Thrift-Link! We're excited to have you on board. You can now start browsing and buying from verified vendors.\n\nBest regards,\nThe Thrift-Link Team`,
    html: `<h1>Welcome to Thrift-Link!</h1><p>Hi ${name},</p><p>Welcome to Thrift-Link! We're excited to have you on board. You can now start browsing and buying from verified vendors.</p><p>Best regards,<br>The Thrift-Link Team</p>`
  }),
  orderConfirmation: (orderId, total) => ({
    subject: `Order Confirmation #${orderId.slice(0, 8)}`,
    text: `Thank you for your order!\n\nYour order #${orderId.slice(0, 8)} for ₦${total.toLocaleString()} has been received and is being processed by the vendor.\n\nYou can track your order in your dashboard.\n\nBest regards,\nThe Thrift-Link Team`,
    html: `<h1>Order Confirmation</h1><p>Thank you for your order!</p><p>Your order <strong>#${orderId.slice(0, 8)}</strong> for <strong>₦${total.toLocaleString()}</strong> has been received and is being processed by the vendor.</p><p>You can track your order in your dashboard.</p>`
  }),
  passwordReset: (token) => ({
    subject: 'Password Reset Request',
    text: `You requested a password reset. Please use the following link to reset your password: ${process.env.FRONTEND_URL}/reset-password?token=${token}\n\nIf you didn't request this, please ignore this email.`,
    html: `<h1>Password Reset</h1><p>You requested a password reset. Please click the link below to reset your password:</p><p><a href="${process.env.FRONTEND_URL}/reset-password?token=${token}">Reset Password</a></p><p>If you didn't request this, please ignore this email.</p>`
  })
};

module.exports = { sendEmail, templates };
