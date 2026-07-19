import { useState, useMemo, useEffect } from "react";
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
  RotateCcw,
  MessageSquare,
  Loader2,
  AlertTriangle,
  TicketCheck,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import { usePusher } from "@/hooks/use-pusher";
import { useAuth } from "@/contexts/AuthContext";
import { GET_MY_PAYMENTS, GET_MY_REFUND_REQUESTS } from "@/lib/graphql/queries";
import { REQUEST_REFUND } from "@/lib/graphql/mutations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ViewReceiptDialog, SubmitProofDialog } from "@/components/portal/dialogs";
import { Calendar as UICalendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { format } from "date-fns";


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
  const { user } = useAuth();
  const pusher = usePusher();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [proofPayment, setProofPayment] = useState<any | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [refundPayment, setRefundPayment] = useState<any | null>(null);
  const [refundReason, setRefundReason] = useState("");

  const { data, loading, refetch } = useQuery(GET_MY_PAYMENTS);
  const { data: refundData, refetch: refetchRefunds } = useQuery(GET_MY_REFUND_REQUESTS);
  const [requestRefund, { loading: refundLoading }] = useMutation(REQUEST_REFUND);

  const payments = (data as any)?.myPayments || [];
  const myRefundRequests: any[] = (refundData as any)?.getMyRefundRequests || [];

  // Build a map of paymentId -> refund request for quick lookup
  const refundMap = useMemo(() => {
    const map: Record<string, any> = {};
    for (const r of myRefundRequests) {
      map[r.paymentId] = r;
    }
    return map;
  }, [myRefundRequests]);

  const [viewTicketPayment, setViewTicketPayment] = useState<any | null>(null);
  const [newActivity, setNewActivity] = useState<{ type: string; timestamp: number } | null>(null);

  // Auto-refetch refund history when admin approves/rejects via Pusher
  useEffect(() => {
    if (!pusher || !user) return;

    const channel = pusher.subscribe(`user-${user.id}`);

    const handleNotification = (data: any) => {
      if (data.type === "refund_approved" || data.type === "refund_rejected") {
        // Refund status changed — show activity indicator and refetch
        setNewActivity({ type: data.type, timestamp: Date.now() });
        refetchRefunds();
        refetch();
      }
    };

    channel.bind("notification", handleNotification);

    return () => {
      channel.unbind("notification", handleNotification);
      pusher.unsubscribe(`user-${user.id}`);
    };
  }, [pusher, user, refetchRefunds, refetch]);

  // Auto-clear the new activity indicator after 8 seconds
  useEffect(() => {
    if (!newActivity) return;
    const timer = setTimeout(() => setNewActivity(null), 8000);
    return () => clearTimeout(timer);
  }, [newActivity]);

  const dismissNewActivity = () => setNewActivity(null);

  const handleViewTicket = (payment: any) => {
    setViewTicketPayment(payment);
  };

  const handleClaimRefund = async () => {
    if (!refundPayment || !refundReason.trim()) {
      toast.error("Please describe why you're requesting a refund");
      return;
    }
    try {
      const result = await requestRefund({
        variables: {
          paymentId: refundPayment.id,
          reason: refundReason.trim(),
        },
      });
      if ((result.data as any)?.requestRefund) {
        toast.success("Refund request submitted! An admin will review it shortly.");
        setRefundPayment(null);
        setRefundReason("");
        refetch();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit refund request");
    }
  };

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
                            setRefundPayment={setRefundPayment}
                            setRefundReason={setRefundReason}
                            refundRecord={refundMap[payment.id]}
                            onViewTicket={handleViewTicket}
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

      {/* Refund History Section */}
      {myRefundRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
          onClick={dismissNewActivity}
        >
          <Card className={`border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-500 ${newActivity ? 'ring-2 ring-accent/40 shadow-lg shadow-accent/10' : ''}`}>
            <CardHeader className="border-b border-border/20 pb-4">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <div className="relative">
                  <TicketCheck className="w-5 h-5 text-accent" />
                  {newActivity && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" />
                    </span>
                  )}
                </div>
                Refund Request History
                <Badge variant="outline" className="ml-2 text-[10px] font-black">
                  {myRefundRequests.length} request{myRefundRequests.length !== 1 ? 's' : ''}
                </Badge>
                {newActivity && (
                  <Badge variant="default" className="text-[10px] font-black animate-bounce bg-accent text-accent-foreground">
                    {newActivity.type === 'refund_approved' ? '✓ Updated' : '✗ Updated'}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/20">
                {myRefundRequests.map((ticket: any) => {
                  const statusStyle = {
                    pending: { bg: "bg-amber-500/10", border: "border-l-amber-500", icon: Clock, label: "Pending", color: "text-amber-500" },
                    admin_verified: { bg: "bg-blue-500/10", border: "border-l-blue-500", icon: HelpCircle, label: "Under Review", color: "text-blue-500" },
                    approved: { bg: "bg-green-500/10", border: "border-l-green-500", icon: ThumbsUp, label: "Approved", color: "text-green-500" },
                    rejected: { bg: "bg-red-500/10", border: "border-l-red-500", icon: ThumbsDown, label: "Rejected", color: "text-red-500" },
                    cancelled: { bg: "bg-gray-500/10", border: "border-l-gray-500", icon: XCircle, label: "Cancelled", color: "text-gray-500" },
                  }[ticket.status] || { bg: "", border: "border-l-muted", icon: Clock, label: ticket.status, color: "text-muted-foreground" };
                  const StatusIcon = statusStyle.icon;
                  // Find the matching payment to show the service name
                  const matchedPayment = payments.find((p: any) => p.id === ticket.paymentId);
                  return (
                    <div
                      key={ticket.id}
                      className={`flex items-center gap-4 p-4 hover:bg-accent/5 transition-colors cursor-pointer border-l-4 ${statusStyle.border} ${statusStyle.bg}`}
                      onClick={() => {
                        // Find the payment in the list to open its ticket
                        const payment = payments.find((p: any) => p.id === ticket.paymentId);
                        if (payment) setViewTicketPayment(payment);
                      }}
                    >
                      <div className={`p-2.5 rounded-full shrink-0 ${statusStyle.bg}`}>
                        <StatusIcon className={`w-5 h-5 ${statusStyle.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-bold ${statusStyle.color}`}>
                            {statusStyle.label}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground">
                            {ticket.amount?.toLocaleString()} {ticket.currency}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {matchedPayment?.itemTitle || `Payment #${ticket.paymentId?.slice(-8)}`} — {ticket.reason}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground/60">
                          <span>{ticket.createdAt ? format(new Date(ticket.createdAt), "MMM dd, yyyy") : '—'}</span>
                          {ticket.adminNote && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              Admin responded
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 h-8 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          const payment = payments.find((p: any) => p.id === ticket.paymentId);
                          if (payment) setViewTicketPayment(payment);
                        }}
                      >
                        Details
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* View Refund Ticket Dialog */}
      <Dialog open={!!viewTicketPayment} onOpenChange={(open) => { if (!open) setViewTicketPayment(null); }}>
        <DialogContent className="sm:max-w-[500px]">
          {viewTicketPayment && refundMap[viewTicketPayment.id] && (() => {
            const ticket = refundMap[viewTicketPayment.id];
            const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
              pending: { label: "Pending Review", color: "text-amber-500", icon: Clock },
              admin_verified: { label: "Under Review", color: "text-blue-500", icon: HelpCircle },
              approved: { label: "Approved ✓", color: "text-green-500", icon: ThumbsUp },
              rejected: { label: "Rejected ✗", color: "text-red-500", icon: ThumbsDown },
              cancelled: { label: "Cancelled", color: "text-gray-500", icon: XCircle },
            };
            const statusInfo = statusLabels[ticket.status] || { label: ticket.status, color: "text-muted-foreground", icon: HelpCircle };
            const StatusIcon = statusInfo.icon;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <TicketCheck className="w-5 h-5 text-accent" />
                    Refund Ticket
                  </DialogTitle>
                  <DialogDescription>
                    Details of your refund request for this payment.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-lg border ${ticket.status === 'approved' ? 'bg-green-500/10 border-green-500/30' : ticket.status === 'rejected' ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'} flex items-center gap-3`}>
                    <StatusIcon className={`w-8 h-8 ${statusInfo.color}`} />
                    <div>
                      <p className={`font-bold ${statusInfo.color}`}>{statusInfo.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ticket.status === 'approved' ? 'Your refund has been approved. Money will be sent to your phone.' :
                         ticket.status === 'rejected' ? 'Your refund request was not approved.' :
                         'Your request is being reviewed by an admin.'}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-accent/5 border border-border/50">
                      <span className="text-sm text-muted-foreground">Amount Requested</span>
                      <span className="font-bold">{ticket.amount?.toLocaleString()} {ticket.currency}</span>
                    </div>
                    {ticket.refundableAmountAfterFee > 0 && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                        <span className="text-sm text-muted-foreground">You'll Receive (after 5% fee)</span>
                        <span className="font-bold text-green-600">{ticket.refundableAmountAfterFee?.toLocaleString()} {ticket.currency}</span>
                      </div>
                    )}
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Your Reason</p>
                      <p className="text-sm">{ticket.reason}</p>
                    </div>
                    {ticket.adminNote && (
                      <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                        <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          Admin Response
                        </p>
                        <p className="text-sm">{ticket.adminNote}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Submitted {ticket.createdAt ? format(new Date(ticket.createdAt), "MMM dd, yyyy HH:mm") : '—'}</span>
                      {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
                        <span>Updated {format(new Date(ticket.updatedAt), "MMM dd, yyyy HH:mm")}</span>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setViewTicketPayment(null)}>
                    Close
                  </Button>
                  {ticket.status === 'rejected' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setViewTicketPayment(null);
                        setRefundPayment(viewTicketPayment);
                        setRefundReason("");
                      }}
                    >
                      Request Again
                    </Button>
                  )}
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Claim Refund Dialog - Like Google Forms */}
      <Dialog open={!!refundPayment} onOpenChange={(open) => { if (!open) { setRefundPayment(null); setRefundReason(""); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <RotateCcw className="w-5 h-5 text-destructive" />
              Request a Refund
            </DialogTitle>
            <DialogDescription className="text-sm">
              Please explain why you'd like a refund for this payment. Your request will be
              reviewed by an admin. If approved, the money will be sent back to your phone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Payment Summary */}
            {refundPayment && (
              <div className="p-4 rounded-lg bg-accent/5 border border-border/50 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payment ID</span>
                  <span className="font-mono text-xs">{refundPayment.id.slice(-8)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold">{refundPayment.amount.toLocaleString()} {refundPayment.currency}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{refundPayment.itemTitle || refundPayment.type}</span>
                </div>
              </div>
            )}

            {/* Refund Reason - Like a Google Form */}
            <div className="space-y-2">
              <Label htmlFor="refund-reason" className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                Why are you requesting a refund?
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="refund-reason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Describe your reason for requesting a refund. Include any relevant details that will help us process your request..."
                rows={4}
                className="resize-none"
              />
              <p className="text-[11px] text-muted-foreground">
                Refunds can only be requested within 3 days of payment. A 5% platform fee applies.
              </p>
            </div>

            {/* Warning */}
            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                If your refund is approved, your course access, progress, internship enrollment,
                and any certificates will be revoked. This action cannot be undone.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setRefundPayment(null); setRefundReason(""); }}
              disabled={refundLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClaimRefund}
              disabled={refundLoading || !refundReason.trim()}
            >
              {refundLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              Submit Refund Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </PortalLayout>
  );
}

function PaymentRow({ 
  payment, 
  setSelectedPayment, 
  setProofPayment,
  setRefundPayment,
  setRefundReason,
  refundRecord,
  onViewTicket,
}: { 
  payment: any, 
  setSelectedPayment: (p: any) => void, 
  setProofPayment: (p: any) => void,
  setRefundPayment: (p: any) => void,
  setRefundReason: (r: string) => void,
  refundRecord: any,
  onViewTicket: (p: any) => void,
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
        className={`border-b border-border/10 transition-all hover:bg-accent/5 group cursor-pointer ${expanded ? 'bg-accent/10' : ''}`}
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
            )}                {(payment.status === 'completed' || payment.status === 'paid' || payment.status === 'successful') && (
              <>
                <Button
                  variant="gold"
                  size="sm"
                  className="h-7 text-[9px] font-black uppercase tracking-widest shadow-gold hover:scale-[1.05] transition-all px-2"
                  onClick={() => setSelectedPayment(payment)}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Receipt
                </Button>
                {refundRecord ? (
                  <>
                    {/* Refund already exists — show status badge + View Ticket */}
                    <Badge className={`${{
                      pending: "bg-amber-500/20 text-amber-500 border-amber-500/30",
                      admin_verified: "bg-blue-500/20 text-blue-500 border-blue-500/30",
                      approved: "bg-green-500/20 text-green-500 border-green-500/30",
                      rejected: "bg-red-500/20 text-red-500 border-red-500/30",
                    }[refundRecord.status] || "bg-gray-500/20 text-gray-500"} h-6 text-[9px] font-black uppercase tracking-widest px-2 border`}>
                      {refundRecord.status === 'approved' ? <CheckCircle className="w-2.5 h-2.5 mr-1" /> :
                       refundRecord.status === 'rejected' ? <XCircle className="w-2.5 h-2.5 mr-1" /> :
                       refundRecord.status === 'admin_verified' ? <HelpCircle className="w-2.5 h-2.5 mr-1" /> :
                       <Clock className="w-2.5 h-2.5 mr-1" />}
                      {refundRecord.status === 'pending' ? 'Pending' :
                       refundRecord.status === 'admin_verified' ? 'Verified' :
                       refundRecord.status === 'approved' ? 'Approved' :
                       refundRecord.status === 'rejected' ? 'Rejected' : refundRecord.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[9px] font-black uppercase tracking-widest border-accent/40 text-accent hover:bg-accent/10 hover:text-accent transition-all px-2"
                      onClick={() => onViewTicket(payment)}
                    >
                      <TicketCheck className="w-3 h-3 mr-1" />
                      Ticket
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[9px] font-black uppercase tracking-widest border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all px-2"
                    onClick={() => {
                      setRefundPayment(payment);
                      setRefundReason("");
                    }}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Refund
                  </Button>
                )}
              </>
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
