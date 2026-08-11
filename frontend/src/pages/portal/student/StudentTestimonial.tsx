import { useState } from "react";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_MY_TESTIMONIALS } from "@/lib/graphql/queries";
import { SUBMIT_TESTIMONIAL } from "@/lib/graphql/mutations";
import { toast } from "sonner";
import { Quote, Star, Send, Clock, CheckCircle2, XCircle, MessageCircleHeart, Sparkles } from "lucide-react";

const statusMeta: Record<string, { label: string; className: string; icon: any }> = {
  pending: { label: "Pending review", className: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Clock },
  approved: { label: "Live on site", className: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle2 },
  rejected: { label: "Not approved", className: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
};

function RatingPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="p-1 transition-transform hover:scale-125"
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
        >
          <Star
            className={`w-6 h-6 transition-colors ${i <= (hover || value) ? "text-amber-400 fill-amber-400" : "text-foreground/20"
              }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function StudentTestimonial() {
  const { user } = useAuth();
  const [quote, setQuote] = useState("");
  const [authorRole, setAuthorRole] = useState("");
  const [authorCompany, setAuthorCompany] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  // Load this student's own submissions
  const { data, refetch } = useQuery(GET_MY_TESTIMONIALS, {
    fetchPolicy: "network-only",
  });
  const [submitTestimonial] = useMutation(SUBMIT_TESTIMONIAL);

  const mySubmissions = ((data as any)?.myTestimonials || []).filter((t: any) => t.author?.id === user?.id);
  const myPending = mySubmissions.filter((t: any) => t.status === "pending");

  const handleSubmit = async () => {
    if (!quote.trim()) {
      toast.error("Please write your success story first");
      return;
    }
    if (quote.trim().length < 20) {
      toast.error("Your story should be a bit longer (at least 20 characters)");
      return;
    }
    setSubmitting(true);
    try {
      await submitTestimonial({
        variables: {
          quote: quote.trim(),
          authorRole: authorRole.trim() || null,
          authorCompany: authorCompany.trim() || null,
          rating,
        },
      });
      toast.success("Story submitted! It will go live after a super admin approves it.");
      setQuote("");
      setAuthorRole("");
      setAuthorCompany("");
      setRating(5);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit your story");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmitMore = myPending.length < 3;

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
            Share Your Success Story
          </h1>
          <p className="text-muted-foreground mt-1">
            Tell the world how Bootskills changed your learning journey — approved stories appear on our public site.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Submission form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-2"
          >
            <Card className="border-border/50 bg-card/30 overflow-hidden relative">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
              <CardContent className="p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center">
                    <MessageCircleHeart className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-card-foreground">
                      Write your story
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      What did you achieve, learn, or build with us?
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="relative">
                    <Quote className="absolute left-3 top-3 w-5 h-5 text-accent/60" />
                    <Textarea
                      value={quote}
                      onChange={(e) => setQuote(e.target.value)}
                      placeholder="e.g. Bootskills helped me land my first job as a software developer. The hands-on projects and mentorship were life-changing..."
                      rows={5}
                      className="pl-10 bg-background/60 resize-none"
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[11px] text-muted-foreground">{quote.trim().length} characters</span>
                      {quote.trim().length > 0 && quote.trim().length < 20 && (
                        <span className="text-[11px] text-amber-500">Write at least 20 characters</span>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-card-foreground mb-2 block">
                        Your current role <span className="text-muted-foreground font-normal">(optional)</span>
                      </label>
                      <Input
                        value={authorRole}
                        onChange={(e) => setAuthorRole(e.target.value)}
                        placeholder="e.g. Software Developer"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-card-foreground mb-2 block">
                        Company / School <span className="text-muted-foreground font-normal">(optional)</span>
                      </label>
                      <Input
                        value={authorCompany}
                        onChange={(e) => setAuthorCompany(e.target.value)}
                        placeholder="e.g. TechCorp Rwanda"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-card-foreground mb-2 block">Your rating</label>
                    <RatingPicker value={rating} onChange={setRating} />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-accent" />
                      Submitted stories are reviewed by a super admin before going live.
                    </p>
                    <Button variant="gold" onClick={handleSubmit} disabled={submitting || !canSubmitMore} className="shrink-0">
                      <Send className="w-4 h-4 mr-2" />
                      {submitting ? "Submitting..." : "Submit Story"}
                    </Button>
                  </div>
                  {!canSubmitMore && (
                    <p className="text-xs text-amber-500">
                      You already have 3 stories waiting for review. Please wait for them to be processed.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status side panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="font-heading font-semibold text-card-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" />
                  My submissions
                </h3>
                {mySubmissions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                      <Quote className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You haven't submitted any stories yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mySubmissions.map((t: any) => {
                      const meta = statusMeta[t.status] || statusMeta.pending;
                      const Icon = meta.icon;
                      return (
                        <div key={t.id} className="p-3 rounded-lg bg-background/50 border border-border/40">
                          <p className="text-xs text-card-foreground line-clamp-3 italic leading-relaxed">
                            "{t.quote}"
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <Badge variant="outline" className={`text-[10px] py-0.5 h-5 ${meta.className}`}>
                              <Icon className="w-3 h-3 mr-1" />
                              {meta.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(t.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {t.reviewNote && t.status === "rejected" && (
                            <p className="text-[11px] text-red-500/80 mt-2 pt-2 border-t border-border/40">
                              Note: {t.reviewNote}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-gradient-to-br from-accent/10 to-transparent">
              <CardContent className="p-5">
                <h3 className="font-heading text-sm font-semibold text-card-foreground mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Tips for a great story
                </h3>
                <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
                  <li>Mention a concrete outcome (job, project, certificate)</li>
                  <li>Share what surprised you about the program</li>
                  <li>Keep it honest and specific — real stories resonate</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </PortalLayout>
  );
}
