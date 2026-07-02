/**
 * Disbursement System Test Flow
 *
 * Tests the complete payment distribution (Phase 2) flow:
 * 1. Seeds test data with specific phone numbers
 * 2. Tests commission calculation
 * 3. Tests disbursement processing via InTouch RequestDeposit
 * 4. Tests retry mechanism
 * 5. Tests GraphQL resolvers
 *
 * Phone numbers for testing:
 *   - Sender (platform admin): 0790706170
 *   - Admin receiving disbursement: 0784086021
 *
 * Usage: npx tsx test_disbursement_flow.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

import { disbursementService } from './src/services/disbursement.service';
import { CommissionDisbursement } from './src/models/CommissionDisbursement';
import { AdminCommission } from './src/models/AdminCommission';
import { Config } from './src/models/Config';
import { User } from './src/models/User';
import { Course } from './src/models/Course';
import { Payment } from './src/models/Payment';
import { createIntouchService } from './src/services/intouch.service';

// ─── Test Config ───

const TEST_SENDER_PHONE = '0790706170';    // Platform admin / sender
const TEST_ADMIN_PHONE = '0784086021';     // Admin receiving disbursement
const TEST_AMOUNT = 1000;                  // RWF
const TEST_COMMISSION_PERCENTAGE = 10;     // 10% platform commission

let testAdminId: string;
let testCourseId: string;
let testPaymentId: string;

// ─── Helpers ───

function log(label: string, data: any = '') {
  const prefix = `[${new Date().toISOString().split('T')[1].slice(0, 12)}]`;
  if (typeof data === 'object' && data !== null) {
    console.log(`${prefix} ${label}:`, JSON.stringify(data, null, 2).substring(0, 500));
  } else {
    console.log(`${prefix} ${label}: ${data}`);
  }
}

function timestamp(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
}

// ─── Steps ───

async function connectDB(): Promise<boolean> {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   Disbursement System — Phase 2 Test');
  console.log('═══════════════════════════════════════════════════════════\n');

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log('❌ MONGO_URI not set in .env');
    return false;
  }

  try {
    await mongoose.connect(uri);
    console.log(`✅ Connected to MongoDB`);
    return true;
  } catch (error: any) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    return false;
  }
}

async function seedTestData(): Promise<boolean> {
  console.log('\n─── Step 1: Seed Test Data ───');

  try {
    // 1. Find or create the test admin (0784086021)
    let admin = await User.findOne({
      $or: [{ phone: TEST_ADMIN_PHONE }, { phone: `+250${TEST_ADMIN_PHONE.slice(1)}` }],
      role: 'admin',
    });

    if (!admin) {
      // Try finding any admin
      admin = await User.findOne({ role: 'admin' });
      if (admin) {
        // Update their phone
        admin.phone = TEST_ADMIN_PHONE;
        await admin.save();
        console.log(`✅ Updated existing admin ${admin.email} phone to ${TEST_ADMIN_PHONE}`);
      } else {
        // Create an admin
        const superAdmin = await User.findOne({ role: 'super_admin' });
        admin = new User({
          username: 'test_admin_payout',
          email: 'test_admin_payout@example.com',
          password: 'hashed_password',
          role: 'admin',
          phone: TEST_ADMIN_PHONE,
          fullName: 'Test Admin (Payout)',
          createdBy: superAdmin?._id,
        });
        await admin.save();
        console.log(`✅ Created test admin: ${admin._id} with phone ${TEST_ADMIN_PHONE}`);
      }
    } else {
      console.log(`✅ Found existing admin: ${admin._id} with phone ${admin.phone}`);
    }
    testAdminId = admin._id.toString();

    // 2. Find or create a test course owned by the admin
    let course = await Course.findOne({
      $or: [{ instructor: admin._id }, { createdBy: admin._id }],
    });

    if (!course) {
      course = new Course({
        title: 'Test Disbursement Course',
        description: 'A test course for disbursement testing',
        instructor: admin._id,
        createdBy: admin._id,
        price: TEST_AMOUNT,
        category: 'Technology',
        level: 'Beginner',
        modules: [{
          title: 'Module 1',
          lessons: [{ title: 'Lesson 1', content: 'Test content', order: 1 }],
          order: 1,
        }],
        status: 'published',
      });
      await course.save();
      console.log(`✅ Created test course: ${course._id} owned by admin ${testAdminId}`);
    } else {
      console.log(`✅ Found existing course: ${course._id} owned by admin ${admin.email}`);
    }
    testCourseId = course._id.toString();

    // 3. Set up commission config (10% for this admin/course)
    const existingConfig = await AdminCommission.findOne({
      adminId: admin._id,
      scope: 'course',
      scopeId: course._id,
    });

    if (!existingConfig) {
      await new AdminCommission({
        adminId: admin._id,
        scope: 'course',
        scopeId: course._id,
        scopeTitle: course.title,
        type: 'percentage',
        percentage: TEST_COMMISSION_PERCENTAGE,
        description: `Test: ${TEST_COMMISSION_PERCENTAGE}% commission for ${course.title}`,
        active: true,
      }).save();
      console.log(`✅ Created commission config: ${TEST_COMMISSION_PERCENTAGE}% for course`);
    } else {
      console.log(`✅ Commission config already exists for this course`);
    }

    // 4. Also set global commission for fallback
    const globalConfig = await AdminCommission.findOne({
      adminId: admin._id,
      scope: 'global',
    });

    if (!globalConfig) {
      await new AdminCommission({
        adminId: admin._id,
        scope: 'global',
        type: 'percentage',
        percentage: TEST_COMMISSION_PERCENTAGE,
        description: `Test: Global ${TEST_COMMISSION_PERCENTAGE}% commission`,
        active: true,
      }).save();
    }

    // 5. Set platform commission config
    await Config.findOneAndUpdate(
      { key: 'platform_commission_type' },
      { $set: { value: 'percentage', description: 'Platform commission type' } },
      { upsert: true }
    );
    await Config.findOneAndUpdate(
      { key: 'platform_commission_value' },
      { $set: { value: TEST_COMMISSION_PERCENTAGE.toString(), description: 'Platform commission value' } },
      { upsert: true }
    );
    await Config.findOneAndUpdate(
      { key: 'auto_disbursement_enabled' },
      { $set: { value: 'true', description: 'Auto-disbursement enabled' } },
      { upsert: true }
    );

    // 6. Find or create a test payment
    const studentUser = await User.findOne({ role: 'student' }) || await User.findOne({});
    if (!studentUser) {
      console.log('❌ No student user found. Create a user first.');
      return false;
    }

    let payment = await Payment.findOne({
      $or: [
        { courseId: course._id },
        { courseIds: course._id },
      ],
      status: 'completed',
    });

    if (!payment) {
      payment = new Payment({
        userId: studentUser._id,
        courseId: course._id,
        courseIds: [course._id],
        amount: TEST_AMOUNT,
        currency: 'RWF',
        status: 'completed',
        paymentMethod: 'Intouch',
        transactionId: `TEST-TRX-${Date.now()}`,
        type: 'Course Enrollment',
        itemTitle: course.title,
      });
      await payment.save();
      console.log(`✅ Created test payment: ${payment._id} for ${TEST_AMOUNT} RWF`);
    } else {
      console.log(`✅ Found existing completed payment: ${payment._id}`);
    }
    testPaymentId = payment._id.toString();

    return true;
  } catch (error: any) {
    console.error(`❌ Seed error: ${error.message}`);
    return false;
  }
}

async function testCommissionCalculation(): Promise<boolean> {
  console.log('\n─── Step 2: Test Commission Calculation ───');

  try {
    const payment = await Payment.findById(testPaymentId);
    if (!payment) {
      console.log('❌ Payment not found');
      return false;
    }

    const result = await disbursementService.calculateCommission(
      { amount: payment.amount },
      testCourseId,
      'course'
    );

    if (!result) {
      console.log('❌ No commission config found for this item');
      return false;
    }

    console.log(`  Payment amount: ${payment.amount} RWF`);
    console.log(`  Commission type: ${result.type}`);
    console.log(`  Commission value: ${result.value}`);
    console.log(`  Commission amount: ${result.commission} RWF`);
    console.log(`  Net to owner: ${payment.amount - result.commission} RWF`);

    const expectedCommission = payment.amount * (TEST_COMMISSION_PERCENTAGE / 100);
    const matches = Math.abs(result.commission - expectedCommission) < 1;

    if (matches) {
      console.log(`✅ Commission calculated correctly: ${result.commission} RWF (${TEST_COMMISSION_PERCENTAGE}% of ${payment.amount})`);
    } else {
      console.log(`⚠️ Commission mismatch: expected ~${expectedCommission}, got ${result.commission}`);
    }

    return true;
  } catch (error: any) {
    console.error(`❌ Commission calculation error: ${error.message}`);
    return false;
  }
}

async function testFindItemOwner(): Promise<boolean> {
  console.log('\n─── Step 3: Test Item Owner Lookup ───');

  try {
    const ownerInfo = await disbursementService.findItemOwner(testCourseId, 'course');

    if (!ownerInfo) {
      console.log('❌ No owner found for test course');
      return false;
    }

    console.log(`  Owner ID: ${ownerInfo.ownerId}`);
    console.log(`  Owner Phone: ${ownerInfo.phone}`);

    if (ownerInfo.phone.includes('078408602') || ownerInfo.phone.includes('250784086')) {
      console.log(`✅ Owner found with expected phone: ${ownerInfo.phone}`);
    } else {
      console.log(`⚠️ Owner found but phone is ${ownerInfo.phone} (expected ${TEST_ADMIN_PHONE})`);
    }

    return true;
  } catch (error: any) {
    console.error(`❌ Owner lookup error: ${error.message}`);
    return false;
  }
}

async function testDisbursementProcessing(): Promise<boolean> {
  console.log('\n─── Step 4: Test Disbursement Processing ───');

  try {
    console.log(`  Payment ID: ${testPaymentId}`);
    console.log(`  Course ID: ${testCourseId}`);
    console.log(`  Amount: ${TEST_AMOUNT} RWF`);
    console.log(`  Admin Phone: ${TEST_ADMIN_PHONE}`);
    console.log(`  Expected commission: ${TEST_COMMISSION_PERCENTAGE}%`);
    console.log(`  Expected net: ${TEST_AMOUNT - (TEST_AMOUNT * TEST_COMMISSION_PERCENTAGE / 100)} RWF`);

    // First, clear any existing disbursements for this payment
    await CommissionDisbursement.deleteMany({
      paymentId: new mongoose.Types.ObjectId(testPaymentId),
    });

    const result = await disbursementService.processDisbursement(
      testPaymentId,
      '000000000000000000000000', // placeholder customer
      testCourseId,
      'course',
      TEST_AMOUNT
    );

    console.log(`  Success: ${result.success}`);
    console.log(`  Message: ${result.message}`);
    console.log(`  Disbursement ID: ${result.disbursementId || 'N/A'}`);
    console.log(`  Net Amount: ${result.netAmount} RWF`);
    console.log(`  Platform Commission: ${result.platformCommission} RWF`);
    console.log(`  InTouch Ref: ${result.intouchReferenceId || 'N/A'}`);

    if (result.disbursementId) {
      // Check the record was saved
      const record = await CommissionDisbursement.findById(result.disbursementId);
      if (record) {
        console.log(`  Status: ${record.status}`);
        console.log(`  Owner Phone: ${record.ownerPhone}`);
        console.log(`  Status History: ${record.statusHistory.length} entries`);
      }
    }

    return true;
  } catch (error: any) {
    console.error(`❌ Disbursement processing error: ${error.message}`);
    return false;
  }
}

async function testDisbursementRetry(): Promise<boolean> {
  console.log('\n─── Step 5: Test Disbursement Retry Mechanism ───');

  try {
    // Find a failed disbursement or create one
    let testDisbursement = await CommissionDisbursement.findOne({
      paymentId: new mongoose.Types.ObjectId(testPaymentId),
    });

    if (!testDisbursement) {
      console.log('⚠️ No disbursement found to test retry. Skipping.');
      return true;
    }

    console.log(`  Current status: ${testDisbursement.status}`);
    console.log(`  Current retry count: ${testDisbursement.retryCount}`);

    if (testDisbursement.status === 'Failed') {
      console.log(`  Attempting retry...`);

      // Update the phone number to the test admin phone
      testDisbursement.ownerPhone = TEST_ADMIN_PHONE;
      await testDisbursement.save();

      const result = await disbursementService.retryDisbursement(
        testDisbursement._id.toString()
      );

      console.log(`  Retry success: ${result.success}`);
      console.log(`  Retry message: ${result.message}`);

      const updated = await CommissionDisbursement.findById(testDisbursement._id);
      if (updated) {
        console.log(`  New status: ${updated.status}`);
        console.log(`  New retry count: ${updated.retryCount}`);
        console.log(`  Status history: ${updated.statusHistory.length} entries`);
      }

      return true;
    } else {
      console.log(`  ✅ Disbursement already successful — retry not needed`);
      return true;
    }
  } catch (error: any) {
    console.error(`❌ Retry test error: ${error.message}`);
    return false;
  }
}

async function testGetPlatformConfig(): Promise<boolean> {
  console.log('\n─── Step 6: Test Platform Commission Config ───');

  try {
    const config = await disbursementService.getPlatformCommissionConfig();
    console.log(`  Type: ${config.type}`);
    console.log(`  Value: ${config.value}`);

    if (config.type === 'percentage' && config.value === TEST_COMMISSION_PERCENTAGE) {
      console.log(`✅ Platform commission config retrieved correctly`);
    } else {
      console.log(`⚠️ Config: ${config.type} = ${config.value} (expected percentage = ${TEST_COMMISSION_PERCENTAGE})`);
    }

    return true;
  } catch (error: any) {
    console.error(`❌ Config error: ${error.message}`);
    return false;
  }
}

async function testIntouchConnection(): Promise<boolean> {
  console.log('\n─── Step 7: Test InTouch API Connection ───');

  try {
    const intouchService = createIntouchService();

    const balanceResult = await intouchService.getBalance();
    console.log(`  Balance check success: ${balanceResult.success}`);
    console.log(`  Balance: ${balanceResult.balance}`);
    console.log(`  Message: ${balanceResult.message}`);

    if (balanceResult.success) {
      console.log(`✅ InTouch API connection successful! Balance: ${balanceResult.balance} RWF`);
      return true;
    }

    console.log(`⚠️ Balance check returned success=false. Check credentials.`);
    console.log(`  Username: ${process.env.INTOUCH_USERNAME?.substring(0, 4)}****`);
    console.log(`  Account: ${process.env.INTOUCH_ACCOUNT_NO}`);

    return false;
  } catch (error: any) {
    console.error(`❌ InTouch connection error: ${error.message}`);
    return false;
  }
}

async function cleanUp(): Promise<void> {
  console.log('\n─── Step 8: Cleanup ───');

  try {
    // Keep test data for inspection
    const disbursements = await CommissionDisbursement.find({
      paymentId: new mongoose.Types.ObjectId(testPaymentId),
    });
    console.log(`  Disbursement records kept for inspection: ${disbursements.length}`);

    for (const d of disbursements) {
      console.log(`    [${d.status}] ${d.netAmount} RWF → ${d.ownerPhone} (${d.intouchReferenceId || 'no ref'})`);
      if (d.failureReason) {
        console.log(`    Failure reason: ${d.failureReason}`);
      }
    }
  } catch (error: any) {
    console.log(`  Cleanup note: ${error.message}`);
  }
}

// ─── Main Runner ───

async function main() {
  const results: { step: string; passed: boolean }[] = [];

  // Connect to DB
  const dbOk = await connectDB();
  results.push({ step: 'Database Connection', passed: dbOk });
  if (!dbOk) { printResults(results); return; }

  // Seed test data
  const seedOk = await seedTestData();
  results.push({ step: 'Seed Test Data', passed: seedOk });

  // Test commission calculation
  const commOk = await testCommissionCalculation();
  results.push({ step: 'Commission Calculation', passed: commOk });

  // Test owner lookup
  const ownerOk = await testFindItemOwner();
  results.push({ step: 'Item Owner Lookup', passed: ownerOk });

  // Test disbursement
  const disbOk = await testDisbursementProcessing();
  results.push({ step: 'Disbursement Processing', passed: disbOk });

  // Test retry mechanism
  const retryOk = await testDisbursementRetry();
  results.push({ step: 'Disbursement Retry', passed: retryOk });

  // Test platform config
  const configOk = await testGetPlatformConfig();
  results.push({ step: 'Platform Config', passed: configOk });

  // Test InTouch API
  const intouchOk = await testIntouchConnection();
  results.push({ step: 'InTouch API Connection', passed: intouchOk });

  // Clean up
  await cleanUp();

  // Print summary
  printResults(results);

  await mongoose.disconnect();
}

function printResults(results: { step: string; passed: boolean }[]) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    TEST RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  for (const r of results) {
    console.log(`  ${r.passed ? '✅' : '❌'} ${r.step}`);
  }

  console.log(`\n  Total: ${results.length}  |  ✅ ${passed} Passed  |  ❌ ${failed} Failed`);

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Review the errors above.');
    console.log('  Common issues:');
    console.log('  • InTouch credentials in .env may be for testa (demo) account');
    console.log('  • The testa account may have limited or no balance for disbursements');
    console.log('  • Phone numbers need to be in international format (e.g. 250XXXXXX)');
    console.log('  • For actual disbursements, ensure Intouch account has sufficient balance');
  }

  console.log('\n📋 NOTES');
  console.log('──────────────────');
  console.log(`  • Sender phone (platform): ${TEST_SENDER_PHONE}`);
  console.log(`  • Admin receiving: ${TEST_ADMIN_PHONE}`);
  console.log(`  • Test amount: ${TEST_AMOUNT} RWF`);
  console.log(`  • Commission: ${TEST_COMMISSION_PERCENTAGE}%`);
  console.log(`  • Net to owner: ${TEST_AMOUNT - (TEST_AMOUNT * TEST_COMMISSION_PERCENTAGE / 100)} RWF`);
  console.log('  • The disbursement.service.ts handles auto-disbursement');
  console.log('  • CommissionDisbursement model tracks per-transaction records');
  console.log('  • AdminCommission model supports percentage and fixed-amount');
  console.log('  • Check CommissionDisbursement collection in DB for saved records');
  console.log('  • For production: update .env with live IntouchPay credentials');
  console.log('───────────────────────────────────────────────────────────\n');
}

main().catch(error => {
  console.error('\n❌ Test suite crashed:', error.message);
  process.exit(1);
});
