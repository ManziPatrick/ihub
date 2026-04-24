import mongoose from 'mongoose';
import { Payment } from './src/models/Payment';
import { Course } from './src/models/Course';

const uri = 'mongodb://localhost:27017/codemande_hub'; 

async function run() {
  await mongoose.connect(uri);
  const paymentId = '69ea73b6c5994e98a7e343dd';
  const payment = await Payment.findById(paymentId).lean();
  console.log("Payment courseIds:", payment?.courseIds);
  
  if (payment && payment.courseIds && payment.courseIds.length > 0) {
    const courses = await Course.find({ _id: { $in: payment.courseIds } }).lean();
    console.log("Found courses:", courses.length);
    console.log("Course IDs found in DB:", courses.map(c => c._id.toString()));
  } else {
    console.log("No courseIds in Payment document!");
  }
  process.exit(0);
}
run().catch(console.error);
