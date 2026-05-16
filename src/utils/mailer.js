const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendVerificationEmail = async (to, token) => {
  const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email/${token}`;

  await sgMail.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
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