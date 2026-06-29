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
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import { toast } from 'sonner';
import { Loader2, Phone, CheckCircle, Smartphone, History, ShieldCheck, Mail, Ticket, X, Globe } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/env';
import { useMutation } from '@apollo/client/react';
import { SUBMIT_PAYMENT_PROOF } from '@/lib/graphql/mutations';
import { motion, AnimatePresence } from 'framer-motion';

interface PawaPaySelection {
  providerId: string;
  providerName: string;
  countryCode: string;
  currency: string;
  countryName: string;
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
  onMethodChange?: (method: 'mtn' | 'airtel' | 'card' | 'manual' | 'pawapay') => void;
}

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
  const [countryCode, setCountryCode] = useState('+250');
  const [email, setEmail] = useState(user?.email || '');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | null>(null);
  const [method, setMethod] = useState<'mtn' | 'airtel' | 'card' | 'manual' | 'pawapay'>('mtn');
  const [pawaPaySelection, setPawaPaySelection] = useState<PawaPaySelection | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [isDiscountApplied, setIsDiscountApplied] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [submitProof] = useMutation(SUBMIT_PAYMENT_PROOF, {
    onCompleted: () => {
      toast.success('Proof of payment submitted! Our team will verify it.');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d+]/g, ''); // Allow digits and +
    setPhoneNumber(value);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    return phone.length >= 8; // Basic length check for international numbers
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      toast.error('Please agree to the Terms and Privacy Policy');
      return;
    }

    if (method === 'mtn' || method === 'airtel' || method === 'pawapay') {
      if (!phoneNumber) {
        toast.error('Please enter your phone number');
        return;
      }
      if (!validatePhoneNumber(phoneNumber)) {
        toast.error('Invalid phone number format.');
        return;
      }
    }

    if (method === 'pawapay' && !pawaPaySelection) {
      toast.error('Please select a payment method and country');
      return;
    }

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      const baseUrl = getApiBaseUrl();
      const fullPhoneNumber = countryCode + phoneNumber.replace(/^0+/, ''); // Remove leading zero if any

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const body: Record<string, any> = {
        amount: Math.floor(amount),
        paymentMethod: method === 'manual' ? 'manual_transfer' : method,
        description,
        email,
        courseId: courseId || undefined,
        courseIds: courseIds || undefined,
        subscriptionId: subscriptionId || undefined,
        internshipProgramId: internshipProgramId || undefined,
        internshipIds: internshipIds || undefined,
        selectedDeliveryMode: selectedDeliveryMode || undefined,
      };

      if (method === 'mtn' || method === 'airtel') {
        body.phoneNumber = fullPhoneNumber;
      } else if (method === 'pawapay') {
        body.phoneNumber = fullPhoneNumber;
        body.providerId = pawaPaySelection?.providerId;
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
        // Handle Pesapal redirect
        toast.success('Redirecting to secure payment page...');
        window.location.href = data.redirectUrl;
        return;
      }

      if (data.status === 'processing' && data.transactionId) {
        toast.success('Payment initiated. Please check your phone for the USSD prompt.');
        setTransactionId(data.transactionId);
        pollPaymentStatus(data.transactionId);
        return;
      }

      if (method === 'manual') {
        toast.success('Manual payment record created.');
        onSuccess?.(); // Redirect to manual proof upload in parent
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
        toast.success('Payment successful! 🎉');
        onSuccess?.();
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

  const applyDiscount = () => {
    if (!discountCode) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsDiscountApplied(true);
      toast.success('Discount code applied!');
    }, 1000);
  };

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
            Please check your phone for the USSD prompt and enter your PIN to authorize 
            <span className="text-foreground font-bold"> {amount.toLocaleString()} RWF</span>.
          </p>
        </div>
        <div className="p-4 bg-muted/30 rounded-xl border border-border/50 w-full max-w-xs">
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Reference</p>
          <p className="font-mono text-sm font-bold">{transactionId.slice(-12).toUpperCase()}</p>
        </div>
        <Button variant="ghost" onClick={() => setTransactionId(null)} className="text-xs text-muted-foreground hover:text-foreground">
          Cancel and try again
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleInitiatePayment} className="space-y-6 py-2">
      {/* PAY WITH */}
      <div className="space-y-3">
        <Label className="text-sm font-bold text-foreground">Pay With</Label>
        <Select 
          value={method} 
          onValueChange={(val: any) => {
            setMethod(val);
            onMethodChange?.(val);
          }}
        >
          <SelectTrigger className="h-14 bg-muted/20 border-border/50 rounded-2xl px-4 focus:ring-accent/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-border/50 bg-popover shadow-2xl">
            <SelectItem value="pawapay" className="py-3 rounded-xl focus:bg-accent/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-semibold">Mobile Money</span>
                  <p className="text-[10px] text-muted-foreground font-normal">All countries</p>
                </div>
              </div>
            </SelectItem>
            <SelectItem value="mtn" className="py-3 rounded-xl focus:bg-accent/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#ffcc00] rounded-lg flex items-center justify-center p-1.5 shadow-sm">
                  <img src="https://momo.mtn.com/wp-content/uploads/sites/15/2022/07/Group-360.png" alt="MTN" className="w-full h-full object-contain" />
                </div>
                <span className="font-semibold">MTN Mobile Money</span>
              </div>
            </SelectItem>
            <SelectItem value="airtel" className="py-3 rounded-xl focus:bg-accent/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#ed1c24] rounded-lg flex items-center justify-center p-1.5 shadow-sm">
                   <img src="https://airtel.rw/assets/images/airtel-money-logo.png" alt="Airtel" className="w-full h-full object-contain brightness-0 invert" />
                </div>
                <span className="font-semibold">Airtel Money</span>
              </div>
            </SelectItem>
            <SelectItem value="card" className="py-3 rounded-xl focus:bg-accent/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center p-1 shadow-sm">
                  <div className="flex -space-x-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-red-500 opacity-90" />
                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 opacity-90" />
                  </div>
                </div>
                <span className="font-semibold">VISA/Master Card</span>
              </div>
            </SelectItem>
            <SelectItem value="manual" className="py-3 rounded-xl focus:bg-accent/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shadow-sm">
                  <History className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="font-semibold">Manual Transfer</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

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

        {/* PawaPay Country & Provider Selector */}
        {method === 'pawapay' && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
            <PaymentMethodSelector
              onSelect={(selection) => setPawaPaySelection(selection)}
              selectedProviderId={pawaPaySelection?.providerId}
            />
            
            {pawaPaySelection && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                <Label className="text-xs font-bold text-foreground pl-1">
                  Your Phone Number ({pawaPaySelection.countryName})
                </Label>
                <div className="flex gap-2">
                  <div className="w-[120px]">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="h-14 bg-muted/20 border-border/50 rounded-2xl focus:ring-accent/20">
                        <SelectValue placeholder="Code" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-border/50">
                        <SelectItem value="+250" className="rounded-xl">🇷🇼 +250</SelectItem>
                        <SelectItem value="+254" className="rounded-xl">🇰🇪 +254</SelectItem>
                        <SelectItem value="+256" className="rounded-xl">🇺🇬 +256</SelectItem>
                        <SelectItem value="+255" className="rounded-xl">🇹🇿 +255</SelectItem>
                        <SelectItem value="+257" className="rounded-xl">🇧🇮 +257</SelectItem>
                        <SelectItem value="+243" className="rounded-xl">🇨🇩 +243</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative group flex-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <Phone className="w-4 h-4 text-muted-foreground/40 group-focus-within:text-accent transition-colors" />
                    </div>
                    <Input
                      type="tel"
                      placeholder="788 000 000"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      className="h-14 pl-11 bg-muted/20 border-border/50 rounded-2xl focus-visible:ring-accent/20 transition-all text-sm font-medium"
                    />
                    <span className="absolute -top-2 left-4 px-2 bg-background text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone number</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground pl-1">
                  Enter your phone number for the USSD prompt received via {pawaPaySelection.providerName}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Phone Input (if MoMo via FDI) */}
        {(method === 'mtn' || method === 'airtel') && (
          <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
            <div className="flex gap-2">
              <div className="w-[120px]">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="h-14 bg-muted/20 border-border/50 rounded-2xl focus:ring-accent/20">
                    <SelectValue placeholder="Code" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/50">
                    <SelectItem value="+250" className="rounded-xl">🇷🇼 +250</SelectItem>
                    <SelectItem value="+254" className="rounded-xl">🇰🇪 +254</SelectItem>
                    <SelectItem value="+256" className="rounded-xl">🇺🇬 +256</SelectItem>
                    <SelectItem value="+255" className="rounded-xl">🇹🇿 +255</SelectItem>
                    <SelectItem value="+257" className="rounded-xl">🇧🇮 +257</SelectItem>
                    <SelectItem value="+243" className="rounded-xl">🇨🇩 +243</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative group flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Phone className="w-4 h-4 text-muted-foreground/40 group-focus-within:text-accent transition-colors" />
                </div>
                <Input
                  type="tel"
                  placeholder="788 000 000"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className="h-14 pl-11 bg-muted/20 border-border/50 rounded-2xl focus-visible:ring-accent/20 transition-all text-sm font-medium"
                />
                <span className="absolute -top-2 left-4 px-2 bg-background text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone number</span>
              </div>
            </div>
          </div>
        )}

        {/* Manual Details (if Manual) */}
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
                  <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center p-1 text-white">
                    P
                  </div>
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
                disabled={!discountCode || isLoading}
                onClick={applyDiscount}
                className="absolute right-2 top-2 bottom-2 h-10 rounded-xl px-4 text-xs font-bold"
              >
                Apply
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
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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

      {/* PAY BUTTON */}
      <Button
        type="submit"
        disabled={isLoading || !agreedToTerms}
        className="w-full h-14 rounded-full bg-[#f58220] hover:bg-[#e0751a] text-white text-base font-bold shadow-lg shadow-orange-500/10 transition-all active:scale-[0.98] mt-4"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
          </div>
        ) : (
          <span>Pay {amount.toLocaleString()} RWF</span>
        )}
      </Button>

      <div className="flex flex-col items-center gap-4 pt-4 border-t border-dashed border-border/50">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <ShieldCheck className="w-3.5 h-3.5 text-accent" />
          Secure 256-bit SSL Encrypted Payment
        </div>
      </div>
    </form>
  );
}
