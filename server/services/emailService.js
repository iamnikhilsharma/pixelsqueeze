const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');

function buildTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    logger.warn('SMTP not configured; emails will be skipped');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

async function sendPasswordResetEmail(to, token) {
  try {
    const transporter = buildTransport();
    if (!transporter) return false;

    const from = process.env.EMAIL_FROM || 'no-reply@pixelsqueeze.app';
    const appUrl = process.env.PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;

    const info = await transporter.sendMail({
      from,
      to,
      subject: 'Reset your PixelSqueeze password',
      html: `
        <p>You requested a password reset.</p>
        <p>Click the link below to reset your password. This link expires soon.</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    logger.info(`Password reset email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    return false;
  }
}

module.exports = { sendPasswordResetEmail };