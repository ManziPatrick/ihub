/**
 * Intouch Payment Service
 * Handles payment operations via InTouchPay API v1.2
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface IntouchConfig {
  username: string;
  accountNo: string;
  partnerPassword: string;
  baseUrl: string;
  environment: 'development' | 'production';
}

interface RequestPaymentParams {
  amount: number;
  phoneNumber: string;
  requestTransactionId: string;
  callbackUrl: string;
}

interface IntouchCallbackPayload {
  jsonpayload: {
    requesttransactionid: string;
    transactionid: string;
    responsecode: string;
    status: string;
    statusdesc: string;
    referenceno?: string;
  };
}

export type NormalizedPaymentStatus = 'pending' | 'successful' | 'failed';

export class IntouchService {
  private config: IntouchConfig;

  constructor(config: IntouchConfig) {
    this.config = config;
  }

  /**
   * Generate the password hash per Intouch spec:
   * password = SHA256(username + accountno + partnerpassword + timestamp)
   */
  private generatePassword(timestamp: string): string {
    const raw = this.config.username + this.config.accountNo + this.config.partnerPassword + timestamp;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Generate ISO timestamp in yyyyMMddHHmmss format
   */
  private generateTimestamp(): string {
    const now = new Date();
    const y = now.getFullYear().toString();
    const M = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `${y}${M}${d}${h}${m}${s}`;
  }

  /**
   * Generate a unique request transaction ID
   */
  generateRequestTransactionId(): string {
    return `INT-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  /**
   * Initiate a CASHIN payment (push payment to mobile subscriber)
   * IntouchPay uses form-encoded POST
   */
  async requestPayment(params: RequestPaymentParams): Promise<{
    success: boolean;
    transactionId?: string;
    message: string;
    raw?: any;
  }> {
    const timestamp = this.generateTimestamp();
    const password = this.generatePassword(timestamp);

    // Build form data
    const formData = new URLSearchParams();
    formData.append('username', this.config.username);
    formData.append('accountno', this.config.accountNo);
    formData.append('password', password);
    formData.append('timestamp', timestamp);
    formData.append('amount', params.amount.toString());
    formData.append('mobilephoneno', params.phoneNumber);
    formData.append('requesttransactionid', params.requestTransactionId);

    // Callback URL is configured in Intouch dashboard, but we include it
    if (params.callbackUrl) {
      formData.append('callbackurl', params.callbackUrl);
    }

    try {
      // Log the request (without sensitive data)
      console.log(`📤 Intouch RequestPayment: ref=${params.requestTransactionId}, amount=${params.amount}, phone=${params.phoneNumber.slice(0, 5)}****`);

      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: formData.toString(),
      });

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        // Some Intouch endpoints return non-JSON responses
        data = { raw: text };
      }

      console.log(`📥 Intouch Response:`, JSON.stringify(data).substring(0, 500));

      // Parse response
      if (data.success === true || data.status === 'success' || data.responsecode === '01') {
        return {
          success: true,
          transactionId: data.transactionid || data.transaction_id,
          message: data.statusdesc || data.message || 'Payment initiated',
          raw: data,
        };
      }

      return {
        success: false,
        message: data.statusdesc || data.message || `Intouch error: ${response.status}`,
        raw: data,
      };
    } catch (error) {
      console.error('❌ Intouch RequestPayment error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Intouch request failed',
      };
    }
  }

  /**
   * Check transaction status
   */
  async getTransactionStatus(requestTransactionId: string, transactionId?: string): Promise<{
    success: boolean;
    status?: NormalizedPaymentStatus;
    raw?: any;
  }> {
    const timestamp = this.generateTimestamp();
    const password = this.generatePassword(timestamp);

    const formData = new URLSearchParams();
    formData.append('username', this.config.username);
    formData.append('accountno', this.config.accountNo);
    formData.append('password', password);
    formData.append('timestamp', timestamp);

    // Some Intouch implementations support status query by reference
    formData.append('requesttransactionid', requestTransactionId);
    if (transactionId) {
      formData.append('transactionid', transactionId);
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: formData.toString(),
      });

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        return { success: false, raw: text };
      }

      const normalizedStatus = this.normalizeStatus(data.status || data.state);
      return {
        success: true,
        status: normalizedStatus,
        raw: data,
      };
    } catch (error) {
      console.error('❌ Intouch getTransactionStatus error:', error);
      return { success: false };
    }
  }

  /**
   * Normalize Intouch status strings to our standard enum
   */
  normalizeStatus(status?: string): NormalizedPaymentStatus {
    const value = (status || '').toLowerCase().trim();

    if (value === 'successfull' || value === 'successful' || value === 'success' || value === 'completed') {
      return 'successful';
    }

    if (
      value === 'fail' ||
      value === 'failed' ||
      value === 'error' ||
      value === 'cancelled' ||
      value === 'canceled' ||
      value === 'rejected'
    ) {
      return 'failed';
    }

    return 'pending';
  }

  /**
   * Parse and validate Intouch webhook callback payload
   */
  parseCallbackPayload(payload: any): {
    requestTransactionId: string;
    transactionId: string;
    responseCode: string;
    status: NormalizedPaymentStatus;
    statusDesc: string;
    referenceNo?: string;
  } {
    // Intouch wraps payload in jsonpayload key
    const data = payload?.jsonpayload || payload;

    if (!data.requesttransactionid && !data.transactionid) {
      throw new Error('Missing transaction references in Intouch callback');
    }

    return {
      requestTransactionId: data.requesttransactionid || '',
      transactionId: data.transactionid || '',
      responseCode: data.responsecode || '',
      status: this.normalizeStatus(data.status),
      statusDesc: data.statusdesc || '',
      referenceNo: data.referenceno,
    };
  }
}

/**
 * Factory function to create Intouch service
 */
export function createIntouchService(): IntouchService {
  const username = process.env.INTOUCH_USERNAME;
  const accountNo = process.env.INTOUCH_ACCOUNT_NO;
  const partnerPassword = process.env.INTOUCH_PARTNER_PASSWORD;
  const baseUrl = process.env.INTOUCH_BASE_URL;
  const environment = process.env.INTOUCH_ENVIRONMENT;

  // If config is missing, try loading from a config file
  if (!username || !accountNo || !partnerPassword || !baseUrl) {
    // Check for config file fallback
    const configPath = path.resolve(__dirname, '../../intouch-config.json');
    if (fs.existsSync(configPath)) {
      try {
        const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return new IntouchService({
          username: fileConfig.username || username || '',
          accountNo: fileConfig.accountNo || accountNo || '',
          partnerPassword: fileConfig.partnerPassword || partnerPassword || '',
          baseUrl: fileConfig.baseUrl || baseUrl || '',
          environment: environment === 'development' ? 'development' : 'production',
        });
      } catch (e) {
        console.warn('⚠️ Failed to parse intouch-config.json:', e);
      }
    }

    console.warn('⚠️ Intouch config not fully set. Payments will fail until configured.');
    // Return a minimal instance that will log errors at runtime
  }

  return new IntouchService({
    username: username || '',
    accountNo: accountNo || '',
    partnerPassword: partnerPassword || '',
    baseUrl: baseUrl || 'https://pay.intouchpay.co.tz/api',
    environment: environment === 'development' ? 'development' : 'production',
  });
}
