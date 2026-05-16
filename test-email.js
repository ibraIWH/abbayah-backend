require('dotenv').config();

async function test() {
  const { sendVerificationEmail } = require('./src/utils/mailer');
  try {
    await sendVerificationEmail('vinestetion@gmail.com', 'test-token-123');
    console.log('✅ Email sent! Check your inbox.');
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

test();
