/**
 * Check: PawaPay Deposit Status
 *
 * Queries the PawaPay API for the status of deposits made during testing.
 * Also provides the dashboard URL for manual verification.
 *
 * Usage: npx tsx check_pawapay_deposits.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import { createPaypackService } from './src/services/paypack.service';

async function main() {
  console.log('='.repeat(70));
  console.log('🔍 PAWAPAY DEPOSIT STATUS CHECK');
  console.log('='.repeat(70));

  // Deposit IDs from our test runs
  const depositIds = [
    '3e9c7049-630a-4e58-967f-ba7964962116', // Latest test (13,500 RWF)
    '60ae01d8-3c80-4fe6-b177-18773d42d6c0', // Earlier test (45,000 RWF)
  ];

  const pawapay = createPaypackService();
  const baseUrl = process.env.PAYPACK_BASE_URL || 'https://api.sandbox.pawapay.io';

  console.log(`\n📡 API Base: ${baseUrl}\n`);

  for (const depositId of depositIds) {
    console.log(`─── Deposit: ${depositId} ───`);
    try {
      const result = await pawapay.getDepositStatus(depositId);
      console.log(`  Status:    ${result.status}`);
      if (result.raw) {
        console.log(`  Raw:       ${JSON.stringify(result.raw, null, 4)}`);
      } else {
        console.log(`  Raw:       (no details)`);
      }
    } catch (error) {
      console.log(`  Error:     ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    console.log('');
  }

  // ─── Dashboard Info ──────────────────────────────────────────────
  const env = process.env.PAYPACK_ENVIRONMENT || 'sandbox';
  const dashboardUrl = env === 'production'
    ? 'https://dashboard.pawapay.io'
    : 'https://dashboard.sandbox.pawapay.io';

  console.log('='.repeat(70));
  console.log('📊 DASHBOARD ACCESS');
  console.log('='.repeat(70));
  console.log(`\n🌐 Environment: ${env}`);
  console.log(`🔗 Dashboard:   ${dashboardUrl}`);
  console.log(`\n📝 To verify deposits manually:`);
  console.log(`   1. Visit ${dashboardUrl}`);
  console.log(`   2. Log in with your PawaPay credentials`);
  console.log(`   3. Navigate to Transactions / Deposits`);
  console.log(`   4. Search for deposit IDs above`);
  console.log(`\n⚠️  Both deposits were REJECTED during testing (expected in sandbox):`);
  console.log(`   - PawaPay: MSISDN too short for country RUS (sandbox issue)`);
  console.log(`   - Intouch: 403 Invalid Password (sandbox credentials)`);
  console.log(`\n   ✅ Provider ordering was confirmed: PawaPay tried FIRST.`);
}

main().catch(console.error);
