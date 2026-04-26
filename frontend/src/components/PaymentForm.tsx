import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Phone, DollarSign, CheckCircle, Smartphone, History, Upload, ShieldCheck, Globe } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/env';
import { FileUpload } from '@/components/FileUpload';
import { useMutation } from '@apollo/client/react';
import { SUBMIT_PAYMENT_PROOF } from '@/lib/graphql/mutations';

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
}: PaymentFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'paypack' | 'manual'>('paypack');
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
  const [manualPaymentId, setManualPaymentId] = useState<string | null>(null);

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
    // Allow digits and plus sign
    let value = e.target.value.replace(/[^\d+]/g, ''); 
    
    // Don't auto-prefix with 0 to allow natural typing or pasting of +250...
    setPhoneNumber(value);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Rwandan phone format: 078xxxxxxx or +250788xxxxxx
    const regex = /^(\+250|0)[1-9]\d{8}$/;
    return regex.test(phone.replace(/\s+/g, ''));
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'paypack') {
      if (!phoneNumber) {
        toast.error('Please enter your phone number');
        return;
      }

      if (!validatePhoneNumber(phoneNumber)) {
        toast.error('Invalid phone number format. Use 078xxxxxxx');
        return;
      }
    }

    setIsLoading(true);

    try {
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/api/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('ihub_token')}`,
        },
        body: JSON.stringify({
          amount: Math.floor(amount),
          phoneNumber: paymentMethod === 'paypack' ? phoneNumber : undefined,
          paymentMethod: paymentMethod === 'paypack' ? undefined : 'manual_transfer',
          description,
          courseId: courseId || undefined,
          courseIds: courseIds || undefined,
          subscriptionId: subscriptionId || undefined,
          internshipProgramId: internshipProgramId || undefined,
          internshipIds: internshipIds || undefined,
          selectedDeliveryMode: selectedDeliveryMode || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to initiate payment');
      }

      const data = await response.json();

      if (paymentMethod === 'paypack') {
        setTransactionId(data.transactionId);
        setPaymentStatus('pending');

        toast.success('Payment initiated! Check your phone for a USSD prompt.');
        toast.info(data.instructions);

        // Start polling for payment status after 3 seconds
        setTimeout(() => {
          pollPaymentStatus(data.transactionId);
        }, 3000);
      } else {
        setManualPaymentId(data.transactionId);
        toast.success('Manual payment initiated. Please upload your proof of payment.');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to initiate payment'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizeManual = async () => {
    if (!manualPaymentId || !paymentProofUrl) {
      toast.error('Please upload your payment proof first.');
      return;
    }

    setIsLoading(true);
    try {
      await submitProof({
        variables: {
          paymentId: manualPaymentId,
          proofUrl: paymentProofUrl
        }
      });
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
        headers: {
          Authorization: `Bearer ${localStorage.getItem('ihub_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      const data = await response.json();
      console.log('Payment status check:', data.status);

      const terminalStatuses = ['successful', 'failed', 'cancelled', 'expired'];
      
      if (data.status === 'successful') {
        setPaymentStatus(null);
        toast.success('Payment successful! 🎉');
        onSuccess?.();
      } else if (data.status === 'failed' || data.status === 'cancelled' || data.status === 'expired') {
        setPaymentStatus(null);
        toast.error(`Payment ${data.status}. Please try again.`);
      } else {
        // Still pending or unknown, keep polling
        setPaymentStatus('pending');
        setTimeout(() => {
          pollPaymentStatus(txId);
        }, 4000);
      }
    } catch (error) {
      console.error('Status check error:', error);
      // Keep polling on error (might be transient network issue)
      setTimeout(() => {
        pollPaymentStatus(txId);
      }, 6000);
    }
  }

  // Show status message while payment is pending
  if (transactionId && paymentStatus) {
    return (
      <div className="w-full max-w-sm mx-auto p-6 border rounded-2xl bg-white shadow-xl relative overflow-hidden">
        <div className="relative flex flex-col items-center justify-center mb-6">
          <div className="relative w-14 h-14 bg-[#ffcc00] rounded-2xl flex items-center justify-center shadow-lg mb-4 transform rotate-3 hover:rotate-0 transition-transform duration-500">
            <img 
               src="https://momo.mtn.com/wp-content/uploads/sites/15/2022/07/Group-360.png" 
               alt="MTN" 
               className="w-8 h-8 object-contain rounded"
            />
          </div>
          
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#ffcc00]" />
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Authorization Sent</h3>
            </div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Checking...</p>
          </div>
        </div>

        <div className="relative bg-gray-50/80 border border-gray-100 rounded-xl p-4 text-center space-y-3 backdrop-blur-sm">
          <p className="text-[11px] text-gray-600 leading-normal">
            Enter your PIN on the <strong>MoMo prompt</strong><br/>
            to authorize <strong>{amount.toLocaleString()} RWF</strong>.
          </p>
          
          <div className="py-1.5 px-3 bg-white rounded-lg shadow-xs inline-block border border-gray-100">
             <span className="text-[9px] uppercase font-bold text-gray-300 block mb-0.5">Reference</span>
             <span className="font-mono text-[10px] font-bold text-gray-700">{transactionId.substring(transactionId.length - 8).toUpperCase()}</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setTransactionId(null);
              setPaymentStatus(null);
            }}
            className="w-full border border-gray-100 hover:bg-gray-50 font-bold transition-all h-10 rounded-xl text-xs"
          >
            I've completed payment
          </Button>
          
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest text-center"
          >
            Refresh if prompt didn't appear
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Method Selector */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-muted/30 rounded-2xl border border-border/50">
        <button
          type="button"
          onClick={() => setPaymentMethod('paypack')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all
            ${paymentMethod === 'paypack' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:bg-background/50'}`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          MoMo Pay
        </button>
        <button
          type="button"
          onClick={() => setPaymentMethod('manual')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all
            ${paymentMethod === 'manual' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:bg-background/50'}`}
        >
          <History className="w-3.5 h-3.5" />
          Manual
        </button>
      </div>

      {paymentMethod === 'paypack' ? (
        <form onSubmit={handleInitiatePayment} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Visual Context Bar */}
          <div className="w-full flex items-center justify-between px-3 py-2 bg-background border border-border/50 rounded-xl shadow-inner-sm">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#ffcc00]/10 rounded-md flex items-center justify-center p-1 border border-[#ffcc00]/20">
                  <img 
                    src="https://momo.mtn.com/wp-content/uploads/sites/15/2022/07/Group-360.png" 
                    alt="MTN" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[11px] font-black text-foreground tracking-tight">MTN MoMo</span>
            </div>
            <div className="flex items-center gap-1.5 opacity-60">
                <img src="https://flagcdn.com/w40/rw.png" alt="RW Flag" className="w-3 h-2 object-cover rounded-px grayscale-[0.2]" />
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Verified</span>
            </div>
          </div>

          {/* Primary Input Section */}
          <div className="space-y-3">
            <div className="space-y-1.5 flex flex-col items-center">
                <Label htmlFor="phone" className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.1em] text-center">
                    Mobile Money Number
                </Label>
                <div className="relative group w-full max-w-[200px]">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground/30 group-focus-within:text-[#ffcc00] transition-colors" />
                    </div>
                    <Input
                        id="phone"
                        type="tel"
                        placeholder="078 / 079..."
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        disabled={isLoading}
                        className="pl-9 h-10 bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-accent/40 rounded-xl text-base font-black tracking-widest placeholder:tracking-normal placeholder:font-medium placeholder:text-muted-foreground/20 text-center transition-all shadow-none"
                        maxLength={13}
                    />
                </div>
            </div>

            <Button
                type="submit"
                disabled={isLoading || !phoneNumber}
                className="w-full bg-[#ffcc00] hover:bg-black hover:text-[#ffcc00] text-black font-black h-10 rounded-xl shadow-md transition-all active:scale-[0.98] text-[11px] uppercase tracking-wider border-none"
            >
                {isLoading ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing...</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Pay {amount.toLocaleString()} RWF</span>
                    </div>
                )}
            </Button>
          </div>

          <p className="text-[9px] text-muted-foreground/60 text-center font-medium leading-tight px-4">
            Success is automatic once you confirm the <strong>MoMo prompt</strong> sent to your device.
          </p>
        </form>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-6">
            {/* Unified Manual View */}
            <div className="relative p-6 bg-gradient-to-b from-accent/10 via-accent/5 to-transparent rounded-[2rem] border border-accent/20 overflow-hidden shadow-sm">
                <div className="absolute top-4 right-4 text-accent/40">
                    <ShieldCheck className="w-5 h-5 animate-pulse" />
                </div>
                
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-accent/5 text-accent rounded-full border border-accent/20 text-[9px] font-black uppercase tracking-[0.2em] w-fit shadow-sm mb-2">
                        MANUAL TRANSFER
                    </div>
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] pl-1">BANK / MOMO DETAILS</h3>
                    <div className="space-y-1 pl-1">
                        <p className="text-sm font-black text-foreground tracking-tight uppercase">CODE MANDE LTD</p>
                        <p className="text-[11px] font-medium text-muted-foreground">Equity Bank: <span className="text-foreground font-bold">450123456789</span></p>
                        <p className="text-xl font-black text-[#ffcc00] tracking-tighter">*182*8*1*123456#</p>
                    </div>
                </div>
                
                <div className="mt-6 flex flex-col items-center gap-1 border-t border-dashed border-accent/30 pt-6">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em]">TOTAL AMOUNT</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-foreground tracking-tighter">{amount.toLocaleString()}</span>
                        <span className="text-xs font-black text-muted-foreground uppercase">RWF</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1 px-2">
                  <h4 className="text-[11px] font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    STEP 2: UPLOAD SCREENSHOT
                  </h4>
                  <p className="text-[10px] text-muted-foreground font-medium pl-3.5">Upload your transaction confirmation below.</p>
              </div>
              
              <div className="bg-muted/10 rounded-3xl p-1 border border-border/40 overflow-hidden">
                <FileUpload
                  onUploadComplete={(url) => setPaymentProofUrl(url)}
                  folder="payment-proofs"
                  label="Click to upload screenshot"
                />
              </div>

              {paymentProofUrl && (
                <div className="relative group animate-in zoom-in-95 duration-300">
                  <div className="overflow-hidden rounded-2xl border-2 border-accent/20 shadow-lg aspect-video bg-muted/20">
                    <img src={paymentProofUrl} alt="Proof" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={async () => {
                // For combined view, we need to initiate the payment record first if not already done
                if (!manualPaymentId) {
                  setIsLoading(true);
                  try {
                    const baseUrl = getApiBaseUrl();
                    const response = await fetch(`${baseUrl}/api/payments/initiate`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('ihub_token')}`,
                      },
                      body: JSON.stringify({
                        amount: Math.floor(amount),
                        paymentMethod: 'manual_transfer',
                        description,
                        courseId: courseId || undefined,
                        courseIds: courseIds || undefined,
                        subscriptionId: subscriptionId || undefined,
                        internshipProgramId: internshipProgramId || undefined,
                        internshipIds: internshipIds || undefined,
                        selectedDeliveryMode: selectedDeliveryMode || undefined,
                      }),
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message || 'Failed');
                    
                    // Now submit the proof with the new ID
                    await submitProof({
                      variables: {
                        paymentId: data.transactionId,
                        proofUrl: paymentProofUrl
                      }
                    });
                  } catch (e: any) {
                    toast.error(e.message);
                  } finally {
                    setIsLoading(false);
                  }
                } else {
                  handleFinalizeManual();
                }
              }}
              disabled={isLoading || !paymentProofUrl}
              variant="gold"
              className="w-full h-14 rounded-2xl shadow-premium text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02]"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
              Submit Proof & View Bills
            </Button>
          </div>

          <div className="pt-6 border-t border-dashed border-border/50 flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 px-4 py-2 bg-accent/5 rounded-full border border-accent/20 text-[9px] font-black text-accent uppercase tracking-widest">
              <Globe className="w-3 h-3" />
              Manual verification takes 2-4 hours
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
