/**
 * Seed: Create a fresh OnHold disbursement for testing the approve flow
 * Sets releaseDate to yesterday so it's immediately approvable
 *
 * Usage: npx tsx seed_test_disbursement.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGO_URI || '');
  const db = mongoose.connection.db;
  if (!db) {
    console.error('Failed to get database connection');
    process.exit(1);
  }

  // Find the super_admin user
  const superAdmin = await db.collection('users').findOne({ role: 'super_admin' });
  if (!superAdmin) { console.error('No super_admin found'); process.exit(1); }
  console.log(`Using super_admin: ${superAdmin.username} (${superAdmin._id})`);

  // Find a course owned by super_admin
  const course = await db.collection('courses').findOne({
    $or: [{ instructor: superAdmin._id }, { createdBy: superAdmin._id }]
  });
  if (!course) { console.error('No course found for super_admin'); process.exit(1); }
  console.log(`Using course: ${course.title} (${course._id})`);

  // Create a payment for this course
  const paymentResult = await db.collection('payments').insertOne({
    userId: superAdmin._id,
    courseIds: [course._id],
    amount: 15000,
    currency: 'RWF',
    status: 'completed',
    paymentMethod: 'Mobile Money',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log(`Created payment: ${paymentResult.insertedId}`);

  // Create OnHold disbursement with past release date
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const disbursementId = new mongoose.Types.ObjectId();
  await db.collection('commissiondisbursements').insertOne({
    _id: disbursementId,
    paymentId: paymentResult.insertedId,
    customerId: superAdmin._id,
    ownerId: superAdmin._id,
    itemId: course._id,
    itemType: 'course',
    grossAmount: 15000,
    platformCommission: 1500,
    commissionType: 'percentage',
    commissionValue: 10,
    netAmount: 13500,
    ownerPhone: '0784086021',
    status: 'OnHold',
    releaseDate: yesterday,
    autoDisbursement: true,
    retryCount: 0,
    statusHistory: [{
      status: 'OnHold',
      timestamp: new Date(),
      note: 'Test disbursement for PawaPay-first approval flow. Release date set to past.',
    }],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log(`\n✅ Created test OnHold disbursement:`);
  console.log(`   ID:       ${disbursementId}`);
  console.log(`   Net:      13,500 RWF`);
  console.log(`   Phone:    0784086021`);
  console.log(`   Release:  ${yesterday.toISOString()} (PAST — approvable!)`);
  console.log(`\n   Run: npx tsx test_disbursement_flow.ts`);

  await mongoose.disconnect();
}

main().catch(console.error);
