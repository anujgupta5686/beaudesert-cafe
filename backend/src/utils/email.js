const nodemailer = require('nodemailer');

console.log('🔧 Loading Email Utility...');

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: 587,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

const sendEmail = async (to, subject, html) => {
    console.log(`📧 Sending email to: ${to}`);
    console.log(`📧 Subject: ${subject}`);

    try {
        const info = await transporter.sendMail({
            from: process.env.MAIL_USER,
            to,
            subject,
            html
        });
        console.log('✅ Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return false;
    }
};

// Send OTP for password reset
const sendPasswordResetOTP = async (email, otp) => {
    console.log('🔑 Sending password reset OTP to:', email);

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #b45309;">☕ Beaudesert Cafe</h2>
        <h3 style="color: #374151;">Password Reset Request</h3>
      </div>
      
      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">Your OTP for password reset is:</p>
        <h1 style="color: #b45309; font-size: 32px; letter-spacing: 8px; margin: 10px 0;">${otp}</h1>
        <p style="color: #6b7280; font-size: 14px;">This OTP will expire in 10 minutes.</p>
      </div>
      
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #374151; font-size: 14px; margin: 0;">
          <strong>Didn't request this?</strong><br>
          If you didn't request a password reset, please ignore this email.
        </p>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} Beaudesert Cafe. All rights reserved.
      </p>
    </div>
  `;

    return await sendEmail(email, '🔐 Password Reset OTP - Beaudesert Cafe', html);
};

// Send password changed confirmation
const sendPasswordChangedEmail = async (email) => {
    console.log('📧 Sending password changed confirmation to:', email);

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #b45309;">☕ Beaudesert Cafe</h2>
        <h3 style="color: #374151;">Password Changed Successfully</h3>
      </div>
      
      <div style="background: #d1fae5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="color: #065f46; font-size: 16px;">
          ✅ Your password has been changed successfully.
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          If you did not make this change, please contact support immediately.
        </p>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} Beaudesert Cafe. All rights reserved.
      </p>
    </div>
  `;

    return await sendEmail(email, '✅ Password Changed - Beaudesert Cafe', html);
};

module.exports = { sendEmail, sendPasswordResetOTP, sendPasswordChangedEmail };