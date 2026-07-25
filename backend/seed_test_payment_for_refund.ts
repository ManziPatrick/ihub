import mongoose from 'mongoose';
import { Payment } from './src/models/Payment';
import { User } from './src/models/User';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
  const uri = process.env.MONGO_URI || 'mongodb://bootskills:bootskills@169.58.74.138:27017/?authSource=admin&directConnection=true';
  await mongoose.connect(uri);
  console.log('📦 Connected to MongoDB');

  // Find the test student
  const student = await User.findOne({ email: 'student@bootskills.com' });
  if (!student) {
    console.error('❌ Test student not found. Run seedMasterLogin first.');
    process.exit(1);
  }
  console.log(`✅ Found student: ${student.fullName} (${student._id})`);

  // Find a course to associate (any course)
  const Course = mongoose.model('Course');
  const course = await Course.findOne();
  
  // Create a completed payment (more than 3 days old so it's refundable within the window? No, we want it recent so refund works)
  // Actually the refund requires payment within 3 days, so let's create it 1 day ago
  const paymentDate = new Date();
  paymentDate.setDate(paymentDate.getDate() - 1); // 1 day ago

  const payment = await Payment.create({
    userId: student._id,
    amount: 50000,
    currency: 'RWF',
    status: 'completed',
    paymentMethod: 'MTN MoMo',
    transactionId: `test_refund_${Date.now()}`,
    type: 'Course Enrollment',
    itemTitle: course?.title || 'Test Course for Refund',
    courseId: course?._id,
    createdAt: paymentDate,
    updatedAt: paymentDate,
  });

  console.log(`✅ Created test payment: ${payment._id}`);
  console.log(`   Amount: ${payment.amount} ${payment.currency}`);
  console.log(`   Status: ${payment.status}`);
  console.log(`   Created: ${payment.createdAt}`);
  console.log(`\n🚀 Ready to test refund flow in browser!`);

  await mongoose.disconnect();
}

seed().catch(console.error);
