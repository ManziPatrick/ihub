import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Printer, CheckCircle, Receipt, MapPin, Globe, Mail, Phone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useBranding } from "@/components/BrandingProvider";
import { useAuth } from "@/contexts/AuthContext";

interface Payment {
  id: string;
  itemTitle: string;
  type: string;
  amount: number;
  currency: string;
  date: string;
  status: string;
  paymentMethod: string;
  transactionId: string;
  courses?: Array<{ id: string; title: string; price: number }>;
  internships?: Array<{ id: string; title: string; price: number }>;
}

interface ViewReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
}

export function ViewReceiptDialog({
  open,
  onOpenChange,
  payment
}: ViewReceiptDialogProps) {
  const { branding } = useBranding();
  const { user } = useAuth();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!payment) return null;

  const handleDownload = () => {
    const content = document.getElementById('receipt-content');
    if (!content) {
      toast.error("Could not find receipt content");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Please allow popups to download the receipt");
      return;
    }

    // Get all styles from the current document to preserve look
    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('');
        } catch (e) {
          return '';
        }
      })
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt - ${payment.itemTitle}</title>
          <style>
            ${styles}
            @page { size: auto; margin: 10mm; }
            body { background: white !important; padding: 20px; }
            #receipt-content { display: block !important; }
            .print\\:hidden { display: none !important; }
          </style>
        </head>
        <body>
          <div id="receipt-content">
            ${content.innerHTML}
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-zinc-950">
        <DialogHeader className="px-6 py-4 border-b border-border/50 bg-muted/20 shrink-0 print:hidden">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ShieldCheck className="w-5 h-5 text-accent" />
            Official Payment Receipt
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 custom-scrollbar">
          <div className="p-4 md:p-8 print:p-0" id="receipt-content" ref={receiptRef}>
            {/* Design for the receipt */}
            <div className="border-[12px] border-accent/10 p-8 md:p-12 relative overflow-hidden bg-white dark:bg-zinc-950 shadow-2xl">
              {/* Background Watermark */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] rotate-12 pointer-events-none select-none">
                <Award className="w-[500px] h-[500px] text-accent" />
              </div>

              {/* Header Section */}
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-accent flex items-center justify-center rounded-2xl shadow-lg shadow-accent/20">
                    <span className="text-4xl font-bold text-white leading-none">≪</span>
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-3xl font-heading font-black text-foreground tracking-tighter uppercase leading-none">
                      {branding.siteName}
                    </h1>
                    <p className="text-xs text-accent font-bold tracking-[0.2em] uppercase mt-1">
                      Academy of Innovation
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end text-right">
                  <div className="bg-green-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-green-500/20 mb-2">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Paid & Verified
                  </div>
                  <p className="text-[11px] font-mono text-muted-foreground bg-muted/50 px-3 py-1 rounded-md border border-border/50">
                    Ref: {payment.id || payment.transactionId}
                  </p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="relative z-10 grid md:grid-cols-2 gap-12 mb-16">
                <div className="space-y-8">
                  <div>
                    <h4 className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-4 border-b border-accent/20 pb-1 w-fit">Billed To</h4>
                    <div className="space-y-1">
                      <h3 className="font-heading font-bold text-xl text-foreground">{(user as any)?.username || 'Valued Student'}</h3>
                      <p className="text-sm text-muted-foreground font-medium">{user?.email || 'student@bootskills.com'}</p>
                      <p className="text-sm text-muted-foreground">Kigali, Rwanda</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-4 border-b border-accent/20 pb-1 w-fit">Payment Details</h4>
                    <div className="grid grid-cols-2 gap-y-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Method</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">{payment.paymentMethod || 'Mobile Money'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Date</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">{new Date(payment.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Status</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <p className="text-sm font-black text-green-600 dark:text-green-400 uppercase tracking-tighter">Completed</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-3xl border border-border/50 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
                    <Receipt className="w-20 h-20 text-accent" />
                  </div>

                  <h4 className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-6">Service Description</h4>
                  <div className="space-y-6">
                    {/* Item List */}
                    <div className="space-y-4">
                      {payment.courses && payment.courses.length > 0 ? (
                        payment.courses.map((course: any) => (
                          <div key={course.id} className="flex justify-between items-start gap-4">
                            <div className="space-y-0.5">
                              <h5 className="font-heading font-bold text-sm text-foreground leading-tight">
                                {course.title}
                              </h5>
                              <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest">Course Enrollment</p>
                            </div>
                            <span className="text-xs font-bold text-foreground">
                              {course.price?.toLocaleString() || '---'} RWF
                            </span>
                          </div>
                        ))
                      ) : null}

                      {payment.internships && payment.internships.length > 0 ? (
                        payment.internships.map((internship: any) => (
                          <div key={internship.id} className="flex justify-between items-start gap-4">
                            <div className="space-y-0.5">
                              <h5 className="font-heading font-bold text-sm text-foreground leading-tight">
                                {internship.title}
                              </h5>
                              <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest">Internship Fee</p>
                            </div>
                            <span className="text-xs font-bold text-foreground">
                              {internship.price?.toLocaleString() || '---'} RWF
                            </span>
                          </div>
                        ))
                      ) : null}

                      {(!payment.courses || payment.courses.length === 0) && (!payment.internships || payment.internships.length === 0) && (
                        <div className="space-y-1">
                          <h5 className="font-heading font-bold text-lg text-foreground leading-tight">
                            {payment.itemTitle}
                          </h5>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{payment.type}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-6 border-t border-border/50">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Paid</span>
                        <div className="text-right">
                          <div className="text-3xl font-black text-accent tracking-tighter">
                            {payment.amount.toLocaleString()} <span className="text-sm font-bold uppercase ml-1">RWF</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support/Footer Section */}
              <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t-2 border-dashed border-border/50">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-accent">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Location</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">Kigali Heights, Rwanda</p>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-accent">
                    <Globe className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Website</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">bootskills.com</p>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-accent">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Support</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">academy@bootskills.com</p>
                </div>
                <div className="flex flex-col gap-1 text-right md:text-left">
                  <div className="flex items-center gap-2 text-accent justify-end md:justify-start">
                    <Phone className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Contact</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">+250 790 706 170</p>
                </div>
              </div>

              {/* Official Stamp Overlay */}
              <div className="absolute bottom-16 right-16 opacity-[0.08] pointer-events-none select-none rotate-[-15deg]">
                <div className="border-[6px] border-accent rounded-full p-4 flex flex-col items-center justify-center text-accent">
                  <span className="font-heading font-black text-2xl tracking-widest uppercase">OFFICIAL</span>
                  <span className="text-sm font-bold uppercase tracking-widest">CERTIFIED</span>
                </div>
              </div>
            </div>

            <p className="text-center text-[10px] text-muted-foreground mt-6 italic opacity-60">
              This is a computer generated receipt and does not require a physical signature.
            </p>
          </div>
        </ScrollArea>

        <div className="p-6 border-t border-border bg-muted/20 flex gap-3 shrink-0 print:hidden">
          <Button variant="outline" className="flex-1 h-12 gap-2 font-bold" onClick={handleDownload}>
            <Printer className="w-4 h-4" />
            Print Receipt
          </Button>
          <Button variant="gold" className="flex-1 h-12 gap-2 shadow-lg shadow-gold/20 font-bold" onClick={handleDownload}>
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>
      </DialogContent>

      {/* Hidden layout for print styling */}
      <style>{`
        @media print {
          @page { size: auto; margin: 0mm; }
          
          /* Hide everything globally */
          body * {
            visibility: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Show only the portal components */
          #receipt-content,
          #receipt-content * {
            visibility: visible !important;
          }

          /* Reset absolute positioning for the receipt */
          #receipt-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            padding: 2.5cm !important;
            margin: 0 !important;
            background: white !important;
            visibility: visible !important;
            display: block !important;
          }

          /* Fix parent constraints that might hide content */
          [role="dialog"],
          [data-radix-scroll-area-viewport],
          .custom-scrollbar {
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            display: block !important;
            visibility: visible !important;
            position: static !important;
          }

          .print\\:hidden { 
            display: none !important; 
            visibility: hidden !important;
          }
          
          /* Force white background for printers */
          body { 
            background: white !important; 
            color: black !important;
          }
        }
      `}</style>
    </Dialog>
  );
}

// Minimal icon for Award
function Award({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  )
}
