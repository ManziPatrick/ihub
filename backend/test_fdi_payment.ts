import dotenv from 'dotenv';
import { createFDIService } from './src/services/fdi.service';

dotenv.config();

async function testFDIPayment() {
  console.log('🚀 Starting FDI Payments API Test...');
  const fdi = createFDIService();

  try {
    console.log('🔑 Testing FDI authentication...');
    // We trigger pullFunds which automatically authenticates internally.
    // Let's test standard Momo Pull with test credentials.
    // MSISDN format is supported as: 0781402403 or 250781402403
    const testPayload = {
      trxRef: `TEST-TRX-${Date.now()}`,
      channelId: 'momo-mtn-rw',
      msisdn: '0790706170', // FDI test MSISDN from Swagger documentation example
      amount: 150, // Minimum amount is 100, so 150 is valid
      callback: 'https://api.codemande.com/api/payments/fdi/callback',
    };

    console.log('📤 Initiating Pull Request (Push to USSD prompt) for 150 RWF...', testPayload);
    const result = await fdi.pullFunds(testPayload);

    console.log('✅ FDI Payment Response received successfully!');
    console.log('Result Data:', JSON.stringify(result, null, 2));

    if (result.status === 'success' && result.data?.state === 'processing') {
      console.log('\n🎉 SUCCESS! FDI API returned 202 - processing state.');
      console.log(`Gateway Reference (gwRef): ${result.data.gwRef}`);
      console.log(`Transaction Reference (trxRef): ${result.data.trxRef}`);
      console.log('\nEverything is working as expected. In a real environment, the customer would now see a USSD prompt to approve the payment.');
    } else {
      console.log('\n❌ FDI API responded but in an unexpected format:', result);
    }
  } catch (error: any) {
    console.error('\n❌ FDI Payment Test Failed!');
    if (error.response?.data) {
      console.error('API Error Payload:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error Details:', error.message || error);
    }
  }
}

testFDIPayment();
