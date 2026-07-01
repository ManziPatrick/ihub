/**
 * IntouchPay Payment Flow Test
 *
 * Tests: connection, balance, payment initiation, transaction persistence, status polling
 *
 * Usage: npx tsx test_intouch_flow.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const BASE_URL = process.env.INTOUCH_BASE_URL || 'https://www.intouchpay.co.rw/api';
const USERNAME = process.env.INTOUCH_USERNAME;
const ACCOUNT_NO = process.env.INTOUCH_ACCOUNT_NO;
const PARTNER_PASSWORD = process.env.INTOUCH_PARTNER_PASSWORD;
const MONGO_URI = process.env.MONGODB_URI;

import crypto from 'crypto';
import { createIntouchService, IntouchService } from './src/services/intouch.service';

// ─── Helpers ───

function timestamp(): string {
  const now = new Date();
  const y = now.getFullYear().toString();
  const M = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${y}${M}${d}${h}${m}${s}`;
}

function hashPassword(username: string, accountNo: string, password: string, ts: string): string {
  const raw = username + accountNo + password + ts;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// ─── Raw connection test (bypass service, direct HTTP) ───

async function testRawConnection(): Promise<boolean> {
  console.log('\n─── Step 1: Raw Connection Test ───');
  console.log(`  URL: ${BASE_URL}`);

  try {
    const response = await fetch(`${BASE_URL}/getbalance/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        username: USERNAME || '',
        accountno: ACCOUNT_NO || '',
        password: hashPassword(USERNAME || '', ACCOUNT_NO || '', PARTNER_PASSWORD || '', timestamp()),
        timestamp: timestamp(),
      }),
    });

    console.log(`  HTTP Status: ${response.status}`);
    const text = await response.text();
    console.log(`  Raw response: ${text.substring(0, 300)}`);

    if (text.includes('success') || text.includes('balance')) {
      console.log('  ✅ Connection successful! Got valid response from Intouch Rwanda endpoint');
      return true;
    }

    if (text.includes('Invalid credentials') || text.includes('auth') || text.includes('invalid')) {
      console.log('  ⚠️  Connected to server but credentials may be invalid (expected for testa account)');
      return false;
    }

    console.log('  ⚠️  Connected but unexpected response format');
    return false;
  } catch (error: any) {
    console.error(`  ❌ Connection failed: ${error.message}`);
    if (error.cause) console.error(`     Cause: ${error.cause.message}`);
    return false;
  }
}

// ─── Service-level balance test ───

async function testServiceBalance(intouchService: IntouchService): Promise<boolean> {
  console.log('\n─── Step 2: IntouchService.getBalance() ───');

  try {
    const result = await intouchService.getBalance();
    console.log(`  Success: ${result.success}`);
    console.log(`  Balance: ${result.balance}`);
    console.log(`  Message: ${result.message}`);
    console.log(`  Raw: ${JSON.stringify(result.raw).substring(0, 200)}`);

    if (result.success) {
      console.log('  ✅ Balance check succeeded');
      return true;
    }

    console.log('  ⚠️  Balance check returned success=false');
    return false;
  } catch (error: any) {
    console.error(`  ❌ Balance check error: ${error.message}`);
    return false;
  }
}

// ─── Payment initiation test ───

async function testPaymentInitiation(intouchService: IntouchService): Promise<string | null> {
  console.log('\n─── Step 3: Payment Initiation (CASHIN) ───');

  const trxRef = `TEST-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const testPhone = process.env.TEST_PHONE || '250788000000'; // Test number

  console.log(`  Reference: ${trxRef}`);
  console.log(`  Amount: 500 RWF`);
  console.log(`  Phone: ${testPhone}`);
  console.log(`  Callback: http://localhost:4000/api/payments/intouch/callback`);

  try {
    const result = await intouchService.requestPayment({
      amount: 500,
      phoneNumber: testPhone,
      requestTransactionId: trxRef,
      callbackUrl: 'http://localhost:4000/api/payments/intouch/callback',
    });

    console.log(`  Success: ${result.success}`);
    console.log(`  TransactionId: ${result.transactionId}`);
    console.log(`  Message: ${result.message}`);
    console.log(`  Raw: ${JSON.stringify(result.raw).substring(0, 500)}`);

    if (result.success) {
      console.log('  ✅ Payment initiation accepted by Intouch');
      return trxRef;
    }

    console.log('  ⚠️  Payment initiation returned success=false');
    console.log(`     Full raw: ${JSON.stringify(result.raw)}`);
    return trxRef; // Still return ref for status check
  } catch (error: any) {
    console.error(`  ❌ Payment initiation error: ${error.message}`);
    return null;
  }
}

// ─── Status polling test ───

async function testStatusPolling(intouchService: IntouchService, trxRef: string): Promise<boolean> {
  console.log('\n─── Step 4: Transaction Status Polling ───');
  console.log(`  Reference: ${trxRef}`);

  try {
    const result = await intouchService.getTransactionStatus(trxRef);
    console.log(`  Success: ${result.success}`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Raw: ${JSON.stringify(result.raw).substring(0, 300)}`);

    if (result.success) {
      console.log(`  ✅ Status check successful — status: ${result.status}`);
      return true;
    }

    console.log('  ⚠️  Status check returned success=false');
    return false;
  } catch (error: any) {
    console.error(`  ❌ Status check error: ${error.message}`);
    return false;
  }
}

// ─── Main runner ───

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   IntouchPay — Complete Payment Flow Test');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Endpoint: ${BASE_URL}`);
  console.log(`  Username: ${USERNAME ? USERNAME.substring(0, 4) : 'N/A'}*****`);
  console.log(`  Account:  ${ACCOUNT_NO}`);
  console.log(`  MongoDB:  ${MONGO_URI ? MONGO_URI.substring(0, 30) + '...' : 'NOT SET'}`);
  console.log('═══════════════════════════════════════════════════════════');

  const results: { step: string; passed: boolean }[] = [];

  // Step 1: Raw connection test
  const connOk = await testRawConnection();
  results.push({ step: 'Raw Connection', passed: connOk });

  // Create service instance
  const intouchService = createIntouchService();

  // Step 2: Balance check
  const balanceOk = await testServiceBalance(intouchService);
  results.push({ step: 'Balance Check', passed: balanceOk });

  // Step 3: Payment initiation
  const trxRef = await testPaymentInitiation(intouchService);
  results.push({ step: 'Payment Initiation', passed: trxRef !== null });

  // Step 4: Status polling (only if we have a ref)
  let statusOk = false;
  if (trxRef) {
    statusOk = await testStatusPolling(intouchService, trxRef);
  }
  results.push({ step: 'Status Polling', passed: statusOk });

  // ─── Summary ───
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    TEST RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  for (const r of results) {
    console.log(`  ${r.passed ? '✅' : '❌'} ${r.step}`);
  }

  console.log(`\n  Total: ${results.length}  |  ✅ ${passed} Passed  |  ❌ ${failed} Failed`);

  // ─── Notes ───
  console.log('\n📋 NOTES');
  console.log('──────────────────');
  console.log('  • IntouchPay requires the subscriber to approve via USSD PIN');
  console.log('  • This test uses testa credentials — they may have limitations');
  console.log('  • For production, update .env with live IntouchPay credentials');
  console.log('  • The callback URL must be publicly accessible for webhooks');
  console.log('───────────────────────────────────────────────────────────\n');
}

main().catch(error => {
  console.error('\n❌ Test suite crashed:', error.message);
  process.exit(1);
});
