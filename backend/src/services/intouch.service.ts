/**
 * Intouch Payment Service
 * Handles payment operations via InTouchPay API v1.2
 *
 * API Docs: https://www.intouchpay.co.rw/api/
 * Endpoints:
 *   POST /api/requestpayment/         – Initiate a CASHIN (collect payment from subscriber)
 *   POST /api/requestdeposit/         – Initiate a CASHOUT (send money to subscriber)
 *   POST /api/gettransactionstatus/   – Query transaction status
 *   POST /api/getbalance/             – Query account balance
 *
 * Auth: SHA256(username + accountno + partnerpassword + timestamp) → hexdigest
 * Transport: application/x-www-form-urlencoded POST
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
  callbackUrl?: string;
}

interface RequestDepositParams {
  amount: number;
  phoneNumber: string;
  requestTransactionId: string;
  reason?: string;
  withdrawCharge?: number;
  serviceId?: number;
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

interface IntouchApiResponse {
  success: boolean;
  responsecode?: string;
  message?: string;
  status?: string;
  requesttransactionid?: string;
  transactionid?: string;
  referenceid?: string;
  referenceno?: string;
  statusdesc?: string;
  balance?: number;
  provider?: { code: string; name: string };
}

export type NormalizedPaymentStatus = 'pending' | 'successful' | 'failed';

export class IntouchService {
  private config: IntouchConfig;

  constructor(config: IntouchConfig) {
    this.config = config;
  }

  // ─── Helpers ───

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
   * Build base form fields common to all Intouch requests
   */
  private buildBaseForm(timestamp: string): URLSearchParams {
    const form = new URLSearchParams();
    form.append('username', this.config.username);
    form.append('accountno', this.config.accountNo);
    form.append('password', this.generatePassword(timestamp));
    form.append('timestamp', timestamp);
    return form;
  }

  /**
   * POST form-encoded data to an Intouch endpoint and parse the JSON response
   */
  private async postForm(endpoint: string, formData: URLSearchParams): Promise<{
    httpStatus: number;
    data?: IntouchApiResponse;
    rawText: string;
  }> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    const text = await response.text();
    let data: IntouchApiResponse | undefined;

    try {
      data = JSON.parse(text);
    } catch {
      // Some endpoints may return non-JSON on error
    }

    return { httpStatus: response.status, data, rawText: text };
  }

  // ─── API Methods ───

  /**
   * 1. RequestPayment (CASHIN)
   * Initiates a payment request to a subscriber. The subscriber confirms via USSD.
   * IntouchPay sends callback to your URL with the final status.
   *
   * POST /api/requestpayment/
   */
  async requestPayment(params: RequestPaymentParams): Promise<{
    success: boolean;
    transactionId?: string;
    message: string;
    raw?: any;
  }> {
    const timestamp = this.generateTimestamp();
    const formData = this.buildBaseForm(timestamp);
    formData.append('amount', params.amount.toString());
    // IntouchPay expects mobilephoneno as digits only (country code + number, no + prefix)
    const cleanedPhone = params.phoneNumber.replace(/[^0-9]/g, '');
    formData.append('mobilephone', cleanedPhone);
    formData.append('requesttransactionid', params.requestTransactionId);

    if (params.callbackUrl) {
      formData.append('callbackurl', params.callbackUrl);
    }

    try {
      console.log(
        `📤 Intouch RequestPayment: ref=${params.requestTransactionId}, amount=${params.amount}, phone=${params.phoneNumber.slice(0, 5)}****`
      );

      const { httpStatus, data, rawText } = await this.postForm('/requestpayment/', formData);

      if (!data) {
        return { success: false, message: `Non-JSON response (HTTP ${httpStatus}): ${rawText.substring(0, 200)}` };
      }

      console.log(`📥 Intouch RequestPayment Response: ${JSON.stringify(data).substring(0, 500)}`);

      // Response code 01 = successful, 2001 = successful (deposit-style)
      // 1000 = pending (awaiting user PIN/USSD confirmation)
      if (data.success === true && (data.responsecode === '01' || data.responsecode === '2001' || data.status === 'Successfull')) {
        return {
          success: true,
          transactionId: data.transactionid,
          message: data.statusdesc || data.message || 'Payment initiated',
          raw: data,
        };
      }

      // Pending is still technically "accepted" by the provider
      if (data.success === true && data.responsecode === '1000') {
        return {
          success: true,
          transactionId: data.transactionid,
          message: data.message || 'Transaction pending — awaiting subscriber confirmation',
          raw: data,
        };
      }

      return {
        success: false,
        message: data.statusdesc || data.message || `Intouch error: ${data.responsecode || httpStatus}`,
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
   * 2. RequestDeposit (CASHOUT)
   * Sends money to a subscriber's mobile money account.
   *
   * POST /api/requestdeposit/
   */
  async requestDeposit(params: RequestDepositParams): Promise<{
    success: boolean;
    transactionId?: string;
    referenceId?: string;
    message: string;
    raw?: any;
  }> {
    const timestamp = this.generateTimestamp();
    const formData = this.buildBaseForm(timestamp);
    formData.append('amount', params.amount.toString());
    // IntouchPay expects mobilephoneno as digits only (country code + number, no + prefix)
    const cleanedPhone = params.phoneNumber.replace(/[^0-9]/g, '');
    formData.append('mobilephone', cleanedPhone);
    formData.append('requesttransactionid', params.requestTransactionId);
    formData.append('withdrawcharge', String(params.withdrawCharge ?? 0));
    formData.append('reason', params.reason || 'Payment disbursement');
    formData.append('sid', String(params.serviceId ?? 1));

    try {
      console.log(
        `📤 Intouch RequestDeposit: ref=${params.requestTransactionId}, amount=${params.amount}, phone=${params.phoneNumber.slice(0, 5)}****`
      );

      const { httpStatus, data, rawText } = await this.postForm('/requestdeposit/', formData);

      if (!data) {
        return { success: false, message: `Non-JSON response (HTTP ${httpStatus}): ${rawText.substring(0, 200)}` };
      }

      console.log(`📥 Intouch RequestDeposit Response: ${JSON.stringify(data).substring(0, 500)}`);

      // Response code 2001 = Request Successful
      if (data.success === true && data.responsecode === '2001') {
        return {
          success: true,
          transactionId: data.transactionid,
          referenceId: data.referenceid || data.referenceno,
          message: data.statusdesc || data.message || 'Deposit successful',
          raw: data,
        };
      }

      return {
        success: false,
        message: data.statusdesc || data.message || `Intouch error: ${data.responsecode || httpStatus}`,
        raw: data,
      };
    } catch (error) {
      console.error('❌ Intouch RequestDeposit error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Intouch request failed',
      };
    }
  }

  /**
   * 3. GetTransactionStatus
   * Query the status of a transaction by its request ID and/or IntouchPay transaction ID.
   *
   * POST /api/gettransactionstatus/
   */
  async getTransactionStatus(
    requestTransactionId: string,
    transactionId?: string
  ): Promise<{
    success: boolean;
    status?: NormalizedPaymentStatus;
    raw?: any;
  }> {
    const timestamp = this.generateTimestamp();
    const formData = this.buildBaseForm(timestamp);
    formData.append('requesttransactionid', requestTransactionId);

    if (transactionId) {
      formData.append('transactionid', transactionId);
    }

    try {
      console.log(`📤 Intouch GetTransactionStatus: ref=${requestTransactionId}, txId=${transactionId || 'N/A'}`);

      const { httpStatus, data, rawText } = await this.postForm('/gettransactionstatus/', formData);

      if (!data) {
        return { success: false, raw: rawText };
      }

      console.log(`📥 Intouch GetTransactionStatus Response: ${JSON.stringify(data).substring(0, 500)}`);

      const normalizedStatus = this.normalizeStatus(data.status || data.message);

      return {
        success: data.success === true,
        status: normalizedStatus,
        raw: data,
      };
    } catch (error) {
      console.error('❌ Intouch GetTransactionStatus error:', error);
      return { success: false };
    }
  }

  /**
   * 4. GetBalance
   * Query the account balance.
   *
   * POST /api/getbalance/
   */
  async getBalance(): Promise<{
    success: boolean;
    balance?: number;
    message?: string;
    raw?: any;
  }> {
    const timestamp = this.generateTimestamp();
    const formData = this.buildBaseForm(timestamp);

    try {
      console.log('📤 Intouch GetBalance');

      const { httpStatus, data, rawText } = await this.postForm('/getbalance/', formData);

      if (!data) {
        return { success: false, message: `Non-JSON response (HTTP ${httpStatus})`, raw: rawText };
      }

      console.log(`📥 Intouch GetBalance Response: ${JSON.stringify(data).substring(0, 300)}`);

      if (data.success === true && data.balance !== undefined) {
        return {
          success: true,
          balance: data.balance,
          raw: data,
        };
      }

      return {
        success: false,
        message: data.message || `Intouch error: ${data.responsecode || httpStatus}`,
        raw: data,
      };
    } catch (error) {
      console.error('❌ Intouch GetBalance error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'GetBalance request failed',
      };
    }
  }

  /**
   * Normalize Intouch status strings to our standard enum
   */
  normalizeStatus(status?: string): NormalizedPaymentStatus {
    const value = (status || '').toLowerCase().trim();

    if (
      value === 'successfull' ||
      value === 'successful' ||
      value === 'success' ||
      value === 'completed'
    ) {
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
   *
   * Intouch wraps the payload in { jsonpayload: { ... } }.
   * Fields: requesttransactionid, transactionid, responsecode, status, statusdesc, referenceno
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
  // Ensure we always use the Rwanda base URL if not explicitly set
  // The .tz URL (Tanzania) is for a different region
  const baseUrl = process.env.INTOUCH_BASE_URL || 'https://www.intouchpay.co.rw/api';
  const environment = process.env.INTOUCH_ENVIRONMENT;

  // If config is missing, try loading from a config file
  if (!username || !accountNo || !partnerPassword || !baseUrl) {
    const configPath = path.resolve(__dirname, '../../intouch-config.json');
    if (fs.existsSync(configPath)) {
      try {
        const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return new IntouchService({
          username: fileConfig.username || username || '',
          accountNo: fileConfig.accountNo || accountNo || '',
          partnerPassword: fileConfig.partnerPassword || partnerPassword || '',
          baseUrl: fileConfig.baseUrl || baseUrl || 'https://www.intouchpay.co.rw/api',
          environment: environment === 'development' ? 'development' : 'production',
        });
      } catch (e) {
        console.warn('⚠️ Failed to parse intouch-config.json:', e);
      }
    }

    console.warn('⚠️ Intouch config not fully set. Payments will fail until configured.');
  }

  return new IntouchService({
    username: username || '',
    accountNo: accountNo || '',
    partnerPassword: partnerPassword || '',
    baseUrl: baseUrl || 'https://www.intouchpay.co.rw/api',
    environment: environment === 'development' ? 'development' : 'production',
  });
}
