import { useQuery } from "@apollo/client/react";
import { GET_MY_INTERNSHIP_APPLICATIONS } from "@/lib/graphql/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  CreditCard,
  ShieldCheck,
  Star,
  PartyPopper
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { InternshipPaymentDialog } from "./InternshipPaymentDialog";

interface MyApplicationsProps {
  onGoToDashboard?: () => void;
}

export function MyApplications({ onGoToDashboard }: MyApplicationsProps) {
  const { data, loading, refetch } = useQuery(GET_MY_INTERNSHIP_APPLICATIONS);
  const [payingFor, setPayingFor] = useState<any>(null);

  const applications = (data as any)?.myInternshipApplications || [];

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const ts = Number(dateString);
    const date = isNaN(ts) ? new Date(dateString) : new Date(ts);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Under Review</Badge>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
    </div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border-border/50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
        <CardHeader>
          <CardTitle className="text-xl font-heading flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent" />
            My Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                You haven't applied to any programs. Browse the "Available Tracks" tab to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app: any) => (
                <div
                  key={app.id}
                  className="p-6 rounded-2xl border border-border/50 bg-muted/5 hover:bg-muted/10 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                        {getStatusIcon(app.status)}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1 text-foreground">
                          {app.internshipProgram.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                          <Calendar className="w-3.5 h-3.5" />
                          Applied on {formatDate(app.createdAt)}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(app.status)}
                  </div>

                  {app.status === 'approved' && (
                    <div className="mt-4 p-5 bg-green-500/5 border border-green-500/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-bottom-2 duration-500">
                      <div className="space-y-1.5">
                        <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2 font-bold">
                          <PartyPopper className="w-4 h-4" />
                          Congratulations! Your application has been approved.
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed italic">
                          {app.payment?.status === 'paid'
                            ? "Payment confirmed. Your slot is secured and you'll be assigned to a team soon."
                            : (app.payment?.status === 'pending' && app.payment?.paymentProofUrl)
                            ? "Your payment proof is being verified by our finance team. You'll be notified soon."
                            : `Secure your spot by paying the enrollment fee of ${(app.internshipProgram.price || 0).toLocaleString()} ${app.internshipProgram.currency || 'RWF'}`}
                        </p>
                      </div>

                      {/* No payment record yet or unpaid — show Secure My Spot */}
                      {(!app.payment || (app.payment.status !== 'paid' && !app.payment.paymentProofUrl)) && (
                        <Button
                          variant="gold"
                          size="sm"
                          className="gap-2 shadow-premium font-bold h-11 px-6 rounded-xl hover:-translate-y-0.5 transition-all"
                          onClick={() => setPayingFor(app)}
                          disabled={!app.payment?.id}
                        >
                          <CreditCard className="w-4 h-4" />
                          {!app.payment?.id ? 'Preparing Payment...' : 'Secure My Spot'}
                        </Button>
                      )}

                      {/* Paid — enrolled CTA */}
                      {app.payment?.status === 'paid' && (
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 gap-2 h-9 px-4 rounded-full font-bold">
                            <ShieldCheck className="w-4 h-4" />
                            Officially Enrolled
                          </Badge>
                          {onGoToDashboard && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 h-9 px-4 rounded-xl font-bold border-accent/30 text-accent hover:bg-accent/10"
                              onClick={onGoToDashboard}
                            >
                              <Star className="w-3.5 h-3.5" />
                              View My Opportunity
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Proof submitted — pending admin verification */}
                      {app.payment?.status === 'pending' && app.payment?.paymentProofUrl && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-2 h-9 px-4 rounded-full font-bold">
                          <Clock className="w-4 h-4" />
                          Verification Pending
                        </Badge>
                      )}
                    </div>
                  )}

                  {app.status === 'rejected' && app.rejectionReason && (
                    <div className="mt-4 p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
                      <p className="text-[10px] uppercase font-black text-destructive mb-2 tracking-widest text-center md:text-left">Feedback Detail</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{app.rejectionReason}</p>
                    </div>
                  )}

                  {app.status === 'pending' && (
                    <div className="mt-4 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-2 font-medium">
                        <Clock className="w-4 h-4" />
                        Application sequence initiated. Expected feedback: 3-5 business days.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Local Payment Dialog (MoMo / Manual) - only open when we have a real payment ID */}
      {payingFor && payingFor.payment?.id && (
        <InternshipPaymentDialog
          open={!!payingFor}
          onOpenChange={(open) => {
            if (!open) {
              setPayingFor(null);
              refetch();
            }
          }}
          paymentId={payingFor.payment.id}
          internshipProgramId={payingFor.internshipProgram.id}
          programTitle={payingFor.internshipProgram.title}
          amount={payingFor.internshipProgram.price}
          currency={payingFor.internshipProgram.currency}
        />
      )}
    </div>
  );
}
