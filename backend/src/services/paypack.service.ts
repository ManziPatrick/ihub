/**
 * PawaPay Payment Service
 * Handles multi-country mobile money payments via PawaPay API v2
 * Supports 20+ African countries (MTN, M-Pesa, Airtel, Vodafone, Orange, etc.)
 *
 * Auth modes:
 *  1. PawaPay Bearer token (new) — set PAWAPAY_API_TOKEN env var
 *  2. Paypack OAuth2 (legacy) — uses PAYPACK_CLIENT_ID + PAYPACK_CLIENT_SECRET
 *
 * API Base URLs:
 *  Production: https://api.pawapay.io
 *  Sandbox:    https://api.sandbox.pawapay.io
 *  Legacy:     https://payments.paypack.rw/api
 */

import crypto from 'crypto';

// ─── Types ───

interface PawaPayConfig {
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
  baseUrl: string;
  environment: 'development' | 'production';
  /** Static Bearer token for PawaPay API (v2 multi-country, preferred auth method) */
  apiToken?: string;
}

interface TokenCache {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface DepositRequest {
  amount: number;
  currency: string;
  phoneNumber: string;
  provider: string;
  depositId?: string;
  clientReferenceId?: string;
  customerMessage?: string;
}

interface DepositResponse {
  depositId: string;
  status: 'ACCEPTED' | 'REJECTED';
  clientReferenceId?: string;
  reason?: string;
  failureReason?: {
    failureCode: string;
    failureMessage: string;
  };
  created?: string;
  nextStep?: string;
}

interface TransactionStatusData {
  depositId: string;
  status: string;
  amount: string;
  currency: string;
  payer: {
    type: string;
    accountDetails: {
      phoneNumber: string;
      provider: string;
    };
  };
  outcome?: {
    status: 'SUCCESS' | 'FAILED';
    reason?: string;
  };
  createdAt: string;
  settledAt?: string;
  clientReferenceId?: string;
}

interface TransactionStatusWrapper {
  status: 'FOUND' | 'NOT_FOUND';
  data?: TransactionStatusData;
}

export type NormalizedPaymentStatus = 'pending' | 'successful' | 'failed';

// ─── Country & Provider Mapping ───

interface CountryInfo {
  countryCode: string;
  currency: string;
  providers: { prefix: string; providerId: string; name: string }[];
}

const COUNTRY_PROVIDERS: CountryInfo[] = [
  {
    countryCode: 'RWA', currency: 'RWF',
    providers: [
      { prefix: '25078', providerId: 'MTN_MOMO_RWA', name: 'MTN Rwanda' },
      { prefix: '25079', providerId: 'MTN_MOMO_RWA', name: 'MTN Rwanda' },
      { prefix: '25073', providerId: 'AIRTEL_RWA', name: 'Airtel Rwanda' },
      { prefix: '25072', providerId: 'AIRTEL_RWA', name: 'Airtel Rwanda' },
    ],
  },
  {
    countryCode: 'KEN', currency: 'KES',
    providers: [
      { prefix: '2547', providerId: 'MPESA_KEN', name: 'M-Pesa Kenya' },
      { prefix: '25411', providerId: 'AIRTEL_KEN', name: 'Airtel Kenya' },
    ],
  },
  {
    countryCode: 'UGA', currency: 'UGX',
    providers: [
      { prefix: '2567', providerId: 'MTN_MOMO_UGA', name: 'MTN Uganda' },
      { prefix: '25675', providerId: 'AIRTEL_OAPI_UGA', name: 'Airtel Uganda' },
      { prefix: '25676', providerId: 'AIRTEL_OAPI_UGA', name: 'Airtel Uganda' },
    ],
  },
  {
    countryCode: 'TZA', currency: 'TZS',
    providers: [
      { prefix: '2557', providerId: 'VODACOM_TZA', name: 'Vodacom Tanzania' },
      { prefix: '2556', providerId: 'AIRTEL_TZA', name: 'Airtel Tanzania' },
      { prefix: '2554', providerId: 'TIGO_TZA', name: 'Tigo Tanzania' },
    ],
  },
  {
    countryCode: 'GHA', currency: 'GHS',
    providers: [
      { prefix: '2332', providerId: 'MTN_MOMO_GHA', name: 'MTN Ghana' },
      { prefix: '2335', providerId: 'MTN_MOMO_GHA', name: 'MTN Ghana' },
      { prefix: '23350', providerId: 'VODAFONE_GHA', name: 'Vodafone Ghana' },
      { prefix: '23354', providerId: 'AIRTELTIGO_GHA', name: 'AirtelTigo Ghana' },
      { prefix: '23355', providerId: 'AIRTELTIGO_GHA', name: 'AirtelTigo Ghana' },
    ],
  },
  {
    countryCode: 'NGA', currency: 'NGN',
    providers: [
      { prefix: '23470', providerId: 'MTN_MOMO_NGA', name: 'MTN Nigeria' },
      { prefix: '23480', providerId: 'MTN_MOMO_NGA', name: 'MTN Nigeria' },
      { prefix: '23481', providerId: 'AIRTEL_NGA', name: 'Airtel Nigeria' },
      { prefix: '23490', providerId: 'AIRTEL_NGA', name: 'Airtel Nigeria' },
    ],
  },
  {
    countryCode: 'ZMB', currency: 'ZMW',
    providers: [
      { prefix: '2607', providerId: 'MTN_MOMO_ZMB', name: 'MTN Zambia' },
      { prefix: '2609', providerId: 'AIRTEL_OAPI_ZMB', name: 'Airtel Zambia' },
      { prefix: '2602', providerId: 'ZAMTEL_ZMB', name: 'Zamtel Zambia' },
    ],
  },
  {
    countryCode: 'CMR', currency: 'XAF',
    providers: [
      { prefix: '2376', providerId: 'MTN_MOMO_CMR', name: 'MTN Cameroon' },
      { prefix: '2379', providerId: 'ORANGE_CMR', name: 'Orange Cameroon' },
    ],
  },
  {
    countryCode: 'CIV', currency: 'XOF',
    providers: [
      { prefix: '2250', providerId: 'MTN_MOMO_CIV', name: 'MTN Côte d\'Ivoire' },
      { prefix: '2257', providerId: 'ORANGE_CIV', name: 'Orange Côte d\'Ivoire' },
      { prefix: '2255', providerId: 'MOOV_CIV', name: 'Moov Côte d\'Ivoire' },
    ],
  },
  {
    countryCode: 'SEN', currency: 'XOF',
    providers: [
      { prefix: '2217', providerId: 'ORANGE_SEN', name: 'Orange Senegal' },
      { prefix: '22176', providerId: 'FREE_SEN', name: 'Free Senegal' },
    ],
  },
  {
    countryCode: 'COD', currency: 'CDF',
    providers: [
      { prefix: '2438', providerId: 'VODACOM_COD', name: 'Vodacom DRC' },
      { prefix: '2439', providerId: 'AIRTEL_COD', name: 'Airtel DRC' },
      { prefix: '24382', providerId: 'ORANGE_COD', name: 'Orange DRC' },
    ],
  },
  {
    countryCode: 'MWI', currency: 'MWK',
    providers: [
      { prefix: '2659', providerId: 'AIRTEL_MWI', name: 'Airtel Malawi' },
      { prefix: '2658', providerId: 'TNM_MWI', name: 'TNM Malawi' },
    ],
  },
  {
    countryCode: 'BEN', currency: 'XOF',
    providers: [
      { prefix: '229', providerId: 'MTN_MOMO_BEN', name: 'MTN Benin' },
    ],
  },
  {
    countryCode: 'BFA', currency: 'XOF',
    providers: [
      { prefix: '2267', providerId: 'ORANGE_BFA', name: 'Orange Burkina Faso' },
    ],
  },
  {
    countryCode: 'ETH', currency: 'ETB',
    providers: [
      { prefix: '2519', providerId: 'ETHIO_TEL_ETH', name: 'Ethio Telecom' },
    ],
  },
  {
    countryCode: 'GAB', currency: 'XAF',
    providers: [
      { prefix: '241', providerId: 'AIRTEL_GAB', name: 'Airtel Gabon' },
    ],
  },
  {
    countryCode: 'LSO', currency: 'LSL',
    providers: [
      { prefix: '266', providerId: 'VODACOM_LSO', name: 'Vodacom Lesotho' },
    ],
  },
  {
    countryCode: 'MOZ', currency: 'MZN',
    providers: [
      { prefix: '2588', providerId: 'VODACOM_MOZ', name: 'Vodacom Mozambique' },
      { prefix: '25884', providerId: 'MPESA_MOZ', name: 'M-Pesa Mozambique' },
    ],
  },
  {
    countryCode: 'SLE', currency: 'SLE',
    providers: [
      { prefix: '232', providerId: 'AFRICELL_SLE', name: 'Africell Sierra Leone' },
    ],
  },
  {
    countryCode: 'SOM', currency: 'SOS',
    providers: [
      { prefix: '252', providerId: 'HORMUUD_SOM', name: 'Hormuud Somalia' },
    ],
  },
];

// ─── Service ───

export class PawaPayService {
  private tokenCache: TokenCache | null = null;
  private config: PawaPayConfig;
  private providerCache: { providers: any[]; fetchedAt: number } | null = null;
  /** Whether this instance uses static API token auth */
  private readonly usesApiToken: boolean;

