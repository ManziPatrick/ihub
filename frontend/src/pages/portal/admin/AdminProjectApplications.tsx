import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  FileText, Search, CheckCircle2, XCircle, Clock, Eye,
  ChevronRight, Loader2, Building2, User2, Calendar,
  FileCheck, AlertCircle, Shield, ExternalLink, Filter, RefreshCw
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const GET_PROJECT_APPLICATIONS = gql`
  query GetProjectApplications($status: String) {
    projectApplications(status: $status) {
      id
      title
      description
      status
      ndaSigned
      reviewNotes
      createdAt
      updatedAt
      client {
        id
        fullName
        email
        avatar
      }
      requiredDocuments {
        overviewUrl
        featuresUrl
        technicalUrl
      }
    }
  }
`;

const REVIEW_APPLICATION = gql`
  mutation ReviewProjectApplication($applicationId: ID!, $status: String!, $notes: String) {
    reviewProjectApplication(applicationId: $applicationId, status: $status, notes: $notes) {
      id
      status
      reviewNotes
      updatedAt
    }
  }
`;

const INITIALIZE_PROJECT = gql`
  mutation InitializeProjectFromApplication($applicationId: ID!, $course: String!, $mentorIds: [ID!]!) {
    initializeProjectFromApplication(applicationId: $applicationId, course: $course, mentorIds: $mentorIds) {
      id
      title
      status
    }
  }
`;

const GET_TRAINERS = gql`
  query GetTrainers {
    getAllTrainers {
      id
      fullName
      email
    }
  }
`;

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  submitted: { label: "Submitted", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Clock },
  under_review: { label: "Under Review", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Eye },
  approved: { label: "Approved", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
};

