import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Star, MessageSquare, BarChart3, ThumbsUp, Users, Send,
  Loader2, PenLine, CheckCircle2, X, Rocket,
  Clock, Eye, Calendar
} from "lucide-react";

// ─── GraphQL ──────────────────────────────────────────────────────────────────
const GET_MY_APPLICATIONS = gql`
  query GetMyAppsForFeedback {
    myProjectApplications {
      id
      title
      description
      status
      ndaSigned
      createdAt
    }
  }
`;

const GET_CLIENT_PROJECT = gql`
  query GetClientProjectEval($applicationId: ID!) {
    projectByApplicationId(applicationId: $applicationId) {
      id
      title
      description
      status
      progress
      evaluation {
        clientFeedback { rating comment submittedAt }
        developerEvaluations { developerId rating notes }
        reviewerNotes
      }
      milestones {
        title
        completed
      }
      createdAt
    }
  }
`;

const SUBMIT_CLIENT_EVALUATION_MUTATION = gql`
  mutation SubmitClientEval($projectId: ID!, $rating: Int!, $comment: String!) {
    submitClientEvaluation(projectId: $projectId, rating: $rating, comment: $comment) {
      id
      evaluation {
        clientFeedback { rating comment submittedAt }
      }
    }
  }
`;

// ─── Render HTML with dangerouslySetInnerHTML ─────────────────────────────────
function RenderHTML({ html, className = "" }: { html: string; className?: string }) {
  if (!html) return null;
  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ─── Star Display ─────────────────────────────────────────────────────────────
function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "w-3 h-3" : size === "lg" ? "w-6 h-6" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((_, si) => (
        <Star
          key={si}
          className={`${sizeClass} ${si < Math.round((rating || 0) / 2) ? "text-accent fill-accent" : "text-muted-foreground/30"}`}
        />
      ))}
      <RenderHTML html={`<span class="text-xs font-bold ml-1.5">${rating || 0}/10</span>`} />
    </div>
  );
}

