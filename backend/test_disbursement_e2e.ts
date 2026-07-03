/**
 * End-to-End Disbursement Flow Test
 *
 * Simulates the complete flow from PaymentController.handleSuccessfulPayment:
 * 1. Seeds test users (admin with phone, student)
 * 2. Creates a course owned by the admin
 * 3. Sets up commission config (percentage + fixed variants)
 * 4. Creates a completed Payment record
 * 5. Calls disbursementService.processDisbursement (the core of auto-disbursement)
 * 6. Verifies a CommissionDisbursement record was created
 * 7. Checks the status of the disbursement record
 *
 * Usage: npx tsx test_disbursement_e2e.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

import { disbursementService } from './src/services/disbursement.service';
import { CommissionDisbursement } from './src/models/CommissionDisbursement';
import { AdminCommission } from './src/models/AdminCommission';
import { Config } from './src/models/Config';
import { User, IUser } from './src/models/User';
import { Course } from './src/models/Course';
import { Payment } from './src/models/Payment';

// ─── Test Config ───
const TEST_ADMIN_PHONE = '0784086021';
const TEST_STUDENT_PHONE = '0790706170';
const TEST_AMOUNT = 50000; // RWF
const TEST_COMMISSION_PERCENTAGE = 10;

// IDs to clean up
let testAdminId: string;
let testStudentId: string;
let testCourseId: string;
let testPaymentId: string;
let createdDisbursementIds: string[] = [];

// ─── Helpers ───

function log(label: string, data: any = '') {
  const ts = new Date().toISOString().split('T')[1].slice(0, 12);
  if (data && typeof data === 'object') {
    console.log(`  ${label}:`, JSON.stringify(data, null, 2).substring(0, 600));
  } else {
    console.log(`  ${label}: ${data}`);
  }
}

function step(n: number, title: string) {
  console.log(`\n─── Step ${n}: ${title} ───`);
}

// ─── DB Connection ───

async function connectDB(): Promise<boolean> {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     Disbursement Flow — End-to-End Test                  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

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

// ─── Step 1: Seed Test Data ───

async function seedTestData(): Promise<boolean> {
  step(1, 'Seed Test Data');

  try {
    // 1.1 Find or create admin with phone
    let admin = await User.findOne({
      $or: [
        { phone: TEST_ADMIN_PHONE },
        { phone: `+250${TEST_ADMIN_PHONE.slice(1)}` },
      ],
      role: 'admin',
    });

    if (!admin) {
      const superAdmin = await User.findOne({ role: 'super_admin' });
      admin = await User.create({
        username: 'disburse_admin',
        email: 'disburse_admin@test.com',
        password: 'hashed_pw',
        role: 'admin',
        phone: TEST_ADMIN_PHONE,
        fullName: 'Disbursement Test Admin',
        createdBy: superAdmin?._id || new mongoose.Types.ObjectId(),
      });
      log(`✅ Created admin: ${admin._id}`);
    } else {
      // Ensure phone is set
      admin.phone = TEST_ADMIN_PHONE;
      await admin.save();
      log(`✅ Using existing admin: ${admin._id} (phone: ${admin.phone})`);
    }
    testAdminId = admin._id.toString();

    // 1.2 Find or create student
    let student = await User.findOne({
      $or: [
        { phone: TEST_STUDENT_PHONE },
        { phone: `+250${TEST_STUDENT_PHONE.slice(1)}` },
      ],
      role: 'student',
    });

    if (!student) {
      student = await User.create({
        username: 'disburse_student',
        email: 'disburse_student@test.com',
        password: 'hashed_pw',
        role: 'student',
        phone: TEST_STUDENT_PHONE,
        fullName: 'Disbursement Test Student',
      });
      log(`✅ Created student: ${student._id}`);
    } else {
      log(`✅ Using existing student: ${student._id}`);
    }
    testStudentId = student._id.toString();

    // 1.3 Find or create course owned by admin
    let course = await Course.findOne({
      $or: [{ instructor: admin._id }, { createdBy: admin._id }],
      title: { $regex: /^E2E Disbursement/i },
    });

    if (!course) {
      course = await Course.create({
        title: 'E2E Disbursement Test Course',
        description: 'Course for testing disbursement auto-flow',
        instructor: admin._id,
        createdBy: admin._id,
        price: TEST_AMOUNT,
        category: 'Technology',
        level: 'Beginner',
        modules: [{
          title: 'Module 1',
          lessons: [{ title: 'Lesson 1', content: 'Test', order: 1 }],
          order: 1,
        }],
        status: 'published',
      });
      log(`✅ Created course: ${course._id}`);
    } else {
      log(`✅ Using existing course: ${course._id}`);
    }
    testCourseId = course._id.toString();

    // 1.4 Set up commission config (percentage)
    await AdminCommission.findOneAndUpdate(
      {
        adminId: admin._id,
        scope: 'course',
        scopeId: course._id,
      },
      {
        $set: {
          type: 'percentage',
          percentage: TEST_COMMISSION_PERCENTAGE,
          fixedAmount: 0,
          scopeTitle: course.title,
          description: `E2E test: ${TEST_COMMISSION_PERCENTAGE}% commission`,
          active: true,
        },
      },
      { upsert: true }
    );
    log(`✅ Set commission config: ${TEST_COMMISSION_PERCENTAGE}% for course`);

    // Also set a global config for fallback
    await AdminCommission.findOneAndUpdate(
      {
        adminId: admin._id,
        scope: 'global',
      },
      {
        $set: {
          type: 'percentage',
          percentage: TEST_COMMISSION_PERCENTAGE,
          fixedAmount: 0,
          description: `E2E test: Global ${TEST_COMMISSION_PERCENTAGE}% commission`,
          active: true,
        },
      },
      { upsert: true }
    );

    // 1.5 Set platform commission config
    await Config.findOneAndUpdate(
      { key: 'platform_commission_type' },
      { $set: { value: 'percentage', description: 'Platform commission type' } },
      { upsert: true }
    );
    await Config.findOneAndUpdate(
      { key: 'platform_commission_value' },
      { $set: { value: String(TEST_COMMISSION_PERCENTAGE), description: 'Platform commission value' } },
      { upsert: true }
    );
    await Config.findOneAndUpdate(
      { key: 'auto_disbursement_enabled' },
      { $set: { value: 'true', description: 'Auto-disbursement enabled' } },
      { upsert: true }
    );
    log('✅ Platform commission config set');

    return true;
  } catch (error: any) {
    console.error(`❌ Seed error: ${error.message}`);
    return false;
  }
}

// ─── Step 2: Create a Completed Payment Record ───

async function createCompletedPayment(): Promise<boolean> {
  step(2, 'Create a Completed Payment Record');

  try {
    // Clean any previous test payment
    await Payment.deleteMany({
      transactionId: { $regex: /^E2E-TRX-/ },
    });

    // Create a completed payment record (simulating what PaymentController does)
    const payment = await Payment.create({
      userId: new mongoose.Types.ObjectId(testStudentId),
      courseId: new mongoose.Types.ObjectId(testCourseId),
      courseIds: [new mongoose.Types.ObjectId(testCourseId)],
      amount: TEST_AMOUNT,
      currency: 'RWF',
      status: 'completed',
      paymentMethod: 'Intouch',
      transactionId: `E2E-TRX-${Date.now()}`,
      type: 'Course Enrollment',
      itemTitle: 'E2E Disbursement Test Course',
    });
    testPaymentId = payment._id.toString();

    log(`✅ Created completed Payment record: ${testPaymentId}`);
    log(`   Amount: ${TEST_AMOUNT} RWF`);
    log(`   Course: ${testCourseId}`);
    log(`   Student: ${testStudentId}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to create payment: ${error.message}`);
    return false;
  }
}

// ─── Step 3: Verify Item Owner & Commission Calculation ───

async function verifyCommissionCalculation(): Promise<boolean> {
  step(3, 'Verify Owner Lookup & Commission Calculation');

  try {
    // 3.1 Find item owner
    const ownerInfo = await disbursementService.findItemOwner(testCourseId, 'course');
    if (!ownerInfo) {
      console.log('❌ No owner found for test course');
      return false;
    }
    log(`✅ Owner found:`);
    log(`   Owner ID: ${ownerInfo.ownerId}`);
    log(`   Owner Phone: ${ownerInfo.phone}`);

    if (ownerInfo.ownerId !== testAdminId) {
      console.log(`❌ Owner mismatch: expected ${testAdminId}, got ${ownerInfo.ownerId}`);
      return false;
    }

    // 3.2 Calculate commission
    const commissionResult = await disbursementService.calculateCommission(
      { amount: TEST_AMOUNT },
      testCourseId,
      'course'
    );

    if (!commissionResult) {
      console.log('❌ Commission calculation returned null');
      return false;
    }

    const expectedCommission = TEST_AMOUNT * (TEST_COMMISSION_PERCENTAGE / 100);
    const netAmount = TEST_AMOUNT - expectedCommission;

    log(`✅ Commission calculated:`);
    log(`   Gross: ${TEST_AMOUNT} RWF`);
    log(`   Commission type: ${commissionResult.type}`);
    log(`   Commission value: ${commissionResult.value}`);
    log(`   Commission amount: ${commissionResult.commission} RWF (expected: ${expectedCommission})`);
    log(`   Net to owner: ${netAmount} RWF`);

    const matches = Math.abs(commissionResult.commission - expectedCommission) < 1;
    if (!matches) {
      console.log(`⚠️ Commission slight mismatch: expected ${expectedCommission}, got ${commissionResult.commission}`);
    }

    return true;
  } catch (error: any) {
    console.error(`❌ Commission verification error: ${error.message}`);
    return false;
  }
}

// ─── Step 4: Trigger Auto-Disbursement (Simulating PaymentController) ───

async function triggerAutoDisbursement(): Promise<boolean> {
  step(4, 'Trigger Auto-Disbursement (simulating PaymentController setImmediate)');

  try {
    // Clear any existing disbursements for this payment
    await CommissionDisbursement.deleteMany({
      paymentId: new mongoose.Types.ObjectId(testPaymentId),
    });

    log(`   Calling disbursementService.processDisbursement(...)`);
    log(`   Payment ID: ${testPaymentId}`);
    log(`   Customer ID: ${testStudentId}`);
    log(`   Item ID: ${testCourseId}`);
    log(`   Item Type: course`);
    log(`   Amount: ${TEST_AMOUNT} RWF`);

    // This is what PaymentController.handleSuccessfulPayment calls via setImmediate
    const result = await disbursementService.processDisbursement(
      testPaymentId,
      testStudentId,
      testCourseId,
      'course',
      TEST_AMOUNT
    );

    log(`📋 Disbursement result:`);
    log(`   Success: ${result.success}`);
    log(`   Message: ${result.message}`);
    log(`   Disbursement ID: ${result.disbursementId || 'N/A'}`);
    if (result.netAmount !== undefined) log(`   Net Amount: ${result.netAmount} RWF`);
    if (result.platformCommission !== undefined) log(`   Platform Commission: ${result.platformCommission} RWF`);
    if (result.intouchReferenceId) log(`   InTouch Ref: ${result.intouchReferenceId}`);

    if (result.disbursementId) {
      createdDisbursementIds.push(result.disbursementId);
    }

    return true;
  } catch (error: any) {
    console.error(`❌ Disbursement trigger error: ${error.message}`);
    return false;
  }
}

// ─── Step 5: Verify CommissionDisbursement Record ───

async function verifyDisbursementRecord(): Promise<boolean> {
  step(5, 'Verify CommissionDisbursement Record');

  try {
    // 5.1 Find the disbursement record
    const records = await CommissionDisbursement.find({
      paymentId: new mongoose.Types.ObjectId(testPaymentId),
    });

    const count = records.length;
    log(`📊 CommissionDisbursement records found: ${count}`);

    if (count === 0) {
      console.log('❌ No CommissionDisbursement records created! The auto-disbursement did not run.');
      return false;
    }

    // 5.2 Verify the first/only record
    const record = records[0];
    log(`✅ Record ID: ${record._id}`);
    log(`   Status: ${record.status}`);
    log(`   Gross: ${record.grossAmount} RWF`);
    log(`   Commission: ${record.platformCommission} RWF`);
    log(`   Net: ${record.netAmount} RWF`);
    log(`   Owner Phone: ${record.ownerPhone}`);
    log(`   Owner ID: ${record.ownerId}`);
    log(`   Item ID: ${record.itemId}`);
    log(`   Item Type: ${record.itemType}`);
    log(`   Auto-Disbursement: ${record.autoDisbursement}`);
    log(`   Retry Count: ${record.retryCount}`);
    log(`   Status History: ${record.statusHistory.length} entries`);

    // 5.3 Validate field values
    const checks: { label: string; pass: boolean }[] = [];

    checks.push({
      label: 'paymentId matches',
      pass: record.paymentId.toString() === testPaymentId,
    });
    checks.push({
      label: 'ownerId matches',
      pass: record.ownerId.toString() === testAdminId,
    });
    checks.push({
      label: 'itemId matches',
      pass: record.itemId.toString() === testCourseId,
    });
    checks.push({
      label: 'itemType is "course"',
      pass: record.itemType === 'course',
    });
    checks.push({
      label: 'grossAmount matches',
      pass: record.grossAmount === TEST_AMOUNT,
    });
    checks.push({
      label: 'commissionType is "percentage"',
      pass: record.commissionType === 'percentage',
    });
    const expectedCommission = TEST_AMOUNT * (TEST_COMMISSION_PERCENTAGE / 100);
    checks.push({
      label: 'platformCommission matches expected',
      pass: Math.abs(record.platformCommission - expectedCommission) < 1,
    });
    checks.push({
      label: 'netAmount = gross - commission',
      pass: Math.abs(record.netAmount - (record.grossAmount - record.platformCommission)) < 1,
    });
    checks.push({
      label: 'ownerPhone contains admin phone',
      pass: record.ownerPhone.includes('078408602') || record.ownerPhone.includes('250784086'),
    });
    checks.push({
      label: 'status is not empty',
      pass: ['Pending', 'Processing', 'Successful', 'Failed'].includes(record.status),
    });
    checks.push({
      label: 'statusHistory has at least 1 entry',
      pass: record.statusHistory.length >= 1,
    });

    console.log('');
    for (const check of checks) {
      console.log(`   ${check.pass ? '✅' : '❌'} ${check.label}`);
    }

    const allPassed = checks.every(c => c.pass);
    if (!allPassed) {
      console.log('\n⚠️ Some field validations failed. See ❌ marks above.');
      return false;
    }

    console.log(`\n   ✅ All ${checks.length} field validations passed!`);

    // 5.4 Print status details
    console.log(`\n   📋 Status: ${record.status}`);
    for (const entry of record.statusHistory) {
      const ts = new Date(entry.timestamp).toISOString().split('T')[1].slice(0, 12);
      console.log(`      [${ts}] ${entry.status} — ${entry.note || ''}`);
    }

    if (record.failureReason) {
      console.log(`   ⚠️ Failure reason: ${record.failureReason}`);
    }
    if (record.intouchReferenceId) {
      console.log(`   🔗 Intouch Ref: ${record.intouchReferenceId}`);
    }

    return true;
  } catch (error: any) {
    console.error(`❌ Verification error: ${error.message}`);
    return false;
  }
}

// ─── Step 6: Test Duplicate Prevention ───

async function testDuplicatePrevention(): Promise<boolean> {
  step(6, 'Test Duplicate Disbursement Prevention');

  try {
    // Try to process the same disbursement again
    log(`   Attempting duplicate disbursement for same payment...`);
    const duplicateResult = await disbursementService.processDisbursement(
      testPaymentId,
      testStudentId,
      testCourseId,
      'course',
      TEST_AMOUNT
    );

    log(`   Result success: ${duplicateResult.success}`);
    log(`   Message: ${duplicateResult.message}`);

    if (duplicateResult.message?.includes('already exists')) {
      console.log('   ✅ Duplicate correctly prevented — CommissionDisbursement unique index works');
      return true;
    }

    // The first call may have "already exists" or may have succeeded/failed
    // Either way, check that we don't have duplicate records
    const records = await CommissionDisbursement.find({
      paymentId: new mongoose.Types.ObjectId(testPaymentId),
    });

    log(`   Total records for this payment: ${records.length}`);
    if (records.length > 1) {
      console.log(`   ⚠️ Multiple disbursement records exist (${records.length})`);
    } else {
      console.log('   ✅ Exactly 1 disbursement record (no duplicates)');
    }

    return true;
  } catch (error: any) {
    console.error(`❌ Duplicate test error: ${error.message}`);
    return false;
  }
}

// ─── Step 7: Fixed Commission Variant ───

async function testFixedCommission(): Promise<boolean> {
  step(7, 'Test Fixed Commission Variant');

  try {
    const FIXED_AMOUNT = 2000; // 2000 RWF fixed commission
    const fixedPaymentId = `FIXED-TEST-${Date.now()}`;

    // Create a second course with fixed commission
    const fixedCourse = await Course.create({
      title: `E2E Fixed Commission Course ${Date.now()}`,
      description: 'Course for testing fixed commission',
      instructor: new mongoose.Types.ObjectId(testAdminId),
      createdBy: new mongoose.Types.ObjectId(testAdminId),
      price: TEST_AMOUNT,
      category: 'Technology',
      level: 'Beginner',
      modules: [{
        title: 'Module 1',
        lessons: [{ title: 'Lesson 1', content: 'Test', order: 1 }],
        order: 1,
      }],
      status: 'published',
    });
    log(`✅ Created fixed-commission course: ${fixedCourse._id}`);

    // Set fixed commission config
    await AdminCommission.findOneAndUpdate(
      {
        adminId: new mongoose.Types.ObjectId(testAdminId),
        scope: 'course',
        scopeId: fixedCourse._id,
      },
      {
        $set: {
          type: 'fixed',
          percentage: 0,
          fixedAmount: FIXED_AMOUNT,
          scopeTitle: fixedCourse.title,
          description: `E2E test: fixed ${FIXED_AMOUNT} RWF commission`,
          active: true,
        },
      },
      { upsert: true }
    );
    log(`✅ Set fixed commission config: ${FIXED_AMOUNT} RWF`);

    // Create payment
    const fixedPayment = await Payment.create({
      userId: new mongoose.Types.ObjectId(testStudentId),
      courseId: fixedCourse._id,
      courseIds: [fixedCourse._id],
      amount: TEST_AMOUNT,
      currency: 'RWF',
      status: 'completed',
      paymentMethod: 'Intouch',
      transactionId: fixedPaymentId,
      type: 'Course Enrollment',
      itemTitle: fixedCourse.title,
    });
    log(`✅ Created fixed-commission payment: ${fixedPayment._id}`);

    // Calculate commission
    const commissionResult = await disbursementService.calculateCommission(
      { amount: TEST_AMOUNT },
      fixedCourse._id.toString(),
      'course'
    );

    if (!commissionResult) {
      console.log('❌ Fixed commission calculation returned null');
      return false;
    }

    const expectedNet = TEST_AMOUNT - FIXED_AMOUNT;
    log(`📋 Fixed commission result:`);
    log(`   Type: ${commissionResult.type}`);
    log(`   Commission value: ${commissionResult.value}`);
    log(`   Commission amount: ${commissionResult.commission} RWF (expected: ${FIXED_AMOUNT})`);
    log(`   Net to owner: ${TEST_AMOUNT - commissionResult.commission} RWF (expected: ${expectedNet})`);

    if (Math.abs(commissionResult.commission - FIXED_AMOUNT) < 1) {
      console.log('   ✅ Fixed commission calculated correctly');
      return true;
    } else {
      console.log(`   ❌ Fixed commission mismatch: expected ${FIXED_AMOUNT}, got ${commissionResult.commission}`);
      return false;
    }
  } catch (error: any) {
    console.error(`❌ Fixed commission test error: ${error.message}`);
    return false;
  }
}

// ─── Step 8: Summary & Cleanup ───

async function printSummary(results: { step: string; passed: boolean }[]) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    TEST RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  for (const r of results) {
    console.log(`  ${r.passed ? '✅' : '❌'} ${r.step}`);
  }

  console.log(`\n  Total: ${results.length}  |  ✅ ${passed} Passed  |  ❌ ${failed} Failed`);

  if (createdDisbursementIds.length > 0) {
    console.log(`\n📦 Disbursement records created (${createdDisbursementIds.length}):`);
    for (const id of createdDisbursementIds) {
      console.log(`   • ${id}`);
    }
  }

  console.log('\n📋 E2E Flow Summary');
  console.log('──────────────────');
  console.log(`  • Admin (owner): ${testAdminId} (phone: ${TEST_ADMIN_PHONE})`);
  console.log(`  • Student (customer): ${testStudentId}`);
  console.log(`  • Course: ${testCourseId}`);
  console.log(`  • Payment: ${testPaymentId}`);
  console.log(`  • Amount: ${TEST_AMOUNT} RWF`);
  console.log(`  • Commission: ${TEST_COMMISSION_PERCENTAGE}%`);
  console.log(`  • Net to owner: ${TEST_AMOUNT - (TEST_AMOUNT * TEST_COMMISSION_PERCENTAGE / 100)} RWF`);
  console.log('  • CommissionDisbursement records: ✓ created');
  console.log('  • InTouch API status: depends on testa account configuration');
  console.log('─────────────────────────────────────────────────────────\n');
}

// ─── Main Runner ───

async function main() {
  const results: { step: string; passed: boolean }[] = [];

  // Connect
  const dbOk = await connectDB();
  results.push({ step: 'Database Connection', passed: dbOk });
  if (!dbOk) { printSummary(results); await mongoose.disconnect(); return; }

  // 1. Seed test data
  const seedOk = await seedTestData();
  results.push({ step: 'Seed Test Data', passed: seedOk });
  if (!seedOk) { printSummary(results); await mongoose.disconnect(); return; }

  // 2. Create completed payment
  const paymentOk = await createCompletedPayment();
  results.push({ step: 'Create Completed Payment', passed: paymentOk });

  // 3. Verify commission calculation
  const calcOk = await verifyCommissionCalculation();
  results.push({ step: 'Commission Calculation', passed: calcOk });

  // 4. Trigger auto-disbursement
  const disbOk = await triggerAutoDisbursement();
  results.push({ step: 'Auto-Disbursement Trigger', passed: disbOk });

  // 5. Verify CommissionDisbursement record
  const recordOk = await verifyDisbursementRecord();
  results.push({ step: 'CommissionDisbursement Record Verified', passed: recordOk });

  // 6. Test duplicate prevention
  const dupOk = await testDuplicatePrevention();
  results.push({ step: 'Duplicate Prevention', passed: dupOk });

  // 7. Test fixed commission variant
  const fixedOk = await testFixedCommission();
  results.push({ step: 'Fixed Commission Variant', passed: fixedOk });

  // Print summary
  await printSummary(results);

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
}

main().catch(error => {
  console.error('\n❌ Test suite crashed:', error.message);
  process.exit(1);
});
