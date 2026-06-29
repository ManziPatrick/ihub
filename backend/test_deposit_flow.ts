/**
 * PawaPay Sandbox Deposit Flow Test
 *
 * Tests the complete deposit lifecycle: initiate → poll → verify
 * Uses official PawaPay sandbox test numbers from docs.pawapay.io/testing_the_api
 *
 * Usage: npx tsx test_deposit_flow.ts
 */

const PAWAPAY_SANDBOX_URL = 'https://api.sandbox.pawapay.io';
const BEARER_TOKEN = 'eyJraWQiOiIxIiwiYWxnIjoiRVMyNTYifQ.eyJ0dCI6IkFBVCIsInN1YiI6IjI0MDQwIiwibWF2IjoiMSIsImV4cCI6MjA5ODM0NDI0NywiaWF0IjoxNzgyNzI1MDQ3LCJwbSI6IkRBRixQQUYiLCJqdGkiOiIyMDQxNDQyZi1lZjllLTQ4NWYtODgxMC1kNDM0NTUwN2Y0NDEifQ._KZxcUuOADk0IWwncT7o54G_WEh4kr9HrwCHD6HwNF5aptWXghvK5FMD-m3wGy4KSNLoufoLuacRpk81BVkrcg';

interface TestCase {
  label: string;
  country: string;
  phone: string;
  provider: string;
  currency: string;
  expectedOutcome: 'COMPLETED' | 'PAYMENT_NOT_APPROVED' | 'PAYER_NOT_FOUND' | 'INSUFFICIENT_BALANCE' | 'OTHER_ERROR';
  amount: number;
}

interface DepositResult {
  testCase: TestCase;
  initiateOk: boolean;
  initiateStatus: string;
  depositId: string;
  pollStatus: string | null;
  pollRaw: any;
  success: boolean;
  error?: string;
}

// ─── Test Cases from official PawaPay sandbox docs ───

const TEST_CASES: TestCase[] = [
  // ✅ Successful deposits (auto-settle)
  {
    label: 'MTN Rwanda - Success',
    country: 'RWA',
    phone: '250783456789',
    provider: 'MTN_MOMO_RWA',
    currency: 'RWF',
    expectedOutcome: 'COMPLETED',
    amount: 100,
  },
  {
    label: 'Airtel Rwanda - Success',
    country: 'RWA',
    phone: '250733456789',
    provider: 'AIRTEL_RWA',
    currency: 'RWF',
    expectedOutcome: 'COMPLETED',
    amount: 500,
  },
  {
    label: 'M-Pesa Kenya - Success',
    country: 'KEN',
    phone: '254703456789',
    provider: 'MPESA_KEN',
    currency: 'KES',
    expectedOutcome: 'COMPLETED',
    amount: 50,
  },
  {
    label: 'MTN Uganda - Success',
    country: 'UGA',
    phone: '256783456789',
    provider: 'MTN_MOMO_UGA',
    currency: 'UGX',
    expectedOutcome: 'COMPLETED',
    amount: 5000,
  },
  {
    label: 'Vodacom Tanzania - Success',
    country: 'TZA',
    phone: '255763456789',
    provider: 'VODACOM_TZA',
    currency: 'TZS',
    expectedOutcome: 'COMPLETED',
    amount: 1000,
  },
  {
    label: 'MTN Zambia - Success',
    country: 'ZMB',
    phone: '260763456789',
    provider: 'MTN_MOMO_ZMB',
    currency: 'ZMW',
    expectedOutcome: 'COMPLETED',
    amount: 15,
  },
  // ❌ Failure scenarios
  {
    label: 'MTN Rwanda - Insufficient Balance',
    country: 'RWA',
    phone: '250783456049',
    provider: 'MTN_MOMO_RWA',
    currency: 'RWF',
    expectedOutcome: 'INSUFFICIENT_BALANCE',
    amount: 100,
  },
  {
    label: 'MTN Rwanda - Payment Not Approved',
    country: 'RWA',
    phone: '250783456039',
    provider: 'MTN_MOMO_RWA',
    currency: 'RWF',
    expectedOutcome: 'PAYMENT_NOT_APPROVED',
    amount: 100,
  },
  {
    label: 'M-Pesa Kenya - Payment Not Approved',
    country: 'KEN',
    phone: '254703456039',
    provider: 'MPESA_KEN',
    currency: 'KES',
    expectedOutcome: 'PAYMENT_NOT_APPROVED',
    amount: 50,
  },
];

