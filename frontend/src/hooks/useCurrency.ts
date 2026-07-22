/**
 * useCurrency — Detects user's country from IP and formats prices in local currency.
 *
 * Caches the detected country and exchange rates in localStorage to avoid
 * re-fetching on every page load. Falls back to RWF (Rwandan Franc) if
 * detection fails.
 *
 * API endpoints used (both public, no auth required):
 *   GET /api/payments/detect-country  → { countryCode, currency }
 *   GET /api/payments/countries       → { countries: [...], rates: {...} }
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getApiBaseUrl } from '@/lib/env';

// ─── Types ──────────────────────────────────────────────────────────────

interface CurrencyState {
  currencyCode: string;     // e.g. "RWF", "KES", "UGX"
  currencySymbol: string;   // e.g. "FRw", "KSh", "USh"
  countryCode: string;      // ISO 3166-1 alpha-3, e.g. "RWA"
  countryFlag: string;      // Emoji flag
  exchangeRate: number;     // 1 RWF = X local currency
  isLoading: boolean;
}

// ─── Currency Metadata ─────────────────────────────────────────────────

const CURRENCY_META: Record<string, { symbol: string; flag: string }> = {
  RWF: { symbol: 'RWF', flag: '🇷🇼' },
  KES: { symbol: 'KSh', flag: '🇰🇪' },
  UGX: { symbol: 'USh', flag: '🇺🇬' },
  TZS: { symbol: 'TSh', flag: '🇹🇿' },
  GHS: { symbol: '₵',   flag: '🇬🇭' },
  NGN: { symbol: '₦',   flag: '🇳🇬' },
  ZMW: { symbol: 'ZK',  flag: '🇿🇲' },
  XAF: { symbol: 'FCFA',flag: '🇨🇲' },
  XOF: { symbol: 'CFA', flag: '🇨🇮' },
  CDF: { symbol: 'FC',  flag: '🇨🇩' },
  MWK: { symbol: 'MK',  flag: '🇲🇼' },
  ETB: { symbol: 'Br',  flag: '🇪🇹' },
  MZN: { symbol: 'MT',  flag: '🇲🇿' },
  SLE: { symbol: 'Le',  flag: '🇸🇱' },
  SOS: { symbol: 'SoSh',flag: '🇸🇴' },
  LSL: { symbol: 'L',   flag: '🇱🇸' },
  USD: { symbol: '$',   flag: '🇺🇸' },
};

// ─── LocalStorage Cache ─────────────────────────────────────────────────

const CACHE_KEY = 'bootskills_currency_cache';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CacheData {
  currencyCode: string;
  currencySymbol: string;
  countryCode: string;
  countryFlag: string;
  exchangeRate: number;
  timestamp: number;
}

function readCache(): CacheData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CacheData;
    if (Date.now() - data.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function writeCache(data: Omit<CacheData, 'timestamp'>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, timestamp: Date.now() }));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────

const DEFAULT_STATE: CurrencyState = {
  currencyCode: 'RWF',
  currencySymbol: 'FRw',
  countryCode: 'RWA',
  countryFlag: '🇷🇼',
  exchangeRate: 1,
  isLoading: true,
};

export function useCurrency() {
  const [state, setState] = useState<CurrencyState>(() => {
    const cached = readCache();
    if (cached) {
      return {
        currencyCode: cached.currencyCode,
        currencySymbol: cached.currencySymbol,
        countryCode: cached.countryCode,
        countryFlag: cached.countryFlag,
        exchangeRate: cached.exchangeRate,
        isLoading: false,
      };
    }
    return DEFAULT_STATE;
  });

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    const cached = readCache();
    if (cached) return; // already loaded from cache above

    fetchedRef.current = true;
    const baseUrl = getApiBaseUrl();

    Promise.all([
      fetch(`${baseUrl}/api/payments/detect-country`).catch(() => null),
      fetch(`${baseUrl}/api/payments/countries`).catch(() => null),
    ]).then(async ([detectRes, countriesRes]) => {
      let currencyCode = 'RWF';
      let countryCode = 'RWA';
      let exchangeRate = 1;

      if (detectRes?.ok) {
        const detectData = await detectRes.json();
        if (detectData.currency) currencyCode = detectData.currency;
        if (detectData.countryCode) countryCode = detectData.countryCode;
      }

      if (countriesRes?.ok) {
        const countriesData = await countriesRes.json();
        if (countriesData.rates?.[currencyCode]) {
          exchangeRate = countriesData.rates[currencyCode];
        } else if (countriesData.rates?.['RWF']) {
          // rates are in RWF base, find this currency's rate
          const rwfRate = countriesData.rates['RWF'];
          // If API returns RWF-relative, just use 1/rate
          exchangeRate = currencyCode === 'RWF' ? 1 : (countriesData.rates[currencyCode] || 1);
        }
      }

      const meta = CURRENCY_META[currencyCode] || { symbol: currencyCode, flag: '' };
      const newState = {
        currencyCode,
        currencySymbol: meta.symbol,
        countryCode,
        countryFlag: meta.flag,
        exchangeRate,
        isLoading: false,
      };

      writeCache(newState);
      setState(newState);
    }).catch(() => {
      setState(prev => ({ ...prev, isLoading: false }));
    });
  }, []);

  /**
 * Format a price from RWF to local currency.
 * @param amountInRwf - The price stored in RWF
 * @returns Formatted string like "2 000 RWF" or "1 500 KSh"
 */
const formatPrice = useCallback(
  (amountInRwf: number): string => {
    if (amountInRwf === 0) return 'Free';

    const converted = Math.round(amountInRwf * state.exchangeRate);
    const decimals = ['RWF', 'UGX', 'TZS', 'CDF', 'MWK'].includes(state.currencyCode) ? 0 : 2;

    const formatted = converted.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    return `${formatted} ${state.currencySymbol}`;
  },
  [state.exchangeRate, state.currencySymbol, state.currencyCode]
);

  return {
    ...state,
    formatPrice,
  };
}


