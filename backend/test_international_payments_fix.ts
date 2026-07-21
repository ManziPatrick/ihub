/**
 * International Payments Fix Test — Multi-Country
 *
 * Tests the sanitizeCustomerMessage fix with descriptions containing special
 * characters (apostrophes, colons, commas, etc.) for multiple countries.
 *
 * Specifically tests the scenario that failed:
 *   UGA, AIRTEL_OAPI_UGA, "Navigating Rwanda's Digital Government: A Citizen's Guide to E-Services"
 *
 * Usage: npx tsx test_international_payments_fix.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import { createPaypackService } from './src/services/paypack.service';

const SANDBOX_BASE_URL = process.env.PAYPACK_BASE_URL?.includes('sandbox')
  ? process.env.PAYPACK_BASE_URL
  : 'https://api.sandbox.pawapay.io';

// ─── Step 1: Unit test the sanitizeCustomerMessage fix ───

function testSanitizeCustomerMessage() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  STEP 1: Unit Test — sanitizeCustomerMessage');
  console.log('═══════════════════════════════════════════════════════════\n');

  const svc = createPaypackService();
  const sanitize = (svc as any).sanitizeCustomerMessage.bind(svc) as (msg: string) => string;

  const tests: { input: string; expected: string; desc: string }[] = [
    {
      input: "Navigating Rwanda's Digital Government: A Citizen's Guide to E-Services",
      expected: "Navigating Rwanda s Di",
      desc: 'The exact failing description (69 chars → 22)',
    },
    {
      input: "Don't stop believing!",
      expected: "Don t stop believing",
      desc: 'Apostrophe + exclamation',
    },
    {
      input: "Hello, World! How's it going?",
      expected: "Hello World How s it g",
      desc: 'Comma, apostrophe, question mark, exclamation',
    },
    {
      input: "Price: 100 RWF (incl. tax) — 10% off!",
      expected: "Price 100 RWF incl tax",
      desc: 'Colon, parens, em-dash, percent',
    },
    {
      input: "Course #1: Intro to JavaScript & TypeScript",
      expected: "Course 1 Intro to Java",
      desc: 'Hash, colon, ampersand',
    },
    {
      input: "  Spaces   everywhere!  ",
      expected: "Spaces everywhere",
      desc: 'Leading/trailing spaces + multiple spaces + exclamation',
    },
    {
      input: "'''''",  // all special chars
      expected: "Payment",
      desc: 'All special chars → fallback to "Payment"',
    },
    {
      input: "ABCdef123",  // plain alphanumeric
      expected: "ABCdef123",
      desc: 'Plain alphanumeric (no change expected)',
    },
    {
      input: "A-B-C-D-E-F-G-H-I-J-K-L-M-N-O-P",  // longer than 22
      expected: "A B C D E F G H I J K",
      desc: 'Hyphenated string > 22 chars',
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    const result = sanitize(t.input);
    const ok = result === t.expected;
    if (ok) {
      console.log(`  ✅ ${t.desc}`);
      console.log(`     Input:    "${t.input.substring(0, 60)}${t.input.length > 60 ? '...' : ''}"`);
      console.log(`     Output:   "${result}" (${result.length} chars)`);
      passed++;
    } else {
      console.log(`  ❌ ${t.desc}`);
      console.log(`     Input:    "${t.input.substring(0, 60)}${t.input.length > 60 ? '...' : ''}"`);
      console.log(`     Expected: "${t.expected}"`);
      console.log(`     Got:      "${result}" (${result.length} chars)`);
      failed++;
    }
    console.log('');
  }

  console.log(`───────────────────────────────────────────────────────`);
  console.log(`  Sanitizer: ${passed} passed, ${failed} failed`);
  console.log(`───────────────────────────────────────────────────────\n`);

  return { passed, failed };
}

// ─── Step 2: Integration test — Initiate deposits with special-char descriptions ───

interface CountryTest {
  label: string;
  phone: string;
  provider: string;
  currency: string;
  description: string;
}

const COUNTRY_TESTS: CountryTest[] = [
  {
    label: '🇺🇬 Uganda — Airtel (the original failing scenario)',
    phone: '256748491043',  // Sandbox Airtel Uganda test number
    provider: 'AIRTEL_OAPI_UGA',
    currency: 'UGX',
    description: "Navigating Rwanda's Digital Government: A Citizen's Guide to E-Services",
  },
  {
    label: '🇺🇬 Uganda — MTN',
    phone: '256783456789',  // Sandbox MTN Uganda success number (from test_deposit_flow)
    provider: 'MTN_MOMO_UGA',
    currency: 'UGX',
    description: "Don't Miss: Uganda's Digital Future — Register Now!",
  },
  {
    label: '🇰🇪 Kenya — M-Pesa',
    phone: '254703456789',  // Sandbox M-Pesa Kenya success number
    provider: 'MPESA_KEN',
    currency: 'KES',
    description: "Kenya's Premier Tech Course: AI & Machine Learning (2026)",
  },
  {
    label: '🇹🇿 Tanzania — Vodacom',
    phone: '255763456789',  // Sandbox Vodacom Tanzania success number
    provider: 'VODACOM_TZA',
    currency: 'TZS',
    description: "Swahili's Finest: Digital Marketing Course — 50% Off!",
  },
  {
    label: '🇿🇲 Zambia — MTN',
    phone: '260763456789',  // Sandbox MTN Zambia success number
    provider: 'MTN_MOMO_ZMB',
    currency: 'ZMW',
    description: "Zambia's #1 Data Science Course: Python, SQL & AI",
  },
  {
    label: '🇷🇼 Rwanda — MTN',
    phone: '250783456789',  // Sandbox MTN Rwanda success number
    provider: 'MTN_MOMO_RWA',
    currency: 'RWF',
    description: "Rwanda's Digital Government: A Citizen's Guide to E-Services",
  },
];

interface CountryResult {
  test: CountryTest;
  initiateOk: boolean;
  depositId: string;
  status: string;
  reason?: string;
  descriptionSanitized: string;
}

async function testCountryPayments(sanitize: (msg: string) => string): Promise<CountryResult[]> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  STEP 2: Integration Test — Multi-Country Payments');
  console.log('═══════════════════════════════════════════════════════════\n');

  const svc = createPaypackService();
  const token = await svc.getAccessToken();
  const results: CountryResult[] = [];

  for (let idx = 0; idx < COUNTRY_TESTS.length; idx++) {
    const test = COUNTRY_TESTS[idx];

    console.log(`─── Test ${idx + 1}/${COUNTRY_TESTS.length}: ${test.label} ───`);
    console.log(`  📱 Phone:     ${test.phone}`);
    console.log(`  🏦 Provider:  ${test.provider}`);
    console.log(`  💰 Amount:    400 ${test.currency}`);
    console.log(`  📝 Desc:      "${test.description}"`);

    const depositId = svc.generateDepositId();
    const customerMessage = sanitize(test.description);

    console.log(`  🧹 Sanitized: "${customerMessage}" (${customerMessage.length} chars)`);

    const body = {
      depositId,
      payer: {
        type: 'MMO' as const,
        accountDetails: {
          phoneNumber: test.phone,
          provider: test.provider,
        },
      },
      amount: '400',
      currency: test.currency,
      clientReferenceId: `TEST-${Date.now()}-${idx}`,
      customerMessage,
    };

    try {
      const response = await fetch(`${SANDBOX_BASE_URL}/v2/deposits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          'Idempotency-Key': `ik-${depositId}`,
        },
        body: JSON.stringify(body),
      });

      const responseData = await response.json() as {
        depositId: string;
        status: string;
        failureReason?: { failureCode: string; failureMessage: string };
        reason?: string;
      };

      if (!response.ok) {
        const reason = responseData.failureReason
          ? `${responseData.failureReason.failureCode}: ${responseData.failureReason.failureMessage}`
          : responseData.reason || responseData.status || `HTTP ${response.status}`;

        console.log(`  ${response.status === 409 ? '⚠️ Conflict (retryable)' : '❌ REJECTED'}: ${reason}`);
        console.log(`  Full: ${JSON.stringify(responseData)}\n`);

        results.push({
          test,
          initiateOk: false,
          depositId,
          status: responseData.status || `HTTP ${response.status}`,
          reason,
          descriptionSanitized: customerMessage,
        });
        continue;
      }

      console.log(`  ✅ ACCEPTED! Deposit ID: ${depositId.substring(0, 12)}...`);
      console.log(`  Status: ${responseData.status}\n`);

      results.push({
        test,
        initiateOk: true,
        depositId,
        status: responseData.status,
        reason: responseData.failureReason?.failureMessage,
        descriptionSanitized: customerMessage,
      });
    } catch (error) {
      console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Request failed'}\n`);
      results.push({
        test,
        initiateOk: false,
        depositId,
        status: 'ERROR',
        reason: error instanceof Error ? error.message : 'Request failed',
        descriptionSanitized: customerMessage,
      });
    }
  }

  return results;
}

// ─── Main ───

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   International Payments Fix — Multi-Country Test Suite     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`  Sandbox: ${SANDBOX_BASE_URL}`);
  console.log(`  Time:    ${new Date().toISOString()}`);
  console.log('');

  // ═══ Step 1: Unit tests ═══
  const unitResults = testSanitizeCustomerMessage();

  // ═══ Step 2: Integration tests ═══
  const svc = createPaypackService();
  const sanitize = (svc as any).sanitizeCustomerMessage.bind(svc) as (msg: string) => string;
  const countryResults = await testCountryPayments(sanitize);

  // ═══ Summary ═══
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                     FINAL SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('  🔬 Sanitizer Unit Tests:');
  console.log(`     ✅ ${unitResults.passed} passed`);
  if (unitResults.failed > 0) console.log(`     ❌ ${unitResults.failed} failed`);
  console.log('');

  console.log('  🌍 Multi-Country Deposit Tests:');
  const accepted = countryResults.filter(r => r.initiateOk).length;
  const rejected = countryResults.filter(r => !r.initiateOk).length;
  for (const r of countryResults) {
    const icon = r.initiateOk ? '✅' : '❌';
    const rejectReason = r.reason ? ` — ${r.reason}` : '';
    console.log(`     ${icon} ${r.test.label}`);
    console.log(`        Desc: "${r.descriptionSanitized}" (${r.descriptionSanitized.length} chars)`);
    console.log(`        ${r.initiateOk ? 'ACCEPTED' : 'REJECTED'}${rejectReason}`);
  }
  console.log(`     Total: ${countryResults.length} | ✅ ${accepted} Accepted | ❌ ${rejected} Rejected`);
  console.log('');

  console.log('  📋 KEY VERIFICATION:');
  const failedWithBadChar = countryResults.filter(
    r => !r.initiateOk && r.reason?.includes('INVALID_PARAMETER')
  );
  if (failedWithBadChar.length === 0) {
    console.log('     ✅ NO "INVALID_PARAMETER: Customer message can have only alphanumeric" errors!');
    console.log('     ✅ The sanitizeCustomerMessage fix is working correctly.');
  } else {
    console.log(`     ❌ ${failedWithBadChar.length} test(s) still have INVALID_PARAMETER errors.`);
  }

  // Check if the specific failing scenario is now fixed
  const ugandaAirtelResult = countryResults.find(
    r => r.test.provider === 'AIRTEL_OAPI_UGA'
  );
  if (ugandaAirtelResult) {
    console.log('');
    console.log('  🎯 ORIGINAL FAILING SCENARIO (UGA/AIRTEL):');
    console.log(`     Description: "${ugandaAirtelResult.test.description}"`);
    console.log(`     Sanitized:   "${ugandaAirtelResult.descriptionSanitized}"`);
    console.log(`     Result:      ${ugandaAirtelResult.initiateOk ? '✅ ACCEPTED (Fix works!)' : '❌ REJECTED'}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\n❌ Test suite crashed:', err.message);
  process.exit(1);
});
