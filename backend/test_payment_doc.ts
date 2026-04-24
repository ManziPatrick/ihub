import mongoose from 'mongoose';
import { Payment } from './src/models/Payment';
import { PaymentTransaction } from './src/models/PaymentTransaction';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const paymentId = '69ea73b6c5994e98a7e343dd';
  
  const payment = await Payment.findById(paymentId).lean();
  console.log("--- Payment Document ---");
  console.log(payment);
  
  if (payment && payment.transactionId) {
    const tx = await PaymentTransaction.findOne({ paypackRef: payment.transactionId }).lean();
    console.log("\n--- PaymentTransaction Document ---");
    console.log(tx);
  }
  
  mongoose.disconnect();
}
run();
