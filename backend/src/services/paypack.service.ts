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
          body: JSON.stringify({ phoneNumber: cleanPhone }),
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

      console.log(`📡 PawaPay predict-provider: ${cleanPhone} → ${data.provider} (${data.country})`);
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
  }> {
    const prediction = await this.predictProvider(phoneNumber);
    if (prediction) {
      const countryInfo = COUNTRY_PROVIDERS.find(c => c.countryCode === prediction.country);
      return {
        provider: prediction.provider,
        country: prediction.country,
        currency: countryInfo?.currency || 'RWF',
      };
    }

    return this.lookupProviderByPhone(phoneNumber);
  }

  /**
   * Get active configuration for this merchant account
   * GET /v2/active-conf
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

      const data = await response.json() as any[];
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
  async initiateDeposit(request: DepositRequest): Promise<{
    success: boolean;
    depositId: string;
    status: string;
    reason?: string;
  }> {
    const token = await this.getAccessToken();
    const depositId = request.depositId || this.generateDepositId();
    const idempotencyKey = this.generateIdempotencyKey();

    const cleanPhone = request.phoneNumber.replace(/[^0-9]/g, '').replace(/^0+/, '');
    const customerMessage = this.sanitizeCustomerMessage(request.customerMessage || 'Payment');

    const body = {
      depositId,
      payer: {
        type: 'MMO',
        accountDetails: {
          phoneNumber: cleanPhone,
          provider: request.provider,
        },
      },
      amount: request.amount.toString(),
      currency: request.currency,
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
   * Parse and validate webhook payload
   * PawaPay v2 webhook format:
   *   { depositId, status: "COMPLETED"|"SETTLED"|"DECLINED", amount, currency, payer, outcome, settledAt }
   */
  parseWebhookPayload(payload: any): {
    transactionRef: string;
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

      if (!transaction?.depositId) {
        throw new Error('Missing depositId in webhook');
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
        transactionRef: transaction.depositId,
        status,
        amount: parseFloat(transaction.amount) || 0,
        currency: transaction.currency || 'RWF',
        provider: transaction.payer?.accountDetails?.provider || '',
        clientNumber: transaction.payer?.accountDetails?.phoneNumber || '',
        settledAt: transaction.settledAt,
      };
    } catch (error) {
      console.error('Failed to parse PawaPay webhook payload:', error);
      throw error;
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

  if (!baseUrl || !webhookSecret) {
    throw new Error('Missing PAYPACK_BASE_URL or PAYPACK_WEBHOOK_SECRET environment variables.');
  }

  const config: PawaPayConfig = {
    clientId: clientId || '',
    clientSecret: clientSecret || '',
    webhookSecret,
    baseUrl,
    apiToken: apiToken || undefined,
    environment: environment === 'development' ? 'development' : 'production',
  };

  return new PawaPayService(config);
}
