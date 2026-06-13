import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TextEditor } from "@/components/ui/text-editor";
import { FileUpload } from "@/components/FileUpload";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { toast } from "sonner";
import { RESTORE_PROJECT_APPLICATION } from "@/lib/graphql/mutations";
import { ConfirmDialog } from "@/components/portal/dialogs/ConfirmDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  CheckCircle,
  FileSignature,
  Send,
  Loader2,
  UserCheck,
  X,
  Trash2,
  Shield,
  Coins,
  Link2,
  PenLine,
  Building,
} from "lucide-react";

// ─── GraphQL ──────────────────────────────────────────────────────────────────
const GET_MY_APPLICATIONS = gql`
  query GetMyApplications {
    myProjectApplications {
      id
      title
      description
      status
      ndaSigned
      ndaPdfUrl
      reviewNotes
      assignedAdmin {
        id
        fullName
      }
      requiredDocuments {
        overviewUrl
        featuresUrl
        technicalUrl
      }
      createdAt
    }
  }
`;

const NDA_DAILY_LIMIT_STATUS = gql`
  query NdaDailyLimitStatus {
    ndaDailyLimitStatus {
      remaining
      limit
    }
  }
`;

const SUBMIT_APPLICATION = gql`
  mutation SubmitProjectApplication(
    $title: String!
    $description: String!
    $documents: ProjectApplicationDocumentsInput!
    $assignedAdminId: ID
  ) {
    submitProjectApplication(title: $title, description: $description, documents: $documents, assignedAdminId: $assignedAdminId) {
      id
      title
      status
    }
  }
`;

const DELETE_APPLICATION = gql`
  mutation DeleteProjectApplication($applicationId: ID!) {
    deleteProjectApplication(applicationId: $applicationId) {
      id
      title
      status
    }
  }
`;

const UPDATE_APPLICATION = gql`
  mutation UpdateProjectApplication(
    $applicationId: ID!
    $title: String
    $description: String
    $documents: ProjectApplicationDocumentsInput
  ) {
    updateProjectApplication(applicationId: $applicationId, title: $title, description: $description, documents: $documents) {
      id
      title
      description
      status
    }
  }
`;