export default function AdminProjectApplications() {
  const [tab, setTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"review" | "initialize" | null>(null);
  const [reviewStatus, setReviewStatus] = useState("approved");
  const [reviewNotes, setReviewNotes] = useState("");
  const [courseName, setCourseName] = useState("");
  const [selectedMentorIds, setSelectedMentorIds] = useState<string[]>([]);

  const statusFilter = tab === "all" ? undefined : tab;
  const { data, loading, refetch } = useQuery(GET_PROJECT_APPLICATIONS, {
    variables: { status: statusFilter },
    fetchPolicy: "cache-and-network",
  });

  const { data: trainersData } = useQuery(GET_TRAINERS);

  const [reviewApp, { loading: reviewing }] = useMutation(REVIEW_APPLICATION);
  const [initProject, { loading: initializing }] = useMutation(INITIALIZE_PROJECT);

  const applications = (data as any)?.projectApplications || [];
  const trainers = (trainersData as any)?.getAllTrainers || [];

  const filtered = applications.filter((app: any) => {
    const q = searchQuery.toLowerCase();
    return (
      app.title.toLowerCase().includes(q) ||
      app.client?.fullName?.toLowerCase().includes(q) ||
      app.client?.email?.toLowerCase().includes(q)
    );
  });

  const tabCounts = {
    all: applications.length,
    submitted: applications.filter((a: any) => a.status === "submitted").length,
    under_review: applications.filter((a: any) => a.status === "under_review").length,
    approved: applications.filter((a: any) => a.status === "approved").length,
    rejected: applications.filter((a: any) => a.status === "rejected").length,
  };

  const handleReview = async () => {
    if (!selectedApp) return;
    try {
      await reviewApp({
        variables: { applicationId: selectedApp.id, status: reviewStatus, notes: reviewNotes },
      });
      toast.success(`Application ${reviewStatus === "approved" ? "approved" : "updated"} successfully`);
      setSelectedApp(null);
      setViewMode(null);
      setReviewNotes("");
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleInitialize = async () => {
    if (!selectedApp || !courseName) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await initProject({
        variables: { applicationId: selectedApp.id, course: courseName, mentorIds: selectedMentorIds },
      });
      toast.success("Project created and workspace initialized!");
      setSelectedApp(null);
      setViewMode(null);
      setCourseName("");
      setSelectedMentorIds([]);
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openReview = (app: any) => {
    setSelectedApp(app);
    setReviewStatus(app.status === "submitted" ? "under_review" : "approved");
    setReviewNotes(app.reviewNotes || "");
    setViewMode("review");
  };

  const openInitialize = (app: any) => {
    setSelectedApp(app);
    setViewMode("initialize");
  };

  return (
    <PortalLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-medium">Project Applications</h1>
            <p className="text-muted-foreground mt-1">
              Review incoming client project proposals and manage the approval workflow.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 self-start">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { key: "submitted", label: "Pending Review", color: "text-blue-500", bg: "bg-blue-500/10" },
            { key: "under_review", label: "Under Review", color: "text-amber-500", bg: "bg-amber-500/10" },
            { key: "approved", label: "Approved", color: "text-green-500", bg: "bg-green-500/10" },
            { key: "rejected", label: "Rejected", color: "text-red-500", bg: "bg-red-500/10" },
          ].map(({ key, label, color, bg }) => (
            <Card key={key} className="border-border/50 cursor-pointer hover:border-accent/30 transition-colors" onClick={() => setTab(key)}>
              <CardContent className="pt-4 pb-3">
                <div className={`inline-flex p-2 rounded-lg ${bg} mb-2`}>
                  {(() => { const Icon = statusConfig[key].icon; return <Icon className={`w-4 h-4 ${color}`} />; })()}
                </div>
                <p className={`text-2xl font-black ${color}`}>{tabCounts[key as keyof typeof tabCounts]}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by project title, client name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card border-border/50"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-card border border-border/50 rounded-xl p-1 flex-wrap h-auto">
            {["all", "submitted", "under_review", "approved", "rejected"].map((t) => (
              <TabsTrigger key={t} value={t} className="rounded-lg text-xs font-semibold capitalize">
                {t.replace("_", " ")}
                <span className="ml-1.5 text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-bold">
                  {tabCounts[t as keyof typeof tabCounts] ?? applications.length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center min-h-[30vh]">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No applications found</p>
                <p className="text-xs mt-1">
                  {searchQuery ? "Try a different search query" : "No applications in this category yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((app: any) => {
                  const cfg = statusConfig[app.status] || statusConfig.submitted;
                  const StatusIcon = cfg.icon;
                  return (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 bg-card border border-border/50 rounded-2xl hover:border-accent/30 transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-6 h-6 text-accent" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-bold text-sm">{app.title}</h3>
                            <Badge variant="outline" className={`text-[10px] uppercase font-bold ${cfg.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {cfg.label}
                            </Badge>
                            {app.ndaSigned && (
                              <Badge className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                                <Shield className="w-3 h-3" /> NDA Signed
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{app.description}</p>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <User2 className="w-3.5 h-3.5" />
                              {app.client?.fullName || "Unknown"} ({app.client?.email})
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              Submitted {format(new Date(parseInt(app.createdAt)), "MMM d, yyyy")}
                            </span>
                          </div>

                          {/* Document Links */}
                          {(app.requiredDocuments?.overviewUrl || app.requiredDocuments?.featuresUrl || app.requiredDocuments?.technicalUrl) && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {app.requiredDocuments.overviewUrl && (
                                <a href={app.requiredDocuments.overviewUrl} target="_blank" rel="noreferrer">
                                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1">
                                    <FileText className="w-3 h-3" /> Overview Doc
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </Button>
                                </a>
                              )}
                              {app.requiredDocuments.featuresUrl && (
                                <a href={app.requiredDocuments.featuresUrl} target="_blank" rel="noreferrer">
                                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1">
                                    <FileCheck className="w-3 h-3" /> Features Doc
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </Button>
                                </a>
                              )}
                              {app.requiredDocuments.technicalUrl && (
                                <a href={app.requiredDocuments.technicalUrl} target="_blank" rel="noreferrer">
                                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1">
                                    <AlertCircle className="w-3 h-3" /> Technical Doc
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </Button>
                                </a>
                              )}
                            </div>
                          )}

                          {app.reviewNotes && (
                            <div className="mt-3 p-2 bg-muted/20 rounded-lg text-xs text-muted-foreground border border-border/30">
                              <strong>Admin Note:</strong> {app.reviewNotes}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => openReview(app)}>
                            <Eye className="w-3.5 h-3.5 mr-1" /> Review
                          </Button>
                          {app.status === "approved" && app.ndaSigned && (
                            <Button variant="gold" size="sm" className="text-xs h-8" onClick={() => openInitialize(app)}>
                              <ChevronRight className="w-3.5 h-3.5 mr-1" /> Init Project
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Dialog */}
      <AnimatePresence>
        {viewMode === "review" && selectedApp && (
          <Dialog open onOpenChange={() => { setSelectedApp(null); setViewMode(null); }}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-accent" />
                  Review Application
                </DialogTitle>
                <DialogDescription>{selectedApp.title}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="p-3 bg-muted/20 rounded-xl text-sm">
                  <p className="text-xs text-muted-foreground mb-1">Client</p>
                  <p className="font-bold">{selectedApp.client?.fullName}</p>
                  <p className="text-xs text-muted-foreground">{selectedApp.client?.email}</p>
                </div>

                <div className="p-3 bg-muted/20 rounded-xl text-sm">
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm leading-relaxed">{selectedApp.description}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Update Status</label>
                  <Select value={reviewStatus} onValueChange={setReviewStatus}>
                    <SelectTrigger className="bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="approved">Approve</SelectItem>
                      <SelectItem value="rejected">Reject</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Admin Notes (Optional)</label>
                  <Textarea
                    placeholder="Add feedback or review notes for the client..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setSelectedApp(null); setViewMode(null); }}>Cancel</Button>
                <Button
                  variant={reviewStatus === "rejected" ? "destructive" : "gold"}
                  onClick={handleReview}
                  disabled={reviewing}
                >
                  {reviewing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {reviewStatus === "approved" ? "Approve Application" : reviewStatus === "rejected" ? "Reject Application" : "Save Review"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Initialize Project Dialog */}
        {viewMode === "initialize" && selectedApp && (
          <Dialog open onOpenChange={() => { setSelectedApp(null); setViewMode(null); }}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ChevronRight className="w-5 h-5 text-accent" />
                  Initialize Project Workspace
                </DialogTitle>
                <DialogDescription>
                  Set up the development environment for "{selectedApp.title}". This will create a live project and enable the client workspace.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Category / Course Area</label>
                  <Input
                    placeholder="e.g., Full-Stack Web Development, Mobile App"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assign Project Mentors</label>
                  <div className="max-h-48 overflow-y-auto space-y-2 border border-border/50 rounded-xl p-3">
                    {trainers.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No trainers available</p>
                    ) : (
                      trainers.map((t: any) => (
                        <label key={t.id} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={selectedMentorIds.includes(t.id)}
                            onChange={(e) => {
                              setSelectedMentorIds(prev =>
                                e.target.checked ? [...prev, t.id] : prev.filter(id => id !== t.id)
                              );
                            }}
                          />
                          <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                            {t.fullName?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium group-hover:text-accent transition-colors">{t.fullName}</p>
                            <p className="text-[10px] text-muted-foreground">{t.email}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setSelectedApp(null); setViewMode(null); }}>Cancel</Button>
                <Button variant="gold" onClick={handleInitialize} disabled={initializing || !courseName}>
                  {initializing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                  Launch Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </PortalLayout>
  );
}
