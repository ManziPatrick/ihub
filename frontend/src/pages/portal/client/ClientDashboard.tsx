import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarGrid } from "@/components/portal/CalendarGrid";
import { BookCallDialog } from "@/components/portal/dialogs/BookCallDialog";
import { ConfirmDialog } from "@/components/portal/dialogs/ConfirmDialog";
import { TextEditor } from "@/components/ui/text-editor";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { toast } from "sonner";
import {
  RESTORE_BOOKING,
} from "@/lib/graphql/mutations";
import { format } from "date-fns";
import {
  LayoutDashboard, Calendar, FileText, MessageSquare, Star, Send,
  Plus, Clock, CheckCircle2, Users, Rocket, TrendingUp, Package,
  ChevronRight, Loader2, Video, BarChart3, Layers, Globe, ShieldCheck,
  GitBranch, Eye, PenLine, ThumbsUp, Download, AlertCircle, X,
  XCircle, Building2, Circle, CheckSquare,
  Coins, FileSignature, Lock
} from "lucide-react";

// ─── GraphQL ──────────────────────────────────────────────────────────────────
const GET_MY_APPLICATIONS = gql`
  query GetMyApps {
    myProjectApplications {
      id
      title
      description
      status
      ndaSigned
      reviewNotes
      requiredDocuments {
        overviewUrl
        featuresUrl
        technicalUrl
      }
      createdAt
    }
  }
`;

const GET_CLIENT_PROJECT = gql`
  query GetClientProject($applicationId: ID!) {
    projectByApplicationId(applicationId: $applicationId) {
      id
      title
      description
      status
      progress
      deadline
      course
      type
      team { userId name role }
      mentors { id username fullName }
      tasks { id title completed approved feedback category }
      milestones {
        title description dueDate completed
        submissions { url submittedAt message feedback status version fileName submittedBy }
        feedback
      }
      evaluation {
        clientFeedback { rating comment submittedAt }
        developerEvaluations { developerId rating notes }
        reviewerNotes
      }
      createdAt
    }
  }
`;

const GET_MY_BOOKINGS = gql`
  query GetClientBookings {
    myBookings {
      id
      type
      date
      time
      topic
      notes
      status
      meetingLink
      mentor { id username }
      user { id username }
      createdAt
    }
  }
`;

const SUBMIT_APPLICATION = gql`
  mutation SubmitProjectApplication(
    $title: String!
    $description: String!
    $documents: ProjectApplicationDocumentsInput!
  ) {
    submitProjectApplication(title: $title, description: $description, documents: $documents) {
      id title status
    }
  }
`;

const CANCEL_BOOKING = gql`
  mutation CancelMyBooking($id: ID!) {
    cancelBooking(id: $id) {
      id
      status
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

const SIGN_NDA = gql`
  mutation SignProjectNDA($applicationId: ID!, $signerName: String!) {
    signProjectNDA(applicationId: $applicationId, signerName: $signerName) {
      id status signerName signedAt
    }
  }
`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  status: string;
  mentor?: { username: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────
const INITIAL_TOKENS = 3;
const TOKEN_KEY = "ihub_nda_tokens";

function useSigningTokens() {
  const [tokens, setTokens] = useState<number>(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    return stored ? parseInt(stored, 10) : INITIAL_TOKENS;
  });
  const consume = () => {
    setTokens((prev) => {
      const next = Math.max(0, prev - 1);
      localStorage.setItem(TOKEN_KEY, String(next));
      return next;
    });
  };
  return { tokens, consume };
}

const lifecycleStages = [
  { key: "draft", label: "Draft", icon: FileText },
  { key: "nda_pending", label: "NDA Signing", icon: ShieldCheck },
  { key: "in_progress", label: "Development", icon: GitBranch },
  { key: "review", label: "Review", icon: Eye },
  { key: "completed", label: "Delivered", icon: CheckCircle2 },
];

function getStageIndex(status: string) {
  const map: Record<string, number> = { draft: 0, nda_pending: 1, in_progress: 2, review: 3, completed: 4, archived: 4 };
  return map[status] ?? 0;
}

// ─── Status Badge Colors ──────────────────────────────────────────────────────
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

// ─── Toolbar Component ────────────────────────────────────────────────────────
function Toolbar({
  onNewApplication,
  onBookMeeting,
  onRefresh,
}: {
  onNewApplication: () => void;
  onBookMeeting: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap p-3 bg-card border border-border/50 rounded-xl mb-4">
      <Button variant="gold" size="sm" onClick={onNewApplication} className="gap-1.5 text-xs font-bold">
        <Plus className="w-3.5 h-3.5" /> New Proposal
      </Button>
      <Button variant="outline" size="sm" onClick={onBookMeeting} className="gap-1.5 text-xs font-bold">
        <Video className="w-3.5 h-3.5" /> Book Meeting
      </Button>
      <Button variant="ghost" size="sm" onClick={onRefresh} className="gap-1.5 text-xs ml-auto">
        <Loader2 className="w-3.5 h-3.5" /> Refresh
      </Button>
    </div>
  );
}

// ─── Token Badge ──────────────────────────────────────────────────────────────
function TokenBadge({ tokens }: { tokens: number }) {
  const color =
    tokens === 0 ? "bg-red-500/10 text-red-400 border-red-500/20"
    : tokens === 1 ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${color}`}>
      <Coins className="w-3.5 h-3.5" />
      {tokens} signing token{tokens !== 1 ? "s" : ""} remaining
    </div>
  );
}

