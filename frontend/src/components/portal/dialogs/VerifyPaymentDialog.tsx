import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useMutation } from "@apollo/client/react";
import { APPROVE_PAYMENT, REJECT_PAYMENT } from "@/lib/graphql/mutations";
import { GET_PAYMENTS, GET_ADMIN_DASHBOARD_DATA } from "@/lib/graphql/queries";
import { CheckCircle, XCircle, ExternalLink, Eye } from "lucide-react";

export function VerifyPaymentDialog({ open, onOpenChange, payment }: any) {
    const [adminNotes, setAdminNotes] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const [approveMutation] = useMutation(APPROVE_PAYMENT, {
        refetchQueries: [{ query: GET_PAYMENTS }, { query: GET_ADMIN_DASHBOARD_DATA }]
    });

    const [rejectMutation] = useMutation(REJECT_PAYMENT, {
        refetchQueries: [{ query: GET_PAYMENTS }, { query: GET_ADMIN_DASHBOARD_DATA }]
    });

    const handleApprove = async () => {
        setIsProcessing(true);
        try {
            await approveMutation({
                variables: {
                    paymentId: payment.id,
                    adminNotes
                }
            });
            toast.success("Payment approved successfully!");
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to approve payment");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!adminNotes.trim()) {
            toast.error("Please provide a reason for rejection in notes");
            return;
        }

        setIsProcessing(true);
        try {
            await rejectMutation({
                variables: {
                    paymentId: payment.id,
                    adminNotes
                }
            });
            toast.success("Payment rejected");
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to reject payment");
        } finally {
            setIsProcessing(false);
        }
    };

    if (!payment) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Verify Payment Proof</DialogTitle>
                </DialogHeader>

                <div className="grid md:grid-cols-2 gap-6 py-4">
                    <div className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-xl border border-border/50 space-y-2">
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Transaction Details</p>
                            <h3 className="font-bold">{payment.itemTitle}</h3>
                            <p className="text-sm">Student: <span className="font-semibold">{payment.studentName}</span></p>
                            <p className="text-sm">Amount: <span className="text-accent font-bold">{payment.amount.toLocaleString()} {payment.currency}</span></p>
                            <p className="text-sm">Method: <span className="font-medium">{payment.method}</span></p>
                            <p className="text-sm">Date: <span className="text-muted-foreground">{new Date(payment.date).toLocaleString()}</span></p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Admin Notes / Feedback</p>
                            <Textarea
                                placeholder="Enter approval notes or rejection reason..."
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="h-32 resize-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Proof of Payment</p>
                        {payment.proofOfPaymentUrl ? (
                            <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-border/50 bg-black/5 flex items-center justify-center group">
                                {payment.proofOfPaymentUrl.toLowerCase().endsWith('.pdf') ? (
                                    <div className="text-center p-6">
                                        <ExternalLink className="w-12 h-12 text-accent mx-auto mb-4" />
                                        <p className="text-sm font-medium">PDF Document</p>
                                        <Button variant="outline" size="sm" className="mt-4" asChild>
                                            <a href={payment.proofOfPaymentUrl} target="_blank" rel="noopener noreferrer">Open Document</a>
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <img src={payment.proofOfPaymentUrl} alt="Proof" className="w-full h-full object-contain" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button variant="secondary" size="sm" asChild>
                                                <a href={payment.proofOfPaymentUrl} target="_blank" rel="noopener noreferrer">
                                                    <Eye className="w-4 h-4 mr-2" /> View Full
                                                </a>
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="aspect-[3/4] rounded-xl border border-dashed border-border flex flex-col items-center justify-center p-6 text-center text-muted-foreground bg-muted/10">
                                <XCircle className="w-10 h-10 mb-2 opacity-20" />
                                <p className="text-sm">No proof uploaded yet</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-border/50">
                    <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={handleReject}
                        disabled={isProcessing}
                    >
                        <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                    <Button
                        variant="gold"
                        className="flex-1"
                        onClick={handleApprove}
                        disabled={isProcessing || !payment.proofOfPaymentUrl}
                    >
                        <CheckCircle className="w-4 h-4 mr-2" /> Approve
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
