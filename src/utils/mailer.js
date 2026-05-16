const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 8000,      // 8 seconds to establish connection
  greetingTimeout: 8000,        // 8 seconds for SMTP greeting
  socketTimeout: 8000,          // 8 seconds of inactivity
});

exports.sendVerificationEmail = (to, token) => {
  const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email/${token}`;
  
  // Return a promise but we'll handle errors outside
  return transporter.sendMail({
    from: `"Abyr Line" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Verify your email address',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#5C0A14;">Welcome to Abyr Line</h2>
        <p>Please click the button below to verify your email and activate your account.</p>
        <a href="${verifyUrl}" 
           style="display:inline-block;padding:12px 24px;background:#5C0A14;color:#fff;text-decoration:none;border-radius:4px;">
           Verify Email
        </a>
        <p style="margin-top:20px;color:#888;">If you didn't create an account, ignore this email.</p>
      </div>
    `,
  });
};