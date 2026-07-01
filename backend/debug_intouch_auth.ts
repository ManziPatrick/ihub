/**
 * Debug IntouchPay authentication
 * Shows exactly what password hash is being sent to Intouch
 *
 * Usage: npx tsx debug_intouch_auth.ts
 */

import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const username = process.env.INTOUCH_USERNAME || '';
const accountNo = process.env.INTOUCH_ACCOUNT_NO || '';
const partnerPassword = process.env.INTOUCH_PARTNER_PASSWORD || '';
const baseUrl = process.env.INTOUCH_BASE_URL || 'https://www.intouchpay.co.rw/api';

console.log('═══════════════════════════════════════════════════════════');
console.log('   IntouchPay — Auth Debug');
console.log('═══════════════════════════════════════════════════════════');
console.log(`  Base URL:     ${baseUrl}`);
console.log(`  Username:     ${username}`);
console.log(`  Account No:   ${accountNo}`);
console.log(`  Password:     ${partnerPassword.substring(0, 5)}...${partnerPassword.slice(-5)}`);
console.log(`  Password len: ${partnerPassword.length}`);
console.log('');

// Show character codes of password for debugging
console.log('Password character codes:');
for (let i = 0; i < partnerPassword.length; i++) {
  console.log(`  [${i}] '${partnerPassword[i]}' → U+${partnerPassword.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0')} (${partnerPassword.charCodeAt(i)})`);
}

console.log('');

// Generate timestamps and hashes
const ts1 = (() => {
  const now = new Date();
  const y = now.getFullYear().toString();
  const M = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${y}${M}${d}${h}${m}${s}`;
})();

console.log(`  Timestamp: ${ts1}`);

const rawString = username + accountNo + partnerPassword + ts1;
console.log(`  Raw string: "${username}" + "${accountNo}" + "${partnerPassword.substring(0, 5)}...${partnerPassword.slice(-5)}" + "${ts1}"`);
console.log(`  Full raw:   "${username}${accountNo}${partnerPassword}${ts1}"`);

const hash = crypto.createHash('sha256').update(rawString).digest('hex');
console.log(`  SHA256 hex: ${hash}`);
console.log(`  SHA256 len: ${hash.length}`);

console.log('');

// Show the form body that would be sent
const formBody = new URLSearchParams({
  username,
  accountno: accountNo,
  password: hash,
  timestamp: ts1,
});

console.log('  Form body that gets POSTed:');
console.log(`  ${formBody.toString().substring(0, 200)}...`);

// Make a test request to Intouch
(async () => {
  console.log('');
  console.log('─── Sending test auth request to Intouch ───');
  console.log(`  POST ${baseUrl}/getbalance/`);

  try {
    const response = await fetch(`${baseUrl}/getbalance/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody,
    });

    const text = await response.text();
    console.log(`  HTTP ${response.status}`);
    console.log(`  Response: ${text.substring(0, 500)}`);

    if (text.includes('Invalid Password') || text.includes('invalid')) {
      console.log('');
      console.log('❌ Intouch rejected the password hash.');
      console.log('');
      console.log('Possible issues:');
      console.log('  1. The INTOCUCH_PARTNER_PASSWORD in .env is wrong');
      console.log('  2. The password was changed by Intouch support');
      console.log('  3. Special characters in the password need different encoding');
      console.log('  4. The account (testa/250160000011) might be for a different Intouch environment');
      console.log('');
      console.log('Try:');
      console.log('  • Check with Intouch support if testa credentials are still valid');
      console.log('  • Go to https://www.intouchpay.co.rw and login to verify your password');
      console.log('  • Try the sandbox URL instead: https://www.intouchpay.co.rw/sandbox/api');
    }
  } catch (error: any) {
    console.log(`  ❌ Request failed: ${error.message}`);
  }
})();
