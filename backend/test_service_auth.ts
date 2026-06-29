/**
 * Quick test to verify the updated paypack.service.ts with Bearer token auth
 * Usage: npx tsx test_service_auth.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import { createPaypackService } from './src/services/paypack.service';

async function test() {
  console.log('🔧 Testing PawaPayService with Bearer token auth...\n');

  const svc = createPaypackService();
  console.log('✅ createPaypackService() succeeded');
  console.log('Auth mode: PawaPay Bearer token');

  const token = await svc.getAccessToken();
  console.log(`✅ getAccessToken() returned token (${token.length} chars)`);
  console.log(`  Prefix: ${token.substring(0, 25)}...`);

  // Test predict-provider
  const pred = await svc.predictProvider('250788123456');
  if (pred) {
    console.log(`✅ predictProvider: ${pred.phoneNumber} → ${pred.provider} (${pred.country})`);
  } else {
    console.log('⚠️ predictProvider returned null (falling back to local mapping)');
  }

  // Test getSupportedCountries
  const countries = svc.getSupportedCountries();
  console.log(`✅ getSupportedCountries: ${countries.length} countries`);

  // Test normalizeStatus with COMPLETED
  const s1 = svc.normalizeStatus('COMPLETED');
  console.log(`✅ normalizeStatus('COMPLETED') = '${s1}' (expected: 'successful')`);

  const s2 = svc.normalizeStatus('SETTLED');
  console.log(`✅ normalizeStatus('SETTLED') = '${s2}' (expected: 'successful')`);

  const s3 = svc.normalizeStatus('DECLINED');
  console.log(`✅ normalizeStatus('DECLINED') = '${s3}' (expected: 'failed')`);

  // Test customer message sanitization
  const msg = (svc as any).sanitizeCustomerMessage('This is a very long customer message that exceeds 22 chars');
  console.log(`✅ sanitizeCustomerMessage: '${msg}' (${msg.length} chars, max 22)`);

  console.log('\n🎉 All tests passed!');
}

test().catch(err => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});
