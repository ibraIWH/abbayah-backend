const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

exports.sendVerificationSMS = async (phone, code) => {
  await client.messages.create({
    body: `Your Abyr Line verification code is: ${code}`,
    from: process.env.TWILIO_PHONE_NUMBER, // your Twilio phone number
    to: phone,
  });
};