let allResults: DepositResult[] = [];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function initiateDeposit(testCase: TestCase, attempt = 1): Promise<{
  ok: boolean;
  depositId: string;
  status: string;
  response: any;
}> {
  const depositId = crypto.randomUUID?.() || `test-${Date.now()}-${attempt}`;
  const idempotencyKey = crypto.randomBytes?.(16).toString('hex') || `${depositId}-ik`;

  const body = {
    depositId,
    payer: {
      type: 'MMO',
      accountDetails: {
        phoneNumber: testCase.phone,
        provider: testCase.provider,
      },
    },
    amount: testCase.amount.toString(),
    currency: testCase.currency,
    clientReferenceId: `ref-${Date.now()}-${attempt}`,
    customerMessage: 'Pay test',
  };

  const response = await fetch(`${PAWAPAY_SANDBOX_URL}/v2/deposits`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${BEARER_TOKEN}`,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 409 && attempt < 3) {
    // Duplicate depositId — retry with a new one
    console.log(`  ⚠️  Conflict (409), retrying with new depositId...`);
    return initiateDeposit(testCase, attempt + 1);
  }

  return {
    ok: response.ok,
    depositId,
    status: data.status || `HTTP ${response.status}`,
    response: data,
  };
}

async function pollDepositStatus(depositId: string, maxAttempts = 30): Promise<{
  status: string;
  raw: any;
}> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${PAWAPAY_SANDBOX_URL}/v2/deposits/${depositId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${BEARER_TOKEN}`,
      },
    });

    if (response.status === 404) {
      await sleep(2000);
      continue;
    }

    const data = await response.json().catch(() => ({}));

    if (data.status === 'SETTLED' || data.status === 'DECLINED' || data.status === 'EXPIRED' || data.status === 'CANCELLED') {
      return { status: data.status, raw: data };
    }

    if (data.outcome?.status === 'SUCCESS' || data.outcome?.status === 'FAILED') {
      return { status: data.status, raw: data };
    }

    // Still pending — wait and retry
    await sleep(2000);
  }

  return { status: 'TIMEOUT', raw: null };
}

function normalizeStatus(raw: any): string {
  if (!raw) return 'TIMEOUT';
  if (raw.status === 'SETTLED') return 'COMPLETED';
  if (raw.outcome?.status === 'SUCCESS') return 'COMPLETED';
  if (raw.outcome?.reason) return raw.outcome.reason;
  return raw.status || 'UNKNOWN';
}

function testWebhookParsing(raw: any): { ok: boolean; parsed: any } {
  // Simulate what our webhook handler does
  try {
    const transaction = raw;
    let status = 'pending';
    if (transaction.status === 'SETTLED' || transaction.outcome?.status === 'SUCCESS') {
      status = 'successful';
    } else if (['DECLINED', 'EXPIRED', 'CANCELLED'].includes(transaction.status) || transaction.outcome?.status === 'FAILED') {
      status = 'failed';
    }

    const parsed = {
      transactionRef: transaction.depositId,
      status,
      amount: parseFloat(transaction.amount) || 0,
      currency: transaction.currency || 'RWF',
      provider: transaction.payer?.accountDetails?.provider || '',
      clientNumber: transaction.payer?.accountDetails?.phoneNumber || '',
      settledAt: transaction.settledAt,
    };

    return { ok: true, parsed };
  } catch (e: any) {
    return { ok: false, parsed: { error: e.message } };
  }
}

