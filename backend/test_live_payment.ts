/**
 * Live PawaPay Payment Test
 *
 * Initiates a real deposit to the given phone number.
 * The user will receive a USSD prompt to authorize the payment.
 *
 * Usage: npx tsx test_live_payment.ts
 *
 * ⚠️ WARNING: This sends a real USSD prompt to the target phone!
 *    The user must enter their PIN to complete the payment.
 */

import dotenv from 'dotenv';
dotenv.config();

import { createPaypackService } from './src/services/paypack.service';

async function run() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('   Live PawaPay Payment Test');
  console.log('═══════════════════════════════════════════════════\n');

  const phone = '0790706170'; // User's Rwanda MTN number
  const amount = 1000; // 1000 RWF
  const currency = 'RWF';

  // Clean phone: remove leading 0 and add country code
  const cleanPhone = phone.replace(/^0+/, '');
  const fullPhone = `250${cleanPhone}`;

  console.log(`📱 Phone:    ${phone} → ${fullPhone}`);
  console.log(`💰 Amount:   ${amount} ${currency}`);
  console.log('');

  // Initialize the PawaPay service (reads from .env)
  const pawapay = createPaypackService();

  // Step 1: Predict provider
  console.log('📡 Step 1: Predicting provider...');
  const providerInfo = await pawapay.resolveProvider(fullPhone);
  console.log(`   → Provider: ${providerInfo.provider}`);
  console.log(`   → Country:  ${providerInfo.country}`);
  console.log(`   → Currency: ${providerInfo.currency}`);
  console.log('');

  // Step 2: Initiate deposit
  console.log('📤 Step 2: Initiating deposit...');
  console.log('   ⚠️  This will send a USSD prompt to 0790706170!');
  console.log('   Enter your PIN when prompted on your phone.\n');

  const depositId = pawapay.generateDepositId();

  const result = await pawapay.initiateDeposit({
    amount,
    currency,
    phoneNumber: fullPhone,
    provider: providerInfo.provider,
    depositId,
    clientReferenceId: `LIVE-TEST-${Date.now()}`,
    customerMessage: 'iHub Test Payment',
  });

  console.log(`   ✅ Accepted: ${result.success}`);
  console.log(`   🆔 Deposit ID: ${depositId}`);
  console.log(`   📊 Status: ${result.status}`);
  if (result.reason) console.log(`   💬 Reason: ${result.reason}`);
  console.log('');

  if (!result.success) {
    console.log('❌ Payment initiation failed. See reason above.');
    process.exit(1);
  }

  // Step 3: Poll for status (up to 2 minutes)
  console.log('🔄 Step 3: Polling for status (will poll for up to 2 min)...');
  console.log('   Please check your phone and enter your PIN!\n');

  let attempts = 0;
  const maxAttempts = 30; // ~2 min with 4s intervals
  let finalStatus = 'PENDING';

  while (attempts < maxAttempts) {
    attempts++;
    await new Promise(r => setTimeout(r, 4000));

    try {
      const statusResult = await pawapay.getDepositStatus(depositId);
      console.log(`   [${attempts}] Status: ${statusResult.status}`);

      if (statusResult.status === 'successful') {
        finalStatus = 'SUCCESSFUL';
        console.log('\n   ✅ PAYMENT SUCCESSFUL!');
        if (statusResult.raw) {
          console.log(`   Settled at: ${statusResult.raw.settledAt}`);
          console.log(`   Amount: ${statusResult.raw.amount} ${statusResult.raw.currency}`);
        }
        break;
      }

      if (statusResult.status === 'failed') {
        finalStatus = 'FAILED';
        console.log('\n   ❌ Payment failed.');
        if (statusResult.raw?.outcome?.reason) {
          console.log(`   Reason: ${statusResult.raw.outcome.reason}`);
        }
        break;
      }
    } catch (e: any) {
      console.log(`   [${attempts}] Error: ${e.message}`);
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════');
  console.log('                 RESULT');
  console.log('═══════════════════════════════════════════════════');
  console.log(`   Deposit ID: ${depositId}`);
  console.log(`   Phone:      ${phone}`);
  console.log(`   Amount:     ${amount} ${currency}`);
  console.log(`   Final:      ${finalStatus === 'SUCCESSFUL' ? '✅ SUCCESSFUL' : finalStatus === 'FAILED' ? '❌ FAILED' : '⏳ TIMEOUT'}`);
  console.log('═══════════════════════════════════════════════════\n');
}

run().catch(err => {
  console.error('\n❌ Test crashed:', err.message);
  process.exit(1);
});
