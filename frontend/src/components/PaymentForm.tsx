import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { Loader2, Phone, CheckCircle, Smartphone, History, ShieldCheck, Mail, Ticket, X, Globe, MapPin, RefreshCw, Percent } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/env';
import { useMutation } from '@apollo/client/react';
import { SUBMIT_PAYMENT_PROOF, VALIDATE_DISCOUNT_CODE, ENROLL_COURSE } from '@/lib/graphql/mutations';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ──────────────────────────────────────────────────────────────

interface CountryInfo {
  countryCode: string;
  country: string;
  flag: string;
  currency: string;
  rate: number | null;
  providers: ProviderInfo[];
}

interface ProviderInfo {
  providerId: string;
  name: string;
  paymentMethod: string;
}

interface PaymentFormProps {
  amount: number;
  description: string;
  courseId?: string;
  courseIds?: string[];
  subscriptionId?: string;
  internshipProgramId?: string;
  internshipIds?: string[];
  selectedDeliveryMode?: string;
  onSuccess?: () => void;
  onMethodChange?: (method: string) => void;
}

type PaymentMethod = 'pawapay' | 'card' | 'manual' | 'intouch';

// ─── Provider Logos ─────────────────────────────────────────────────────

// ─── Country Code Prefixes ─────────────────────────────────────────────
const COUNTRY_CODE_PREFIXES: Record<string, string> = {
  'RWA': '+250', 'KEN': '+254', 'UGA': '+256', 'TZA': '+255',
  'GHA': '+233', 'NGA': '+234', 'ZMB': '+260', 'CMR': '+237',
  'CIV': '+225', 'SEN': '+221', 'COD': '+243', 'MWI': '+265',
  'BEN': '+229', 'BFA': '+226', 'ETH': '+251', 'GAB': '+241',
  'LSO': '+266', 'MOZ': '+258', 'SLE': '+232', 'SOM': '+252',
};

// ─── Phone Validation ───────────────────────────────────────────────────

/** Expected phone format hints per country, shown as placeholder guidance */
const PHONE_FORMAT_HINTS: Record<string, { example: string; digits: string }> = {
  'RWA': { example: '078X XXX XXX', digits: '10 digits (07X...)' },
  'KEN': { example: '0712 XXX XXX', digits: '10 digits (07X...)' },
  'UGA': { example: '0772 XXX XXX', digits: '10 digits (07X...)' },
  'TZA': { example: '0712 XXX XXX', digits: '10 digits (07X...)' },
  'GHA': { example: '023X XXX XXX', digits: '10 digits (02X...)' },
  'NGA': { example: '0803 XXX XXX', digits: '11 digits (080...)' },
  'ZMB': { example: '097X XXX XXX', digits: '10 digits (09X...)' },
  'CMR': { example: '670 000 000', digits: '9 digits (6X...)' },
  'CIV': { example: '0700 000 00', digits: '10 digits (07...)' },
  'SEN': { example: '77 000 00 00', digits: '9 digits' },
  'COD': { example: '081 000 000', digits: '9 digits (08X...)' },
  'MWI': { example: '0999 000 00', digits: '10 digits (09X...)' },
};

/**
 * Validate a phone number for the given country.
 * Returns a user-friendly error message, or null if valid.
 */
function validatePhone(phone: string, countryCode: string): string | null {
  if (!phone || phone.trim() === '') {
    return 'Please enter your phone number to continue';
  }

  // Strip everything except digits
  const digitsOnly = phone.replace(/[^0-9]/g, '');

  if (digitsOnly.length === 0) {
    return 'Please enter a valid phone number with digits';
  }

  // Remove leading country code if present (e.g., 250790706170 → 790706170)
  const prefix = COUNTRY_CODE_PREFIXES[countryCode]?.replace(/\+/g, '') || '250';
  const localNumber = digitsOnly.startsWith(prefix)
    ? digitsOnly.slice(prefix.length)
    : digitsOnly;

  // Remove leading zeros to get the base subscriber number
  const baseNumber = localNumber.replace(/^0+/, '');

  // Check minimum length (most African numbers are at least 6 digits after stripping prefix/zeros)
  if (baseNumber.length < 6) {
    const hint = PHONE_FORMAT_HINTS[countryCode];
    if (hint) {
      return `Number too short. Please use ${hint.digits} format (e.g., ${hint.example})`;
    }
    return `Number too short. Please enter the full phone number including area code`;
  }

  // Check maximum length (international format with country code is max ~15 digits)
  if (digitsOnly.length > 15) {
    return 'Number too long. Please check you entered the correct phone number';
  }

  return null; // valid
}

