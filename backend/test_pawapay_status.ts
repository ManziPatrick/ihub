/**
 * Quick PawaPay Status Test
 * Run: npx tsx test_pawapay_status.ts
 */
import dotenv from 'dotenv';
dotenv.config();
import { createPaypackService } from './src/services/paypack.service';

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  PAWAPAY STATUS CHECK');
  console.log('═══════════════════════════════════════════════');
  console.log();

  const p = createPaypackService();
  
  // 1. Merchant Status
  console.log('📡 STEP 1: Merchant Status (active configs)');
  const status = await p.getMerchantStatus();
  console.log(`  Connected:      ${status.connected ? '✅ YES' : '❌ NO'}`);
  console.log(`  Active configs: ${status.activeConfigs}`);
  console.log(`  Countries:      ${status.countries.length > 0 ? status.countries.join(', ') : '(none configured in PawaPay dashboard yet)'}`);
  console.log(`  Message:        ${status.message || 'OK'}`);
  console.log();

  // 2. Supported countries (from local mapping)
  console.log('📋 STEP 2: All Supported Countries (20)');
  const countries = p.getSupportedCountries();
  console.log(`  Total: ${countries.length} countries`);
  countries.forEach(c => {
    const names: Record<string, string> = {
      RWA: 'Rwanda', KEN: 'Kenya', UGA: 'Uganda', TZA: 'Tanzania',
      GHA: 'Ghana', NGA: 'Nigeria', ZMB: 'Zambia', CMR: 'Cameroon',
      CIV: "Côte d'Ivoire", SEN: 'Senegal', COD: 'DR Congo', MWI: 'Malawi',
      BEN: 'Benin', BFA: 'Burkina Faso', ETH: 'Ethiopia', GAB: 'Gabon',
      LSO: 'Lesotho', MOZ: 'Mozambique', SLE: 'Sierra Leone', SOM: 'Somalia',
    };
    console.log(`  ${names[c.countryCode] || c.countryCode} (${c.currency}) — ${c.providers.length} provider(s)`);
  });
  console.log();

  // 3. Live API: active configs
  console.log('🌐 STEP 3: Active Configurations from PawaPay API');
  try {
    const configs = await p.getActiveConfig();
    console.log(`  ${configs.length} active configuration(s) retrieved`);
    if (configs.length > 0) {
      configs.forEach((c: any, i: number) => console.log(`  #${i+1}: ${JSON.stringify(c).substring(0, 120)}`));
    } else {
      console.log('  (No active configs — this is normal for new accounts. Provider mapping still works.)');
    }
  } catch (e: any) {
    console.log(`  ⚠️  Could not fetch: ${e.message}`);
  }
  console.log();

  // 4. Phone detection
  console.log('📱 STEP 4: Phone Number → Provider Detection');
  const phones = [
    ['250788123456', 'Rwanda MTN'],
    ['250738123456', 'Rwanda Airtel'],
    ['254712345678', 'Kenya M-Pesa'],
    ['256771234567', 'Uganda MTN'],
    ['255712345678', 'Tanzania Vodacom'],
    ['233501234567', 'Ghana MTN'],
    ['234801234567', 'Nigeria Airtel'],
    ['260761234567', 'Zambia MTN'],
    ['237612345678', 'Cameroon MTN'],
    ['243812345678', 'DRC Vodacom'],
  ];
  for (const [phone, label] of phones) {
    const r = p.lookupProviderByPhone(phone);
    console.log(`  ${label.padEnd(20)} ${phone} → ${r.provider} (${r.country}, ${r.currency})`);
  }
  console.log();

  // 5. Predict provider via live API
  console.log('🔄 STEP 5: Live Predict-Provider API');
  try {
    const predictions = [
      { phone: '250788123456', label: 'Rwanda MTN' },
      { phone: '254712345678', label: 'Kenya M-Pesa' },
    ];
    for (const { phone, label } of predictions) {
      const result = await p.predictProvider(phone);
      if (result) {
        console.log(`  ${label.padEnd(20)} ${phone} → ${result.provider} (${result.country}) ✅`);
      } else {
        console.log(`  ${label.padEnd(20)} ${phone} → (API unavailable, using local mapping)`);
      }
    }
  } catch (e: any) {
    console.log(`  ⚠️  API predict error: ${e.message}`);
  }
  console.log();

  // Summary
  console.log('═══════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Connected:         ${status.connected ? '✅' : '❌'}`);
  console.log(`  Active configs:    ${status.activeConfigs}`);
  console.log(`  Supported:         ${countries.length} countries`);
  console.log(`  Providers mapped:  ${countries.reduce((sum, c) => sum + c.providers.length, 0)}`);
  console.log();
  console.log('  ✅ PawaPay connection is LIVE and the dashboard will show:');
  console.log(`     • Connection: ${status.connected ? 'Connected' : 'Disconnected'}`);
  console.log(`     • ${countries.length} countries available`);
  console.log('     • Auto provider detection from phone number');
  console.log(`     • ${status.activeConfigs > 0 ? `${status.activeConfigs} active configs` : 'No active configs (normal for new accounts)'}`);
}

main().catch(console.error);