// ─── Feedback Dialog ──────────────────────────────────────────────────────────
function FeedbackDialog({
  open, onClose, projectId, projectTitle, onSubmitted,
}: {
  open: boolean; onClose: () => void; projectId: string; projectTitle: string; onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitEval, { loading }] = useMutation(SUBMIT_CLIENT_EVALUATION_MUTATION);

  const handleSubmit = async () => {
    if (rating === 0) { toast.error("Please select a rating."); return; }
    if (!comment.trim()) { toast.error("Please write your feedback."); return; }
    try {
      await submitEval({ variables: { projectId, rating: rating * 2, comment } });
      toast.success(`Feedback submitted for "${projectTitle}"!`);
      setRating(0); setComment(""); onSubmitted(); onClose();
    } catch (err: any) { toast.error(err.message); }
  };

  const labels = ["Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-card border border-border/50 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          >
            <div className="p-5 border-b border-border/30 flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-bold flex items-center gap-2">
                  <Star className="w-5 h-5 text-accent" /> Rate Your Project
                </h3>
                <RenderHTML html={`<p class="text-xs text-muted-foreground mt-0.5">${projectTitle}</p>`} />
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Star Rating */}
              <div className="text-center space-y-3">
                <RenderHTML html="<p class='text-sm font-semibold text-muted-foreground'>How satisfied are you with the delivered project?</p>" />
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="group relative p-2 transition-all hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 transition-all ${
                          star <= rating
                            ? "fill-accent text-accent drop-shadow-lg"
                            : "text-muted-foreground/30 hover:text-muted-foreground/50"
                        }`}
                      />
                      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {labels[star - 1]}
                      </span>
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <RenderHTML html={`<div class="flex items-center justify-center gap-2 text-lg font-bold text-accent"><span>${["😞","😐","🙂","😊","🔥"][rating-1]}</span><span>${labels[rating-1]}</span><span class="text-muted-foreground">(${rating}/5)</span></div>`} />
                )}
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Your Feedback</label>
                <textarea
                  className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[120px] resize-y"
                  placeholder="Tell us about your experience. What went well? What could be improved?"
                  value={comment} onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>
            <div className="p-5 border-t border-border/30 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button variant="gold" onClick={handleSubmit} disabled={loading || rating === 0}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</> : <><Send className="w-4 h-4 mr-2" /> Submit Feedback</>}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function getStatusBadgeColor(status: string) {
  switch (status) {
    case "submitted": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "under_review": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "approved": return "bg-green-500/10 text-green-400 border-green-500/20";
    case "rejected": return "bg-red-500/10 text-red-400 border-red-500/20";
    case "in_progress": return "bg-accent/10 text-accent border-accent/20";
    case "completed": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    default: return "bg-muted text-muted-foreground";
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ClientFeedback() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);

  const { data: appsData, loading: appsLoading, refetch: refetchApps } = useQuery(GET_MY_APPLICATIONS);
  const { data: projectData, loading: projectLoading, refetch: refetchProject } = useQuery(
    GET_CLIENT_PROJECT,
    { variables: { applicationId: selectedProjectId }, skip: !selectedProjectId }
  );

  const applications: any[] = (appsData as any)?.myProjectApplications || [];
  const activeApps = applications.filter((a: any) => a.ndaSigned && (a.status === "approved" || a.status === "in_progress" || a.status === "completed"));
  const project: any = (projectData as any)?.projectByApplicationId;

  const handleRefresh = () => {
    refetchApps();
    if (selectedProjectId) refetchProject();
  };

  return (
    <PortalLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
              Project Evaluations
            </h1>
            <RenderHTML html="<p class='text-muted-foreground mt-1 text-sm'>View all evaluations, submit your feedback, and track developer reviews across your projects.</p>" />
          </div>
          {selectedProjectId && (
            <Button variant="gold" size="sm" onClick={() => setFeedbackDialogOpen(true)} className="gap-1.5">
              <PenLine className="w-4 h-4" /> Submit Feedback
            </Button>
          )}
        </div>

        {/* Project Selector */}
        {activeApps.length > 0 && (
          <div className="flex items-center gap-3">
            <select
              className="flex-1 bg-card border border-border/50 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent"
              value={selectedProjectId || ""}
              onChange={(e) => setSelectedProjectId(e.target.value || null)}
            >
              <option value="">— Select a Project to Review —</option>
              {activeApps.map((app: any) => (
                <option key={app.id} value={app.id}>{app.title}</option>
              ))}
            </select>
            <Badge className="text-[10px] uppercase font-bold bg-muted text-muted-foreground shrink-0">
              {activeApps.length} available
            </Badge>
          </div>
        )}

        {/* No Projects State */}
        {activeApps.length === 0 && !appsLoading && (
          <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <RenderHTML html="<p class='text-lg font-bold'>No eligible projects</p><p class='text-sm mt-1'>You need approved projects with signed NDAs to submit evaluations.</p>" />
          </div>
        )}

        {/* Loading */}
        {appsLoading && (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        )}

        {/* Selected Project Evaluations */}
        {selectedProjectId && (
          <>
            {projectLoading ? (
              <div className="flex items-center justify-center min-h-[30vh]">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : project ? (
                  <div className="space-y-6">
                    {/* Project Summary */}
                <Card className="border-border/50 bg-gradient-to-r from-card to-muted/10">
                      <CardContent className="pt-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent/10 rounded-lg">
                          <Rocket className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{project.title}</h3>
                          <div className="flex items-center gap-3 mt-0.5">
                            <Badge className={`text-[10px] uppercase font-bold ${getStatusBadgeColor(project.status)}`} variant="outline">
                              {project.status?.replace("_", " ") || "—"}
                            </Badge>
                            <RenderHTML html={`<span class="text-[10px] text-muted-foreground">${project.milestones?.filter((m: any) => m.completed).length || 0}/${project.milestones?.length || 0} milestones</span>`} />
                          </div>
                        </div>
                      </div>
                          <Progress value={project.progress || 0} className="w-24 h-2" />
                    </div>
                      </CardContent>
                    </Card>

                {/* Client Feedback Card */}
                <Card className="border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <ThumbsUp className="w-4 h-4 text-accent" /> Your Feedback
                      </CardTitle>
                      <CardDescription>
                        <RenderHTML html="Your satisfaction rating helps us improve our services." />
                      </CardDescription>
                    </div>
                    {!project.evaluation?.clientFeedback && (
                      <Button variant="outline" size="sm" onClick={() => setFeedbackDialogOpen(true)} className="gap-1.5">
                        <PenLine className="w-3.5 h-3.5" /> Write Review
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {project.evaluation?.clientFeedback ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 bg-accent/5 border border-accent/10 rounded-xl space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <RenderHTML html="<span class='text-sm font-bold text-green-500'>Review Submitted</span>" />
                          </div>
                          <StarRating rating={project.evaluation.clientFeedback.rating} size="md" />
                        </div>
                        <div className="p-3 bg-background/50 rounded-lg">
                          <RenderHTML html={`<p class="text-sm text-muted-foreground leading-relaxed">${project.evaluation.clientFeedback.comment}</p>`} />
                        </div>
                        {project.evaluation.clientFeedback.submittedAt && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-muted-foreground/60" />
                            <RenderHTML html={`<span class="text-[10px] text-muted-foreground/60">Submitted ${format(new Date(parseInt(project.evaluation.clientFeedback.submittedAt)), "MMMM d, yyyy 'at' h:mm a")}</span>`} />
                          </div>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setFeedbackDialogOpen(true)} className="gap-1.5">
                          <PenLine className="w-3.5 h-3.5" /> Update Review
                        </Button>
                      </motion.div>
                    ) : (
                      <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
                        <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <RenderHTML html="<p class='text-sm font-bold'>No feedback submitted yet</p><p class='text-xs mt-1'>Share your experience to help us improve.</p>" />
                        <Button variant="gold" size="sm" className="mt-4" onClick={() => setFeedbackDialogOpen(true)}>
                          <PenLine className="w-3.5 h-3.5 mr-1" /> Write a Review
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Developer Evaluations */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent" /> Developer Evaluations
                    </CardTitle>
                    <CardDescription>
                      <RenderHTML html="See how developers rated their experience working on your project." />
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!project.evaluation?.developerEvaluations || project.evaluation.developerEvaluations.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <RenderHTML html="<p class='text-sm font-bold'>No developer evaluations yet</p><p class='text-xs mt-1'>Developers haven't submitted their evaluations for this project.</p>" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {project.evaluation.developerEvaluations.map((ev: any, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="p-5 bg-muted/10 border border-border/30 rounded-xl space-y-3 hover:border-accent/20 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-black text-accent">
                                  D{i + 1}
                                </div>
                                <RenderHTML html={`<span class="text-sm font-bold">Developer #${i + 1}</span>`} />
                              </div>
                              <StarRating rating={ev.rating} size="sm" />
                            </div>
                            <div className="p-3 bg-background/50 rounded-lg">
                              <RenderHTML html={`<p class="text-sm text-muted-foreground">${ev.notes || "No notes provided."}</p>`} />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Admin Reviewer Notes */}
                {project.evaluation?.reviewerNotes && (
                  <Card className="bg-amber-500/5 border-amber-500/10">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-amber-400" /> Admin Reviewer Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-background/40 rounded-xl border border-amber-500/10">
                        <RenderHTML html={`<p class="text-sm text-muted-foreground leading-relaxed">${project.evaluation.reviewerNotes}</p>`} />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Evaluation Timeline */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="w-4 h-4 text-accent" /> Evaluation Timeline
                    </CardTitle>
                    <CardDescription>
                      <RenderHTML html="Track when evaluations were submitted." />
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {project.evaluation?.clientFeedback?.submittedAt && (
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                            <ThumbsUp className="w-3 h-3 text-accent" />
                          </div>
                          <div>
                            <RenderHTML html="<p class='text-sm font-bold'>Client Feedback Submitted</p>" />
                            <RenderHTML html={`<span class="text-[11px] text-muted-foreground">${format(new Date(parseInt(project.evaluation.clientFeedback.submittedAt)), "MMMM d, yyyy 'at' h:mm a")}</span>`} />
                          </div>
                        </div>
                      )}
                      {(project.evaluation?.developerEvaluations || []).map((ev: any, i: number) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Users className="w-3 h-3 text-accent" />
                          </div>
                          <div>
                            <RenderHTML html={`<p class='text-sm font-bold'>Developer Evaluation #${i + 1} Submitted</p>`} />
                            <RenderHTML html={`<span class="text-[11px] text-muted-foreground">${ev.rating}/10 rating</span>`} />
                          </div>
                        </div>
                      ))}
                      {!project.evaluation?.clientFeedback && (!project.evaluation?.developerEvaluations || project.evaluation.developerEvaluations.length === 0) && (
                        <RenderHTML html="<p class='text-sm text-muted-foreground italic'>No evaluations submitted yet for this project.</p>" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                <Eye className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <RenderHTML html="<p class='text-sm'>No project data found. The project may still be in setup.</p>" />
              </div>
            )}
          </>
        )}

        {/* No Selection State */}
        {!selectedProjectId && activeApps.length > 0 && (
          <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <RenderHTML html="<p class='text-lg font-bold'>Select a project</p><p class='text-sm mt-1'>Choose a project from the dropdown above to view its evaluations.</p>" />
          </div>
        )}
      </div>

      {/* Feedback Dialog */}
      <FeedbackDialog
        open={feedbackDialogOpen && !!selectedProjectId && !!project?.id}
        onClose={() => setFeedbackDialogOpen(false)}
        projectId={project?.id || ""}
        projectTitle={project?.title || ""}
        onSubmitted={handleRefresh}
      />
    </PortalLayout>
  );
}