const SIGN_NDA = gql`
  mutation SignProjectNDA($applicationId: ID!, $signerName: String!) {
    signProjectNDA(applicationId: $applicationId, signerName: $signerName) {
      id
      status
      signerName
      signedAt
      ndaPdfUrl
    }
  }
`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Application {
  id: string;
  title: string;
  description: string;
  status: string;
  ndaSigned: boolean;
  reviewNotes?: string;
  createdAt: string;
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ClientApplications() {
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedAdminId, setAssignedAdminId] = useState("");
  const [overviewUrl, setOverviewUrl] = useState("");
  const [featuresUrl, setFeaturesUrl] = useState("");
  const [technicalUrl, setTechnicalUrl] = useState("");

  // NDA signing
  const [signingAppId, setSigningAppId] = useState<string | null>(null);
  const [signerName, setSignerName] = useState("");
  const [agreed, setAgreed] = useState(false);

  // Tokens from server
  const { data: limitData } = useQuery(NDA_DAILY_LIMIT_STATUS, { fetchPolicy: "cache-and-network" });
  const limitStatus = (limitData as any)?.ndaDailyLimitStatus;
  const tokens = limitStatus?.remaining ?? 0;

  // Apollo
  const { data, loading, refetch } = useQuery(GET_MY_APPLICATIONS);
  const [submitApp, { loading: submitting }] = useMutation(SUBMIT_APPLICATION);
  const [signNda, { loading: signing }] = useMutation(SIGN_NDA);
  const [deleteApp, { loading: deleting }] = useMutation(DELETE_APPLICATION, {
    onCompleted: (data: any) => {
      const deletedId = data?.deleteProjectApplication?.id;
      if (!deletedId) return;
      window.dispatchEvent(new CustomEvent('bell-ring'));
      toast.success("Proposal deleted", {
        description: "You can undo this action within 10 seconds.",
        duration: 10000,
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await restoreApp({ variables: { applicationId: deletedId } });
              toast.success("Proposal restored!");
              refetch();
            } catch (err: any) {
              toast.error(err.message);
            }
          },
        },
      });
      refetch();
    },
    onError: (err: any) => toast.error(err.message),
  });
  const [restoreApp] = useMutation(RESTORE_PROJECT_APPLICATION);
  const [updateApp, { loading: updating }] = useMutation(UPDATE_APPLICATION);

  // Edit & Delete state
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const applications: Application[] = (data as any)?.myProjectApplications || [];

  // ── Helpers ────────────────────────────────────────────────────────────────
  const resetModal = () => {
    setSigningAppId(null);
    setSignerName("");
    setAgreed(false);
  };

  // Admins available for selection
  const { data: adminsData } = useQuery(gql`
    query GetAdminsForSelection {
      getAvailableAdmins {
        id
        fullName
        email
      }
    }
  `, { fetchPolicy: "cache-and-network" });
  const availableAdmins = ((adminsData as any)?.getAvailableAdmins || []).filter(
    (u: any) => u.fullName || u.email
  );

  // ── Form submit ────────────────────────────────────────────────────────────
  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error("Please fill in the project title and description.");
      return;
    }
    try {
      await submitApp({
        variables: {
          title,
          description,
          assignedAdminId: assignedAdminId || undefined,
          documents: {
            overviewUrl: overviewUrl || "https://example.com/doc-overview.pdf",
            featuresUrl: featuresUrl || "https://example.com/doc-features.pdf",
            technicalUrl: technicalUrl || "https://example.com/doc-tech.pdf",
          },
        },
      });
      toast.success("Project proposal submitted successfully!");
      setTitle(""); setDescription(""); setAssignedAdminId(""); setOverviewUrl(""); setFeaturesUrl(""); setTechnicalUrl("");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit proposal.");
    }
  };

  // ── NDA execute ────────────────────────────────────────────────────────────
  const handleSignNda = async () => {
    if (!signerName.trim()) { toast.error("Please enter your full legal name."); return; }
    if (tokens <= 0) { toast.error("No signing tokens remaining."); return; }
    try {
      await signNda({ variables: { applicationId: signingAppId, signerName } });
      toast.success("NDA executed successfully!");
      resetModal();
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to execute NDA.");
    }
  };

  // ── Status badge ───────────────────────────────────────────────────────────
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "submitted": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "under_review": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "approved": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "rejected": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <PortalLayout>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
              Project Proposal Dashboard
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Submit project briefs, upload specifications, and execute legal agreements.
            </p>
          </div>
          <TokenBadge tokens={tokens} />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Proposal Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50 bg-gradient-to-br from-card to-muted/10">
              <CardHeader>
                <CardTitle className="text-xl font-heading flex items-center gap-2">
                  <Send className="w-5 h-5 text-accent" />
                  Submit New Project Brief
                </CardTitle>
                <CardDescription>
                  Apply to have our developers build your customized product.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateApplication} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Project Title</label>
                    <Input
                      placeholder="e.g., E-Commerce Hub with Mobile App"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Detailed Description</label>
                    <TextEditor
                      value={description}
                      onChange={setDescription}
                      placeholder="Detail the scope of work, technical guidelines, and objectives…"
                    />
                  </div>

                  {/* Admin Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-accent" />
                      Assign to Admin
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Select an admin to review and manage your project proposal.
                    </p>
                    <Select value={assignedAdminId} onValueChange={setAssignedAdminId}>
                      <SelectTrigger className="bg-card">
                        <SelectValue placeholder="Choose an admin..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAdmins.length === 0 ? (
                          <SelectItem value="__none__" disabled>
                            No admins available
                          </SelectItem>
                        ) : (
                          availableAdmins.map((admin: any) => (
                            <SelectItem key={admin.id} value={admin.id}>
                              {admin.fullName || admin.email}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Document URLs */}
                  <div className="border-t border-border/30 pt-4 mt-6 space-y-4">
                    <h4 className="text-sm font-bold text-accent uppercase tracking-wider">
                      Specification Documents
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Provide hosted links for your specification documents. Upload a PDF or paste a URL directly.
                    </p>
                    <div className="grid md:grid-cols-3 gap-6">
                      {[
                        { label: "Project Overview URL", key: 'overview', value: overviewUrl, setter: setOverviewUrl },
                        { label: "System Features URL", key: 'features', value: featuresUrl, setter: setFeaturesUrl },
                        { label: "Technical Specs URL", key: 'technical', value: technicalUrl, setter: setTechnicalUrl },
                      ].map(({ label, key, value, setter }) => (
                        <div key={key} className="space-y-2 border border-border/30 rounded-xl p-3 bg-muted/10">
                          <label className="text-xs font-semibold flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-accent" />
                            {label}
                          </label>
                          <div className="flex items-center gap-2">
                            <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <Input
                              placeholder="https://drive.google.com/…"
                              value={value}
                              onChange={(e) => setter(e.target.value)}
                              className="text-xs"
                            />
                          </div>
                          <div className="relative">
                            <FileUpload
                              onUploadComplete={(url) => setter(url)}
                              folder={`ihub-academy/proposals/${key}`}
                              accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                              maxSizeMB={50}
                              label={`Upload ${label}`}
                            />
                          </div>
                          {value && (
                            <div className="flex items-center gap-1.5 text-[10px] text-green-500 font-medium">
                              <CheckCircle className="w-3 h-3" />
                              <span className="truncate max-w-[180px]">{value.split('/').pop() || 'Document attached'}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button type="submit" variant="gold" size="lg" className="w-full md:w-auto" disabled={submitting}>
                      {submitting ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</>
                      ) : (
                        <>Submit Proposal <Send className="w-4 h-4 ml-2" /></>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Applications Sidebar */}
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Your Submissions</CardTitle>
                <CardDescription>Monitor review progress and sign agreements.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="space-y-3">
                    <div className="h-20 bg-muted/40 animate-pulse rounded-lg" />
                    <div className="h-20 bg-muted/40 animate-pulse rounded-lg" />
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                    <Building className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No applications submitted yet.</p>
                  </div>
                ) : (
                  applications.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 bg-muted/20 border border-border/50 rounded-xl space-y-3 hover:border-accent/40 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm line-clamp-1 flex-1">{app.title}</h4>
                        <Badge
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 ml-2 ${getStatusBadgeColor(app.status)}`}
                          variant="outline"
                        >
                          {app.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: app.description }} />

                      {app.reviewNotes && (
                        <div className="p-2 bg-accent/5 rounded border border-accent/10 text-[11px] text-muted-foreground">
                          <strong>Notes:</strong> {app.reviewNotes}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        {app.status === "submitted" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={() => {
                                setEditingApp(app);
                                setEditTitle(app.title);
                                setEditDescription(app.description);
                              }}
                            >
                              <PenLine className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs text-red-400 border-red-500/20 hover:bg-red-500/10"
                              onClick={() => setDeleteTarget(app.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Delete
                            </Button>
                          </>
                        )}
                        {app.status === "approved" && !app.ndaSigned && (
                          <Button
                            variant="gold"
                            size="sm"
                            className="w-full text-xs font-bold"
                            onClick={() => { setSigningAppId(app.id); setAgreed(false); }}
                          >
                            <FileSignature className="w-3.5 h-3.5 mr-1" />
                            Sign Pending NDA
                          </Button>
                        )}
                        {app.ndaSigned && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-green-500 font-bold">
                              <CheckCircle className="w-3.5 h-3.5" />
                              NDA Executed
                            </div>
                            {(app as any).ndaPdfUrl && (
                              <a href={(app as any).ndaPdfUrl} target="_blank" rel="noreferrer">
                                <Button variant="outline" size="sm" className="text-[10px] h-6 gap-1">
                                  <FileSignature className="w-3 h-3" />
                                  View NDA
                                </Button>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── NDA SIGNING MODAL (SIMPLIFIED) ────────────────────────────────── */}
        <AnimatePresence>
          {signingAppId && (
            <motion.div
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-card border border-border/50 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
              >
                {/* Modal Header */}
                <div className="p-5 border-b border-border/30 flex items-center justify-between">
                  <h3 className="font-heading text-lg font-bold flex items-center gap-2">
                    <FileSignature className="w-5 h-5 text-accent" />
                    Sign Non-Disclosure Agreement
                  </h3>
                  <button onClick={resetModal} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-5">
                  {/* Agreement summary */}
                  <div className="bg-muted/20 rounded-xl p-4 border border-border/30 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> Agreement
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You are about to electronically sign a Mutual Non-Disclosure Agreement. This
                      legally binds you to protect confidential information shared during the project.
                    </p>
                  </div>

                  {/* Tokens */}
                  <div className={`flex items-start gap-3 p-4 rounded-xl border ${
                    tokens <= 0
                      ? "bg-red-500/10 border-red-500/20 text-red-400"
                      : tokens <= 1
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  }`}>
                    <Coins className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm">
                        {tokens <= 0 ? "No signing tokens remaining" : `${tokens} signing token${tokens !== 1 ? "s" : ""} remaining (daily limit 100)`}
                      </p>
                      <p className="text-xs mt-0.5 opacity-80">
                        {tokens <= 0 ? "Contact support to increase your daily limit." : `Each signature uses 1 token.`}
                      </p>
                    </div>
                  </div>

                  {/* Name input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Digital Signature — Full Legal Name
                    </label>
                    <Input
                      placeholder="e.g., Jane Doe"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="text-sm"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Your name, timestamp, and IP address will be recorded for compliance.
                    </p>
                  </div>

                  {/* Agreement checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-amber-400 w-4 h-4"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                    />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                      I confirm that I have read, understood, and agree to be legally bound by the terms of this
                      Non-Disclosure Agreement on behalf of myself and my organization.
                    </span>
                  </label>
                </div>

                {/* Modal Footer */}
                <div className="p-5 border-t border-border/30 flex items-center justify-between gap-3">
                  <Button variant="ghost" onClick={resetModal}>Cancel</Button>
                  <Button
                    variant="gold"
                    disabled={signing || !signerName.trim() || !agreed || tokens <= 0}
                    onClick={handleSignNda}
                    className="min-w-40"
                  >
                    {signing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing…</>
                    ) : (
                      <><FileSignature className="w-4 h-4 mr-2" /> Execute Agreement</>
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── DELETE CONFIRMATION ─────────────────────────────────────────── */}
        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
          title="Delete Proposal"
          description="Are you sure you want to delete this proposal? This action cannot be undone."
          confirmText="Delete"
          variant="destructive"
          icon={Trash2}
          loading={deleting}
          onConfirm={async () => {
            if (!deleteTarget) return;
            try {
              await deleteApp({ variables: { applicationId: deleteTarget } });
              toast.success("Proposal deleted.");
              setDeleteTarget(null);
              refetch();
            } catch (err: any) {
              toast.error(err.message);
            }
          }}
        />

        {/* ── EDIT APPLICATION MODAL ──────────────────────────────────────── */}
        <AnimatePresence>
          {editingApp && (
            <motion.div
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-card border border-border/50 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
              >
                <div className="p-5 border-b border-border/30 flex items-center justify-between">
                  <h3 className="font-heading text-lg font-bold flex items-center gap-2">
                    <PenLine className="w-5 h-5 text-accent" /> Edit Proposal
                  </h3>
                  <button onClick={() => setEditingApp(null)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Project Title</label>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Description</label>
                    <textarea
                      className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[150px] resize-y"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </div>
                </div>
                <div className="p-5 border-t border-border/30 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setEditingApp(null)}>Cancel</Button>
                  <Button
                    variant="gold"
                    onClick={async () => {
                      try {
                        await updateApp({
                          variables: {
                            applicationId: editingApp.id,
                            title: editTitle,
                            description: editDescription,
                          },
                        });
                        toast.success("Proposal updated!");
                        setEditingApp(null);
                        refetch();
                      } catch (err: any) {
                        toast.error(err.message);
                      }
                    }}
                    disabled={updating || !editTitle.trim()}
                  >
                    {updating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : <><Send className="w-4 h-4 mr-2" /> Save Changes</>}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PortalLayout>
  );
}
