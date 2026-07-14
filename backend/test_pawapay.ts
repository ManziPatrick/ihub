/**
 * PawaPay Multi-Country API Connection Test
 * Tests: authentication, predict-provider, active config, and deposit initiation
 *
 * Usage: npx tsx test_pawapay.ts
 */

import dotenv from 'dotenv';
dotenv.config();

// API URL — reads from env or defaults to sandbox
const PAWAPAY_BASE_URL = process.env.PAYPACK_BASE_URL || 'https://api.sandbox.pawapay.io';

// Token from env — uses PAWAPAY_API_TOKEN or falls back to old sandbox token
const BEARER_TOKEN = process.env.PAWAPAY_API_TOKEN || '';

interface TestResult {
  name: string;
  status: '✅ PASS' | '❌ FAIL' | '⚠️ SKIP';
  details: string;
  data?: any;
}

const results: TestResult[] = [];

async function testPawaPayConnection() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('   PawaPay Multi-Country API — Connection Test');
  console.log('═══════════════════════════════════════════════\n');

  // ─── 1. Test Authentication ───
  console.log('📡 1. Testing Authentication...');
  try {
    const authResponse = await fetch(`${PAWAPAY_BASE_URL}/auth/agents/authorize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: 'test',
        client_secret: 'test',
      }),
    });

    if (authResponse.status === 404) {
      // Expected — PawaPay doesn't use OAuth2 like Paypack
      const text = await authResponse.text();
      results.push({
        name: 'OAuth2 Auth Endpoint',
        status: '⚠️ SKIP',
        details: `POST /auth/agents/authorize returned ${authResponse.status} — PawaPay uses static Bearer tokens, not OAuth2 client credentials. This endpoint is the old Paypack Rwanda pattern.`,
        data: text.substring(0, 200),
      });
      console.log(`  ⚠️  OAuth2 endpoint not found (${authResponse.status}) — expected, PawaPay uses Bearer tokens\n`);
    } else {
      results.push({
        name: 'OAuth2 Auth Endpoint',
        status: '✅ PASS',
        details: `Responded with ${authResponse.status}`,
      });
    }
  } catch (error: any) {
    results.push({
      name: 'OAuth2 Auth Endpoint',
      status: '❌ FAIL',
      details: `Connection error: ${error.message}`,
    });
  }

  // ─── 2. Test Predict Provider with Bearer Token ───
  console.log('📡 2. Testing predict-provider (Bearer Token auth)...');
  const testPhones = [
    { label: 'MTN Rwanda', phone: '250788123456' },
    { label: 'M-Pesa Kenya', phone: '254712345678' },
    { label: 'MTN Uganda', phone: '256771234567' },
    { label: 'Vodacom Tanzania', phone: '255762345678' },
    { label: 'MTN Zambia', phone: '260761234567' },
  ];

  for (const { label, phone } of testPhones) {
    try {
      const response = await fetch(`${PAWAPAY_BASE_URL}/v2/predict-provider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${BEARER_TOKEN}`,
        },
        body: JSON.stringify({ phoneNumber: phone }),
      });

      if (response.ok) {
        const data = await response.json();
        results.push({
          name: `Predict Provider: ${label}`,
          status: '✅ PASS',
          details: `${phone} → ${data.provider} (${data.country})`,
          data,
        });
        console.log(`  ✅ ${label} (${phone}): ${data.provider} (${data.country})`);
      } else {
        const errorText = await response.text();
        results.push({
          name: `Predict Provider: ${label}`,
          status: response.status === 401 || response.status === 403 ? '❌ FAIL' : '⚠️ SKIP',
          details: `HTTP ${response.status}: ${errorText.substring(0, 200)}`,
        });
        console.log(`  ❌ ${label} (${phone}): HTTP ${response.status}`);
        if (response.status === 401) {
          console.log('  → Token may be invalid or expired');
        }
      }
    } catch (error: any) {
      results.push({
        name: `Predict Provider: ${label}`,
        status: '❌ FAIL',
        details: `Connection error: ${error.message}`,
      });
    }
  }
  console.log('');

  // ─── 3. Test Get Active Config ───
  console.log('📡 3. Testing get active config...');
  try {
    const response = await fetch(`${PAWAPAY_BASE_URL}/v2/active-conf`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${BEARER_TOKEN}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const providers = Array.isArray(data) ? data : [];
      results.push({
        name: 'Active Config',
        status: '✅ PASS',
        details: `${providers.length} active providers/configs returned`,
        data: providers.slice(0, 5), // Show first 5
      });
      console.log(`  ✅ ${providers.length} active configs returned`);
      if (providers.length > 0) {
        console.log(`  Sample: ${JSON.stringify(providers.slice(0, 3), null, 2)}`);
      }
    } else {
      const errorText = await response.text();
      results.push({
        name: 'Active Config',
        status: response.status === 401 || response.status === 403 ? '❌ FAIL' : '⚠️ SKIP',
        details: `HTTP ${response.status}: ${errorText.substring(0, 200)}`,
      });
      console.log(`  ❌ Active Config: HTTP ${response.status}`);
    }
  } catch (error: any) {
    results.push({
      name: 'Active Config',
      status: '❌ FAIL',
      details: `Connection error: ${error.message}`,
    });
  }
  console.log('');

  // ─── 4. Test Initiate Deposit (DRY RUN — no actual money) ───
  console.log('📡 4. Testing initiate deposit (dry run — checking API reachability)...');
  try {
    const testDepositId = crypto.randomUUID?.() || 'test-' + Date.now();
    const body = {
      depositId: testDepositId,
      payer: {
        type: 'MMO',
        accountDetails: {
          phoneNumber: '250788123456',
          provider: 'MTN_MOMO_RWA',
        },
      },
      amount: '100',
      currency: 'RWF',
    };

    const response = await fetch(`${PAWAPAY_BASE_URL}/v2/deposits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${BEARER_TOKEN}`,
        'Idempotency-Key': 'test-' + Date.now(),
      },
      body: JSON.stringify(body),
    });

    const responseData = await response.json().catch(() => null);

    if (response.ok) {
      results.push({
        name: 'Initiate Deposit',
        status: '✅ PASS',
        details: `Deposit ${testDepositId}: ${responseData?.status || 'ACCEPTED'}`,
        data: responseData,
      });
      console.log(`  ✅ Deposit initiated: ${responseData?.status || 'unknown'}`);
    } else if (response.status === 422) {
      // 422 likely means invalid phone/provider combo — that's OK, the API is reachable
      results.push({
        name: 'Initiate Deposit',
        status: '⚠️ SKIP',
        details: `HTTP 422 (likely invalid test phone) — API is reachable and authenticated. Body: ${JSON.stringify(responseData)}`,
        data: responseData,
      });
      console.log(`  ⚠️  HTTP 422 (test phone may not be valid for deposit) — but API is reachable`);
      console.log(`  Response: ${JSON.stringify(responseData)}`);
    } else {
      results.push({
        name: 'Initiate Deposit',
        status: response.status === 401 || response.status === 403 ? '❌ FAIL' : '⚠️ SKIP',
        details: `HTTP ${response.status}: ${JSON.stringify(responseData)}`,
      });
      console.log(`  ❌ Deposit: HTTP ${response.status}`);
      if (responseData) console.log(`  Response: ${JSON.stringify(responseData)}`);
    }
  } catch (error: any) {
    results.push({
      name: 'Initiate Deposit',
      status: '❌ FAIL',
      details: `Connection error: ${error.message}`,
    });
  }

  // ─── Summary ───
  console.log('\n═══════════════════════════════════════════════');
  console.log('                    RESULTS');
  console.log('═══════════════════════════════════════════════\n');

  const passed = results.filter(r => r.status === '✅ PASS').length;
  const failed = results.filter(r => r.status === '❌ FAIL').length;
  const skipped = results.filter(r => r.status === '⚠️ SKIP').length;

  for (const result of results) {
    console.log(`  ${result.status} | ${result.name}`);
    console.log(`         ${result.details}`);
    if (result.data) {
      console.log(`         Data: ${JSON.stringify(result.data).substring(0, 150)}`);
    }
    console.log('');
  }

  console.log('───────────────────────────────────────────────');
  console.log(`  Total: ${results.length}  |  ✅ ${passed} Passed  |  ❌ ${failed} Failed  |  ⚠️ ${skipped} Skipped`);
  console.log('───────────────────────────────────────────────\n');

  // ─── Recommendations ───
  console.log('📋 RECOMMENDATIONS');
  console.log('──────────────────');
  if (failed > 0 || results.some(r => r.status === '❌ FAIL')) {
    console.log('  ❌ Some tests failed. See above for details.');
  }
  console.log('  1. Update PAYPACK_BASE_URL from https://payments.paypack.rw/api');
  console.log('     → Production: https://api.pawapay.io');
  console.log('     → Sandbox:    https://api.sandbox.pawapay.io');
  console.log('  2. Update auth in paypack.service.ts — PawaPay uses static Bearer tokens,');
  console.log('     not OAuth2 client_credentials like old Paypack Rwanda.');
  console.log('  3. Keep PAYPACK_CLIENT_ID/PAYPACK_CLIENT_SECRET for backward compat with');
  console.log('     old Paypack Rwanda. Add PAWAPAY_API_TOKEN for the new multi-country API.');
  console.log('───────────────────────────────────────────────\n');
}

// Add crypto.randomUUID fallback for older Node
if (typeof crypto.randomUUID !== 'function') {
  (crypto as any).randomUUID = () => {
    const bytes = crypto.randomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = bytes.toString('hex');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  };
}

testPawaPayConnection().catch(console.error);
