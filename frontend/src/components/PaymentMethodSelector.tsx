import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiBaseUrl } from '@/lib/env';
import { Loader2, Globe, CheckCircle, ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

// ─── Types ───

interface Provider {
  providerId: string;
  name: string;
}

interface CountryInfo {
  countryCode: string;
  currency: string;
  providers: Provider[];
}

interface PaymentMethodSelectorProps {
  onSelect: (selection: {
    providerId: string;
    providerName: string;
    countryCode: string;
    currency: string;
    countryName: string;
  } | null) => void;
  selectedProviderId?: string;
}

// ─── Provider Logo Map ───

const PROVIDER_BRANDING: Record<string, { color: string; short: string }> = {
  MTN_MOMO_RWA: { color: '#ffcc00', short: 'MTN' },
  AIRTEL_RWA: { color: '#ed1c24', short: 'AIR' },
  MPESA_KEN: { color: '#4BB543', short: 'M-P' },
  AIRTEL_KEN: { color: '#ed1c24', short: 'AIR' },
  MTN_MOMO_UGA: { color: '#ffcc00', short: 'MTN' },
  AIRTEL_OAPI_UGA: { color: '#ed1c24', short: 'AIR' },
  VODACOM_TZA: { color: '#D42027', short: 'VOD' },
  AIRTEL_TZA: { color: '#ed1c24', short: 'AIR' },
  TIGO_TZA: { color: '#003B7B', short: 'TIG' },
  MTN_MOMO_GHA: { color: '#ffcc00', short: 'MTN' },
  VODAFONE_GHA: { color: '#E60000', short: 'VOD' },
  AIRTELTIGO_GHA: { color: '#ed1c24', short: 'AIR' },
  MTN_MOMO_NGA: { color: '#ffcc00', short: 'MTN' },
  AIRTEL_NGA: { color: '#ed1c24', short: 'AIR' },
  MTN_MOMO_ZMB: { color: '#ffcc00', short: 'MTN' },
  AIRTEL_OAPI_ZMB: { color: '#ed1c24', short: 'AIR' },
  ZAMTEL_ZMB: { color: '#009639', short: 'ZAM' },
  MTN_MOMO_CMR: { color: '#ffcc00', short: 'MTN' },
  ORANGE_CMR: { color: '#FF7900', short: 'ORN' },
  MTN_MOMO_CIV: { color: '#ffcc00', short: 'MTN' },
  ORANGE_CIV: { color: '#FF7900', short: 'ORN' },
  MOOV_CIV: { color: '#00A3E0', short: 'MOV' },
  ORANGE_SEN: { color: '#FF7900', short: 'ORN' },
  FREE_SEN: { color: '#E10098', short: 'FRE' },
  VODACOM_COD: { color: '#D42027', short: 'VOD' },
  AIRTEL_COD: { color: '#ed1c24', short: 'AIR' },
  ORANGE_COD: { color: '#FF7900', short: 'ORN' },
  AIRTEL_MWI: { color: '#ed1c24', short: 'AIR' },
  TNM_MWI: { color: '#00A650', short: 'TNM' },
  ETHIO_TEL_ETH: { color: '#1A5276', short: 'ETH' },
  HORMUUD_SOM: { color: '#2E86C1', short: 'HOR' },
  AFRICELL_SLE: { color: '#E71D36', short: 'AFR' },
  VODACOM_LSO: { color: '#D42027', short: 'VOD' },
  VODACOM_MOZ: { color: '#D42027', short: 'VOD' },
  MPESA_MOZ: { color: '#4BB543', short: 'M-P' },
  MTN_MOMO_BEN: { color: '#ffcc00', short: 'MTN' },
  ORANGE_BFA: { color: '#FF7900', short: 'ORN' },
  AIRTEL_GAB: { color: '#ed1c24', short: 'AIR' },
};

// ─── Country Flag Map ───

const COUNTRY_FLAGS: Record<string, { flag: string; name: string }> = {
  RWA: { flag: '🇷🇼', name: 'Rwanda' },
  KEN: { flag: '🇰🇪', name: 'Kenya' },
  UGA: { flag: '🇺🇬', name: 'Uganda' },
  TZA: { flag: '🇹🇿', name: 'Tanzania' },
  GHA: { flag: '🇬🇭', name: 'Ghana' },
  NGA: { flag: '🇳🇬', name: 'Nigeria' },
  ZMB: { flag: '🇿🇲', name: 'Zambia' },
  CMR: { flag: '🇨🇲', name: 'Cameroon' },
  CIV: { flag: '🇨🇮', name: "Côte d'Ivoire" },
  SEN: { flag: '🇸🇳', name: 'Senegal' },
  COD: { flag: '🇨🇩', name: 'DR Congo' },
  MWI: { flag: '🇲🇼', name: 'Malawi' },
  BEN: { flag: '🇧🇯', name: 'Benin' },
  BFA: { flag: '🇧🇫', name: 'Burkina Faso' },
  ETH: { flag: '🇪🇹', name: 'Ethiopia' },
  GAB: { flag: '🇬🇦', name: 'Gabon' },
  LSO: { flag: '🇱🇸', name: 'Lesotho' },
  MOZ: { flag: '🇲🇿', name: 'Mozambique' },
  SLE: { flag: '🇸🇱', name: 'Sierra Leone' },
  SOM: { flag: '🇸🇴', name: 'Somalia' },
};

// ─── Provider Logo SVG Component ───

function ProviderLogo({ providerId, size = 40 }: { providerId: string; size?: number }) {
  const branding = PROVIDER_BRANDING[providerId];
  const color = branding?.color || '#6b7280';
  const short = branding?.short || providerId.substring(0, 3);

  return (
    <div
      className="rounded-xl flex items-center justify-center font-black text-white shadow-sm"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color}, ${color}dd)`,
        fontSize: size * 0.3,
        letterSpacing: '0.05em',
      }}
    >
      {short}
    </div>
  );
}

// ─── Component ───

export function PaymentMethodSelector({
  onSelect,
  selectedProviderId,
}: PaymentMethodSelectorProps) {
  const [countries, setCountries] = useState<CountryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(selectedProviderId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch supported countries
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const baseUrl = getApiBaseUrl();
        const res = await fetch(`${baseUrl}/api/payments/countries`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('ihub_token')}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch countries');
        const data = await res.json();
        setCountries(data.countries || []);
      } catch (err) {
        console.error('Failed to load payment countries:', err);
        setError('Could not load payment options');
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
  }, []);

  // Filter countries by search
  const filteredCountries = countries.filter((c) => {
    const info = COUNTRY_FLAGS[c.countryCode];
    const search = searchQuery.toLowerCase();
    return (
      info?.name.toLowerCase().includes(search) ||
      c.countryCode.toLowerCase().includes(search) ||
      c.currency.toLowerCase().includes(search)
    );
  });

  const handleSelectProvider = (countryCode: string, provider: Provider) => {
    setSelectedCountry(countryCode);
    setSelectedProvider(provider.providerId);
    const countryInfo = COUNTRY_FLAGS[countryCode];
    const countryData = countries.find((c) => c.countryCode === countryCode);
    onSelect({
      providerId: provider.providerId,
      providerName: provider.name,
      countryCode,
      currency: countryData?.currency || 'RWF',
      countryName: countryInfo?.name || countryCode,
    });
  };

  const handleClear = () => {
    setSelectedCountry(null);
    setSelectedProvider(null);
    onSelect(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
          <p className="text-xs text-muted-foreground font-medium">Loading payment options...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/5 rounded-xl border border-destructive/20 text-center">
        <p className="text-xs text-destructive font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected Provider Display */}
      <AnimatePresence mode="wait">
        {selectedProvider ? (
          <motion.div
            key="selected"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-accent/5 border-2 border-accent/30 rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ProviderLogo providerId={selectedProvider} size={44} />
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {countries
                      .find((c) => c.providers.some((p) => p.providerId === selectedProvider))
                      ?.providers.find((p) => p.providerId === selectedProvider)?.name || selectedProvider}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {(() => {
                      const c = countries.find((c) =>
                        c.providers.some((p) => p.providerId === selectedProvider)
                      );
                      const info = COUNTRY_FLAGS[c?.countryCode || ''];
                      return c ? `${info?.flag || ''} ${info?.name || c.countryCode} • ${c.currency}` : '';
                    })()}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClear}
                className="text-[10px] text-muted-foreground hover:text-foreground underline transition-colors"
              >
                Change
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="selector"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {/* Country Search / Selector */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <Input
                placeholder="Search country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 pl-9 bg-muted/20 border-border/50 rounded-xl text-sm focus-visible:ring-accent/20"
              />
            </div>

            {/* Country Grid */}
            <div className="max-h-[280px] overflow-y-auto custom-scrollbar space-y-1.5 -mx-1 px-1">
              {filteredCountries.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No countries found</p>
              ) : (
                filteredCountries.map((country) => {
                  const info = COUNTRY_FLAGS[country.countryCode];
                  const isActive = selectedCountry === country.countryCode;
                  return (
                    <div key={country.countryCode}>
                      {/* Country Header */}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCountry(isActive ? null : country.countryCode)
                        }
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                          isActive
                            ? 'bg-accent/10 border border-accent/30'
                            : 'bg-muted/10 border border-transparent hover:bg-muted/20 hover:border-border/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{info?.flag || '🌍'}</span>
                          <div className="text-left">
                            <p className="text-sm font-bold text-foreground">{info?.name || country.countryCode}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {country.providers.length} method{country.providers.length !== 1 ? 's' : ''} • {country.currency}
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground transition-transform ${
                            isActive ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {/* Provider Cards */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-12 pr-2 py-2 space-y-1.5">
                              {country.providers.map((provider) => {
                                const isProviderSelected = selectedProvider === provider.providerId;
                                return (
                                  <button
                                    key={provider.providerId}
                                    type="button"
                                    onClick={() =>
                                      handleSelectProvider(country.countryCode, provider)
                                    }
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                      isProviderSelected
                                        ? 'bg-accent/10 border-accent/40 shadow-sm'
                                        : 'bg-background/50 border-border/30 hover:border-accent/30 hover:bg-accent/5'
                                    }`}
                                  >
                                    <ProviderLogo providerId={provider.providerId} size={36} />
                                    <div className="flex-1 text-left">
                                      <p className={`text-xs font-bold ${
                                        isProviderSelected ? 'text-accent' : 'text-foreground'
                                      }`}>
                                        {provider.name}
                                      </p>
                                      <p className="text-[9px] text-muted-foreground font-mono">
                                        {provider.providerId}
                                      </p>
                                    </div>
                                    {isProviderSelected && (
                                      <CheckCircle className="w-4 h-4 text-accent shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!loading && !error && countries.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Globe className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground font-medium">No payment options available</p>
        </div>
      )}
    </div>
  );
}
