/**
 * Email Service
 * Handles all email sending functionality using Nodemailer
 */

import nodemailer from 'nodemailer';

// Create transporter
let transporter = null;

/**
 * Initialize email transporter
 * Called once at app startup
 */
export const initEmailService = () => {
    try {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false // Allow self-signed certs
            }
        });

        console.log('✅ Email service initialized');
        return true;
    } catch (error) {
        console.error('❌ Email service initialization failed:', error.message);
        return false;
    }
};

/**
 * Verify email configuration
 * @returns {Promise<boolean>}
 */
export const verifyEmailConfig = async () => {
    try {
        if (!transporter) {
            initEmailService();
        }
        await transporter.verify();
        console.log('✅ Email configuration verified');
        return true;
    } catch (error) {
        console.error('❌ Email configuration error:', error.message);
        return false;
    }
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @returns {Promise<Object>} - Send result
 */
export const sendEmail = async ({ to, subject, text, html }) => {
    try {
        if (!transporter) {
            initEmailService();
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || `"Campus Share" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text,
            html
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${to}: ${result.messageId}`);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Email send error:', error);
        throw new Error('Failed to send email. Please try again later.');
    }
};

/**
 * Send OTP email
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {string} username - User's username
 * @returns {Promise<Object>}
 */
export const sendOTPEmail = async (email, otp, username = 'User') => {
    const subject = 'Campus Share - Verify Your Email';

    const text = `
Hello ${username},

Your verification code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
Campus Share Team
  `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 500px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                📁 Campus Share
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 24px;">
                Hello <strong>${username}</strong>,
              </p>
              
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 24px;">
                Welcome to Campus Share! Please use the following verification code to complete your registration:
              </p>
              
              <!-- OTP Box -->
              <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 36px; font-weight: 700; color: #6366f1; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${otp}
                </span>
              </div>
              
              <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px; line-height: 20px;">
                ⏰ This code will expire in <strong>10 minutes</strong>.
              </p>
              
              <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 20px;">
                If you didn't request this code, please ignore this email. Someone might have entered your email by mistake.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Campus Share. Made for students, by students.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

    return await sendEmail({ to: email, subject, text, html });
};

/**
 * Send welcome email after successful verification
 * @param {string} email - Recipient email
 * @param {string} username - User's username
 * @returns {Promise<Object>}
 */
export const sendWelcomeEmail = async (email, username) => {
    const subject = 'Welcome to Campus Share! 🎉';

    const text = `
Hello ${username},

Welcome to Campus Share! Your email has been verified and your account is now active.

You can now:
- Upload and download files from any device
- Create folders to organize your files
- Use the clipboard feature to share text
- Access your files from anywhere

Start sharing: ${process.env.CLIENT_URL}

Best regards,
Campus Share Team
  `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Campus Share</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 500px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🎉 Welcome Aboard!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 24px;">
                Hello <strong>${username}</strong>,
              </p>
              
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 24px;">
                Your email has been verified and your Campus Share account is now active! 🚀
              </p>
              
              <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 24px;">
                Here's what you can do:
              </p>
              
              <ul style="margin: 0 0 24px; padding-left: 24px; color: #374151; font-size: 15px; line-height: 28px;">
                <li>📤 Upload files, photos, and videos</li>
                <li>📁 Create folders to stay organized</li>
                <li>📋 Use clipboard for quick text sharing</li>
                <li>📱 Access from any device</li>
              </ul>
              
              <a href="${process.env.CLIENT_URL}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Start Sharing Files →
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Campus Share. Made for students, by students.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

    return await sendEmail({ to: email, subject, text, html });
};

export default {
    initEmailService,
    verifyEmailConfig,
    sendEmail,
    sendOTPEmail,
    sendWelcomeEmail
};
