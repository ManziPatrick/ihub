import mongoose from 'mongoose';
import { Payment } from './src/models/Payment';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const latestPayment = await Payment.findOne().sort({ createdAt: -1 });
  console.log("Latest Payment:", latestPayment);
  mongoose.disconnect();
}
run();
