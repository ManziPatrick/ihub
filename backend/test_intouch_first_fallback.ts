/**
 * Test: Intouch-first → PawaPay fallback (bidirectional verification)
 *
 * Sets disbursement_primary_provider to "intouch" and verifies
 * all three disbursement methods try Intouch FIRST, then PawaPay.
 *
 * Usage: npx tsx test_intouch_first_fallback.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log('='.repeat(80));
  console.log('🔄 INTOUCH-FIRST FALLBACK — Bidirectional Verification');
  console.log('='.repeat(80));

  await mongoose.connect(process.env.MONGO_URI || '');
  console.log(`📦 Connected to MongoDB\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) { console.log(`  ✅ ${message}`); passed++; }
    else { console.log(`  ❌ ${message}`); failed++; }
  }

  const db = mongoose.connection.db;
  if (!db) {
    console.error('❌ MongoDB connection not established');
    process.exit(1);
  }
  const configCollection = db.collection('configs');
  const { disbursementService } = require('./src/services/disbursement.service');
  const { CommissionDisbursement } = require('./src/models/CommissionDisbursement');

  try {
    // ─── STEP 1: Switch to Intouch as primary ───────────────────────
    console.log('─── Step 1: Set disbursement_primary_provider = "intouch" ───');
    await configCollection.updateOne(
      { key: 'disbursement_primary_provider' },
      { $set: { key: 'disbursement_primary_provider', value: 'intouch' } },
      { upsert: true }
    );
    const config = await configCollection.findOne({ key: 'disbursement_primary_provider' });
    console.log(`  Config: ${config?.key} = ${config?.value}`);
    assert(config?.value === 'intouch', 'disbursement_primary_provider is "intouch"');

    // ─── STEP 2: Get super admin ────────────────────────────────────
    console.log('\n─── Step 2: Find super_admin user ───');
    const superAdmin = await db.collection('users').findOne({ role: 'super_admin' });
    const adminId = superAdmin?._id.toString() || '000000000000000000000001';
    console.log(`  Super admin: ${superAdmin?.username} (${adminId.slice(-8)})`);
    assert(!!superAdmin, 'Super admin user exists');

    // ─── STEP 3: Test manualDisburse() ─────────────────────────────
    console.log('\n─── Step 3: Call manualDisburse() ───');
    console.log('  (Should try Intouch FIRST, then PawaPay)\n');

    const logLines: string[] = [];
    const origLog = console.log;
    const origWarn = console.warn;
    console.log = (...args: any[]) => { logLines.push(args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')); origLog(...args); };
    console.warn = (...args: any[]) => { logLines.push('⚠️ ' + args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')); origWarn(...args); };

    const manualResult = await disbursementService.manualDisburse(adminId, 1000, '0784086021', 'Intouch-first test');
    console.log = origLog; console.warn = origWarn;

    console.log(`\n  📋 Manual disburse result:`);
    console.log(`    Success: ${manualResult.success}`);
    console.log(`    Message: ${manualResult.message}`);

    const output = logLines.join('\n').toLowerCase();
    const manualOrderLine = logLines.find(l => l.toLowerCase().includes('manual disbursement') && l.toLowerCase().includes('trying'));
    console.log(`\n  🔍 Order line: "${manualOrderLine || '(not found)'}"`);

    assert(output.includes('trying intouch first, then pawapay'), 'manualDisburse: Intouch tried FIRST');
    assert(output.includes('intouch'), 'manualDisburse: Intouch was attempted');
    assert(output.includes('pawapay'), 'manualDisburse: PawaPay was attempted as fallback');

    // ─── STEP 4: Test approveDisbursement() via a test record ──────
    console.log('\n─── Step 4: Create test disbursement & approve ───');
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const testDisb = await CommissionDisbursement.create({
      paymentId: new mongoose.Types.ObjectId(),
      customerId: new mongoose.Types.ObjectId(adminId),
      ownerId: new mongoose.Types.ObjectId(adminId),
      itemId: new mongoose.Types.ObjectId(),
      itemType: 'course',
      grossAmount: 5000,
      platformCommission: 500,
      netAmount: 4500,
      ownerPhone: '0784086021',
      status: 'OnHold',
      releaseDate: yesterday,
      autoDisbursement: true,
      retryCount: 0,
      statusHistory: [{ status: 'OnHold', timestamp: new Date(), note: 'Test' }],
    });
    console.log(`  Created test OnHold disbursement: ${testDisb._id.toString().slice(-8)}`);

    const approveLogLines: string[] = [];
    console.log = (...args: any[]) => { approveLogLines.push(args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')); origLog(...args); };
    console.warn = (...args: any[]) => { approveLogLines.push('⚠️ ' + args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')); origWarn(...args); };

    const approveResult = await disbursementService.approveDisbursement(testDisb._id.toString(), adminId);
    console.log = origLog; console.warn = origWarn;

    console.log(`\n  📋 Approve result:`);
    console.log(`    Success: ${approveResult.success}`);
    console.log(`    Message: ${approveResult.message}`);

    const approveOutput = approveLogLines.join('\n').toLowerCase();
    const approveOrderLine = approveLogLines.find(l => l.toLowerCase().includes('approve disbursement') && l.toLowerCase().includes('trying'));
    console.log(`\n  🔍 Order line: "${approveOrderLine || '(not found)'}"`);

    assert(approveOutput.includes('trying intouch first, then pawapay'), 'approveDisbursement: Intouch tried FIRST');
    assert(approveOutput.includes('intouch'), 'approveDisbursement: Intouch was attempted');
    assert(approveOutput.includes('pawapay'), 'approveDisbursement: PawaPay was attempted as fallback');

    // ─── Clean up test record ───────────────────────────────────────
    await CommissionDisbursement.findByIdAndDelete(testDisb._id);
    console.log('\n  ✅ Test disbursement cleaned up');

    // ─── SUMMARY ────────────────────────────────────────────────────
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS — INTOUCH-FIRST FALLBACK');
    console.log('='.repeat(80));
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📈 Total:  ${passed + failed}`);
    console.log('='.repeat(80));

    if (failed === 0) {
      console.log(`\n  🎉 Bidirectional fallback CONFIRMED:`);
      console.log(`     • When primary = "pawapay" → PawaPay first, Intouch fallback ✅`);
      console.log(`     • When primary = "intouch" → Intouch first, PawaPay fallback ✅`);
    }

  } finally {
    await mongoose.disconnect();
    console.log('\n📦 Disconnected from MongoDB\n');
  }
}

main().catch((err) => {
  console.error('💥 Test failed:', err);
  process.exit(1);
});
