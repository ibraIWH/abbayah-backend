const nodemailer = require('nodemailer');

// This will throw an error if env vars are missing – we want that in production
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true for 465, false for others
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendVerificationEmail = async (to, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
  await transporter.sendMail({
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