  constructor(config: PawaPayConfig) {
    this.config = config;
    this.usesApiToken = !!config.apiToken;
  }

  /**
   * Initiate a direct payout (CASHOUT/disbursement) to a mobile money subscriber
   * POST /v2/payouts
   *
   * This is the CORRECT endpoint for sending money TO someone (disbursements).
   * Unlike deposits (which require the recipient to enter a PIN via USSD),
   * payouts send money directly from your PawaPay wallet without requiring recipient action.
   */
  async initiatePayout(params: {
    amount: number;
    phoneNumber: string;
    provider: string;
    currency?: string;
    payoutId?: string;
    clientReferenceId?: string;
    customerMessage?: string;
    metadata?: Record<string, any>[];
  }): Promise<{
    success: boolean;
    payoutId: string;
    status: string;
    reason?: string;
    created?: string;
  }> {
    const token = await this.getAccessToken();
    const payoutId = (params.payoutId && params.payoutId.trim())
      ? params.payoutId.trim()
      : this.generateDepositId();
    const idempotencyKey = this.generateIdempotencyKey();

    const cleanPhone = params.phoneNumber.replace(/[^0-9]/g, '').replace(/^0+/, '');
    // Use the phone number as-is (cleaned). PawaPay handles international format correctly
    // (e.g. "250790706170"). Do NOT strip the country code — doing so causes numbers
    // starting with "790" or "78" to be misidentified as Russian (RUS) by PawaPay's
    // internal validation, since those are also Russian mobile prefixes.
    const payoutPhone = cleanPhone;
    const customerMessage = this.sanitizeCustomerMessage(params.customerMessage || 'Payout');

    const body: Record<string, any> = {
      payoutId,
      recipient: {
        type: 'MMO',
        accountDetails: {
          phoneNumber: payoutPhone,
          provider: params.provider,
        },
      },
      amount: params.amount.toString(),
      currency: params.currency || 'RWF',
      ...(params.clientReferenceId ? { clientReferenceId: params.clientReferenceId } : {}),
      customerMessage,
      ...(params.metadata ? { metadata: params.metadata } : {}),
    };

    try {
      console.log(`📤 PawaPay payout: payoutId=${payoutId}, ${params.amount} ${params.currency || 'RWF'}, provider=${params.provider}, phone=${payoutPhone.substring(0, 8)}****`);

      const response = await fetch(
        `${this.config.baseUrl}/v2/payouts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(body),
        }
      );

      const responseData = await response.json() as {
        payoutId: string;
        status: 'ACCEPTED' | 'REJECTED' | 'DUPLICATE_IGNORED';
        created?: string;
        failureReason?: { failureCode: string; failureMessage: string };
      };

      if (!response.ok) {
        const failureMsg = responseData.failureReason
          ? `${responseData.failureReason.failureCode}: ${responseData.failureReason.failureMessage}`
          : responseData.status || `HTTP ${response.status}`;
        console.error('❌ PawaPay payout rejected:', JSON.stringify(responseData));
        return {
          success: false,
          payoutId,
          status: responseData.status || 'REJECTED',
          reason: failureMsg,
          created: responseData.created,
        };
      }

      console.log(`📥 PawaPay payout response: ${responseData.status} (${payoutId})`);
      return {
        success: responseData.status === 'ACCEPTED',
        payoutId,
        status: responseData.status,
        reason: responseData.failureReason?.failureMessage,
        created: responseData.created,
      };
    } catch (error) {
      console.error('Failed to initiate PawaPay payout:', error);
      return {
        success: false,
        payoutId,
        status: 'REJECTED',
        reason: error instanceof Error ? error.message : 'Request failed',
      };
    }
  }

  /**
   * Get payout status
   * GET /v2/payouts/{payoutId}
   *
   * Returns: { status: "FOUND", data: { payoutId, status: "COMPLETED"|"DECLINED", ... } }
   */
  async getPayoutStatus(payoutId: string): Promise<{
    status: NormalizedPaymentStatus;
    raw?: any;
  }> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v2/payouts/${payoutId}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 404) return { status: 'pending' };
      if (!response.ok) throw new Error(`Failed to get payout status: ${response.statusText}`);

      const wrapper = await response.json() as { status: 'FOUND' | 'NOT_FOUND'; data?: any };
      const data = wrapper.data;

      if (!data || !data.payoutId) return { status: 'pending' };

      const txStatus = (data.status || '').toUpperCase();

      if (txStatus === 'COMPLETED' || txStatus === 'SETTLED') return { status: 'successful', raw: data };
      if (data.outcome?.status === 'SUCCESS') return { status: 'successful', raw: data };
      if (data.outcome?.status === 'FAILED') return { status: 'failed', raw: data };
      if (['DECLINED', 'EXPIRED', 'CANCELLED', 'FAILED', 'REJECTED'].includes(txStatus)) return { status: 'failed', raw: data };

      return { status: 'pending', raw: data };
    } catch (error) {
      if (error instanceof Error && error.message !== 'NOT_FOUND') console.error('Failed to fetch payout status:', error);
      throw error;
    }
  }

  /**
   * Resend a payout callback
   * POST /v2/payouts/resend-callback/{payoutId}
   */
  async resendPayoutCallback(payoutId: string): Promise<{ success: boolean; message: string }> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v2/payouts/resend-callback/${payoutId}`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return { success: false, message: `Failed to resend payout callback: ${response.statusText}` };
      return { success: true, message: 'Payout callback resent' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to resend payout callback' };
    }
  }

  /**
   * Cancel an enqueued payout
   * POST /v2/payouts/fail-enqueued/{payoutId}
   *
   * Cancels a payout that is currently in ENQUEUED status.
   * The payment will be moved to FAILED status with failure code MANUALLY_CANCELLED.
   */
  async cancelEnqueuedPayout(payoutId: string): Promise<{ success: boolean; message: string }> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v2/payouts/fail-enqueued/${payoutId}`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return { success: false, message: `Failed to cancel payout: ${response.statusText}` };
      return { success: true, message: 'Payout cancelled (MANUALLY_CANCELLED)' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to cancel payout' };
    }
  }

  /**
   * Cancel an enqueued refund
   * POST /v2/refunds/fail-enqueued/{refundId}
   *
   * Cancels a refund that is currently in ENQUEUED status.
   * The refund will be moved to FAILED status with failure code MANUALLY_CANCELLED.
   */
  async cancelEnqueuedRefund(refundId: string): Promise<{ success: boolean; message: string }> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v2/refunds/fail-enqueued/${refundId}`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return { success: false, message: `Failed to cancel refund: ${response.statusText}` };
      return { success: true, message: 'Refund cancelled (MANUALLY_CANCELLED)' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to cancel refund' };
    }
  }

  /**
   * Initiate a disbursement (CASHOUT/payout) to a mobile money subscriber
   * Uses the CORRECT /v2/payouts endpoint instead of /v2/deposits.
   * Payputs send money directly from your wallet without requiring recipient PIN.
   */
  async initiateDisbursement(params: {
    amount: number;
    phoneNumber: string;
    currency?: string;
    reason?: string;
  }): Promise<{
    success: boolean;
    transactionId?: string;
    status?: string;
    message?: string;
  }> {
    try {
      // Resolve provider from phone number — this also returns the phone in PawaPay's
      // expected format via the predict-provider API
      const providerInfo = await this.resolveProvider(params.phoneNumber);

      // Use PawaPay's predicted phone format if available (it's the authoritative source),
      // otherwise fall back to the original input
      const payoutPhone = providerInfo.formattedPhone || params.phoneNumber;

      const result = await this.initiatePayout({
        amount: params.amount,
        currency: params.currency || providerInfo.currency,
        phoneNumber: payoutPhone,
        provider: providerInfo.provider,
        clientReferenceId: `DSB-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        customerMessage: (params.reason || 'Payout').substring(0, 22),
      });

      if (result.success) {
        return {
          success: true,
          transactionId: result.payoutId,
          status: result.status,
          message: '✅ Disbursement initiated via PawaPay payout (no PIN required)',
        };
      }

      return {
        success: false,
        transactionId: result.payoutId,
        status: result.status,
        message: `❌ PawaPay payout rejected: ${result.reason || 'Unknown error'}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'PawaPay payout failed',
      };
    }
  }

  /**
   * Initiate a refund for a deposit via PawaPay v2
   * POST /v2/refunds
   *
   * This properly reverses the original deposit and tracks refund status separately.
   * Use this instead of manualDisburse for customer refunds.
   *
   * API response:
   *   ACCEPTED → { refundId, status: "ACCEPTED", created }
   *   REJECTED → { refundId, status: "REJECTED", failureReason }
   */
  async initiateRefund(params: {
    depositId: string;
    amount: number;
    currency?: string;
    clientReferenceId?: string;
    metadata?: Record<string, any>[];
  }): Promise<{
    success: boolean;
    refundId: string;
    status: string;
    reason?: string;
  }> {
    const token = await this.getAccessToken();
    const refundId = this.generateDepositId();
    const idempotencyKey = this.generateIdempotencyKey();

    const body: Record<string, any> = {
      refundId,
      depositId: params.depositId,
      amount: params.amount.toString(),
      currency: params.currency || 'RWF',
      ...(params.clientReferenceId ? { clientReferenceId: params.clientReferenceId } : {}),
      ...(params.metadata ? { metadata: params.metadata } : {}),
    };

    try {
      console.log(`📤 PawaPay refund: refundId=${refundId}, depositId=${params.depositId}, amount=${params.amount} ${params.currency || 'RWF'}`);

      const response = await fetch(
        `${this.config.baseUrl}/v2/refunds`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(body),
        }
      );

      const responseData = await response.json() as {
        refundId: string;
        status: 'ACCEPTED' | 'REJECTED';
        created?: string;
        failureReason?: {
          failureCode: string;
          failureMessage: string;
        };
      };

      if (!response.ok) {
        const failureMsg = responseData.failureReason
          ? `${responseData.failureReason.failureCode}: ${responseData.failureReason.failureMessage}`
          : `HTTP ${response.status}`;
        console.error('PawaPay refund rejected:', JSON.stringify(responseData));
        return {
          success: false,
          refundId,
          status: responseData.status || 'REJECTED',
          reason: failureMsg,
        };
      }

      console.log(`📥 PawaPay refund response: ${responseData.status} (${refundId})`);
      return {
        success: responseData.status === 'ACCEPTED',
        refundId,
        status: responseData.status,
        reason: responseData.failureReason?.failureMessage,
      };
    } catch (error) {
      console.error('Failed to initiate PawaPay refund:', error);
      return {
        success: false,
        refundId,
        status: 'REJECTED',
        reason: error instanceof Error ? error.message : 'Request failed',
      };
    }
  }

  /**
   * Get refund status
   * GET /v2/refunds/{refundId}
   *
   * Returns wrapper: { status: "FOUND", data: { refundId, status: "COMPLETED"|"DECLINED", ... } }
   */
  async getRefundStatus(refundId: string): Promise<{
    status: NormalizedPaymentStatus;
    raw?: any;
  }> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v2/refunds/${refundId}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 404) {
        return { status: 'pending' };
      }

