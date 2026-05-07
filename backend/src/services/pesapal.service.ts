import axios from 'axios';
import crypto from 'crypto';

interface PesapalConfig {
  consumerKey: string;
  consumerSecret: string;
  environment: 'sandbox' | 'production';
  baseUrl: string;
}

interface PesapalAuthResponse {
  token: string;
  expiryDate: string;
  error?: any;
  status: string;
}

interface PesapalOrderRequest {
  id: string;
  currency: string;
  amount: number;
  description: string;
  callback_url: string;
  notification_id: string;
  billing_address: {
    email_address: string;
    phone_number?: string;
    country_code?: string;
    first_name?: string;
    last_name?: string;
    line_1?: string;
    line_2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    zip_code?: string;
  };
}

interface PesapalOrderResponse {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
  status: string;
}

interface PesapalTransactionStatusResponse {
  payment_method: string;
  amount: number;
  created_date: string;
  confirmation_code: string;
  payment_status_description: string;
  description: string;
  message: string;
  payment_account: string;
  call_back_url: string;
  statusCode: number;
  merchant_reference: string;
  payment_status_code: string;
  currency: string;
}

export class PesapalService {
  private config: PesapalConfig;
  private tokenCache: { token: string; expires: number } | null = null;
  private ipnCache: { id: string; url: string } | null = null;

  constructor(config: PesapalConfig) {
    this.config = config;
  }

  /**
   * Get Authentication Token
   */
  async getAuthToken(): Promise<string> {
    if (this.tokenCache && this.tokenCache.expires > Date.now()) {
      return this.tokenCache.token;
    }

    let lastError: any;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Pesapal: Fetching Auth Token from ${this.config.baseUrl} (Attempt ${attempt})...`);
        const response = await axios.post<PesapalAuthResponse>(
          `${this.config.baseUrl}/Auth/RequestToken`,
          {
            consumer_key: this.config.consumerKey,
            consumer_secret: this.config.consumerSecret,
          },
          { timeout: 30000 }
        );

        if (response.data.status !== '200') {
          throw new Error(`Pesapal Auth Failed: ${JSON.stringify(response.data.error)}`);
        }

        this.tokenCache = {
          token: response.data.token,
          expires: new Date(response.data.expiryDate).getTime() - 60000, // 1 min buffer
        };

        console.log('Pesapal: Auth Token fetched successfully.');
        return response.data.token;
      } catch (error: any) {
        lastError = error;
        console.warn(`Pesapal Auth Attempt ${attempt} failed: ${error.message}`);
        if (attempt < 3) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
    }

    console.error('Pesapal Auth Error after 3 attempts:', lastError.response?.data || lastError.message);
    throw lastError;
  }

  /**
   * Register IPN URL
   */
  async registerIPN(callbackUrl: string): Promise<string> {
    // Check cache first
    if (this.ipnCache && this.ipnCache.url === callbackUrl) {
      return this.ipnCache.id;
    }

    const token = await this.getAuthToken();
    try {
      console.log(`Pesapal: Registering IPN for ${callbackUrl}...`);
      const response = await axios.post(
        `${this.config.baseUrl}/URLSetup/RegisterIPN`,
        {
          url: callbackUrl,
          ipn_notification_type: 'POST',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000
        }
      );

      if (!response.data.ipn_id) {
        throw new Error('Pesapal IPN Registration failed: No IPN ID returned');
      }

      this.ipnCache = {
        id: response.data.ipn_id,
        url: callbackUrl
      };

      console.log(`Pesapal: IPN Registered successfully. ID: ${response.data.ipn_id}`);
      return response.data.ipn_id;
    } catch (error: any) {
      console.error('Pesapal IPN Registration Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Submit Order Request
   */
  async submitOrder(orderData: PesapalOrderRequest): Promise<PesapalOrderResponse> {
    const token = await this.getAuthToken();
    try {
      console.log(`Pesapal: Submitting Order ${orderData.id}...`);
      const response = await axios.post<PesapalOrderResponse>(
        `${this.config.baseUrl}/Transactions/SubmitOrderRequest`,
        orderData,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000
        }
      );

      console.log(`Pesapal: Order submitted successfully. TrackingID: ${response.data.order_tracking_id}`);
      return response.data;
    } catch (error: any) {
      console.error('Pesapal Submit Order Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get Transaction Status
   */
  async getTransactionStatus(orderTrackingId: string): Promise<PesapalTransactionStatusResponse> {
    const token = await this.getAuthToken();
    try {
      console.log(`Pesapal: Fetching status for ${orderTrackingId}...`);
      const response = await axios.get<PesapalTransactionStatusResponse>(
        `${this.config.baseUrl}/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Pesapal Get Status Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Normalize Pesapal status to our internal status
   */
  normalizeStatus(statusCode: number): 'pending' | 'successful' | 'failed' {
    switch (statusCode) {
      case 1:
        return 'successful';
      case 2:
        return 'failed';
      case 3:
        return 'failed'; // Reverted
      default:
        return 'pending';
    }
  }
}

export const createPesapalService = () => {
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY?.trim();
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET?.trim();
  const environment = (process.env.PESAPAL_ENVIRONMENT || 'sandbox').trim() as 'sandbox' | 'production';

  if (!consumerKey || !consumerSecret) {
    throw new Error('Missing Pesapal configuration. Check environment variables.');
  }

  const baseUrl = environment === 'production'
    ? 'https://pay.pesapal.com/v3/api'
    : 'https://cybqa.pesapal.com/pesapalv3/api';

  return new PesapalService({
    consumerKey,
    consumerSecret,
    environment,
    baseUrl,
  });
};
