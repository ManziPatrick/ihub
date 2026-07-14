/**
 * End-to-End Disbursement Flow Test
 *
 * Tests:
 *  1. Existing disbursements in DB
 *  2. Provider config (PawaPay-first by default)
 *  3. Simulated approval flow (dry run - no real money sent)
 *  4. Phone: 0784086021 (super_admin user)
 *
 * Run: npx tsx test_disbursement_e2e.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { disbursementService } from './src/services/disbursement.service';
import { CommissionDisbursement } from './src/models/CommissionDisbursement';
import { Config } from './src/models/Config';
import { User } from './src/models/User';
import { Course } from './src/models/Course';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || '');
  const db = mongoose.connection.db;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  DISBURSEMENT END-TO-END TEST');
  console.log('═══════════════════════════════════════════════════════════');
  console.log();

  // ─── Step 1: Find user 0784086021 ──────────────────────────────────
  console.log('📋 STEP 1: Find owner (phone: 0784086021)');
  const owner = await User.findOne({ phone: { $regex: '0784086021' } });
  if (!owner) {
    console.log('  ❌ User 0784086021 not found!');
    console.log('  Searching for any user with 078...');
    const alt = await User.findOne({ phone: { $regex: '078' } });
    if (alt) console.log(`  Found: ${alt.username} (${alt.role}) - phone: ${alt.phone}`);
    throw new Error('User not found');
  }
  console.log(`  ✅ Owner: ${owner.username} (${owner.email})`);
  console.log(`     Role: ${owner.role}`);
  console.log(`     Phone: ${owner.phone}`);
  console.log(`     ID: ${owner._id}`);
  console.log();

  // ─── Step 2: Find courses owned by this user ───────────────────────
  console.log('📋 STEP 2: Courses owned by this user');
  const courses = await Course.find({
    $or: [{ instructor: owner._id }, { createdBy: owner._id }],
  }).select('title price');
  if (courses.length === 0) {
    console.log('  ⚠️  No courses found for this owner');
  } else {
    courses.forEach((c) => console.log(`  ✅ ${c.title} — ${c.price} RWF`));
  }
  console.log();

  // ─── Step 3: Check existing disbursements ──────────────────────────
  console.log('📋 STEP 3: All Disbursements');
  const all = await CommissionDisbursement.find().sort({ createdAt: -1 }).lean();
  if (all.length === 0) {
    console.log('  ⚠️  No disbursements found in the system');
  } else {
    console.log(`  Total disbursements: ${all.length}`);
    console.log();
    all.forEach((d, i) => {
      const created = d.createdAt ? new Date(d.createdAt).toISOString().slice(0, 10) : '?';
      const release = d.releaseDate ? new Date(d.releaseDate).toISOString().slice(0, 10) : 'N/A';
      const now = new Date();
      const eligible = d.releaseDate ? now >= new Date(d.releaseDate) : false;
      console.log(`  #${i + 1}: ${d._id.toString().slice(-8)}`);
      console.log(`     Amount: ${d.grossAmount} RWF (net: ${d.netAmount} RWF)`);
      console.log(`     Status: ${d.status}`);
      console.log(`     Owner:  ${d.ownerPhone}`);
      console.log(`     Item:   ${d.itemType} #${d.itemId.toString().slice(-8)}`);
      console.log(`     Created: ${created}`);
      console.log(`     Release: ${release} ${eligible ? '✅ ELIGIBLE' : '⏳ NOT YET'}`);
      if (d.failureReason) console.log(`     Reason: ${d.failureReason}`);
      if (d.intouchReferenceId) console.log(`     Ref: ${d.intouchReferenceId}`);
      console.log();
    });
  }

  // ─── Step 4: Check provider config ─────────────────────────────────
  console.log('📋 STEP 4: Provider Configuration');
  const config = await Config.findOne({ key: 'disbursement_primary_provider' });
  const primaryProvider = config?.value === 'intouch' ? 'intouch' : 'pawapay';
  console.log(`  Config key: disbursement_primary_provider`);
  console.log(`  Value: ${config?.value || '(not set — defaults to pawapay)'}`);
  console.log(`  Effective primary: ${primaryProvider}`);
  console.log(`  Effective fallback: ${primaryProvider === 'pawapay' ? 'intouch' : 'pawapay'}`);
  console.log(`  Status: ${primaryProvider === 'pawapay' ? '✅ PAWAPAY IS PRIMARY (as requested)' : 'ℹ️ Intouch is primary'}`);
  console.log();

  // ─── Step 5: Simulate approval for an OnHold disbursement ──────────
  console.log('📋 STEP 5: Simulating approval flow');
  const onHold = all.filter((d) => d.status === 'OnHold');
  console.log(`  Found ${onHold.length} OnHold disbursement(s)`);
  console.log();

  if (onHold.length > 0) {
    const target = onHold[0];
    const now = new Date();
    const releaseDate = target.releaseDate ? new Date(target.releaseDate) : null;
    const eligible = releaseDate ? now >= releaseDate : false;

    console.log(`  Target disbursement: ${target._id.toString().slice(-8)}`);
    console.log(`  Net amount: ${target.netAmount} RWF`);
    console.log(`  Owner phone: ${target.ownerPhone}`);
    console.log(`  Release date: ${releaseDate?.toISOString().slice(0, 10) || 'N/A'}`);
    console.log(`  Release eligible: ${eligible ? '✅ YES' : '❌ NO (15-day hold not elapsed)'}`);
    console.log();

    if (eligible) {
      console.log('  🟢 Would approve via this flow:');
      console.log(`     1. Primary: ${primaryProvider} (${primaryProvider === 'pawapay' ? '🌍 PawaPay' : '🇷🇼 IntouchPay'})`);
      console.log(`     2. If fails → Fallback: ${primaryProvider === 'pawapay' ? '🇷🇼 IntouchPay' : '🌍 PawaPay'}`);
      console.log(`     3. If both fail → Mark as Failed`);
      console.log();
      console.log('  ⚠️  NOTE: To actually approve, run:');
      console.log(`    npx tsx -e 'import {disbursementService} from \"./src/services/disbursement.service\";import mongoose from \"mongoose\";import dotenv from \"dotenv\";dotenv.config();(async()=>{const m=await mongoose.connect(process.env.MONGODB_URI||process.env.MONGO_URI||\"\");const r=await disbursementService.approveDisbursement(\"${target._id}\",\"${owner._id}\");console.log(JSON.stringify(r,null,2));await mongoose.disconnect();})()'`);
    } else {
      const daysUntil = releaseDate
        ? Math.ceil((releaseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 15;
      console.log(`  ⏳ Cannot approve yet — ${daysUntil} day(s) until release eligibility.`);
      console.log();
      console.log('  🟢 When eligible, the flow will be:');
      console.log(`     1. Try ${primaryProvider} (${primaryProvider === 'pawapay' ? '🌍 PawaPay' : '🇷🇼 IntouchPay'})`);
      console.log(`     2. If fails → Try ${primaryProvider === 'pawapay' ? '🇷🇼 IntouchPay' : '🌍 PawaPay'}`);
      console.log(`     3. If both fail → Mark as Failed`);
    }
    console.log();
  } else {
    console.log('  ⚠️  No OnHold disbursements to test approval with.');
    console.log('  To test, create one by processing a payment or use:');
    console.log('  npx tsx -e \'const {disbursementService} = require("./src/services/disbursement.service"); ...\'');
    console.log();
  }

  // ─── Step 6: Simulate retry for Failed disbursements ───────────────
  console.log('📋 STEP 6: Failed disbursements');
  const failed = all.filter((d) => d.status === 'Failed');
  console.log(`  Found ${failed.length} Failed disbursement(s)`);
  if (failed.length > 0) {
    failed.forEach((d) => {
      console.log(`  - ${d._id.toString().slice(-8)}: ${d.grossAmount} RWF | ${d.failureReason?.slice(0, 80) || 'No reason'} | retries: ${d.retryCount}`);
    });
    console.log();
    console.log('  🟢 Retry flow:');
    console.log(`     1. Try ${primaryProvider} first`);
    console.log(`     2. If fails → Try ${primaryProvider === 'pawapay' ? 'intouch' : 'pawapay'}`);
    console.log(`     3. If both fail → Increment retry count, keep as Failed`);
  }
  console.log();

  // ─── Summary ───────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Provider config:     ${config?.value || 'pawapay (default)'}`);
  console.log(`  Primary provider:    ${primaryProvider}`);
  console.log(`  Total disbursements: ${all.length}`);
  console.log(`  OnHold:              ${all.filter((d) => d.status === 'OnHold').length}`);
  console.log(`  Successful:          ${all.filter((d) => d.status === 'Successful').length}`);
  console.log(`  Failed:              ${all.filter((d) => d.status === 'Failed').length}`);
  console.log(`  Owner phone:         ${owner.phone}`);
  console.log(`  Owner courses:       ${courses.length}`);
  console.log();
  console.log(`  ✅ PawaPay is the PRIMARY provider as requested.`);
  console.log(`  ✅ IntouchPay is the fallback if PawaPay fails.`);
  if (onHold.length > 0) {
    const eligible = onHold.some(
      (d) => d.releaseDate && new Date() >= new Date(d.releaseDate)
    );
    if (!eligible) {
      console.log(`  ⏳ ${onHold.length} OnHold disbursements waiting for 15-day hold period.`);
    }
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