      if (!response.ok) {
        throw new Error(`Failed to get refund status: ${response.statusText}`);
      }

      const wrapper = await response.json() as {
        status: 'FOUND' | 'NOT_FOUND';
        data?: any;
      };

      const data = wrapper.data;
      if (!data || !data.refundId) {
        return { status: 'pending' };
      }

      const txStatus = (data.status || '').toUpperCase();

      if (txStatus === 'COMPLETED' || txStatus === 'SETTLED') {
        return { status: 'successful', raw: data };
      }

      if (data.outcome?.status === 'SUCCESS') return { status: 'successful', raw: data };
      if (data.outcome?.status === 'FAILED') return { status: 'failed', raw: data };

      if (['DECLINED', 'EXPIRED', 'CANCELLED', 'FAILED', 'REJECTED'].includes(txStatus)) {
        return { status: 'failed', raw: data };
      }

      return { status: 'pending', raw: data };
    } catch (error) {
      if (error instanceof Error && error.message !== 'NOT_FOUND') {
        console.error('Failed to fetch refund status:', error);
      }
      throw error;
    }
  }

  /**
   * Request PawaPay to resend a deposit callback
   * POST /v2/deposits/{depositId}/callback
   */
  async resendDepositCallback(depositId: string): Promise<{ success: boolean; message: string }> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v2/deposits/${depositId}/callback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        return { success: false, message: `Failed to resend deposit callback: ${response.statusText}` };
      }

      return { success: true, message: 'Deposit callback resent' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to resend deposit callback' };
    }
  }

  /**
   * Request PawaPay to resend a refund callback
   * POST /v2/refunds/{refundId}/callback
   */
  async resendRefundCallback(refundId: string): Promise<{ success: boolean; message: string }> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v2/refunds/${refundId}/callback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        return { success: false, message: `Failed to resend refund callback: ${response.statusText}` };
      }

      return { success: true, message: 'Refund callback resent' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to resend refund callback' };
    }
  }

  /**
   * Initiate bulk payouts via PawaPay v2
   * POST /v2/payouts/bulk
   *
   * Sends multiple payouts in a single request (max ~20 transactions per request).
   * Each payout in the array follows the same format as individual payouts.
   * Bulk requests with more than 20 payout transactions may be rejected by PawaPay.
   *
   * Callback will be delivered separately for each payout as they resolve to final status.
   */
  async initiateBulkPayouts(
    payouts: Array<{
      payoutId: string;
      recipient: {
        type: 'MMO';
        accountDetails: {
          phoneNumber: string;
          provider: string;
        };
      };
      amount: string;
      currency: string;
      clientReferenceId?: string;
      customerMessage?: string;
      metadata?: Record<string, any>[];
    }>
  ): Promise<{
    success: boolean;
    results?: Array<{ payoutId: string; status: string; created?: string; failureReason?: any }>;
    message?: string;
  }> {
    const token = await this.getAccessToken();
    const idempotencyKey = this.generateIdempotencyKey();

    // Sanitize each payout
    const sanitizedPayouts = payouts.map((p) => ({
      payoutId: p.payoutId,
      recipient: {
        type: p.recipient.type || 'MMO',
        accountDetails: {
          phoneNumber: p.recipient.accountDetails.phoneNumber.replace(/[^0-9]/g, ''),
          provider: p.recipient.accountDetails.provider,
        },
      },
      amount: p.amount,
      currency: p.currency,
      ...(p.clientReferenceId ? { clientReferenceId: p.clientReferenceId } : {}),
      ...(p.customerMessage ? { customerMessage: this.sanitizeCustomerMessage(p.customerMessage) } : {}),
      ...(p.metadata ? { metadata: p.metadata } : {}),
    }));

    try {
      console.log(`📤 PawaPay bulk payout: ${sanitizedPayouts.length} payout(s)`);

      const response = await fetch(
        `${this.config.baseUrl}/v2/payouts/bulk`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(sanitizedPayouts),
        }
      );

      const responseData = await response.json() as Array<{
        payoutId: string;
        status: 'ACCEPTED' | 'DUPLICATE_IGNORED' | 'REJECTED';
        created?: string;
        failureReason?: { failureCode: string; failureMessage: string };
      }>;

      if (!response.ok) {
        const msg = Array.isArray(responseData)
          ? `Bulk payout rejected: ${responseData.map((r) => r.status).join(', ')}`
          : `HTTP ${response.status}`;
        console.error('PawaPay bulk payout rejected:', JSON.stringify(responseData));
        return { success: false, message: msg, results: responseData };
      }

      const accepted = responseData.filter((r) => r.status === 'ACCEPTED').length;
      const rejected = responseData.filter((r) => r.status === 'REJECTED').length;
      const duplicated = responseData.filter((r) => r.status === 'DUPLICATE_IGNORED').length;

      console.log(`📥 PawaPay bulk payout: ${accepted} accepted, ${rejected} rejected, ${duplicated} duplicates`);

      return {
        success: accepted > 0,
        results: responseData,
        message: `${accepted} accepted, ${rejected} rejected, ${duplicated} duplicates`,
      };
    } catch (error) {
      console.error('Failed to initiate PawaPay bulk payout:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Bulk payout request failed',
      };
    }
  }

  /**
   * Get wallet balances from PawaPay
   * GET /v2/wallet-balances
   *
   * Returns your current available PawaPay wallet balance across all currencies.
   *
   * PawaPay v2 response:
   *   {
   *     "balances": [
   *       { "country": "ZMB", "balance": "21798.03", "currency": "ZMW", "provider": "" },
   *       { "country": "UGA", "balance": "10798.03", "currency": "UGX", "provider": "" }
   *     ]
   *   }
   */
  async getWalletBalance(): Promise<{
    success: boolean;
    balances: { country: string; currency: string; balance: number; provider: string }[];
    message?: string;
  }> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v2/wallet-balances`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get wallet balances: ${response.statusText}`);
      }

      const data = await response.json() as {
        balances?: { country: string; balance: string; currency: string; provider: string }[];
      };

      const balances = (data.balances || []).map((b) => ({
        country: b.country,
        currency: b.currency,
        balance: parseFloat(b.balance) || 0,
        provider: b.provider || '',
      }));

      return { success: true, balances };
    } catch (error) {
      return {
        success: false,
        balances: [],
        message: error instanceof Error ? error.message : 'Failed to get wallet balances',
      };
    }
  }

  /**
   * Get the current merchant status / active configurations summary
   * Useful for displaying on the dashboard
   */
  async getMerchantStatus(): Promise<{
    connected: boolean;
    activeConfigs: number;
    countries: string[];
    message?: string;
  }> {
    try {
      const configs = await this.getActiveConfig();
      const countries = [...new Set(configs.map((c: any) => c.country || c.countryCode || '').filter(Boolean))];
      return {
        connected: true,
        activeConfigs: configs.length,
        countries,
      };
    } catch (error) {
      return {
        connected: false,
        activeConfigs: 0,
        countries: [],
        message: error instanceof Error ? error.message : 'Failed to get status',
      };
    }
  }

  /**
   * Generate a UUID v4 for depositId
   */
  generateDepositId(): string {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    const bytes = crypto.randomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
    const hex = bytes.toString('hex');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }

  /**
   * Generate unique idempotency key
   */
  private generateIdempotencyKey(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Mapping from country code (e.g., "RWA") to dialing prefix (e.g., "250")
   * Extracted from COUNTRY_PROVIDERS prefix patterns.
   */
  private readonly COUNTRY_CODE_MAP: Record<string, string> = {
    RWA: '250', KEN: '254', UGA: '256', TZA: '255',
    GHA: '233', NGA: '234', ZMB: '260', CMR: '237',
    CIV: '225', SEN: '221', COD: '243', MWI: '265',
    BEN: '229', BFA: '226', ETH: '251', GAB: '241',
    LSO: '266', MOZ: '258', SLE: '232', SOM: '252',
  };

  /**
   * Truncate customer message to PawaPay's 22-character limit
   */
  private sanitizeCustomerMessage(msg: string): string {
    return msg.replace(/[^\x20-\x7E]/g, '').substring(0, 22).trim() || 'Payment';
  }

  /**
   * Normalize PawaPay status to our DB enum
   */
  normalizeStatus(status?: string): NormalizedPaymentStatus {
    const value = (status || '').toUpperCase().trim();

    if (value === 'COMPLETED' || value === 'SUCCESS' || value === 'SUCCESSFUL' || value === 'SETTLED') {
      return 'successful';
    }

    if (
      value === 'FAILED' || value === 'DECLINED' || value === 'CANCELLED' ||
      value === 'EXPIRED' || value === 'REJECTED' || value === 'FAIL'
    ) {
      return 'failed';
    }

    return 'pending';
  }

  /**
   * Get auth token for API requests.
   *
   * Two modes:
   *  1. PawaPay Bearer token (preferred) — returns the static apiToken from config
   *  2. Paypack OAuth2 (legacy) — exchanges client_id + client_secret for a JWT
   */
  async getAccessToken(): Promise<string> {
    // Mode 1: Static Bearer token (PawaPay v2)
    if (this.usesApiToken && this.config.apiToken) {
      return this.config.apiToken;
    }

    // Mode 2: OAuth2 client_credentials (legacy Paypack Rwanda)
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now() + 60000) {
      return this.tokenCache.accessToken;
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/auth/agents/authorize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`PawaPay OAuth2 auth failed: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        access: string;
        refresh: string;
        expires?: number;
      };
      const expiresIn = data.expires || 900000;

      this.tokenCache = {
        accessToken: data.access,
        refreshToken: data.refresh,
        expiresAt: Date.now() + expiresIn,
      };

      return data.access;
    } catch (error) {
      console.error('Failed to get PawaPay access token:', error);
      throw error;
    }
  }

  /**
   * Predict the mobile money provider from a phone number
   * POST /v2/predict-provider
   */
  async predictProvider(phoneNumber: string): Promise<{
    country: string;
    provider: string;
    phoneNumber: string;
  } | null> {
    const token = await this.getAccessToken();

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '').replace(/^0+/, '');

    // ── Pre-normalize: if the phone looks like a local number (no country code),
    // try to determine the country from our local prefix mapping and prepend
    // the country code dial prefix before calling PawaPay's predict-provider API.
    //
    // This prevents misidentification: e.g. Rwandan number "790706170" (9 digits
    // local) starts with "790", which PawaPay would interpret as a Russian mobile
    // prefix, returning "RUS" instead of "RWA".
    //
    // By sending the full international format (e.g. "250790706170"), PawaPay
    // correctly identifies the country as Rwanda.
    let phoneToSend = cleanPhone;
    if (cleanPhone.length <= 10) {
      const localMatch = this.lookupProviderByPhone(phoneNumber);
      const dialCode = this.COUNTRY_CODE_MAP[localMatch.country];
      if (dialCode && !cleanPhone.startsWith(dialCode)) {
        phoneToSend = dialCode + cleanPhone;
      }
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v2/predict-provider`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ phoneNumber: phoneToSend }),
        }
      );

      if (!response.ok) {
        console.warn(`Predict provider API returned ${response.status}, falling back to local mapping`);
        return null;
      }

      const data = await response.json() as {
        country: string;
        provider: string;
        phoneNumber: string;
      };

      console.log(`📡 PawaPay predict-provider: ${phoneToSend} → ${data.provider} (${data.country})`);
      return data;
    } catch (error) {
      console.error('Failed to predict provider:', error);
      return null;
    }
  }

  /**
   * Local phone-number → provider mapping (fallback when predict-provider API fails)
   */
  lookupProviderByPhone(phoneNumber: string): {
    provider: string;
    country: string;
    currency: string;
  } {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '').replace(/^0+/, '');

    // Sort providers by prefix length descending (longest first) for correct matching
    for (const country of COUNTRY_PROVIDERS) {
      const sorted = [...country.providers].sort((a, b) => b.prefix.length - a.prefix.length);
      for (const prov of sorted) {
        if (cleanPhone.startsWith(prov.prefix)) {
          return {
            provider: prov.providerId,
            country: country.countryCode,
            currency: country.currency,
          };
        }
      }
    }

    console.warn(`⚠️ Could not map phone ${phoneNumber.substring(0, 6)}**** to a known provider, defaulting to Rwanda MTN`);
    return {
      provider: 'MTN_MOMO_RWA',
      country: 'RWA',
      currency: 'RWF',
    };
  }

  /**
   * Determine the best provider for a phone number
   * Uses predict-provider API first, falls back to local mapping
   */
  async resolveProvider(phoneNumber: string): Promise<{
    provider: string;
    country: string;
    currency: string;
    /** The phone number in PawaPay's expected format (returned by predict-provider API) */
    formattedPhone?: string;
  }> {
    const prediction = await this.predictProvider(phoneNumber);
    if (prediction) {
      const countryInfo = COUNTRY_PROVIDERS.find(c => c.countryCode === prediction.country);
      return {
        provider: prediction.provider,
        country: prediction.country,
        currency: countryInfo?.currency || 'RWF',
        // Use the phone number format that PawaPay's own API returned — this is the
        // authoritative format (e.g. PawaPay may strip/reformat it appropriately for the provider)
        formattedPhone: prediction.phoneNumber,
      };
    }

    return this.lookupProviderByPhone(phoneNumber);
  }

  /**
   * Get active configuration for this merchant account
   * GET /v2/active-conf
   *
   * PawaPay returns an object (e.g. { data: [...], limit, offset }) or an array.
   * We normalize both to always return an array.
   */
  async getActiveConfig(): Promise<any[]> {
    const token = await this.getAccessToken();

    if (this.providerCache && this.providerCache.fetchedAt > Date.now() - 300000) {
      return this.providerCache.providers;
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v2/active-conf`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get active config: ${response.statusText}`);
      }

      const raw: any = await response.json();
      // Normalize: PawaPay may return:
      //   - An array: [config, config, ...]
      //   - { data: [config, config, ...] }
      //   - { configs: [config, config, ...] }
      //   - { countries: [{ country, providers: [{ provider, currencies: [{ currency, operationTypes }] }] }] }  ← production API format
      const rawData = Array.isArray(raw)
        ? raw
        : (raw.data || raw.countries || raw.configs || raw.items || []);

      // Flatten nested structure: production API returns
      // { countries: [{ country, providers: [{ provider, currencies: [{ currency, operationTypes }] }] }] }
      // Normalize to flat array of { country, provider, currency, operationTypes, ... }
      const data: any[] = [];
      for (const item of rawData) {
        if (item.country && item.providers && Array.isArray(item.providers)) {
          // New nested format: country → providers[] → currencies[]
          for (const prov of item.providers) {
            const providerId = prov.provider || prov.providerId || '';
            const currencies = prov.currencies || [];
            if (currencies.length > 0) {
              for (const curr of currencies) {
                const ops = curr.operationTypes
                  ? (Array.isArray(curr.operationTypes) ? curr.operationTypes : Object.keys(curr.operationTypes))
                  : [];
                data.push({
                  country: item.country,
                  provider: providerId,
                  currency: curr.currency || '',
                  operationTypes: ops,
                  status: curr.status || curr.operationTypes?.DEPOSIT?.status || 'ACTIVE',
                  minimumAmount: curr.minAmount || curr.operationTypes?.DEPOSIT?.minAmount || null,
                  maximumAmount: curr.maxAmount || curr.operationTypes?.DEPOSIT?.maxAmount || null,
                });
              }
            } else {
              data.push({
                country: item.country,
                provider: providerId,
                currency: '',
                operationTypes: [],
                status: 'ACTIVE',
              });
            }
          }
        } else {
          // Legacy flat format: each item is { country, provider, operationTypes, ... }
          const ops = item.operationTypes
            ? (Array.isArray(item.operationTypes) ? item.operationTypes : Object.keys(item.operationTypes))
            : [];
          data.push({
            country: item.country || item.countryCode || '',
            provider: item.provider || item.providerId || '',
            currency: item.currency || '',
            operationTypes: ops,
            status: item.status || 'ACTIVE',
            minimumAmount: item.minimumAmount || item.minAmount || null,
            maximumAmount: item.maximumAmount || item.maxAmount || null,
          });
        }
      }
      this.providerCache = { providers: data, fetchedAt: Date.now() };
      return data;
    } catch (error) {
      console.error('Failed to get active config:', error);
      return [];
    }
  }

  /**
   * Initiate a deposit (CASHIN) via PawaPay v2 API
   * POST /v2/deposits
   *
   * API response (success): { depositId, status: "ACCEPTED", created, nextStep: "FINAL_STATUS" }
   * API response (rejected): { depositId, status: "REJECTED", failureReason: { failureCode, failureMessage } }
   */
  async initiateDeposit(request: DepositRequest & { preAuthorisationCode?: string }): Promise<{
    success: boolean;
    depositId: string;
    status: string;
    reason?: string;
  }> {
    const token = await this.getAccessToken();

    // Guarantee we always have a non-empty depositId.
    // This prevents persisting `paypackRef: null` downstream.
    const depositId = (request.depositId && request.depositId.trim())
      ? request.depositId.trim()
      : this.generateDepositId();

    const idempotencyKey = this.generateIdempotencyKey();

    const cleanPhone = request.phoneNumber.replace(/[^0-9]/g, '').replace(/^0+/, '');
    // Use the phone number as-is (cleaned international format).
    // Do NOT strip the country code — PawaPay's endpoints detect the country from the
    // phone number itself. Stripping the country code causes numbers starting with
    // "790" or "78" (Rwandan MTN prefixes) to be misidentified as Russian (RUS).
    // PawaPay handles the country code -> local format conversion internally for USSD.
    const depositPhone = cleanPhone;
    const customerMessage = this.sanitizeCustomerMessage(request.customerMessage || 'Payment');

    const body = {
      depositId,
      payer: {
        type: 'MMO',
        accountDetails: {
          phoneNumber: depositPhone,
          provider: request.provider,
        },
      },
      amount: request.amount.toString(),
      currency: request.currency,
      ...(request.preAuthorisationCode ? { preAuthorisationCode: request.preAuthorisationCode } : {}),
      clientReferenceId: request.clientReferenceId || depositId,
      customerMessage,
    };

    try {
      console.log(`📤 PawaPay deposit: ${depositId}, ${request.amount} ${request.currency}, provider=${request.provider}`);

      const response = await fetch(
        `${this.config.baseUrl}/v2/deposits`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(body),
        }
      );

      const responseData = await response.json() as DepositResponse;

      if (!response.ok) {
        const failureMsg = responseData.failureReason
          ? `${responseData.failureReason.failureCode}: ${responseData.failureReason.failureMessage}`
          : (responseData.reason || responseData.status || `HTTP ${response.status}`);

        console.error('PawaPay deposit rejected:', JSON.stringify(responseData));
        return {
          success: false,
          depositId,
          status: responseData.status || 'REJECTED',
          reason: failureMsg,
        };
      }

      console.log(`📥 PawaPay deposit response: ${responseData.status} (${depositId})`);
      return {
        success: responseData.status === 'ACCEPTED',
        depositId,
        status: responseData.status,
        reason: responseData.failureReason?.failureMessage,
      };
    } catch (error) {
      console.error('Failed to initiate PawaPay deposit:', error);
      return {
        success: false,
        depositId,
        status: 'REJECTED',
        reason: error instanceof Error ? error.message : 'Request failed',
      };
    }
  }

  /**
   * Get deposit/transaction status
   * GET /v2/deposits/{depositId}
   *
   * PawaPay v2 returns a wrapper format:
   *   { status: "FOUND", data: { depositId, status: "COMPLETED"|"ACCEPTED"|..., amount, ... } }
   *
   * Status mapping:
   *   COMPLETED / SETTLED       → successful
   *   ACCEPTED / PENDING        → pending (awaiting user PIN)
   *   DECLINED / EXPIRED / CANCELLED → failed
   */
  async getDepositStatus(depositId: string): Promise<{
    status: NormalizedPaymentStatus;
    raw?: TransactionStatusData;
  }> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v2/deposits/${depositId}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 404) {
        return { status: 'pending' };
      }

      if (!response.ok) {
        throw new Error(`Failed to get deposit status: ${response.statusText}`);
      }

      const wrapper = (await response.json()) as TransactionStatusWrapper;

      // Handle nested format: { status: "FOUND", data: { ... } }
      const data = wrapper.data || (wrapper as unknown as TransactionStatusData);

      if (!data || !data.depositId) {
        return { status: 'pending' };
      }

      const txStatus = data.status?.toUpperCase() || '';

      // Terminal success states
      if (txStatus === 'COMPLETED' || txStatus === 'SETTLED') {
        return { status: 'successful', raw: data };
      }

      // Check outcome field
      if (data.outcome) {
        if (data.outcome.status === 'SUCCESS') return { status: 'successful', raw: data };
        if (data.outcome.status === 'FAILED') return { status: 'failed', raw: data };
      }

      // Terminal failure states
      if (['DECLINED', 'EXPIRED', 'CANCELLED', 'FAILED', 'REJECTED'].includes(txStatus)) {
        return { status: 'failed', raw: data };
      }

      // ACCEPTED, PENDING, FOUND, or anything else = still pending
      return { status: 'pending', raw: data };
    } catch (error) {
      if (error instanceof Error && error.message !== 'NOT_FOUND') {
        console.error('Failed to fetch deposit status:', error);
      }
      throw error;
    }
  }

  /**
   * Get supported countries and providers (from local mapping)
   */
  getSupportedCountries(): { countryCode: string; currency: string; providers: { providerId: string; name: string }[] }[] {
    return COUNTRY_PROVIDERS.map(c => ({
      countryCode: c.countryCode,
      currency: c.currency,
      providers: c.providers.map(p => ({ providerId: p.providerId, name: p.name })),
    }));
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const base64Hash = crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(payload)
        .digest('base64');

      const hexHash = crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(payload)
        .digest('hex');

      const normalizedSignature = signature.replace(/^sha256=/i, '').trim();

      return (
        normalizedSignature === base64Hash ||
        normalizedSignature === hexHash
      );
    } catch (error) {
      console.error('Failed to verify webhook signature:', error);
      return false;
    }
  }

  /**
   * Parse and validate webhook payload (supports deposit, payout, and refund callbacks)
   * PawaPay v2 webhook formats:
   *   Deposit: { depositId, status: "COMPLETED"|"SETTLED"|"DECLINED", amount, currency, payer, outcome, settledAt }
   *   Payout:  { payoutId, status: "COMPLETED"|"DECLINED", amount, currency, recipient, outcome, settledAt }
   *   Refund:  { refundId, status: "COMPLETED"|"DECLINED", amount, currency, ... }
   */
  parseWebhookPayload(payload: any): {
    transactionRef: string;
    type: 'deposit' | 'payout' | 'refund';
    status: NormalizedPaymentStatus;
    amount: number;
    currency: string;
    provider: string;
    clientNumber: string;
    settledAt?: string;
  } {
    try {
      // Handle both wrapped (payload.data) and flat (payload) formats
      const transaction = (payload?.data || payload) as any;

      // Detect type from which ID field is present
      let transactionRef = '';
      let type: 'deposit' | 'payout' | 'refund' = 'deposit';

      if (transaction?.payoutId) {
        transactionRef = transaction.payoutId;
        type = 'payout';
      } else if (transaction?.refundId) {
        transactionRef = transaction.refundId;
        type = 'refund';
      } else if (transaction?.depositId) {
        transactionRef = transaction.depositId;
        type = 'deposit';
      } else {
        throw new Error('Missing transaction ID (depositId/payoutId/refundId) in webhook');
      }

      // Determine status — normalize to uppercase for comparison
      let status: NormalizedPaymentStatus = 'pending';
      const txStatus = (transaction.status || '').toUpperCase();
      const outcomeStatus = (transaction.outcome?.status || '').toUpperCase();

      if (txStatus === 'COMPLETED' || txStatus === 'SETTLED' || outcomeStatus === 'SUCCESS') {
        status = 'successful';
      } else if (
        ['DECLINED', 'EXPIRED', 'CANCELLED', 'FAILED', 'REJECTED'].includes(txStatus) ||
        outcomeStatus === 'FAILED'
      ) {
        status = 'failed';
      }

      return {
        transactionRef,
        type,
        status,
        amount: parseFloat(transaction.amount) || 0,
        currency: transaction.currency || 'RWF',
        provider: transaction.payer?.accountDetails?.provider || transaction.recipient?.accountDetails?.provider || '',
        clientNumber: transaction.payer?.accountDetails?.phoneNumber || transaction.recipient?.accountDetails?.phoneNumber || '',
        settledAt: transaction.settledAt,
      };
    } catch (error) {
      console.error('Failed to parse PawaPay webhook payload:', error);
      throw error;
    }
  }

  /**
   * Get PawaPay public keys for callback signature verification
   * GET /v2/public-keys
   *
   * Returns the public keys that PawaPay uses to sign callbacks.
   */
  async getPublicKeys(): Promise<{ success: boolean; keys?: any[]; message?: string }> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v2/public-keys`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error(`Failed to get public keys: ${response.statusText}`);
      const raw: any = await response.json();
      const keys = Array.isArray(raw) ? raw : (raw.keys || raw.data || []);
      return { success: true, keys };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to get public keys' };
    }
  }

  /**
   * Request a financial statement from PawaPay
   * POST /v2/statements
   *
   * Generates a statement for the specified date range.
   * The statement is prepared asynchronously — poll getStatementStatus to check readiness.
   */
  async requestStatement(params: {
    from: string;  // ISO date string
    to: string;    // ISO date string
    currency?: string;
  }): Promise<{ success: boolean; statementId?: string; message?: string }> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v2/statements`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            from: params.from,
            to: params.to,
            ...(params.currency ? { currency: params.currency } : {}),
          }),
        }
      );

      if (!response.ok) throw new Error(`Failed to request statement: ${response.statusText}`);
      const data = await response.json() as { statementId: string };
      return { success: true, statementId: data.statementId, message: 'Statement requested' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to request statement' };
    }
  }

  /**
   * Check the status of a requested statement
   * GET /v2/statements/{statementId}
   */
  async getStatementStatus(statementId: string): Promise<{
    success: boolean;
    status?: string;
    downloadUrl?: string;
    message?: string;
  }> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v2/statements/${statementId}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error(`Failed to get statement status: ${response.statusText}`);
      const data = await response.json() as { status: string; downloadUrl?: string };
      return {
        success: true,
        status: data.status,
        downloadUrl: data.downloadUrl,
      };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to get statement status' };
    }
  }

  /**
   * Initiate a remittance (cross-border money transfer)
   * POST /v2/remittances
   *
   * Sends money from one country to another. Requires source and destination currencies.
   */
  /**
   * Initiate a remittance (cross-border money transfer)
   * POST /v2/remittances
   *
   * Sends money from one country to another with full sender/recipient details.
   * Requires comprehensive KYC/regulatory data for cross-border transfers.
   */
  async initiateRemittance(params: {
    remittanceId: string;
    amount: string;
    currency: string;
    recipient: {
      type: 'MMO';
      accountDetails: {
        phoneNumber: string;
        provider: string;
      };
      recipientDetails?: {
        firstName: string;
        lastName: string;
      };
    };
    sender?: {
      transactionDetails?: {
        transactionReference?: string;
        originalAmount?: string;
        originalCurrency?: string;
        buyFxRate?: string;
        senderFees?: string;
        purposeOfFunds?: string;
        sourceOfFunds?: string;
      };
      senderDetails?: {
        firstName?: string;
        lastName?: string;
        nationality?: string;
        phoneNumber?: string;
        address?: {
          addressLine?: string;
          postalCode?: string;
          city?: string;
          country?: string;
        };
        identification?: {
          type?: string;
          number?: string;
        };
        gender?: string;
        dateOfBirth?: string;
        placeOfBirth?: string;
        occupation?: string;
        relationshipRecipient?: string;
      };
    };
    customerMessage?: string;
    metadata?: Record<string, any>[];
  }): Promise<{
    success: boolean;
    remittanceId: string;
    status: string;
    reason?: string;
  }> {
    const token = await this.getAccessToken();
    const idempotencyKey = this.generateIdempotencyKey();

    const body: Record<string, any> = {
      remittanceId: params.remittanceId,
      recipient: params.recipient.type === 'MMO' ?
        {
          type: 'MMO',
          accountDetails: {
            phoneNumber: params.recipient.accountDetails.phoneNumber.replace(/[^0-9]/g, ''),
            provider: params.recipient.accountDetails.provider,
          },
          ...(params.recipient.recipientDetails ? { recipientDetails: params.recipient.recipientDetails } : {}),
        }
        : params.recipient,
      ...(params.sender ? { sender: params.sender } : {}),
      amount: params.amount,
      currency: params.currency,
      ...(params.customerMessage ? { customerMessage: this.sanitizeCustomerMessage(params.customerMessage) } : {}),
      ...(params.metadata ? { metadata: params.metadata } : {}),
    };

    try {
      console.log(`📤 PawaPay remittance: remittanceId=${params.remittanceId}, ${params.amount} ${params.currency}`);

      const response = await fetch(
        `${this.config.baseUrl}/v2/remittances`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(body),
        }
      );

      const responseData = await response.json() as {
        remittanceId: string;
        status: string;
        failureReason?: { failureCode: string; failureMessage: string };
      };

      if (!response.ok) {
        const msg = responseData.failureReason
          ? `${responseData.failureReason.failureCode}: ${responseData.failureReason.failureMessage}`
          : `HTTP ${response.status}`;
        console.error('PawaPay remittance rejected:', JSON.stringify(responseData));
        return { success: false, remittanceId: params.remittanceId, status: 'REJECTED', reason: msg };
      }

      return { success: true, remittanceId: responseData.remittanceId, status: responseData.status };
    } catch (error) {
      return { success: false, remittanceId: params.remittanceId, status: 'REJECTED', reason: error instanceof Error ? error.message : 'Request failed' };
    }
  }
}