// ─── New Application Dialog ───────────────────────────────────────────────────
function NewApplicationDialog({
  open, onClose, onCreated,
}: {
  open: boolean; onClose: () => void; onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [overviewUrl, setOverviewUrl] = useState("");
  const [featuresUrl, setFeaturesUrl] = useState("");
  const [technicalUrl, setTechnicalUrl] = useState("");
  const [submitApp, { loading }] = useMutation(SUBMIT_APPLICATION);

  const handleSubmit = async () => {
    if (!title || !description) { toast.error("Title and description required."); return; }
    try {
      await submitApp({
        variables: {
          title, description,
          documents: { overviewUrl: overviewUrl || "", featuresUrl: featuresUrl || "", technicalUrl: technicalUrl || "" },
        },
      });
      toast.success("Project proposal submitted!");
      setTitle(""); setDescription(""); setOverviewUrl(""); setFeaturesUrl(""); setTechnicalUrl("");
      onCreated(); onClose();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-card border border-border/50 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          >
            <div className="p-5 border-b border-border/30 flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold flex items-center gap-2">
                <Send className="w-5 h-5 text-accent" /> New Project Proposal
              </h3>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Project Title</label>
                <input
                  className="w-full px-3 py-2 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g., E-Commerce Platform with Admin Dashboard"
                  value={title} onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Detailed Description</label>
                <TextEditor value={description} onChange={setDescription} placeholder="Describe the project scope, objectives, and key features…" />
              </div>
              <div className="border-t border-border/30 pt-4 space-y-4">
                <h4 className="text-sm font-bold text-accent uppercase tracking-wider">Specification Documents</h4>
                {[
                  { label: "Project Overview URL", value: overviewUrl, setter: setOverviewUrl },
                  { label: "System Features URL", value: featuresUrl, setter: setFeaturesUrl },
                  { label: "Technical Specs URL", value: technicalUrl, setter: setTechnicalUrl },
                ].map(({ label, value, setter }) => (
                  <div key={label} className="space-y-1.5">
                    <label className="text-xs font-semibold">{label}</label>
                    <input
                      className="w-full px-3 py-2 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="https://drive.google.com/..."
                      value={value} onChange={(e) => setter(e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5 border-t border-border/30 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button variant="gold" onClick={handleSubmit} disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</> : <><Send className="w-4 h-4 mr-2" /> Submit Proposal</>}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Feedback Dialog ──────────────────────────────────────────────────────────
function FeedbackDialog({
  open, onClose, projectId, onSubmitted,
}: {
  open: boolean; onClose: () => void; projectId: string; onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitEval, { loading }] = useMutation(SUBMIT_CLIENT_EVALUATION_MUTATION);

  const handleSubmit = async () => {
    if (rating === 0) { toast.error("Please select a rating."); return; }
    if (!comment.trim()) { toast.error("Please write your feedback."); return; }
    try {
      // Convert 1-5 star scale to 2-10 backend scale (matching /10 display elsewhere in the app)
      await submitEval({ variables: { projectId, rating: rating * 2, comment } });
      toast.success("Feedback submitted successfully!");
      setRating(0); setComment(""); onSubmitted(); onClose();
    } catch (err: any) { toast.error(err.message); }
  };

  const labels = ["Poor", "Fair", "Good", "Very Good", "Excellent"];
  const emojis = ["😞", "😐", "🙂", "😊", "🔥"];

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
              <h3 className="font-heading text-lg font-bold flex items-center gap-2">
                <Star className="w-5 h-5 text-accent" /> Rate Your Project
              </h3>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Star Rating */}
              <div className="text-center space-y-3">
                <p className="text-sm font-semibold text-muted-foreground">How satisfied are you with the delivered project?</p>
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
                  <div className="flex items-center justify-center gap-2 text-lg font-bold text-accent">
                    <span>{emojis[rating - 1]}</span>
                    <span>{labels[rating - 1]}</span>
                    <span className="text-muted-foreground">({rating}/5)</span>
                  </div>
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

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [newAppDialogOpen, setNewAppDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [signingAppId, setSigningAppId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [signerName, setSignerName] = useState("");
  const { tokens, consume } = useSigningTokens();

  // Queries
  const { data: appsData, loading: appsLoading, refetch: refetchApps } = useQuery(GET_MY_APPLICATIONS);
  const { data: bookingsData, loading: bookingsLoading, refetch: refetchBookings } = useQuery(GET_MY_BOOKINGS);
  const { data: projectData, loading: projectLoading, refetch: refetchProject } = useQuery(
    GET_CLIENT_PROJECT,
    { variables: { applicationId: selectedProjectId }, skip: !selectedProjectId }
  );

  const [signNda, { loading: signing }] = useMutation(SIGN_NDA);
  const [restoreBooking] = useMutation(RESTORE_BOOKING);
  const [cancelBook, { loading: cancelling }] = useMutation(CANCEL_BOOKING, {
    onCompleted: (data: any) => {
      const bookingId = data?.cancelBooking?.id;
      setCancelTarget(null);
      if (!bookingId) return;
      window.dispatchEvent(new CustomEvent('bell-ring'));
      toast.success("Booking cancelled", {
        description: "You can undo this action within 10 seconds.",
        duration: 10000,
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await restoreBooking({ variables: { id: bookingId } });
              toast.success("Booking restored!");
              refetchBookings();
            } catch (err: any) {
              toast.error(err.message);
            }
          },
        },
      });
      refetchBookings();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const applications: any[] = (appsData as any)?.myProjectApplications || [];
  const bookings: any[] = (bookingsData as any)?.myBookings || [];
  const project: any = (projectData as any)?.projectByApplicationId;

  const activeApps = applications.filter((a: any) => a.ndaSigned && a.status === "approved");
  const completedApps = applications.filter((a: any) => a.status === "completed" || a.status === "rejected");

  // Map bookings to calendar events
  const calendarEvents: CalendarEvent[] = bookings.map((b: any) => ({
    id: b.id,
    title: b.topic || b.type || "Meeting",
    date: b.date,
    time: b.time,
    type: b.type,
    status: b.status,
    mentor: b.mentor,
  }));

  // Stats
  const totalApplications = applications.length;
  const approvedApps = applications.filter((a: any) => a.status === "approved").length;
  const pendingNdAs = applications.filter((a: any) => a.status === "approved" && !a.ndaSigned).length;
  const activeProjects = activeApps.length;

  const handleRefresh = () => {
    refetchApps();
    refetchBookings();
    if (selectedProjectId) refetchProject();
  };

  const handleSignNda = async () => {
    if (!signerName.trim()) { toast.error("Please enter your full legal name."); return; }
    if (tokens <= 0) { toast.error("No signing tokens remaining."); return; }
    try {
      await signNda({ variables: { applicationId: signingAppId, signerName } });
      consume();
      toast.success("NDA executed successfully!");
      setSigningAppId(null); setSignerName(""); refetchApps();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <PortalLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
              Client Dashboard
            </h1>
            <RenderHTML html="<p>Manage your projects, schedule meetings, and track progress in real time.</p>" className="text-muted-foreground text-sm mt-1" />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="gold" size="sm" onClick={() => setNewAppDialogOpen(true)} className="gap-1.5">
              <Plus className="w-4 h-4" /> New Proposal
            </Button>
            <Button variant="outline" size="sm" onClick={() => setBookDialogOpen(true)} className="gap-1.5">
              <Video className="w-4 h-4" /> Book Meeting
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Proposals", value: totalApplications, icon: FileText, color: "text-blue-500", desc: "Submitted so far" },
            { label: "Approved", value: approvedApps, icon: CheckCircle2, color: "text-green-500", desc: "Ready for NDA" },
            { label: "Pending NDA", value: pendingNdAs, icon: Lock, color: "text-amber-500", desc: "Action required" },
            { label: "Active Projects", value: activeProjects, icon: Rocket, color: "text-accent", desc: "In development" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted/50 ${stat.color}`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-black">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <RenderHTML html={`<span class="text-[10px] opacity-60">${stat.desc}</span>`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <Toolbar
          onNewApplication={() => setNewAppDialogOpen(true)}
          onBookMeeting={() => setBookDialogOpen(true)}
          onRefresh={handleRefresh}
        />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-card border border-border/50 rounded-xl p-1 overflow-x-auto flex-nowrap">
            <TabsTrigger value="overview" className="rounded-lg text-xs font-semibold gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" /> Overview
            </TabsTrigger>
            <TabsTrigger value="applications" className="rounded-lg text-xs font-semibold gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Applications
            </TabsTrigger>
            <TabsTrigger value="workspace" className="rounded-lg text-xs font-semibold gap-1.5">
              <Rocket className="w-3.5 h-3.5" /> Workspace
            </TabsTrigger>
            <TabsTrigger value="calendar" className="rounded-lg text-xs font-semibold gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Calendar
            </TabsTrigger>
            <TabsTrigger value="feedback" className="rounded-lg text-xs font-semibold gap-1.5">
              <Star className="w-3.5 h-3.5" /> Feedback
            </TabsTrigger>
          </TabsList>

          {/* ── OVERVIEW TAB ──────────────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Recent Applications */}
              <Card className="lg:col-span-2 border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-accent" /> Recent Proposals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appsLoading ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => <div key={i} className="h-16 bg-muted/40 animate-pulse rounded-lg" />)}
                    </div>
                  ) : applications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                      <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <RenderHTML html="<p class='text-sm'>No proposals yet. <strong>Submit your first one!</strong></p>" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {applications.slice(0, 5).map((app: any) => (
                        <div key={app.id} className="flex items-center justify-between p-3 bg-muted/10 border border-border/30 rounded-xl hover:border-accent/30 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${app.status === "approved" ? "bg-green-500" : app.status === "rejected" ? "bg-red-500" : app.status === "submitted" ? "bg-blue-500" : "bg-amber-500"}`} />
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate">{app.title}</p>
                              <RenderHTML html={`<span class="text-[10px] text-muted-foreground">Submitted ${format(new Date(parseInt(app.createdAt)), "MMM d, yyyy")}</span>`} />
                            </div>
                          </div>
                          <Badge className={`text-[10px] uppercase font-bold ml-2 shrink-0 ${getStatusBadgeColor(app.status)}`} variant="outline">
                            {app.status.replace("_", " ")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Meetings */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-accent" /> Upcoming Meetings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <div className="space-y-2">
                      {[1,2].map(i => <div key={i} className="h-14 bg-muted/40 animate-pulse rounded-lg" />)}
                    </div>
                  ) : bookings.filter((b: any) => b.status === "confirmed" || b.status === "pending").length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-xl">
                      <Video className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <RenderHTML html="<p class='text-xs'>No upcoming meetings.</p>" />
                      <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setBookDialogOpen(true)}>
                        Book one now
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bookings.filter((b: any) => b.status === "confirmed" || b.status === "pending").slice(0, 4).map((b: any) => (
                        <div key={b.id} className="flex items-center gap-3 p-3 bg-muted/10 border border-border/30 rounded-xl">
                          <div className="p-2 bg-accent/10 rounded-lg">
                            <Video className="w-4 h-4 text-accent" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{b.topic || b.type}</p>
                            <RenderHTML html={`<span class="text-[10px] text-muted-foreground">${b.date} at ${b.time} · ${b.mentor?.username || "N/A"}</span>`} />
                          </div>
                          <Badge className={`text-[9px] uppercase font-bold shrink-0 ${b.status === "confirmed" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}`} variant="outline">
                            {b.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Deliverables */}
            {activeApps.length > 0 && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="w-4 h-4 text-accent" /> Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RenderHTML html="<p class='text-sm text-muted-foreground mb-4'>Select a project from the <strong>Workspace</strong> tab to view recent deliverables and milestones.</p>" />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── APPLICATIONS TAB ──────────────────────────────────────────────── */}
          <TabsContent value="applications" className="space-y-4 mt-4">
            {/* NDA Signing Banner */}
            {pendingNdAs > 0 && (
              <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <RenderHTML html={`<p class='text-sm font-bold text-amber-400'>${pendingNdAs} NDA${pendingNdAs > 1 ? "s" : ""} Pending Signature</p>`} />
                  <RenderHTML html="<p class='text-xs text-muted-foreground mt-0.5'>Review and sign your Non-Disclosure Agreement to move your project forward.</p>" />
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {appsLoading ? (
                <div className="col-span-full space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-24 bg-muted/40 animate-pulse rounded-xl" />)}
                </div>
              ) : applications.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <RenderHTML html="<p class='text-sm font-bold'>No proposals yet</p><p class='text-xs mt-1'>Submit your first project proposal to get started.</p>" />
                  <Button variant="gold" size="sm" className="mt-4" onClick={() => setNewAppDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Submit Proposal
                  </Button>
                </div>
              ) : (
                applications.map((app: any) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-card border border-border/50 rounded-2xl space-y-4 hover:border-accent/40 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-sm flex-1 line-clamp-1">{app.title}</h3>
                      <Badge className={`text-[10px] uppercase font-bold ml-2 ${getStatusBadgeColor(app.status)}`} variant="outline">
                        {app.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <RenderHTML html={`<p class='text-xs text-muted-foreground line-clamp-2'>${app.description || "No description."}</p>`} />
                    <RenderHTML html={`<p class='text-[10px] text-muted-foreground'>Submitted ${app.createdAt ? format(new Date(parseInt(app.createdAt)), "MMM d, yyyy") : "—"}</p>`} />

                    {app.reviewNotes && (
                      <div className="p-3 bg-accent/5 border border-accent/10 rounded-xl">
                        <RenderHTML html={`<p class='text-[11px] text-muted-foreground'><strong>Review Notes:</strong> ${app.reviewNotes}</p>`} />
                      </div>
                    )}

                    {/* Required Documents */}
                    {app.requiredDocuments && (app.requiredDocuments.overviewUrl || app.requiredDocuments.featuresUrl || app.requiredDocuments.technicalUrl) && (
                      <div className="space-y-1.5">
                        <RenderHTML html="<p class='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>Spec Documents</p>" />
                        {[
                          { label: "Overview", url: app.requiredDocuments.overviewUrl },
                          { label: "Features", url: app.requiredDocuments.featuresUrl },
                          { label: "Technical", url: app.requiredDocuments.technicalUrl },
                        ].filter(d => d.url).map(doc => (
                          <a key={doc.label} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-muted/10 rounded-lg hover:bg-muted/20 transition-colors">
                            <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
                            <span className="text-xs font-medium flex-1">{doc.label}</span>
                            <Download className="w-3 h-3 text-muted-foreground" />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* NDA Signing or Status */}
                    {app.status === "approved" && !app.ndaSigned && (
                      <div className="space-y-2 border-t border-border/30 pt-3">
                        <RenderHTML html="<p class='text-xs font-semibold text-amber-400 flex items-center gap-1.5'><strong>Action Required:</strong> NDA Ready for Signature</p>" />
                        {signingAppId === app.id ? (
                          <div className="space-y-2 p-3 bg-muted/20 rounded-xl">
                            <input
                              className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                              placeholder="Enter your full legal name"
                              value={signerName} onChange={(e) => setSignerName(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="text-xs flex-1" onClick={() => { setSigningAppId(null); setSignerName(""); }}>
                                Cancel
                              </Button>
                              <Button variant="gold" size="sm" className="text-xs flex-1" onClick={handleSignNda} disabled={signing || !signerName.trim() || tokens <= 0}>
                                {signing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <FileSignature className="w-3 h-3 mr-1" />}
                                Sign NDA
                              </Button>
                            </div>
                            <TokenBadge tokens={tokens} />
                          </div>
                        ) : (
                          <Button variant="gold" size="sm" className="w-full text-xs font-bold" onClick={() => setSigningAppId(app.id)}>
                            <FileSignature className="w-3.5 h-3.5 mr-1" /> Sign Pending NDA
                          </Button>
                        )}
                      </div>
                    )}

                    {app.ndaSigned && (
                      <div className="flex items-center gap-1.5 text-xs text-green-500 font-bold border-t border-border/30 pt-3">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        NDA Executed
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          {/* ── WORKSPACE TAB ─────────────────────────────────────────────────── */}
          <TabsContent value="workspace" className="space-y-4 mt-4">
            {activeApps.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                <Rocket className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <RenderHTML html="<p class='text-sm font-bold'>No active projects</p><p class='text-xs mt-1'>Once your proposal is approved and NDA signed, your workspace will appear here.</p>" />
                <Button variant="gold" size="sm" className="mt-4" onClick={() => setNewAppDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Submit a Proposal
                </Button>
              </div>
            ) : (
              <>
                {/* Project Selector */}
                <div className="flex items-center gap-3">
                  <select
                    className="flex-1 bg-card border border-border/50 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                    value={selectedProjectId || ""}
                    onChange={(e) => setSelectedProjectId(e.target.value || null)}
                  >
                    <option value="">— Select a Project —</option>
                    {activeApps.map((app: any) => (
                      <option key={app.id} value={app.id}>{app.title}</option>
                    ))}
                  </select>
                  <Button variant="outline" size="sm" onClick={() => setFeedbackDialogOpen(true)} disabled={!selectedProjectId} className="gap-1.5">
                    <Star className="w-3.5 h-3.5" /> Give Feedback
                  </Button>
                </div>

                {projectLoading ? (
                  <div className="flex items-center justify-center min-h-[40vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                  </div>
                ) : project ? (
                  <>
                    {/* Lifecycle Progress */}
                    <Card className="border-border/50 bg-gradient-to-r from-card to-muted/10 overflow-hidden">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between relative">
                          <div className="absolute left-0 right-0 top-5 h-px bg-border/50 z-0" />
                          <div className="absolute left-0 top-5 h-px bg-accent/60 z-0 transition-all duration-700"
                            style={{ width: `${(getStageIndex(project.status) / (lifecycleStages.length - 1)) * 100}%` }}
                          />
                          {lifecycleStages.map((stage, i) => {
                            const current = getStageIndex(project.status);
                            const isDone = i < current;
                            const isActive = i === current;
                            return (
                              <div key={stage.key} className="flex flex-col items-center gap-2 relative z-10">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                                  ${isDone ? "bg-accent border-accent text-accent-foreground" : isActive ? "bg-accent/20 border-accent text-accent animate-pulse" : "bg-card border-border/50 text-muted-foreground"}`}>
                                  <stage.icon className="w-4 h-4" />
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider hidden sm:block ${isActive ? "text-accent" : isDone ? "text-foreground" : "text-muted-foreground"}`}>
                                  {stage.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Project Info & Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: "Progress", value: `${project.progress || 0}%`, icon: TrendingUp, color: "text-blue-500" },
                        { label: "Milestones", value: `${project.milestones?.filter((m: any) => m.completed).length || 0}/${project.milestones?.length || 0}`, icon: Layers, color: "text-green-500" },
                        { label: "Team", value: `${(project.team?.length || 0) + (project.mentors?.length || 0)}`, icon: Users, color: "text-purple-500" },
                        { label: "Open Tasks", value: `${project.tasks?.filter((t: any) => !t.completed).length || 0}`, icon: Clock, color: "text-amber-500" },
                      ].map((stat) => (
                        <Card key={stat.label} className="border-border/50">
                          <CardContent className="pt-5 pb-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg bg-muted/50 ${stat.color}`}>
                                <stat.icon className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-2xl font-black">{stat.value}</p>
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                              </div>
                            </div>
                            {stat.label === "Progress" && <Progress value={project.progress || 0} className="mt-3 h-1.5" />}
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Milestones */}
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Layers className="w-4 h-4 text-accent" /> Milestones & Deliverables
                        </CardTitle>
                        <CardDescription>
                          <RenderHTML html="Track the progress of each project milestone. Deliverables are submitted by developers for your review." />
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {(project.milestones || []).length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                            <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <RenderHTML html="<p class='text-sm'>No milestones defined yet.</p>" />
                          </div>
                        ) : (
                          project.milestones.map((milestone: any, idx: number) => (
                            <div key={idx} className="p-4 bg-muted/10 border border-border/30 rounded-xl space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className={`mt-0.5 ${milestone.completed ? "text-green-500" : "text-muted-foreground"}`}>
                                    {milestone.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-bold text-sm">{milestone.title}</h4>
                                      <Badge variant="outline" className={`text-[10px] uppercase ${milestone.completed ? "text-green-500 border-green-500/20 bg-green-500/5" : "text-muted-foreground border-border/30"}`}>
                                        {milestone.completed ? "Completed" : "Pending"}
                                      </Badge>
                                      {milestone.dueDate && (
                                        <RenderHTML html={`<span class="text-[10px] text-muted-foreground">Due ${format(new Date(parseInt(milestone.dueDate)), "MMM d")}</span>`} />
                                      )}
                                    </div>
                                    {milestone.description && (
                                      <RenderHTML html={`<p class="text-xs text-muted-foreground mt-1">${milestone.description}</p>`} />
                                    )}

                                    {/* Submissions */}
                                    {milestone.submissions?.length > 0 && (
                                      <div className="mt-3 space-y-2">
                                        <RenderHTML html="<p class='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>Submitted Deliverables</p>" />
                                        {milestone.submissions.map((s: any, si: number) => (
                                          <div key={si} className="flex items-center gap-2 p-2.5 bg-background border border-border/20 rounded-lg">
                                            <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-medium truncate">{s.fileName || "Deliverable"}</p>
                                              <RenderHTML html={`<span class="text-[10px] text-muted-foreground">v${s.version || 1} · ${s.status || "pending"}</span>`} />
                                            </div>
                                            {s.feedback && (
                                              <RenderHTML html={`<span class="text-[10px] text-muted-foreground hidden md:block">${s.feedback}</span>`} />
                                            )}
                                            <a href={s.url} target="_blank" rel="noreferrer">
                                              <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2">
                                                <Download className="w-3 h-3 mr-1" /> View
                                              </Button>
                                            </a>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    {/* Tasks */}
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-accent" /> Task Board
                        </CardTitle>
                        <CardDescription>
                          <RenderHTML html="Read-only view of development tasks and their completion status." />
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {(project.tasks || []).length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <RenderHTML html="<p class='text-sm'>No tasks created yet.</p>" />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {project.tasks.map((task: any) => (
                              <div key={task.id} className="flex items-center gap-3 p-3 bg-muted/10 border border-border/30 rounded-xl hover:border-accent/30 transition-colors">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${task.completed ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                                  {task.category && <RenderHTML html={`<span class="text-[10px] text-muted-foreground">${task.category}</span>`} />}
                                </div>
                                {task.approved && (
                                  <Badge className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20 shrink-0">Approved</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Team */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card className="border-border/50">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Users className="w-4 h-4 text-accent" /> Developer Team
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {(project.team || []).length === 0 ? (
                            <RenderHTML html="<p class='text-sm text-muted-foreground'>No developers assigned yet.</p>" />
                          ) : (
                            project.team.map((member: any, i: number) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
                                <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-xs font-black text-accent">
                                  {(member.name || "D")[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-bold">{member.name}</p>
                                  <RenderHTML html={`<span class="text-xs text-muted-foreground">${member.role || "Developer"}</span>`} />
                                </div>
                                <Badge className="ml-auto text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/20 shrink-0">Developer</Badge>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border-border/50">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Star className="w-4 h-4 text-accent" /> Project Mentors
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {(project.mentors || []).length === 0 ? (
                            <RenderHTML html="<p class='text-sm text-muted-foreground'>No mentors assigned yet.</p>" />
                          ) : (
                            project.mentors.map((mentor: any) => (
                              <div key={mentor.id} className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
                                <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center text-xs font-black text-gold">
                                  {(mentor.fullName || mentor.username || "M")[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-bold">{mentor.fullName || mentor.username}</p>
                                  <RenderHTML html="<span class='text-xs text-muted-foreground'>Project Mentor</span>" />
                                </div>
                                <Badge className="ml-auto text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20 shrink-0">Mentor</Badge>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </>
                ) : selectedProjectId ? (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                    <RenderHTML html="<p>No project data found yet. The project may still be in setup phase.</p>" />
                  </div>
                ) : null}
              </>
            )}
          </TabsContent>

          {/* ── CALENDAR TAB ───────────────────────────────────────────────────── */}
          <TabsContent value="calendar" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-bold">Meeting Calendar</h3>
                <RenderHTML html="<p class='text-sm text-muted-foreground'>View and manage your scheduled meetings with the team.</p>" />
              </div>
              <Button variant="gold" size="sm" onClick={() => setBookDialogOpen(true)} className="gap-1.5">
                <Video className="w-4 h-4" /> Book Meeting
              </Button>
            </div>

            <CalendarGrid
              events={calendarEvents}
              onEventClick={(event) => {
                toast.info(`${event.title} — ${event.date} at ${event.time}`);
              }}
            />

            {/* Meeting List */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">All Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => <div key={i} className="h-14 bg-muted/40 animate-pulse rounded-lg" />)}
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <RenderHTML html="<p class='text-sm'>No meetings booked yet.</p>" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bookings.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between p-3 bg-muted/10 border border-border/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-accent/10 rounded-lg">
                            <Video className="w-4 h-4 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{b.topic || b.type || "Meeting"}</p>
                            <RenderHTML html={`<span class="text-[10px] text-muted-foreground">${b.date} at ${b.time} · ${b.mentor?.username || "No mentor"}</span>`} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-[9px] uppercase font-bold ${b.status === "confirmed" ? "bg-green-500/10 text-green-500 border-green-500/20" : b.status === "pending" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-muted text-muted-foreground"}`} variant="outline">
                            {b.status}
                          </Badge>
                          {b.meetingLink && (
                            <a href={b.meetingLink} target="_blank" rel="noreferrer">
                              <Button variant="ghost" size="sm" className="h-7 text-[10px]">
                                <Globe className="w-3 h-3 mr-1" /> Join
                              </Button>
                            </a>
                          )}
                          {(b.status === "pending" || b.status === "confirmed") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={() => setCancelTarget(b.id)}
                            >
                              <X className="w-3 h-3 mr-1" /> Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── FEEDBACK TAB ──────────────────────────────────────────────────── */}
          <TabsContent value="feedback" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-bold">Project Evaluations</h3>
                <RenderHTML html="<p class='text-sm text-muted-foreground'>Share your feedback and review developer evaluations.</p>" />
              </div>
              {activeApps.length > 0 && (
                <Button variant="gold" size="sm" onClick={() => setFeedbackDialogOpen(true)} className="gap-1.5" disabled={!selectedProjectId}>
                  <Star className="w-4 h-4" /> Submit Feedback
                </Button>
              )}
            </div>

            {/* Project Selector for Feedback */}
            {activeApps.length > 0 && (
              <div className="flex items-center gap-3">
                <select
                  className="flex-1 bg-card border border-border/50 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                  value={selectedProjectId || ""}
                  onChange={(e) => setSelectedProjectId(e.target.value || null)}
                >
                  <option value="">— Select a Project —</option>
                  {activeApps.map((app: any) => (
                    <option key={app.id} value={app.id}>{app.title}</option>
                  ))}
                </select>
              </div>
            )}

            {projectLoading ? (
              <div className="flex items-center justify-center min-h-[30vh]">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : selectedProjectId && project ? (
              <div className="space-y-6">
                {/* Client Feedback */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-accent" /> Your Feedback
                    </CardTitle>
                    <CardDescription>
                      <RenderHTML html="Your satisfaction rating helps us improve our services." />
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {project.evaluation?.clientFeedback ? (
                      <div className="p-4 bg-accent/5 border border-accent/10 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">Submitted Review</span>
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map((_, si) => (
                              <Star key={si} className={`w-4 h-4 ${si < Math.round((project.evaluation.clientFeedback.rating || 0) / 2) ? "text-accent fill-accent" : "text-muted-foreground/30"}`} />
                            ))}
                            <RenderHTML html={`<span class="text-xs font-bold ml-1">${project.evaluation.clientFeedback.rating}/10</span>`} />
                          </div>
                        </div>
                        <RenderHTML html={`<p class="text-sm text-muted-foreground">${project.evaluation.clientFeedback.comment}</p>`} />
                        {project.evaluation.clientFeedback.submittedAt && (
                          <RenderHTML html={`<p class="text-[10px] text-muted-foreground/60">Submitted ${format(new Date(parseInt(project.evaluation.clientFeedback.submittedAt)), "MMM d, yyyy")}</p>`} />
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                        <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <RenderHTML html="<p class='text-sm'>No feedback submitted yet.</p>" />
                        <Button variant="gold" size="sm" className="mt-3" onClick={() => setFeedbackDialogOpen(true)}>
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
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <RenderHTML html="<p class='text-sm'>No developer evaluations yet.</p>" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {project.evaluation.developerEvaluations.map((ev: any, i: number) => (
                          <div key={i} className="p-4 bg-muted/10 border border-border/30 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold">Developer Evaluation #{i + 1}</span>
                              <div className="flex items-center gap-1">
                                {[1,2,3,4,5].map((_, si) => (
                                  <Star key={si} className={`w-3.5 h-3.5 ${si < Math.round((ev.rating || 0) / 2) ? "text-accent fill-accent" : "text-muted-foreground/30"}`} />
                                ))}
                                <RenderHTML html={`<span class="text-xs font-bold ml-1">${ev.rating}/10</span>`} />
                              </div>
                            </div>
                            <RenderHTML html={`<p class="text-sm text-muted-foreground">${ev.notes}</p>`} />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Reviewer Notes */}
                {project.evaluation?.reviewerNotes && (
                  <Card className="border-border/50 bg-amber-500/5 border-amber-500/10">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-amber-400" /> Admin Reviewer Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RenderHTML html={`<p class="text-sm text-muted-foreground">${project.evaluation.reviewerNotes}</p>`} />
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              !selectedProjectId && (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                  <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <RenderHTML html="<p class='text-sm'>Select a project above to view or submit feedback.</p>" />
                </div>
              )
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Cancel Confirmation */}
      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => { if (!open) setCancelTarget(null); }}
        title="Cancel Booking"
        description="Are you sure you want to cancel this meeting? This action cannot be undone."
        confirmText="Cancel Booking"
        variant="destructive"
        icon={XCircle}
        loading={cancelling}          onConfirm={async () => {
          if (!cancelTarget) return;
          await cancelBook({ variables: { id: cancelTarget } });
        }}
      />

      {/* Dialogs */}
      <BookCallDialog
        open={bookDialogOpen}
        onOpenChange={setBookDialogOpen}
      />

      <NewApplicationDialog
        open={newAppDialogOpen}
        onClose={() => setNewAppDialogOpen(false)}
        onCreated={handleRefresh}
      />

      <FeedbackDialog
        open={feedbackDialogOpen && !!selectedProjectId}
        onClose={() => setFeedbackDialogOpen(false)}
        projectId={selectedProjectId || ""}
        onSubmitted={handleRefresh}
      />
    </PortalLayout>
  );
}
