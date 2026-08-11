import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_TESTIMONIALS, GET_USERS } from "@/lib/graphql/queries";
import { ADMIN_SUBMIT_TESTIMONIAL, REVIEW_TESTIMONIAL, DELETE_TESTIMONIAL } from "@/lib/graphql/mutations";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircleHeart,
  Plus,
  Trash2,
  ShieldCheck,
  Search,
  Star,
  Quote,
  BadgeCheck,
  Send,
} from "lucide-react";

const statusMeta: Record<string, { label: string; className: string; icon: any }> = {
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Clock },
  approved: { label: "Approved", className: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
};

const tabs = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function AdminTestimonials() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  // Submit-on-behalf form state
  const [studentId, setStudentId] = useState("");
  const [quote, setQuote] = useState("");
  const [authorRole, setAuthorRole] = useState("");
  const [authorCompany, setAuthorCompany] = useState("");
  const [rating, setRating] = useState(5);
  const [studentSearch, setStudentSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data, loading, refetch } = useQuery(GET_TESTIMONIALS, {
    variables: { page, limit: 12, status: status || null },
    fetchPolicy: "network-only",
  });
  const { data: studentsData, loading: studentsLoading } = useQuery(GET_USERS, {
    variables: { page: 1, limit: 200, role: "student" },
    fetchPolicy: "cache-first",
  });

  const [adminSubmit] = useMutation(ADMIN_SUBMIT_TESTIMONIAL);
  const [review] = useMutation(REVIEW_TESTIMONIAL);
  const [remove] = useMutation(DELETE_TESTIMONIAL);

  const items = ((data as any)?.testimonials?.items || []) as any[];
  const pagination = useMemo(() => ((data as any)?.testimonials?.pagination || {}) as any, [data]);
  const students = useMemo(() => ((studentsData as any)?.users?.items || []) as any[], [studentsData]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s: any) =>
        (s.fullName || "").toLowerCase().includes(q) ||
        (s.username || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  const handleSubmitForStudent = async () => {
    if (!studentId) {
      toast.error("Please select a student first");
      return;
    }
    if (!quote.trim()) {
      toast.error("Please write a quote for the student");
      return;
    }
    setSubmitting(true);
    try {
      await adminSubmit({
        variables: {
          userId: studentId,
          quote: quote.trim(),
          authorRole: authorRole.trim() || null,
          authorCompany: authorCompany.trim() || null,
          rating,
        },
      });
      toast.success("Testimonial submitted for review");
      setDialogOpen(false);
      setStudentId("");
      setQuote("");
      setAuthorRole("");
      setAuthorCompany("");
      setRating(5);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit testimonial");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await review({ variables: { id, status: "approved" } });
      toast.success("Testimonial approved — now live on the public site");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve");
    }
  };

  const handleReject = async () => {
    if (!rejectOpen) return;
    try {
      await review({ variables: { id: rejectOpen, status: "rejected", note: rejectNote || null } });
      toast.success("Testimonial rejected");
      setRejectOpen(null);
      setRejectNote("");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove({ variables: { id } });
      toast.success("Testimonial deleted");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= (pagination.totalPages || 1)) setPage(newPage);
  }, [pagination]);

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
              Testimonials
            </h1>
            <p className="text-muted-foreground mt-1">
              {isSuperAdmin
                ? "Approve or reject success stories — approved ones appear on the public site."
                : "Submit success stories on behalf of students. Only a super admin can approve them."}
            </p>
          </div>
          <Button variant="gold" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Submit for a Student
          </Button>
        </motion.div>

        {/* Status tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatus(tab.key);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === tab.key
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "bg-background/50 border border-border/50 text-muted-foreground hover:text-accent hover:border-accent/30"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-3"
        >
          {loading && items.length === 0 ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 bg-muted/40 animate-pulse rounded-xl border border-border/30" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-12 text-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <MessageCircleHeart className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <h3 className="font-heading font-semibold text-card-foreground mb-1">No testimonials</h3>
                <p className="text-sm text-muted-foreground">
                  {status ? `No ${status} testimonials yet.` : "No testimonials have been submitted yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            items.map((t: any) => {
              const meta = statusMeta[t.status] || statusMeta.pending;
              const Icon = meta.icon;
              return (
                <Card key={t.id} className="border-border/50 hover:border-accent/30 transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/60 to-accent/30 flex items-center justify-center text-foreground font-heading font-bold text-sm shrink-0">
                            {t.authorAvatar ? (
                              <img src={t.authorAvatar} alt={t.authorName} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              (t.authorName || "S").charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-card-foreground text-sm truncate flex items-center gap-1.5">
                              {t.authorName || "Unknown student"}
                              {t.status === "approved" && <BadgeCheck className="w-4 h-4 text-accent" />}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {[t.authorRole, t.authorCompany].filter(Boolean).join(" · ") || "Student"}
                              {t.submittedBy && ` · submitted by ${t.submittedBy.fullName || t.submittedBy.username || "admin"}`}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-card-foreground/90 leading-relaxed italic">
                          "{t.quote}"
                        </p>

                        <div className="flex items-center gap-1 mt-3">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i <= (t.rating || 5) ? "text-amber-400 fill-amber-400" : "text-foreground/15"}`}
                            />
                          ))}
                          <span className="text-[11px] text-muted-foreground ml-2">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {t.reviewNote && (
                          <p className="text-xs text-red-500/80 mt-2 bg-red-500/5 border border-red-500/10 rounded-md px-3 py-2">
                            Rejection note: {t.reviewNote}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                        <Badge variant="outline" className={`text-[11px] py-1 h-6 ${meta.className}`}>
                          <Icon className="w-3.5 h-3.5 mr-1" />
                          {meta.label}
                        </Badge>

                        {isSuperAdmin && (
                          <div className="flex items-center gap-2">
                            {t.status !== "approved" && (
                              <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleApprove(t.id)}>
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                Approve
                              </Button>
                            )}
                            {t.status !== "rejected" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10"
                                onClick={() => setRejectOpen(t.id)}
                              >
                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                Reject
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-red-500"
                              onClick={() => handleDelete(t.id)}
                              aria-label="Delete testimonial"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}

          {items.length > 0 && (
            <div className="pt-2">
              <PaginationBar
                currentPage={page}
                totalPages={pagination.totalPages || 1}
                totalCount={pagination.totalCount}
                onPageChange={handlePageChange}
                hasPreviousPage={pagination.hasPreviousPage}
                hasNextPage={pagination.hasNextPage}
              />
            </div>
          )}
        </motion.div>
      </div>

      {/* Submit-on-behalf dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-accent" />
              Submit a Testimonial for a Student
            </DialogTitle>
            <DialogDescription>
              Pick a student and write their success story. It will be reviewed by a super admin before going live.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-card-foreground mb-2 block">Student</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search students by name, username or email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {studentsLoading ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">Loading students...</div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">No students found</div>
                  ) : (
                    filteredStudents.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.fullName || s.username} {s.email ? `(${s.email})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-card-foreground mb-2 block">Success story</label>
              <Textarea
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="e.g. This student completed the Full-Stack program and immediately landed a job..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-card-foreground mb-2 block">Role (optional)</label>
                <Input value={authorRole} onChange={(e) => setAuthorRole(e.target.value)} placeholder="e.g. Developer" />
              </div>
              <div>
                <label className="text-sm font-medium text-card-foreground mb-2 block">Company / School (optional)</label>
                <Input value={authorCompany} onChange={(e) => setAuthorCompany(e.target.value)} placeholder="e.g. TechCorp" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-card-foreground mb-2 block">Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} type="button" onClick={() => setRating(i)} className="p-1">
                    <Star className={`w-5 h-5 ${i <= rating ? "text-amber-400 fill-amber-400" : "text-foreground/20"}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleSubmitForStudent} disabled={submitting}>
              <Send className="w-4 h-4 mr-2" />
              {submitting ? "Submitting..." : "Submit for Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectOpen} onOpenChange={(o) => { if (!o) setRejectOpen(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Reject Testimonial
            </DialogTitle>
            <DialogDescription>
              Add a note for the student (optional). They'll see it on their submissions page.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="e.g. Please make it more specific about the outcome..."
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(null)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleReject}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