/**
 * Factory function to create PawaPay service.
 *
 * Supports two auth modes:
 *  1. PAWAPAY_API_TOKEN (preferred) — static Bearer token
 *  2. PAYPACK_CLIENT_ID + PAYPACK_CLIENT_SECRET (legacy) — OAuth2
 *
 * Required for both modes: PAYPACK_BASE_URL, PAYPACK_WEBHOOK_SECRET
 */
export function createPaypackService(): PawaPayService {
  const apiToken = process.env.PAWAPAY_API_TOKEN;
  const clientId = process.env.PAYPACK_CLIENT_ID;
  const clientSecret = process.env.PAYPACK_CLIENT_SECRET;
  const webhookSecret = process.env.PAYPACK_WEBHOOK_SECRET;
  const baseUrl = process.env.PAYPACK_BASE_URL;
  const environment = process.env.PAYPACK_ENVIRONMENT;

  // Must have either apiToken or (clientId + clientSecret)
  if (!apiToken && (!clientId || !clientSecret)) {
    throw new Error(
      'Missing PawaPay authentication. Set PAWAPAY_API_TOKEN (preferred) or PAYPACK_CLIENT_ID + PAYPACK_CLIENT_SECRET (legacy).'
    );
  }

  if (!baseUrl) {
    throw new Error('Missing PAYPACK_BASE_URL environment variable.');
  }

  const config: PawaPayConfig = {
    clientId: clientId || '',
    clientSecret: clientSecret || '',
    webhookSecret: webhookSecret || '', // Optional - PawaPay uses public-key signatures (RFC-9421), not HMAC
    baseUrl,
    apiToken: apiToken || undefined,
    environment: environment === 'development' ? 'development' : 'production',
  };

  if (!webhookSecret) {
    console.warn('⚠️ PAYPACK_WEBHOOK_SECRET not set - webhook signature verification disabled. Set it for production.');
  }

  return new PawaPayService(config);
}
