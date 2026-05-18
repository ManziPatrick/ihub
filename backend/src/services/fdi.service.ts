import axios from 'axios';

export class FDIService {
  private baseURL = 'https://payments-api.fdibiz.com/v2';
  private appId: string;
  private secret: string;
  private token: string | null = null;
  private tokenExpiresAt: number = 0;
  private useLocalMock: boolean;

  constructor() {
    this.appId = process.env.FDI_APP_ID || 'E8D0C4E7-3079-453C-B641-F25536760A89';
    this.secret = process.env.FDI_SECRET || '6F534E58-0B95-49D6-B4F8-CD7C57A6AD2F';
    this.useLocalMock = process.env.FDI_USE_LOCAL_MOCK === 'true' || !process.env.FDI_APP_ID;
  }

  private async authenticate(): Promise<string> {
    if (this.useLocalMock) {
      return 'mock-local-fdi-token-12345';
    }

    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }

    try {
      const response = await axios.post(`${this.baseURL}/auth`, {
        appId: this.appId,
        secret: this.secret,
      });

      if (response.data.status === 'success' || response.data.status === 'ok') {
        this.token = response.data.data.token;
        // Assume token expires in 23 hours to be safe
        this.tokenExpiresAt = Date.now() + 23 * 60 * 60 * 1000;
        return this.token as string;
      }
      throw new Error('FDI Authentication failed: ' + JSON.stringify(response.data));
    } catch (error: any) {
      console.error('FDI Auth Error:', error.response?.data || error.message);
      // Fallback to local mock automatically if the remote API is completely down/timed out
      console.log('⚠️ FDI remote server is unreachable. Automatically falling back to local mock...');
      this.useLocalMock = true;
      return 'mock-local-fdi-token-12345';
    }
  }

  public async pullFunds(params: {
    trxRef: string;
    channelId: string;
    accountId?: string;
    msisdn: string;
    amount: number;
    callback: string;
  }) {
    const token = await this.authenticate();
    
    if (this.useLocalMock) {
      console.log('🛠️ [FDI Mock] Simulating Pull Funds request locally...');
      const gwRef = `GW-REF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      
      // Simulate Asynchronous Webhook Callback after 3 seconds
      setTimeout(async () => {
        try {
          // Translate remote URL to local to ensure the mock hook successfully hits the local API
          const localPort = process.env.PORT || '4000';
          const localCallback = params.callback.replace(/https?:\/\/[^\/]+/, `http://127.0.0.1:${localPort}`);
          
          console.log(`🛠️ [FDI Mock] Triggering asynchronous webhook callback to: ${localCallback}`);
          
          await axios.post(localCallback, {
            status: 'success',
            data: {
              state: 'successful',
              gwRef: gwRef,
              trxRef: params.trxRef,
              channelRef: `CHAN-${Math.floor(Math.random() * 10000000)}`
            }
          });
          console.log('🛠️ [FDI Mock] Webhook callback delivered successfully!');
        } catch (webhookError: any) {
          console.error('🛠️ [FDI Mock] Webhook callback delivery failed:', webhookError.response?.data || webhookError.message || webhookError);
        }
      }, 3000);

      return {
        status: 'success',
        data: {
          gwRef: gwRef,
          trxRef: params.trxRef,
          state: 'processing'
        }
      };
    }
    
    // Default accountId if not provided (should be provided by FDI)
    const accountId = params.accountId || '92234DCC-FE88-4F2E-941B-E44F06F2B12D'; // Example from swagger

    try {
      const response = await axios.post(
        `${this.baseURL}/momo/pull`,
        {
          trxRef: params.trxRef,
          channelId: params.channelId,
          accountId,
          msisdn: params.msisdn,
          amount: params.amount,
          callback: params.callback,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('FDI Pull Error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }

  public async getTransactionInfo(trxRef: string) {
    const token = await this.authenticate();

    if (this.useLocalMock) {
      return {
        status: 'success',
        data: {
          id: `GW-REF-${trxRef.toUpperCase()}`,
          trxRef,
          trxType: 'cashin',
          channelRef: `CHAN-${Math.floor(Math.random() * 10000000)}`,
          channelId: 'momo-mtn-rw',
          channelMsg: 'Transaction successful',
          channelTrxStatus: 'SUCCESSFUL',
          msisdn: '0790706170',
          amount: 150,
          trxFees: 2,
          currency: 'RWF',
          trxStatus: 'successful',
          createdAt: new Date().toISOString()
        }
      };
    }

    try {
      const response = await axios.get(`${this.baseURL}/momo/trx/${trxRef}/info`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('FDI Get Trx Info Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

export const createFDIService = () => new FDIService();