function getProviderLogo(providerId: string, name: string) {
  const id = providerId.toLowerCase();
  const n = name.toLowerCase();

  // MTN: Yellow bg + bold dark "MTN"
  if (id.includes('mtn')) {
    return {
      bgClass: 'bg-[#FFCC00]',
      dotColor: 'bg-[#FFCC00]',
      label: 'MTN Mobile Money',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <rect x="2" y="6" width="20" height="12" rx="2" fill="#1a1a1a" />
          <text x="12" y="16" textAnchor="middle" fill="#FFCC00" fontSize="10" fontWeight="bold" fontFamily="Arial">MTN</text>
        </svg>
      ),
      miniSvg: (
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none">
          <rect x="2" y="5" width="20" height="14" rx="2" fill="#1a1a1a" />
          <text x="12" y="16" textAnchor="middle" fill="#FFCC00" fontSize="8" fontWeight="bold" fontFamily="Arial">M</text>
        </svg>
      ),
    };
  }

  // Airtel: Red bg + white "Airtel"
  if (id.includes('airtel')) {
    return {
      bgClass: 'bg-[#E30613]',
      dotColor: 'bg-[#E30613]',
      label: 'Airtel Money',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <circle cx="12" cy="12" r="10" fill="white" />
          <text x="12" y="16" textAnchor="middle" fill="#E30613" fontSize="12" fontWeight="bold" fontFamily="Arial">A</text>
        </svg>
      ),
      miniSvg: (
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none">
          <circle cx="12" cy="12" r="10" fill="white" />
          <text x="12" y="16" textAnchor="middle" fill="#E30613" fontSize="10" fontWeight="bold" fontFamily="Arial">A</text>
        </svg>
      ),
    };
  }

  // M-Pesa: Green bg + white "M-Pesa"
  if (id.includes('mpesa')) {
    return {
      bgClass: 'bg-[#4CAF50]',
      dotColor: 'bg-[#4CAF50]',
      label: 'M-Pesa',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <rect x="3" y="5" width="18" height="14" rx="3" fill="white" />
          <text x="12" y="16" textAnchor="middle" fill="#4CAF50" fontSize="9" fontWeight="bold" fontFamily="Arial">M-P</text>
        </svg>
      ),
      miniSvg: (
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none">
          <rect x="3" y="5" width="18" height="14" rx="3" fill="white" />
          <text x="12" y="16" textAnchor="middle" fill="#4CAF50" fontSize="7" fontWeight="bold" fontFamily="Arial">M</text>
        </svg>
      ),
    };
  }

  // Vodacom: Red bg
  if (id.includes('vodacom') || id.includes('vodafone')) {
    return {
      bgClass: 'bg-[#E30613]',
      dotColor: 'bg-[#E30613]',
      label: 'Vodacom',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">VOD</text>
        </svg>
      ),
      miniSvg: (
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none">
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="Arial">V</text>
        </svg>
      ),
    };
  }

  // Tigo: Orange bg
  if (id.includes('tigo')) {
    return {
      bgClass: 'bg-[#FF6600]',
      dotColor: 'bg-[#FF6600]',
      label: 'Tigo',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">TIGO</text>
        </svg>
      ),
      miniSvg: (
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none">
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="Arial">T</text>
        </svg>
      ),
    };
  }

  // Orange
  if (id.includes('orange')) {
    return {
      bgClass: 'bg-[#FF7900]',
      dotColor: 'bg-[#FF7900]',
      label: 'Orange Money',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <rect x="3" y="6" width="18" height="12" rx="2" fill="white" />
          <text x="12" y="16" textAnchor="middle" fill="#FF7900" fontSize="9" fontWeight="bold" fontFamily="Arial">OR</text>
        </svg>
      ),
      miniSvg: (
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none">
          <rect x="3" y="6" width="18" height="12" rx="2" fill="white" />
          <text x="12" y="16" textAnchor="middle" fill="#FF7900" fontSize="7" fontWeight="bold" fontFamily="Arial">O</text>
        </svg>
      ),
    };
  }

  // Moov
  if (id.includes('moov')) {
    return {
      bgClass: 'bg-[#00A3E0]',
      dotColor: 'bg-[#00A3E0]',
      label: 'Moov Money',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">MOOV</text>
        </svg>
      ),
      miniSvg: (
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none">
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="Arial">M</text>
        </svg>
      ),
    };
  }

  // Zamtel
  if (id.includes('zamtel')) {
    return {
      bgClass: 'bg-[#007B3D]',
      dotColor: 'bg-[#007B3D]',
      label: 'Zamtel',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="Arial">ZAM</text>
        </svg>
      ),
      miniSvg: (
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none">
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="Arial">Z</text>
        </svg>
      ),
    };
  }

  // Intouch (Rwanda)
  if (id.includes('intouch')) {
    return {
      bgClass: 'bg-gradient-to-br from-emerald-500 to-green-600',
      dotColor: 'bg-emerald-500',
      label: 'IntouchPay',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <circle cx="12" cy="10" r="6" fill="white" opacity="0.9" />
          <path d="M8 14 L12 20 L16 14" fill="white" />
        </svg>
      ),
      miniSvg: (
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none">
          <circle cx="12" cy="10" r="5" fill="white" opacity="0.9" />
          <path d="M9 14 L12 18 L15 14" fill="white" />
        </svg>
      ),
    };
  }

  // PawaPay (Multi-country) — default for PawaPay providers
  if (id.includes('pawapay') || n.includes('pawapay')) {
    return {
      bgClass: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      dotColor: 'bg-blue-500',
      label: 'PawaPay',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <circle cx="12" cy="12" r="7" fill="white" opacity="0.9" />
          <path d="M9 12 L11 14 L15 10" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      ),
      miniSvg: (
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none">
          <circle cx="12" cy="12" r="6" fill="white" opacity="0.9" />
          <path d="M10 12 L11 13 L14 10" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      ),
    };
  }

  // Ethio Telecom
  if (id.includes('ethio')) {
    return {
      bgClass: 'bg-[#003D8B]',
      dotColor: 'bg-[#003D8B]',
      label: 'Ethio Telecom',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="Arial">ETHIO</text>
        </svg>
      ),
      miniSvg: (
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none">
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="Arial">E</text>
        </svg>
      ),
    };
  }

  // Africell
  if (id.includes('africell')) {
    return {
      bgClass: 'bg-[#ED1C24]',
      dotColor: 'bg-[#ED1C24]',
      label: 'Africell',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial">AFC</text>
        </svg>
      ),
      miniSvg: (
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none">
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="Arial">A</text>
        </svg>
      ),
    };
  }

  // Hormuud
  if (id.includes('hormuud')) {
    return {
      bgClass: 'bg-[#00A651]',
      dotColor: 'bg-[#00A651]',
      label: 'Hormuud',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial">H</text>
        </svg>
      ),
      miniSvg: (
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none">
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="Arial">H</text>
        </svg>
      ),
    };
  }

  // TNM (Malawi)
  if (id.includes('tnm')) {
    return {
      bgClass: 'bg-[#00AEEF]',
      dotColor: 'bg-[#00AEEF]',
      label: 'TNM Mpamba',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="Arial">TNM</text>
        </svg>
      ),
      miniSvg: (
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none">
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="Arial">T</text>
        </svg>
      ),
    };
  }

  // Free (Senegal)
  if (id.includes('free')) {
    return {
      bgClass: 'bg-[#E2001A]',
      dotColor: 'bg-[#E2001A]',
      label: 'Free Money',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">Free</text>
        </svg>
      ),
      miniSvg: (
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none">
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="Arial">F</text>
        </svg>
      ),
    };
  }

  // Default: PawaPay-style
  return {
    bgClass: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    dotColor: 'bg-blue-500',
    label: 'PawaPay',
    svg: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <circle cx="12" cy="12" r="7" fill="white" opacity="0.9" />
        <path d="M9 12 L11 14 L15 10" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
    miniSvg: (
      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none">
        <circle cx="12" cy="12" r="6" fill="white" opacity="0.9" />
        <path d="M10 12 L11 13 L14 10" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  };
}

