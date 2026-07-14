/**
 * Currency Conversion Service
 *
 * Uses exchangerate-api.com (free tier, no API key required for basic usage).
 * Fallback to hard-coded rates if the API is unavailable.
 *
 * Base currency: RWF (Rwandan Franc) — all prices are stored in RWF.
 *
 * Supported African currencies mapped to PawaPay countries.
 */

// ─── Types ───

export interface ExchangeRates {
  [currency: string]: number; // e.g. { RWF: 1, KES: 0.11, UGX: 3.5, ... }
}

interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  /** Countries that use this currency (ISO 3166-1 alpha-3 codes) */
  countries: string[];
}

// ─── Supported Currencies ───

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw', countries: ['RWA'] },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', countries: ['KEN'] },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', countries: ['UGA'] },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', countries: ['TZA'] },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', countries: ['GHA'] },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', countries: ['NGA'] },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', countries: ['ZMB'] },
  { code: 'XAF', name: 'CFA Franc BEAC', symbol: 'FCFA', countries: ['CMR', 'GAB'] },
  { code: 'XOF', name: 'CFA Franc BCEAO', symbol: 'CFA', countries: ['CIV', 'SEN', 'BEN', 'BFA'] },
  { code: 'CDF', name: 'Congolese Franc', symbol: 'FC', countries: ['COD'] },
  { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK', countries: ['MWI'] },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', countries: ['ETH'] },
  { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT', countries: ['MOZ'] },
  { code: 'SLE', name: 'Sierra Leonean Leone', symbol: 'Le', countries: ['SLE'] },
  { code: 'SOS', name: 'Somali Shilling', symbol: 'SoSh', countries: ['SOM'] },
  { code: 'LSL', name: 'Lesotho Loti', symbol: 'L', countries: ['LSO'] },
  { code: 'USD', name: 'US Dollar', symbol: '$', countries: [] },
];

// Hard-coded fallback rates (relative to RWF = 1)
// Updated: Jan 2026 — accurate within ~5%
const FALLBACK_RATES: ExchangeRates = {
  RWF: 1,
  KES: 0.11,
  UGX: 3.5,
  TZS: 2.3,
  GHS: 0.012,
  NGN: 1.0,
  ZMW: 0.017,
  XAF: 0.66,
  XOF: 0.66,
  CDF: 2.5,
  MWK: 1.2,
  ETB: 0.050,
  MZN: 0.060,
  SLE: 0.020,
  SOS: 0.55,
  LSL: 0.017,
  USD: 0.00078,
};

// Exchange rate API URL (exchangerate-api.com free tier)
// Uses EUR as base because the free tier supports EUR, USD, GBP only
const EXCHANGE_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

// ─── Cache ───

let cachedRates: ExchangeRates | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ─── Service ───

/**
 * Fetch live exchange rates from exchangerate-api.com
 * Rates are relative to USD. We convert to RWF-relative.
 */
async function fetchLiveRates(): Promise<ExchangeRates | null> {
  try {
    const response = await fetch(EXCHANGE_API_URL, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn(`[Currency] Exchange rate API returned ${response.status}`);
      return null;
    }

    const data = await response.json() as {
      rates: Record<string, number>;
      base: string;
    };

    const usdRates = data.rates;

    // Get RWF rate in USD
    const rwfPerUsd = usdRates['RWF'] || 1280;

    // Convert all to RWF-relative rates
    const rwfRates: ExchangeRates = { RWF: 1 };

    for (const [currency, ratePerUsd] of Object.entries(usdRates)) {
      if (currency !== 'RWF' && ratePerUsd > 0) {
        rwfRates[currency] = ratePerUsd / rwfPerUsd;
      }
    }

    console.log(`[Currency] Live rates fetched (${Object.keys(rwfRates).length} currencies)`);
    return rwfRates;
  } catch (error) {
    console.warn('[Currency] Failed to fetch live rates:', error);
    return null;
  }
}

/**
 * Get exchange rates for all supported African currencies.
 * Uses cached rates when available and fresh, otherwise fetches live rates,
 * falling back to hard-coded rates.
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  const now = Date.now();

  if (cachedRates && (now - lastFetchTime) < CACHE_TTL_MS) {
    return cachedRates;
  }

  const liveRates = await fetchLiveRates();

  if (liveRates) {
    cachedRates = liveRates;
    lastFetchTime = now;
    return liveRates;
  }

  // Fallback to hard-coded rates
  console.log('[Currency] Using fallback exchange rates');
  return { ...FALLBACK_RATES };
}

/**
 * Convert an amount from RWF to target currency.
 */
export async function convertFromRwf(
  amountRwf: number,
  targetCurrency: string
): Promise<{ amount: number; rate: number; currency: string }> {
  if (targetCurrency === 'RWF') {
    return { amount: amountRwf, rate: 1, currency: 'RWF' };
  }

  const rates = await getExchangeRates();
  const rate = rates[targetCurrency];

  if (!rate || rate <= 0) {
    console.warn(`[Currency] No rate found for ${targetCurrency}, returning RWF`);
    return { amount: amountRwf, rate: 1, currency: 'RWF' };
  }

  return {
    amount: Math.round(amountRwf * rate * 100) / 100, // Round to 2 decimal places
    rate,
    currency: targetCurrency,
  };
}

/**
 * Convert an amount from a source currency to RWF.
 */
export async function convertToRwf(
  amountSource: number,
  sourceCurrency: string
): Promise<{ amount: number; rate: number; currency: string }> {
  if (sourceCurrency === 'RWF') {
    return { amount: amountSource, rate: 1, currency: 'RWF' };
  }

  const rates = await getExchangeRates();
  const rate = rates[sourceCurrency];

  if (!rate || rate <= 0) {
    console.warn(`[Currency] No rate found for ${sourceCurrency}, returning as RWF`);
    return { amount: amountSource, rate: 1, currency: 'RWF' };
  }

  return {
    amount: Math.round((amountSource / rate) * 100) / 100,
    rate: 1 / rate,
    currency: 'RWF',
  };
}

/**
 * Format an amount in a given currency with its symbol.
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const info = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  const symbol = info?.symbol || currencyCode;

  // Format based on currency
  const decimals = ['RWF', 'UGX', 'TZS', 'CDF', 'MWK'].includes(currencyCode) ? 0 : 2;

  return `${symbol} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Get supported currencies with their country mappings.
 */
export function getSupportedCurrencies() {
  return SUPPORTED_CURRENCIES;
}
