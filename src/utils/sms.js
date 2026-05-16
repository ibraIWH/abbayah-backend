// src/utils/sms.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 8000,
  greetingTimeout: 8000,
  socketTimeout: 8000,
});

exports.sendVerificationSMS = (phone, code) => {
  const digits = phone.replace(/\D/g, '');
  const gatewayDomain = process.env.SMS_GATEWAY_DOMAIN || 'mobily.com.sa';
  const to = `${digits}@${gatewayDomain}`;

  return transporter.sendMail({
    from: `"Abyr Line" <${process.env.SMTP_USER}>`,
    to,
    subject: '',
    text: `Your Abyr Line verification code is: ${code}`,
  });
};