/**
 * End-to-end refund flow test
 * 
 * Tests: 
 * 1. Create a refund request for a completed PawaPay payment
 * 2. Verify the refund request (as admin)
 * 3. Approve the refund request (as super admin)
 * 4. Check that PawaPay refund was called and enrollment was removed
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const BACKEND_URL = 'http://localhost:4000/graphql';
const MONGO_URI = process.env.MONGO_URI || '';

async function graphqlRequest(query: string, variables: any = {}, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(BACKEND_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    console.error('GraphQL Errors:', JSON.stringify(json.errors, null, 2));
    throw new Error(json.errors[0]?.message || 'GraphQL error');
  }
  return json.data;
}

async function main() {
  console.log('🔍 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  // 1. Find a completed PawaPay deposit and its Payment record
  console.log('\n📋 Step 1: Finding completed PawaPay deposit...');
  
  const depositTx = await db.collection('paymenttransactions').findOne({
    paymentMethod: 'pawapay',
    pawapayDepositId: { $exists: true, $ne: '' },
    status: 'successful',
  }, { sort: { createdAt: -1 } });

  if (!depositTx) {
    console.error('❌ No completed PawaPay deposit found.');
    process.exit(1);
  }

  console.log(`   ✅ Found deposit: ${depositTx._id}`);
  console.log(`   Deposit ID: ${depositTx.pawapayDepositId}`);
  console.log(`   Amount: ${depositTx.amount} RWF`);
  console.log(`   User: ${depositTx.userId}`);
  console.log(`   Phone: ${depositTx.phoneNumber}`);

  // Find the Payment record linked to this deposit
  const payment = await db.collection('payments').findOne({
    $or: [
      { transactionId: depositTx.pawapayDepositId },
      { transactionId: { $regex: depositTx._id.toString().slice(-8), $options: 'i' } },
    ],
    status: 'completed',
  });

  if (!payment) {
    console.error('❌ No Payment record linked to this deposit.');
    // Try finding by user
    console.log('   Searching for any completed payment by this user...');
    const userPayments = await db.collection('payments').find({
      userId: depositTx.userId,
      status: 'completed',
    }).sort({ createdAt: -1 }).limit(3).toArray();
    
    if (userPayments.length === 0) {
      console.error('❌ No completed payments found for this user either.');
      process.exit(1);
    }
    
    console.log(`   ✅ Found payment by user: ${userPayments[0]._id}`);
    console.log(`   Amount: ${userPayments[0].amount} RWF`);
    console.log(`   TransactionId: ${userPayments[0].transactionId}`);
    console.log(`   CourseIds: ${JSON.stringify(userPayments[0].courseIds)}`);
    console.log(`   Method: ${userPayments[0].paymentMethod}`);
  }

  const activePayment = payment || userPayments[0];
  console.log(`   ✅ Using Payment: ${activePayment._id.toString()}`);
  console.log(`   Amount: ${activePayment.amount}`);
  console.log(`   User: ${activePayment.userId}`);
  console.log(`   Courses: ${JSON.stringify(activePayment.courseIds)}`);

  // 2. Get a super admin JWT token
  console.log('\n📋 Step 2: Getting super admin token...');
  const admin = await db.collection('users').findOne({ role: 'super_admin' });
  if (!admin) {
    console.error('❌ No super admin found.');
    process.exit(1);
  }
  console.log(`   ✅ Super admin: ${admin.email} (${admin._id})`);

  // Generate JWT
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { id: admin._id.toString(), email: admin.email, role: admin.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1h' }
  );
  console.log('   ✅ JWT generated');

  // Check if enrollemnts exist before refund
  console.log('\n📋 Checking enrollment state BEFORE refund...');
  if (activePayment.courseIds && activePayment.courseIds.length > 0) {
    for (const cid of activePayment.courseIds) {
      const course = await db.collection('courses').findOne({ _id: new mongoose.Types.ObjectId(cid) });
      if (course) {
        const wasEnrolled = course.studentsEnrolled?.some(
          (s: any) => s.toString() === activePayment.userId.toString()
        );
        console.log(`   Course ${cid}: student enrolled = ${wasEnrolled ? '✅ YES' : '❌ NO'}`);
      }
    }
  }

  // Check for existing OnHold disbursements
  const existingDisbursements = await db.collection('commissiondisbursements').find({
    paymentId: new mongoose.Types.ObjectId(activePayment._id),
  }).toArray();
  console.log(`   Disbursements for this payment: ${existingDisbursements.length}`);
  for (const d of existingDisbursements) {
    console.log(`   - ${d._id} | Status: ${d.status} | Net: ${d.netAmount} | Owner: ${d.ownerId}`);
  }

  // 3. Check if a refund request already exists
  console.log('\n📋 Step 3: Checking for existing refund requests...');
  const existingRefund = await db.collection('refundrequests').findOne({
    paymentId: new mongoose.Types.ObjectId(activePayment._id),
    status: { $in: ['pending', 'admin_verified', 'approved'] },
  });

  if (existingRefund) {
    console.log(`   ⚠️ Refund request already exists: ${existingRefund._id} (status: ${existingRefund.status})`);
    console.log(`   Skipping refund creation, will use existing one.`);
  } else {
    // 4. Create refund request
    console.log('\n📋 Step 4: Creating refund request via GraphQL...');
    const createMutation = `
      mutation RequestRefund($paymentId: ID!, $reason: String!) {
        requestRefund(paymentId: $paymentId, reason: $reason) {
          id
          paymentId
          userId
          amount
          reason
          status
          createdAt
        }
      }
    `;
    
    const createResult = await graphqlRequest(
      createMutation,
      { paymentId: activePayment._id.toString(), reason: 'E2E test refund - testing full refund flow' },
      token
    );
    console.log(`   ✅ Refund request created: ${createResult.requestRefund.id}`);
    console.log(`   Status: ${createResult.requestRefund.status}`);
    console.log(`   Amount: ${createResult.requestRefund.amount} RWF`);
  }

  // 5. Verify the refund request
  console.log('\n📋 Step 5: Verifying refund request...');
  const refundRequest = existingRefund || await db.collection('refundrequests').findOne({
    paymentId: new mongoose.Types.ObjectId(activePayment._id),
    status: 'pending',
  });

  if (!refundRequest) {
    console.error('❌ No pending refund request found to verify.');
    process.exit(1);
  }

  const verifyMutation = `
    mutation VerifyRefundRequest($id: ID!, $note: String) {
      verifyRefundRequest(id: $id, note: $note) {
        id
        status
        verifiedBy
        verifiedAt
        adminNote
      }
    }
  `;

  const verifyResult = await graphqlRequest(
    verifyMutation,
    { id: refundRequest._id.toString(), note: 'Verified via E2E test' },
    token
  );
  console.log(`   ✅ Refund verified: ${verifyResult.verifyRefundRequest.status}`);
  console.log(`   Verified by: ${verifyResult.verifyRefundRequest.verifiedBy}`);

  // 6. Approve the refund request
  console.log('\n📋 Step 6: Approving refund (this will trigger PawaPay refund API)...');
  const approveMutation = `
    mutation ApproveRefund($id: ID!, $note: String) {
      approveRefund(id: $id, note: $note) {
        id
        status
        approvedBy
        approvedAt
        refundedAmount
        refundFee
        refundableAmountAfterFee
        cancelledDisbursements
      }
    }
  `;

  const approveResult = await graphqlRequest(
    approveMutation,
    { id: refundRequest._id.toString(), note: 'Approved via E2E test' },
    token
  );
  
  console.log('\n📋 Step 7: Results:');
  console.log(`   ✅ Refund status: ${approveResult.approveRefund.status}`);
  console.log(`   ✅ Refunded amount: ${approveResult.approveRefund.refundedAmount} RWF`);
  console.log(`   💰 Refund fee (5%): ${approveResult.approveRefund.refundFee} RWF`);
  console.log(`   💰 To customer: ${approveResult.approveRefund.refundableAmountAfterFee} RWF`);
  console.log(`   ❌ Cancelled disbursements: ${approveResult.approveRefund.cancelledDisbursements?.length || 0}`);

  // 7. Verify enrollment was removed
  console.log('\n📋 Step 8: Verifying enrollment changes AFTER refund...');
  if (activePayment.courseIds && activePayment.courseIds.length > 0) {
    for (const cid of activePayment.courseIds) {
      const course = await db.collection('courses').findOne({ _id: new mongoose.Types.ObjectId(cid) });
      if (course) {
        const stillEnrolled = course.studentsEnrolled?.some(
          (s: any) => s.toString() === activePayment.userId.toString()
        );
        console.log(`   Course ${cid}: student enrolled = ${stillEnrolled ? '❌ STILL ENROLLED' : '✅ REMOVED'}`);
      }
    }
  }

  // 8. Check the Payment record status
  const updatedPayment = await db.collection('payments').findOne({ _id: activePayment._id });
  console.log(`\n   Payment status: ${updatedPayment?.status}`);
  console.log(`   Course progress records: ${(await db.collection('courseprogresses').countDocuments({ userId: activePayment.userId }))}`);

  // 9. Check PawaPay refund status by checking the payment transaction
  console.log('\n📋 Step 9: Checking original deposit transaction status...');
  const updatedTx = await db.collection('paymenttransactions').findOne({ _id: depositTx._id });
  console.log(`   Transaction status: ${updatedTx?.status}`);
  if (updatedTx?.metadata) {
    console.log(`   Refund settled at: ${updatedTx.metadata.refundSettledAt || 'N/A'}`);
  }

  await mongoose.disconnect();
  console.log('\n✅ Refund E2E test complete!');
}

main().catch(e => {
  console.error('❌ Test failed:', e.message || e);
  process.exit(1);
});
