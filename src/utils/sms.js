const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendVerificationSMS = async (phone, code) => {
  const digits = phone.replace(/\D/g, '');
  const gatewayDomain = process.env.SMS_GATEWAY_DOMAIN || 'mobily.com.sa';
  const to = `${digits}@${gatewayDomain}`;

  await sgMail.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: '',
    text: `Your Abyr Line verification code is: ${code}`,
  });
};