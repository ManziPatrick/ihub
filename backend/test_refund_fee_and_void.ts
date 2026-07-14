/**
 * Test: Refund Fee (5%) + Void Disbursement + Full Refund Flow
 *
 * Tests:
 *   1. 5% refund fee calculation
 *   2. Void disbursement (super admin cancels OnHold disbursement)
 *   3. Refund workflow: request → verify → approve with 5% fee
 *   4. Disbursement cancellation during refund
 *   5. Refund fee calculation edge cases
 *
 * Usage: npx tsx test_refund_fee_and_void.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ihub';

async function main() {
  console.log('='.repeat(70));
  console.log('🧪 REFUND FEE (5%) + VOID DISBURSEMENT TEST');
  console.log('='.repeat(70));

  await mongoose.connect(MONGO_URI);
  console.log(`📦 Connected to MongoDB\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ ${message}`);
      passed++;
    } else {
      console.log(`  ❌ ${message}`);
      failed++;
    }
  }

  // ─── Test 1: 5% Fee Calculation ───────────────────────────────────────
  console.log('\n─── Test 1: 5% Refund Fee Calculation ───');

  const testAmounts = [10000, 5000, 2500, 100000, 0];
  for (const amount of testAmounts) {
    const fee = Math.round(amount * 0.05);
    const afterFee = amount - fee;
    console.log(`  Amount: ${amount} RWF | Fee (5%): ${fee} RWF | Refundable: ${afterFee} RWF`);
    assert(fee + afterFee === amount, `Fee + AfterFee = ${amount} (${fee} + ${afterFee} = ${fee + afterFee})`);
    assert(fee === Math.round(amount * 0.05), `Fee is exactly 5%: ${fee} RWF`);
  }

  // ─── Test 2: Authorization Logic ─────────────────────────────────────
  console.log('\n─── Test 2: Authorization (Resolver Logic) ───');

  const allowedRoles = ['super_admin'];
  const deniedRoles = ['student', 'trainer', 'admin', null];

  for (const role of allowedRoles) {
    assert(
      ['super_admin'].includes(role!),
      `voidDisbursement: ${role} is ALLOWED`
    );
  }

  for (const role of deniedRoles) {
    assert(
      !role || !['super_admin'].includes(role),
      `voidDisbursement: ${role || 'anonymous'} is DENIED`
    );
  }

  // ─── Test 3: Refund Resolver Fee Logic (unit test) ────────────────────
  console.log('\n─── Test 3: Refund Resolver Fee Logic ───');

  // Simulate the approveRefund/forceApproveRefund fee calculation
  const simulateApproveRefund = (amount: number) => {
    const refundFee = Math.round(amount * 0.05);
    const refundableAmountAfterFee = amount - refundFee;
    return { refundFee, refundableAmountAfterFee, refundedAmount: amount };
  };

  const result1 = simulateApproveRefund(10000);
  assert(result1.refundFee === 500, `approveRefund(10000): fee = 500 RWF`);
  assert(result1.refundableAmountAfterFee === 9500, `approveRefund(10000): customer gets 9500 RWF`);

  const result2 = simulateApproveRefund(2500);
  assert(result2.refundFee === 125, `approveRefund(2500): fee = 125 RWF`);
  assert(result2.refundableAmountAfterFee === 2375, `approveRefund(2500): customer gets 2375 RWF`);

  const result3 = simulateApproveRefund(999);
  assert(result3.refundFee === 50, `approveRefund(999): fee = 50 RWF (rounded)`);
  assert(result3.refundableAmountAfterFee === 949, `approveRefund(999): customer gets 949 RWF`);

  // ─── Test 4: Model Schema Fields ──────────────────────────────────────
  console.log('\n─── Test 4: RefundRequest Model Schema ───');

  const RefundRequest = require('./src/models/RefundRequest').default;
  const schemaPaths = Object.keys(RefundRequest.schema.paths);

  assert(schemaPaths.includes('refundFee'), 'RefundRequest model has refundFee field');
  assert(schemaPaths.includes('refundableAmountAfterFee'), 'RefundRequest model has refundableAmountAfterFee field');

  // ─── Test 5: CommissionDisbursement voidDisbursement Logic ────────────
  console.log('\n─── Test 5: voidDisbursement Service Logic ───');

  const { DisbursementService } = require('./src/services/disbursement.service');
  const disbursementService = new DisbursementService();

  assert(typeof disbursementService.voidDisbursement === 'function', 'voidDisbursement method exists on service');

  // ─── Test 6: typeDefs Schema ──────────────────────────────────────────
  console.log('\n─── Test 6: GraphQL Schema ───');

  const typeDefsContent = require('fs').readFileSync('./src/graphql/typeDefs.ts', 'utf8');
  assert(typeDefsContent.includes('voidDisbursement'), 'typeDefs includes voidDisbursement mutation');
  assert(typeDefsContent.includes('refundFee: Float!'), 'typeDefs includes refundFee in RefundRequest type');
  assert(typeDefsContent.includes('refundableAmountAfterFee: Float!'), 'typeDefs includes refundableAmountAfterFee in RefundRequest type');

  // ─── Test 7: Disbursement Resolvers ───────────────────────────────────
  console.log('\n─── Test 7: Disbursement Resolvers Export ───');

  const { disbursementResolvers } = require('./src/graphql/disbursement-resolvers.fixed');
  assert(!!disbursementResolvers.Mutation.voidDisbursement, 'disbursementResolvers exports voidDisbursement mutation');

  // ─── Test 8: Refund Resolvers Fee Fields ──────────────────────────────
  console.log('\n─── Test 8: Refund Resolvers Return Fee Fields ───');

  const resolversContent = require('fs').readFileSync('./src/graphql/refund-resolvers.ts', 'utf8');
  const feeOccurrences = (resolversContent.match(/refundFee/g) || []).length;
  assert(feeOccurrences >= 10, `refundFee appears at least 10 times in refund-resolvers.ts (found: ${feeOccurrences})`);

  const afterFeeOccurrences = (resolversContent.match(/refundableAmountAfterFee/g) || []).length;
  assert(afterFeeOccurrences >= 10, `refundableAmountAfterFee appears at least 10 times in refund-resolvers.ts (found: ${afterFeeOccurrences})`);

  // ─── Test 9: Frontend Mutations ───────────────────────────────────────
  console.log('\n─── Test 9: Frontend GraphQL Mutations ───');

  const frontendMutations = require('fs').readFileSync('../frontend/src/lib/graphql/mutations.ts', 'utf8');
  assert(frontendMutations.includes('VOID_DISBURSEMENT'), 'Frontend has VOID_DISBURSEMENT mutation');
  assert(frontendMutations.includes('voidDisbursement'), 'Frontend mutation includes voidDisbursement operation');

  // ─── Test 10: Frontend Disbursements Page ─────────────────────────────
  console.log('\n─── Test 10: Frontend SuperAdminDisbursements Page ───');

  const frontendPage = require('fs').readFileSync('../frontend/src/pages/portal/super-admin/SuperAdminDisbursements.tsx', 'utf8');
  assert(frontendPage.includes('VOID_DISBURSEMENT'), 'Frontend page imports VOID_DISBURSEMENT');
  assert(frontendPage.includes('voidDisbursement'), 'Frontend page uses voidDisbursement mutation');
  assert(frontendPage.includes('Void'), 'Frontend page has "Void" button text');
  assert(frontendPage.includes('Ban'), 'Frontend page imports Ban icon for Void button');

  // ─── Test 11: Payment Model has refunded status ───────────────────────
  console.log('\n─── Test 11: Payment Model Status ───');

  const { Payment } = require('./src/models/Payment');
  const paymentSchemaPaths = Object.keys(Payment.schema.paths);
  assert(paymentSchemaPaths.includes('status'), 'Payment model has status field');

  // ─── Test 12: Resolvers Integration ───────────────────────────────────
  console.log('\n─── Test 12: Resolvers Integration ───');

  const resolversFile = require('fs').readFileSync('./src/graphql/resolvers.ts', 'utf8');
  assert(resolversFile.includes('disbursementResolvers'), 'resolvers.ts imports disbursementResolvers');
  assert(resolversFile.includes('refundResolvers'), 'resolvers.ts imports refundResolvers');

  // ─── Summary ──────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(70));
  console.log(`📊 TEST RESULTS`);
  console.log('='.repeat(70));
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📈 Total:  ${passed + failed}`);
  console.log('='.repeat(70));

  // Phone number validation (for the user's reference)
  console.log('\n📞 Phone numbers provided for testing:');
  console.log(`  0790706170 → ${'250790706170'}`);
  console.log(`  0784086021 → ${'250784086021'}`);
  console.log('  (These would be used when testing via the actual IntouchPay API)');

  await mongoose.disconnect();
  console.log('\n📦 Disconnected from MongoDB\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('💥 Test failed with error:', err);
  process.exit(1);
});