// ─── Component ──────────────────────────────────────────────────────────

export function PaymentForm({
  amount,
  description,
  courseId,
  courseIds,
  subscriptionId,
  internshipProgramId,
  internshipIds,
  selectedDeliveryMode,
  onSuccess,
  onMethodChange,
}: PaymentFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('pawapay');
  const [discountCode, setDiscountCode] = useState('');
  const [isDiscountApplied, setIsDiscountApplied] = useState(false);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [discountInfo, setDiscountInfo] = useState<{ finalPrice: number; originalPrice: number; discountType: string; discountValue: number; message: string; savings: number; savingsPercent: number } | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [sendingReceipt, setSendingReceipt] = useState(false);

  // ─── Multi-country state ───
  const [countries, setCountries] = useState<CountryInfo[]>([]);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('RWA');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [localCurrency, setLocalCurrency] = useState<string>('RWF');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [localAmount, setLocalAmount] = useState<number>(amount);
  const [isDetecting, setIsDetecting] = useState(true);
  const [isDetectingCountry, setIsDetectingCountry] = useState(true);

  const [validateDiscountMutation] = useMutation(VALIDATE_DISCOUNT_CODE);
  const [enrollMutation, { loading: enrollingFree }] = useMutation(ENROLL_COURSE, {
    onCompleted: () => {
      setPaymentSuccess(true);
      toast.success('🎉 You are now enrolled! The course is yours for free.');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to enroll. Please try again.');
    }
  });

  const [submitProof] = useMutation(SUBMIT_PAYMENT_PROOF, {
    onCompleted: () => {
      toast.success('Proof of payment submitted! Our team will verify it.');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  // ─── Fetch countries and auto-detect country on mount ───
  useEffect(() => {
    const baseUrl = getApiBaseUrl();

    // 1. Fetch supported countries
    fetch(`${baseUrl}/api/payments/countries`)
      .then(res => res.json())
      .then(data => {
        setCountries(data.countries || []);
        // Find rates for conversion
        if (data.rates) {
          const rwfRate = data.rates['RWF'] || 1;
          setExchangeRate(rwfRate);
        }
      })
      .catch(err => console.error('Failed to fetch countries:', err))
      .finally(() => setIsDetecting(false));

    // 2. Auto-detect country from IP
    fetch(`${baseUrl}/api/payments/detect-country`)
      .then(res => res.json())
      .then(data => {
        if (data.countryCode) {
          setDetectedCountry(data.countryCode);
          setSelectedCountry(data.countryCode);
          if (data.currency) {
            setLocalCurrency(data.currency);
          }
        }
      })
      .catch(err => console.error('Country detection failed:', err))
      .finally(() => setIsDetectingCountry(false));
  }, []);

  // ─── Re-validate phone when country or provider changes ───
  useEffect(() => {
    // Clear phone error when method/country changes (format different)
    if (phoneTouched) {
      setPhoneError(validatePhone(phoneNumber, selectedCountry));
    }
  }, [selectedCountry, selectedProvider, method]);

  // ─── Update local amount when country/currency changes ───
  useEffect(() => {
    const country = countries.find(c => c.countryCode === selectedCountry);
    if (country) {
      setLocalCurrency(country.currency);
      setExchangeRate(country.rate);

      // Convert display amount
      if (country.rate && country.rate !== 1) {
        const converted = Math.round(amount * country.rate * 100) / 100;
        setLocalAmount(converted);
      } else {
        setLocalAmount(amount);
      }

      // Auto-select first provider
      if (country.providers.length > 0 && !selectedProvider) {
        setSelectedProvider(country.providers[0].providerId);
        // Update method based on provider
        const provMethod = country.providers[0].paymentMethod;
        if (provMethod === 'pawapay' || provMethod === 'intouch') {
          setMethod(provMethod as PaymentMethod);
        }
      }
    }
  }, [selectedCountry, countries, amount, selectedProvider]);

  // ─── Update method when provider changes ───
  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    const country = countries.find(c => c.countryCode === selectedCountry);
    if (country) {
      const provider = country.providers.find(p => p.providerId === providerId);
      if (provider) {
        const newMethod = provider.paymentMethod as PaymentMethod;
        setMethod(newMethod);
        onMethodChange?.(newMethod);
      }
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d+]/g, '');
    setPhoneNumber(value);
    // Validate silently — error only shows after blur/submit
    setPhoneError(validatePhone(value, selectedCountry));
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    const error = validatePhone(phoneNumber, selectedCountry);
    setPhoneError(error);
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      toast.error('Please agree to the Terms and Privacy Policy');
      return;
    }

    // Validate phone before submitting
    if (method === 'pawapay' || method === 'intouch') {
      const phoneValidationError = validatePhone(phoneNumber, selectedCountry);
      if (phoneValidationError) {
        setPhoneTouched(true);
        setPhoneError(phoneValidationError);
        toast.error(phoneValidationError);
        return;
      }
    }

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      const baseUrl = getApiBaseUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      // Clean phone number
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '').replace(/^0+/, '');

      // Use totalToPay (discount only applies to validated course, others at full price)
      const payAmount = Math.floor(totalToPay);

      const body: Record<string, any> = {
        amount: payAmount,
        paymentMethod: method === 'manual' ? 'manual_transfer' : method,
        description,
        email,
        courseId: courseId || undefined,
        courseIds: courseIds || undefined,
        subscriptionId: subscriptionId || undefined,
        internshipProgramId: internshipProgramId || undefined,
        internshipIds: internshipIds || undefined,
        selectedDeliveryMode: selectedDeliveryMode || undefined,
        // Discount code
        discountCode: isDiscountApplied ? discountCode.toUpperCase() : undefined,
        // Multi-country fields
        countryCode: selectedCountry, // Send for ALL countries — backend normalizes phone with this
        currency: localCurrency !== 'RWF' ? localCurrency : undefined,
      };

      if (method === 'pawapay' || method === 'intouch') {
        // Send with country code prefix (e.g., 250790706170 for Rwanda)
        const prefix = (COUNTRY_CODE_PREFIXES[selectedCountry] || '+250').replace(/\+/g, '');
        body.phoneNumber = `${prefix}${cleanPhone}`;
        body.countryCode = selectedCountry; // Always send country code for proper normalization
        if (selectedProvider) {
          body.providerId = selectedProvider;
        }
      }

      const response = await fetch(`${baseUrl}/api/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('ihub_token')}`,
        },
        signal: controller.signal,
        body: JSON.stringify(body),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to initiate payment');
      }

      const data = await response.json();

      if (data.redirectUrl) {
        toast.success('Redirecting to secure payment page...');
        window.location.href = data.redirectUrl;
        return;
      }

      if (data.status === 'pending' && (data.transactionId || data.depositId)) {
        toast.success('Payment initiated. Please check your phone for the USSD prompt.');
        setTransactionId(data.transactionId || data.depositId);
        pollPaymentStatus(data.transactionId || data._id);
        return;
      }

      if (method === 'manual') {
        toast.success('Manual payment record created.');
        onSuccess?.();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to initiate payment');
    } finally {
      setIsLoading(false);
    }
  };

  const pollPaymentStatus = async (txId: string) => {
    setPaymentStatus('checking');
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/payments/${txId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${localStorage.getItem('ihub_token')}` },
      });

      if (!response.ok) throw new Error('Failed to check status');
      const data = await response.json();

      if (data.status === 'successful') {
        setPaymentStatus(null);
        setPaymentSuccess(true);
        toast.success('Payment successful! 🎉');
      } else if (['failed', 'cancelled', 'expired'].includes(data.status)) {
        setPaymentStatus(null);
        toast.error(`Payment ${data.status}. Please try again.`);
      } else {
        setPaymentStatus('pending');
        setTimeout(() => pollPaymentStatus(txId), 4000);
      }
    } catch (error) {
      setTimeout(() => pollPaymentStatus(txId), 6000);
    }
  };

  const handleSendReceipt = async () => {
    if (!email || sendingReceipt) return;
    setSendingReceipt(true);
    try {
      // The backend sends receipt email automatically via handleSuccessfulPayment
      // This is a manual trigger in case user wants a re-send
      const baseUrl = getApiBaseUrl();
      await fetch(`${baseUrl}/api/payments/send-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('ihub_token')}`,
        },
        body: JSON.stringify({
          email,
          transactionId,
          amount,
          description,
        }),
      });
      toast.success('Receipt sent to your email!');
    } catch {
      toast.error('Failed to send receipt. Please try again.');
    } finally {
      setSendingReceipt(false);
    }
  };

  const applyDiscount = async () => {
    if (!discountCode) return;
    
    setIsValidatingDiscount(true);
    try {
      const { data } = await validateDiscountMutation({
        variables: {
          code: discountCode.toUpperCase(),
          courseId: courseId || (courseIds || [])[0] || null,
        },
      });
      
      const result = (data as any)?.validateDiscountCode as
        | {
            valid?: boolean;
            finalPrice?: number;
            originalPrice?: number;
            discountType?: string;
            discountValue?: number;
            message?: string;
          }
        | undefined;
      if (!result?.valid) {
        const errMsg = result?.message || 'Invalid discount code';
        toast.error(errMsg);
        setIsDiscountApplied(false);
        setDiscountInfo(null);
      } else {
        const finalPrice = result.finalPrice ?? 0;
        const originalPrice = result.originalPrice ?? 0;
        const savings = originalPrice - finalPrice;
        const savingsPercent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;
        
        setIsDiscountApplied(true);
        setDiscountInfo({
          finalPrice,
          originalPrice,
          discountType: result.discountType || 'percentage',
          discountValue: result.discountValue || 0,
          message: result.message || 'Discount code applied!',
          savings,
          savingsPercent,
        });
        const savingsStr = `Discount code applied! You save ${savings.toLocaleString()} ${localCurrency}`;
        toast.success(`🎉 ${result.message || savingsStr}`);
      }
    } catch (err: any) {
      const errMsg = err.message || 'Failed to validate discount code';
      toast.error(errMsg);
      setIsDiscountApplied(false);
      setDiscountInfo(null);
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  const handleFreeEnroll = async () => {
    if (!courseId && (!courseIds || courseIds.length === 0)) {
      toast.error('No course selected for enrollment');
      return;
    }
    await enrollMutation({
      variables: {
        courseId: courseId || (courseIds || [])[0],
        discountCode: discountCode.toUpperCase(),
        selectedDeliveryMode: selectedDeliveryMode || null,
      },
    });
  };

  // Computed: other courses total when multiple in cart (discount only applies to one, not both)
  const otherCartTotal = isDiscountApplied && discountInfo && courseIds && courseIds.length > 1
    ? Math.max(0, amount - (discountInfo.originalPrice || 0))
    : 0;
  // Total to pay: discounted course + other courses at full price
  const totalToPay = isDiscountApplied && discountInfo
    ? discountInfo.finalPrice + otherCartTotal
    : amount;

  // Get current country info
  const currentCountry = countries.find(c => c.countryCode === selectedCountry);
  const isFreeEnrollment = totalToPay <= 0;

  // Success receipt screen
  if (paymentSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full flex flex-col items-center justify-center py-10 px-6 text-center space-y-6"
      >
        {/* Success animation */}
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-accent rounded-full flex items-center justify-center shadow-md">
            <span className="text-white text-xs font-bold">✓</span>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-foreground">Payment Successful! 🎉</h3>
          <p className="text-sm text-muted-foreground">
            Your payment has been confirmed and processed.
          </p>
        </div>

        {/* Receipt card */}
        <div className="w-full max-w-sm bg-muted/20 border border-border/50 rounded-2xl p-6 space-y-4 text-left">
          <div className="flex items-center justify-between pb-3 border-b border-border/30">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Receipt</span>
            <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Paid</span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Amount</span>
              <span className="text-lg font-bold text-foreground">
                {localAmount.toLocaleString()} {localCurrency}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Description</span>
              <span className="text-xs font-medium text-foreground text-right max-w-[200px] truncate">{description}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Reference</span>
              <span className="font-mono text-xs font-bold text-foreground bg-background px-2 py-1 rounded-lg border border-border/30">
                {(transactionId || '').slice(-12).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Payment method</span>
              <div className="flex items-center gap-1.5">
                {selectedProvider && (
                  <div className={`w-4 h-4 rounded flex items-center justify-center ${getProviderLogo(selectedProvider, '').bgClass}`}>
                    {getProviderLogo(selectedProvider, '').miniSvg}
                  </div>
                )}
                <span className="text-xs font-medium text-foreground">{getProviderLogo(selectedProvider || 'pawapay', '').label}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Email</span>
              <span className="text-xs font-medium text-foreground">{email}</span>
            </div>
          </div>

          {/* Invoice sent badge */}
          <div className="pt-3 border-t border-border/30 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
            <Mail className="w-3 h-3 text-accent" />
            Invoice sent to your email
          </div>
        </div>

        {/* Action buttons */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          <Button
            onClick={handleSendReceipt}
            disabled={sendingReceipt}
            variant="outline"
            className="w-full h-12 rounded-full border-accent/30 text-accent hover:bg-accent/5 hover:text-accent font-semibold text-sm"
          >
            {sendingReceipt ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Send Receipt to Email
              </div>
            )}
          </Button>

          <Button
            onClick={() => { setPaymentSuccess(false); onSuccess?.(); }}
            className="w-full h-12 rounded-full bg-[#f58220] hover:bg-[#e0751a] text-white font-bold text-sm shadow-lg shadow-orange-500/10 transition-all active:scale-[0.98]"
          >
            Done
          </Button>
        </div>
      </motion.div>
    );
  }

  // Waiting screen
  if (transactionId && paymentStatus) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12 px-6 text-center space-y-6 animate-in fade-in zoom-in-95">
        <div className="relative">
          <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center animate-pulse">
            <Smartphone className="w-10 h-10 text-accent" />
          </div>
          <Loader2 className="w-6 h-6 text-accent animate-spin absolute -bottom-1 -right-1 bg-background rounded-full p-1 border" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold">Waiting for Approval</h3>
          <p className="text-sm text-muted-foreground">
            Please check your phone for the USSD prompt and enter your PIN to authorize{' '}
            <span className="text-foreground font-bold">
              {localAmount.toLocaleString()} {localCurrency}
            </span>
            {currentCountry && (
              <span> via {currentCountry.flag} {currentCountry.country}</span>
            )}
          </p>
          {selectedCountry === 'RWA' && !selectedProvider?.toLowerCase().includes('airtel') && (
            <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-amber-600">⏳ Not receiving the prompt?</span>{' '}
                If the USSD prompt doesn't appear, dial{' '}
                <span className="font-mono font-bold text-foreground bg-background px-2 py-0.5 rounded-md">*182*7*1#</span>{' '}
                to check your pending transactions and complete the payment.
              </p>
            </div>
          )}
        </div>
        <div className="p-4 bg-muted/30 rounded-xl border border-border/50 w-full max-w-xs">
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Reference</p>
          <p className="font-mono text-sm font-bold">{transactionId.slice(-12).toUpperCase()}</p>
        </div>
        <Button
          variant="ghost"
          onClick={() => setTransactionId(null)}
          className="w-full max-w-xs h-12 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 px-8 transition-all"
        >
          Cancel and try again
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleInitiatePayment} className="space-y-6 py-2">
      {/* Detect Country Banner */}
      {isDetectingCountry ? (
        <div className="flex items-center gap-2 p-3 bg-accent/5 rounded-2xl border border-accent/20 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-accent" />
          Detecting your country...
        </div>
      ) : detectedCountry && detectedCountry !== 'RWA' ? (
        <div className="flex items-center gap-2 p-3 bg-accent/5 rounded-2xl border border-accent/20 text-sm">
          <MapPin className="w-4 h-4 text-accent" />
          <span>
            Detected: <strong>{countries.find(c => c.countryCode === detectedCountry)?.flag} {countries.find(c => c.countryCode === detectedCountry)?.country || detectedCountry}</strong>
          </span>
          {exchangeRate && exchangeRate !== 1 && (
            <span className="text-xs text-muted-foreground ml-auto">
              1 RWF ≈ {exchangeRate.toFixed(4)} {localCurrency}
            </span>
          )}
        </div>
      ) : detectedCountry === 'RWA' && (
        <div className="flex items-center gap-2 p-3 bg-accent/5 rounded-2xl border border-accent/20 text-sm">
          <MapPin className="w-4 h-4 text-accent" />
          <span>Detected: 🇷🇼 Rwanda</span>
        </div>
      )}

      {/* PAY WITH — hidden when 100% discount makes it free */}
      {!isFreeEnrollment && (
        <div className="space-y-3">
          <Label className="text-sm font-bold text-foreground flex items-center gap-2">
            <Globe className="w-4 h-4 text-accent" />
            Country & Payment Method
          </Label>

          {/* Country Selector */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                value={selectedCountry}
                onValueChange={(val) => {
                  setSelectedCountry(val);
                  setSelectedProvider('');
                }}
              >
                <SelectTrigger className="h-14 bg-muted/20 border-border/50 rounded-2xl px-4 focus:ring-accent/20">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/50 bg-popover shadow-2xl max-h-60">
                  {isDetecting ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="w-5 h-5 animate-spin text-accent" />
                    </div>
                  ) : (
                    countries.map((c) => (
                      <SelectItem key={c.countryCode} value={c.countryCode} className="py-2.5 rounded-xl focus:bg-accent/10">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{c.flag}</span>
                          <div>
                            <span className="font-semibold">{c.country}</span>
                            <p className="text-[10px] text-muted-foreground font-normal">
                              {c.currency} {c.rate ? `· ${(amount * c.rate).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${c.currency}` : ''}
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Provider/Network Selector with real logos */}
          {currentCountry && currentCountry.providers.length > 0 && (
            <div>
              <Select value={selectedProvider} onValueChange={handleProviderChange}>
                <SelectTrigger className="h-14 bg-muted/20 border-border/50 rounded-2xl px-4 focus:ring-accent/20">
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/50 bg-popover shadow-2xl">
                  {currentCountry.providers.map((p) => {
                    const logo = getProviderLogo(p.providerId, p.name);
                    return (
                      <SelectItem key={p.providerId} value={p.providerId} className="py-3 rounded-xl focus:bg-accent/10">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${logo.bgClass}`}>
                            {logo.svg}
                          </div>
                          <div>
                            <span className="font-semibold">{p.name}</span>
                            <p className="text-[10px] text-muted-foreground font-normal flex items-center gap-1">
                              {logo.label}
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ${logo.dotColor}`} />
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Payment provider info banner */}
          {selectedProvider && currentCountry && (
            <div className="flex items-center gap-2 px-2 text-[11px] text-muted-foreground">
              <div className={`w-5 h-5 rounded-md flex items-center justify-center shadow-sm ${getProviderLogo(selectedProvider, '').bgClass}`}>
                {getProviderLogo(selectedProvider, '').miniSvg}
              </div>
              <span>
                Secure payment via <strong>{getProviderLogo(selectedProvider, '').label}</strong>
                {selectedCountry !== 'RWA' && (
                  <span> · {currentCountry.flag} {currentCountry.country}</span>
                )}
              </span>
            </div>
          )}
        </div>
      )}

      {/* SEND TO */}
      <div className="space-y-4">
        <Label className="text-sm font-bold text-foreground">Send To</Label>

        {/* Email Input */}
        <div className="space-y-1.5">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Mail className="w-4 h-4 text-muted-foreground/40 group-focus-within:text-accent transition-colors" />
            </div>
            <Input
              type="email"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 pl-11 bg-muted/20 border-border/50 rounded-2xl focus-visible:ring-accent/20 transition-all text-sm font-medium"
            />
            <span className="absolute -top-2 left-4 px-2 bg-background text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email</span>
          </div>
          <p className="text-[10px] text-muted-foreground pl-1">We will send your invoice to this address</p>
        </div>

        {/* Phone Input (for Mobile Money) — hidden when 100% discount makes it free */}
        {(method === 'pawapay' || method === 'intouch') && !isFreeEnrollment && (
          <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
            <div className="flex gap-2">
              <div className="w-[130px]">
                <div className="h-14 bg-muted/20 border border-border/50 rounded-2xl flex items-center justify-center px-3 text-sm font-bold text-foreground tracking-tight">
                  {currentCountry?.flag} <span className="ml-1.5">{COUNTRY_CODE_PREFIXES[selectedCountry] || '+250'}</span>
                </div>
              </div>
              <div className="relative group flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Phone className={`w-4 h-4 transition-colors ${phoneError && phoneTouched ? 'text-red-500' : 'text-muted-foreground/40 group-focus-within:text-accent'}`} />
                </div>
                <Input
                  type="tel"
                  placeholder={PHONE_FORMAT_HINTS[selectedCountry]?.example || '7X XXXX XXX'}
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  onBlur={handlePhoneBlur}
                  className={`h-14 pl-11 bg-muted/20 rounded-2xl focus-visible:ring-accent/20 transition-all text-sm font-medium ${phoneError && phoneTouched ? 'border-red-500 border-2 focus-visible:ring-red-500/20' : 'border-border/50'}`}
                />
                <span className={`absolute -top-2 left-4 px-2 bg-background text-[10px] font-bold uppercase tracking-wider ${phoneError && phoneTouched ? 'text-red-500' : 'text-muted-foreground'}`}>Phone number</span>
              </div>
            </div>
            {/* Inline validation error */}
            {phoneError && phoneTouched && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] text-red-500 pl-1.5 flex items-center gap-1 font-medium"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="13" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {phoneError}
              </motion.p>
            )}
            {/* Hint text (only when no error) */}
            {(!phoneError || !phoneTouched) && (
              <p className="text-[10px] text-muted-foreground pl-1.5 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Enter your mobile number. We will send a USSD prompt to {COUNTRY_CODE_PREFIXES[selectedCountry] || '+250'} XXX XXX XXX
              </p>
            )}
          </div>
        )}

        {/* Manual Details */}
        {method === 'manual' && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
            <div className="p-4 bg-accent/5 rounded-2xl border border-accent/20 space-y-4">
              <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#ffcc00] rounded flex items-center justify-center p-1">
                    <img src="https://momo.mtn.com/wp-content/uploads/sites/15/2022/07/Group-360.png" alt="MTN" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-xs font-bold">MTN MoMo</span>
                </div>
                <span className="font-mono text-xs font-bold select-all">0790706170</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center p-1 text-white">P</div>
                  <span className="text-xs font-bold">PayPal</span>
                </div>
                <span className="font-mono text-[10px] font-bold select-all">munyeshurimanzi@gmail.com</span>
              </div>
              <p className="text-[10px] text-muted-foreground text-center italic">
                Please transfer the amount and then upload proof below.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* DISCOUNT CODE */}
      <div className="space-y-3 pt-2">
        <AnimatePresence mode="wait">
          {!isDiscountApplied ? (
            <motion.div
              key="discount-input"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative group"
            >
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Ticket className="w-4 h-4 text-muted-foreground/40 group-focus-within:text-accent transition-colors" />
              </div>
              <Input
                placeholder="Enter discount code"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                className="h-14 pl-11 pr-24 bg-muted/20 border-border/50 rounded-2xl focus-visible:ring-accent/20 transition-all text-sm font-medium"
              />
              <span className="absolute -top-2 left-4 px-2 bg-background text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Discount code</span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={!discountCode || isValidatingDiscount}
                onClick={applyDiscount}
                className="absolute right-2 top-2 bottom-2 h-10 rounded-xl px-4 text-xs font-bold"
              >
                {isValidatingDiscount ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Apply"
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="discount-applied"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-between p-4 bg-accent/5 border border-accent/20 rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Code Applied</p>
                  <p className="text-sm font-bold text-foreground">{discountCode.toUpperCase()}</p>
                  {discountInfo && discountInfo.savings > 0 && (
                    <p className="text-[11px] font-bold text-emerald-500 mt-0.5">
                      Save {discountInfo.savings.toLocaleString()} {localCurrency}
                      {discountInfo.savingsPercent > 0 && (
                        <span className="ml-1 text-[10px] bg-emerald-500/15 px-1.5 py-0.5 rounded-full">
                          -{discountInfo.savingsPercent}%
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-red-500"
                onClick={() => {
                  setIsDiscountApplied(false);
                  setDiscountCode('');
                  setDiscountInfo(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DISCOUNT APPLIED BANNER — shown when partial discount makes price > 0 */}
      {isDiscountApplied && discountInfo && !isFreeEnrollment && discountInfo.savings > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 bg-gradient-to-br from-accent/10 to-orange-500/5 border-2 border-accent/30 rounded-2xl space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
              <Percent className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-accent">🎉 Discount Applied — Price Reduced</p>
              <p className="text-xs text-muted-foreground">
                Code <strong className="text-accent">{discountCode.toUpperCase()}</strong> applied successfully
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 justify-center py-2">
            <div className="text-center">
              <p className="text-3xl font-black text-foreground">{totalToPay.toLocaleString()} {localCurrency}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">You pay (discounted)</p>
            </div>
            <div className="h-10 w-px bg-border/50" />
            <div className="text-center">
              <p className="text-lg font-bold text-muted-foreground line-through">
                {amount.toLocaleString()} {localCurrency}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Original price</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
              You save {discountInfo.savings.toLocaleString()} {localCurrency}
              {discountInfo.savingsPercent > 0 && (
                <span className="ml-1">(-{discountInfo.savingsPercent}%)</span>
              )}
            </span>
          </div>
        </motion.div>
      )}

      {/* FREE ENROLLMENT BANNER — shown when discount makes price 0 */}
      {isFreeEnrollment && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-2 border-emerald-500/30 rounded-2xl space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-black text-emerald-500">🎉 100% Discount Applied</p>
              <p className="text-xs text-muted-foreground">
                This course is now <strong className="text-emerald-500">completely free</strong> for you!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 justify-center py-2">
            <div className="text-center">
              <p className="text-2xl font-black text-emerald-500">{totalToPay.toLocaleString()} {localCurrency}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">You pay</p>
            </div>
            <div className="h-8 w-px bg-border/50" />
            <div className="text-center">
              <p className="text-lg font-bold text-muted-foreground line-through">
                {amount.toLocaleString()} {localCurrency}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Original total</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* TERMS */}
      <div className="flex items-start gap-3 px-1 pt-2">
        <Checkbox
          id="terms"
          checked={agreedToTerms}
          onCheckedChange={(val: any) => setAgreedToTerms(val)}
          className="mt-0.5 rounded-md border-border/60 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
        />
        <Label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
          I agree to the <span className="text-accent font-bold">Terms</span> and <span className="text-accent font-bold">Privacy Policy</span>
        </Label>
      </div>

      {/* PAY BUTTON — shows different UI for free enrollment vs paid */}
      {isFreeEnrollment ? (
        <Button
          type="button"
          disabled={enrollingFree || !agreedToTerms}
          onClick={handleFreeEnroll}
          className="w-full h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-base font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] mt-4 disabled:opacity-50 disabled:cursor-not-allowed px-8"
        >
          {enrollingFree ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Enrolling...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold">🎉 Enroll Now for Free</span>
              <span className="text-xs opacity-75">No payment required — your discount covers everything</span>
            </div>
          )}
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={isLoading || !agreedToTerms}
          className="w-full h-14 rounded-full bg-[#f58220] hover:bg-[#e0751a] text-white text-base font-bold shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#f58220] px-8"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            <span className="flex flex-col items-center">
              {isDiscountApplied && discountInfo ? (
                <>
                  <span className="text-lg font-bold">
                    {totalToPay.toLocaleString()} {localCurrency}
                  </span>
                  <span className="text-xs line-through opacity-50">
                    {amount.toLocaleString()} {localCurrency}
                  </span>
                  {otherCartTotal > 0 && (
                    <span className="text-[10px] text-emerald-500 font-semibold mt-0.5">
                      Discount applies to 1 course · Others at full price
                    </span>
                  )}
                </>
              ) : (
                <span>
                  {localAmount.toLocaleString(undefined, { maximumFractionDigits: localCurrency === 'RWF' ? 0 : 2 })} {localCurrency}
                </span>
              )}
              {localCurrency !== 'RWF' && (
                <span className="text-xs opacity-75 ml-1">
                  (~{amount.toLocaleString()} RWF)
                </span>
              )}
            </span>
          )}
        </Button>
      )}

      <div className="flex flex-col items-center gap-4 pt-4 border-t border-dashed border-border/50">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <ShieldCheck className="w-3.5 h-3.5 text-accent" />
          Secure 256-bit SSL Encrypted Payment
        </div>
        {currentCountry && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Globe className="w-3 h-3" />
            {currentCountry.flag} {currentCountry.country} · {currentCountry.currency}
            {selectedProvider && ` · ${currentCountry.providers.find(p => p.providerId === selectedProvider)?.name || ''}`}
          </div>
        )}
      </div>
    </form>
  );
}
