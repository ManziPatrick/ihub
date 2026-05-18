import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  Receipt,
  Search,
  Upload,
} from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { GET_MY_PAYMENTS } from "@/lib/graphql/queries";
import { Input } from "@/components/ui/input";
import { ViewReceiptDialog, SubmitProofDialog } from "@/components/portal/dialogs";
import { Calendar as UICalendar } from "@/components/ui/calendar";


const statusColors: Record<string, string> = {
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  pending: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusIcons: Record<string, React.ElementType> = {
  completed: CheckCircle,
  pending: Clock,
  failed: XCircle,
};

export default function StudentPayments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [proofPayment, setProofPayment] = useState<any | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());

  const { data, loading } = useQuery(GET_MY_PAYMENTS);

  const payments = (data as any)?.myPayments || [];

  const filteredPayments = payments.filter((payment: any) =>
    payment.itemTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visiblePayments = showAll ? filteredPayments : filteredPayments.slice(0, 5);

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
              Billing & Payments
            </h1>
            <p className="text-muted-foreground mt-1">
              View your transaction history and download receipts
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48 bg-background/50"
              />
            </div>
          </div>
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Payment History - Left Column (8 units) */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-border/20 pb-4">
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-accent" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/20">
                        <th className="text-left p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Service</th>
                        <th className="text-left p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Type</th>
                        <th className="text-right p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Amount</th>
                        <th className="text-center p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Date</th>
                        <th className="text-center p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Status</th>
                        <th className="text-right p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-muted-foreground">
                            <div className="animate-pulse space-y-4">
                              <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                            </div>
                          </td>
                        </tr>
                      ) : filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-muted-foreground">
                            No transactions found.
                          </td>
                        </tr>
                      ) : (
                        visiblePayments.map((payment: any) => (
                          <PaymentRow 
                            key={payment.id} 
                            payment={payment} 
                            setSelectedPayment={setSelectedPayment}
                            setProofPayment={setProofPayment}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {filteredPayments.length > 5 && (
                  <div className="p-4 border-t border-border/20 text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-[10px] font-black text-accent hover:text-accent/80 transition-colors uppercase tracking-widest"
                      onClick={() => setShowAll(!showAll)}
                    >
                      {showAll ? 'See Less' : `See All Transactions (${filteredPayments.length})`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right Column (4 units) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Calendar Card */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-border/20 pb-2">
                <CardTitle className="text-sm font-heading flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent" />
                  Payment Calendar
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex justify-center">
                <UICalendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-xl border border-border/30 bg-background/30 shadow-inner"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <ViewReceiptDialog
        open={!!selectedPayment}
        onOpenChange={(open) => !open && setSelectedPayment(null)}
        payment={selectedPayment}
      />
      <SubmitProofDialog
        open={!!proofPayment}
        onOpenChange={(open) => !open && setProofPayment(null)}
        payment={proofPayment}
      />

    </PortalLayout>
  );
}

function PaymentRow({ 
  payment, 
  setSelectedPayment, 
  setProofPayment 
}: { 
  payment: any, 
  setSelectedPayment: (p: any) => void, 
  setProofPayment: (p: any) => void 
}) {
  const [expanded, setExpanded] = useState(false);
  const StatusIcon = statusIcons[payment.status] || Clock;
  
  const allItems = [...(payment.courses || []), ...(payment.internships || [])];

  // Compute a smart display title from actual item names (showing all items)
  const displayTitle = allItems.length > 0
    ? allItems.map((item: any) => item.title).join(", ")
    : payment.itemTitle;

  return (
    <>
      <tr 
        className={`border-b border-border/10 transition-all group cursor-pointer ${expanded ? 'bg-accent/5' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="p-3">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              className="text-muted-foreground group-hover:text-foreground dark:group-hover:text-white transition-colors"
            >
              <Search className="w-3 h-3 rotate-90" />
            </motion.div>
            <div>
              <p className="text-xs font-bold group-hover:text-foreground dark:group-hover:text-white transition-colors flex items-center gap-1.5 flex-wrap leading-tight">
                {displayTitle}
              </p>
              <p className="text-[9px] text-muted-foreground group-hover:text-foreground dark:group-hover:text-white/60 font-mono mt-0.5 transition-colors">ID: {payment.id}</p>
            </div>
          </div>
        </td>
        <td className="p-3">
          <Badge variant="outline" className="text-[9px] font-black border-border/30 uppercase tracking-tighter group-hover:border-white/30 group-hover:text-foreground dark:group-hover:text-white transition-colors h-5 px-1.5">
            {payment.type}
          </Badge>
        </td>
        <td className="p-3 text-right">
          <span className="text-xs font-black group-hover:text-foreground dark:group-hover:text-white transition-colors">
            {payment.amount.toLocaleString()} <span className="text-[9px] text-accent font-bold">{payment.currency}</span>
          </span>
        </td>
        <td className="p-3 text-center">
          <div className="flex flex-col items-center group-hover:text-foreground dark:group-hover:text-white transition-colors leading-tight">
            <span className="text-[11px] font-bold">{new Date(payment.date).toLocaleDateString()}</span>
            <span className="text-[9px] text-muted-foreground group-hover:text-foreground dark:group-hover:text-white/60 transition-colors uppercase tracking-widest font-medium">{new Date(payment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </td>
        <td className="p-3 text-center">
          <Badge className={`${statusColors[payment.status]} flex items-center gap-1 mx-auto w-fit px-1.5 h-5 group-hover:bg-foreground/20 dark:group-hover:bg-white/20 group-hover:text-foreground dark:group-hover:text-white group-hover:border-white/30 transition-colors`}>
            <StatusIcon className="w-2.5 h-2.5" />
            <span className="capitalize text-[9px] font-black tracking-widest">{payment.status}</span>
          </Badge>
        </td>
        <td className="p-3 text-right">
          <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {payment.status === 'pending' && (
              <Button
                variant="gold"
                size="sm"
                className="h-7 text-[9px] font-black uppercase tracking-widest shadow-gold hover:scale-[1.05] transition-all px-2"
                onClick={() => setProofPayment(payment)}
              >
                <Upload className="w-3 h-3 mr-1" />
                Proof
              </Button>
            )}
            {(payment.status === 'completed' || payment.status === 'paid' || payment.status === 'successful') && (
              <Button
                variant="gold"
                size="sm"
                className="h-7 text-[9px] font-black uppercase tracking-widest shadow-gold hover:scale-[1.05] transition-all px-2"
                onClick={() => setSelectedPayment(payment)}
              >
                <Download className="w-3 h-3 mr-1" />
                Receipt
              </Button>
            )}
          </div>
        </td>
      </tr>
      
      {/* Expanded Details Row */}
      <AnimatePresence>
        {expanded && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-accent/5 overflow-hidden"
          >
            <td colSpan={6} className="p-0">
              <div className="p-6 space-y-4 border-l-4 border-accent ml-4 mb-4 mt-2 bg-muted/30 rounded-r-xl">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
                    <Receipt className="w-3.5 h-3.5" />
                    Itemized Breakdown
                  </h4>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    {allItems.length > 0 ? allItems.length : 1} {allItems.length === 1 || allItems.length === 0 ? 'Item' : 'Items'}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {allItems.length > 0 ? allItems.map((item: any, idx: number) => (
                    <div key={item.id || idx} className="flex justify-between items-center p-3 rounded-lg bg-background/50 border border-border/50 group/item hover:border-accent/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center text-accent font-bold text-[10px]">
                          {idx + 1}
                        </div>
                        <span className="text-sm font-bold text-foreground group-hover/item:text-accent transition-colors">
                          {item.title}
                        </span>
                      </div>
                      <span className="font-mono text-sm font-bold">
                        {item.price != null ? item.price.toLocaleString() : (payment.amount / allItems.length).toLocaleString()} {payment.currency}
                      </span>
                    </div>
                  )) : payment.type === 'Bulk Enrollment' || payment.itemTitle.toLowerCase().includes('cart checkout') ? (
                    /* Legacy bulk payment — items being restored */
                    <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
                      <Receipt className="w-6 h-6 text-accent/50" />
                      <p className="text-xs font-bold text-muted-foreground">Item details are being restored for this purchase.</p>
                      <p className="text-[10px] text-muted-foreground/60">Refresh the page in a moment to see the full breakdown.</p>
                    </div>
                  ) : (
                    /* Fallback for true single-item payments */
                    <div className="flex justify-between items-center p-3 rounded-lg bg-background/50 border border-border/50 hover:border-accent/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center text-accent font-bold text-[10px]">1</div>
                        <span className="text-sm font-bold text-foreground">{payment.itemTitle}</span>
                      </div>
                      <span className="font-mono text-sm font-bold">{payment.amount.toLocaleString()} {payment.currency}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border/50 flex justify-between items-center px-2">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Transaction</p>
                    <p className="text-sm font-black text-accent">{payment.status === 'completed' ? 'Paid Successfully' : 'Outstanding Balance'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-foreground tracking-tighter">
                      {payment.amount.toLocaleString()} <span className="text-sm text-accent">{payment.currency}</span>
                    </p>
                  </div>
                </div>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}
