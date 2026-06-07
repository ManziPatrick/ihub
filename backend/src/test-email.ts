import { sendEmail } from './services/email.service';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTest() {
  console.log('--- SMTP Test Script ---');
  console.log('Target:', 'munyeshurimanzi@gmail.com');
  console.log('Using credentials from .env...');

  // Connect to DB because email.service checks DB config first
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ihub_hub';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');
  } catch (err) {
    console.log('MongoDB connection failed, service will fall back to .env values.');
  }

  const result = await sendEmail({
    to: 'munyeshurimanzi@gmail.com',
    subject: 'Bootskills Academy - SMTP Validation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h1 style="color: #EAB308;">SMTP Configuration Verified</h1>
        <p>Hello,</p>
        <p>This is a test email from the <strong>Bootskills Academy</strong> platform.</p>
        <p>The SMTP settings for <strong>Zoho Mail</strong> have been successfully configured and verified using your App Password.</p>
        <hr/>
        <p style="font-size: 12px; color: #666;">Sent at: ${new Date().toLocaleString()}</p>
      </div>
    `
  });

  if (result) {
    console.log('SUCCESS: Email sent to munyeshurimanzi@gmail.com');
  } else {
    console.log('FAILED: Email failed to send. Check console for details.');
  }

  await mongoose.disconnect();
  process.exit(0);
}

runTest();