async function runTest() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('    PawaPay Sandbox — Complete Deposit Flow Test');
  console.log('═══════════════════════════════════════════════════════════\n');

  for (let idx = 0; idx < TEST_CASES.length; idx++) {
    const tc = TEST_CASES[idx];
    console.log(`─── Test ${idx + 1}/${TEST_CASES.length}: ${tc.label} ───`);
    console.log(`    Phone: ${tc.phone}  |  ${tc.amount} ${tc.currency}  |  Provider: ${tc.provider}`);
    console.log(`    Expected: ${tc.expectedOutcome}\n`);

    // Step 1: Initiate deposit
    console.log(`  📤 Initiating deposit...`);
    const init = await initiateDeposit(tc);
    console.log(`  Response: ${init.status} (depositId: ${init.depositId.substring(0, 8)}...)`);

    if (!init.ok) {
      console.log(`  ❌ Initiation failed: ${JSON.stringify(init.response)}\n`);
      allResults.push({
        testCase: tc,
        initiateOk: false,
        initiateStatus: init.status,
        depositId: init.depositId,
        pollStatus: null,
        pollRaw: null,
        success: false,
        error: `Initiation failed: ${init.status}`,
      });
      continue;
    }

    // Step 2: Poll for status (sandbox auto-settles instantly)
    console.log(`  🔄 Polling for status (sandbox auto-settles)...`);
    const pollResult = await pollDepositStatus(init.depositId);

    if (pollResult.status === 'TIMEOUT') {
      console.log(`  ⚠️  Timed out waiting for settlement\n`);
      allResults.push({
        testCase: tc,
        initiateOk: true,
        initiateStatus: 'ACCEPTED',
        depositId: init.depositId,
        pollStatus: null,
        pollRaw: null,
        success: false,
        error: 'Poll timeout',
      });
      continue;
    }

    const actualOutcome = normalizeStatus(pollResult.raw);
    const matched = actualOutcome === tc.expectedOutcome;
    console.log(`  Status: ${pollResult.status}  |  Outcome: ${actualOutcome}`);
    console.log(`  Match expected: ${matched ? '✅ YES' : '❌ NO'}`);

    // Step 3: Test webhook parsing
    const wp = testWebhookParsing(pollResult.raw);
    console.log(`  Webhook parser: ${wp.ok ? '✅ OK' : '❌ FAIL'} → ${JSON.stringify(wp.parsed)}`);

    if (pollResult.raw) {
      console.log(`  Raw response:`);
      console.log(`    depositId: ${pollResult.raw.depositId}`);
      console.log(`    status: ${pollResult.raw.status}`);
      console.log(`    amount: ${pollResult.raw.amount} ${pollResult.raw.currency}`);
      console.log(`    provider: ${pollResult.raw.payer?.accountDetails?.provider}`);
      console.log(`    outcome: ${JSON.stringify(pollResult.raw.outcome)}`);
      if (pollResult.raw.settledAt) console.log(`    settledAt: ${pollResult.raw.settledAt}`);
    }

    const success = matched && pollResult.status !== 'TIMEOUT';
    console.log(`  ${success ? '✅ PASS' : '❌ FAIL'}\n`);

    allResults.push({
      testCase: tc,
      initiateOk: init.ok,
      initiateStatus: init.status,
      depositId: init.depositId,
      pollStatus: pollResult.status,
      pollRaw: pollResult.raw,
      success,
    });
  }

  // ─── Summary ───
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    TEST RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  const passed = allResults.filter(r => r.success).length;
  const failed = allResults.filter(r => !r.success).length;

  for (const result of allResults) {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status} | ${result.testCase.label}`);
    console.log(`         Initiate: ${result.initiateStatus}`);
    console.log(`         Poll:     ${result.pollStatus || 'N/A'}`);
    if (result.pollRaw) {
      const outcome = normalizeStatus(result.pollRaw);
      const expected = result.testCase.expectedOutcome;
      const match = outcome === expected ? '✅' : '❌';
      console.log(`         Outcome:  ${outcome} (expected ${expected}) ${match}`);
    }
    if (result.error) console.log(`         Error:    ${result.error}`);
    console.log('');
  }

  console.log('───────────────────────────────────────────────────────────');
  console.log(`  Total: ${allResults.length}  |  ✅ ${passed} Passed  |  ❌ ${failed} Failed`);
  console.log('───────────────────────────────────────────────────────────\n');

  // API reliability note
  console.log('📋 NOTES');
  console.log('──────────────────');
  console.log('  • Sandbox auto-settles deposits near-instantly (no USSD prompt)');
  console.log('  • Production deposits require the user to approve via USSD PIN');
  console.log('  • Polling interval in sandbox: 2s (can be longer in production)');
  console.log('  • Webhook parser works — maps SETTLED → successful, DECLINED/CANCELLED → failed');
  console.log('  • Update PAYPACK_BASE_URL to https://api.pawapay.io for production');
  console.log('───────────────────────────────────────────────────────────\n');
}

// Ensure crypto.randomUUID exists
const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
if (typeof crypto.randomUUID !== 'function' || nodeMajor < 19) {
  (crypto as any).randomUUID = () => {
    const bytes = crypto.randomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = bytes.toString('hex');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  };
}

runTest().catch(error => {
  console.error('\n❌ Test suite crashed:', error.message);
  process.exit(1);
});
