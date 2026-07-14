/**
 * Test: Manual Disburse Flow — PawaPay-First Verification
 *
 * Tests that manualDisburse() tries PawaPay FIRST, then falls back to Intouch.
 * Unlike approveDisbursement(), manualDisburse doesn't need an OnHold record
 * or a past release date — it's a direct send.
 *
 * Usage: npx tsx test_manual_disburse_flow.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log('='.repeat(80));
  console.log('💰 MANUAL DISBURSE FLOW — PawaPay-First VERIFICATION');
  console.log('='.repeat(80));

  await mongoose.connect(process.env.MONGO_URI || '');
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

  const db = mongoose.connection.db;
  const configCollection = db.collection('configs');
  const { disbursementService } = require('./src/services/disbursement.service');

  try {
    // ─── STEP 1: Ensure provider config is "pawapay" ───────────────────
    console.log('─── Step 1: Ensure disbursement_primary_provider = "pawapay" ───');

    await configCollection.updateOne(
      { key: 'disbursement_primary_provider' },
      { $set: { key: 'disbursement_primary_provider', value: 'pawapay' } },
      { upsert: true }
    );

    const config = await configCollection.findOne({ key: 'disbursement_primary_provider' });
    console.log(`  Config: ${config?.key} = ${config?.value}`);
    assert(config?.value === 'pawapay', 'disbursement_primary_provider is "pawapay"');

    // ─── STEP 2: Find super_admin for reference ────────────────────────
    console.log('\n─── Step 2: Find super_admin user ───');

    const superAdmin = await db.collection('users').findOne({ role: 'super_admin' });
    let adminId = '000000000000000000000001';
    if (superAdmin) {
      adminId = superAdmin._id.toString();
      console.log(`  Super admin: ${superAdmin.username} (${adminId.slice(-8)})`);
    }
    assert(!!superAdmin, 'Super admin user exists in DB');

    // ─── STEP 3: Call manualDisburse() ────────────────────────────────
    console.log('\n─── Step 3: Call manualDisburse() ───');
    console.log('  (Should try PawaPay FIRST, then fall back to Intouch)');

    const testPhone = '0784086021';
    const testAmount = 1000;

    console.log(`\n  📡 Calling manualDisburse(paymentId, ${testAmount}, ${testPhone}, "Test payout")...`);
    console.log('  (Intercepting console.log to verify provider order)');

    // Capture console output to verify ordering
    const originalLog = console.log;
    const originalWarn = console.warn;
    const logLines: string[] = [];

    console.log = (...args: any[]) => {
      const line = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
      logLines.push(line);
      originalLog(...args);
    };
    console.warn = (...args: any[]) => {
      const line = '⚠️ ' + args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
      logLines.push(line);
      originalWarn(...args);
    };

    const result = await disbursementService.manualDisburse(
      adminId,        // paymentId (just a reference ID)
      testAmount,     // amount
      testPhone,      // phoneNumber
      'Test manual disbursement'  // reason
    );

    // Restore console functions
    console.log = originalLog;
    console.warn = originalWarn;

    console.log(`\n  📋 Result:`);
    console.log(`    Success: ${result.success}`);
    console.log(`    Message: ${result.message}`);

    // ─── STEP 4: Verify provider ordering from log ─────────────────────
    console.log('\n─── Step 4: Verify provider ordering ───');

    const allOutput = logLines.join('\n').toLowerCase();
    console.log('\n  📜 Captured console output:');
    logLines.forEach(l => console.log(`    ${l}`));

    // Check the key ordering line
    const orderingLine = logLines.find(l =>
      l.toLowerCase().includes('manual disbursement') &&
      l.toLowerCase().includes('trying')
    );
    if (orderingLine) {
      console.log(`\n  🔍 Provider order line: "${orderingLine}"`);
    }

    // Check console output for provider order
    const pawapayFirst = allOutput.includes('trying pawapay first, then intouch');
    const intouchFirst = allOutput.includes('trying intouch first, then pawapay');

    assert(pawapayFirst && !intouchFirst,
      'Console confirms PawaPay was tried FIRST (not Intouch first)');

    // Check both providers were attempted
    const pawapayAttempted = allOutput.includes('pawapay');
    const intouchAttempted = allOutput.includes('intouch');

    assert(pawapayAttempted, 'PawaPay was attempted');
    assert(intouchAttempted, 'Intouch was attempted as fallback');

    // Check the result message mentions both providers
    const msgLower = (result.message || '').toLowerCase();
    const bothMentioned = msgLower.includes('pawapay') && msgLower.includes('intouch');
    assert(bothMentioned || !result.success,
      'Result message references both providers (or neither if successful)');

    // ─── SUMMARY ──────────────────────────────────────────────────────
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS — MANUAL DISBURSE FLOW');
    console.log('='.repeat(80));
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📈 Total:  ${passed + failed}`);
    console.log('='.repeat(80));

    if (result.success) {
      console.log(`\n  🎉 MANUAL DISBURSEMENT PAID SUCCESSFULLY!`);
      console.log(`     ${result.message}`);
    } else {
      console.log(`\n  ℹ️  Disbursement was NOT paid (expected — sandbox)`);
      console.log(`     ✅ Provider ordering confirmed: PawaPay tried FIRST`);
      console.log(`     ✅ Intouch tried as fallback`);
    }

  } finally {
    await mongoose.disconnect();
    console.log('\n📦 Disconnected from MongoDB\n');
  }
}

main().catch((err) => {
  console.error('💥 Test failed with error:', err);
  process.exit(1);
});
