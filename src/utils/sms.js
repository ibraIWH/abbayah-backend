const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendVerificationSMS = async (phone, code) => {
  // Remove non-digit characters
  const digits = phone.replace(/\D/g, '');
  const gatewayDomain = process.env.SMS_GATEWAY_DOMAIN || 'mobily.com.sa';
  const to = `${digits}@${gatewayDomain}`;

  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL || 'vinestetion@gmail.com',
    subject: '',
    text: `Your Abyr Line verification code is: ${code}`,
  };

  console.log('Sending SMS to:', to);

  await sgMail.send(msg);
  console.log('SMS sent successfully');
};