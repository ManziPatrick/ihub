import { useState, useRef, useCallback, useEffect } from "react";
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
import {
  FileText,
  CheckCircle,
  FileSignature,
  AlertCircle,
  Send,
  Loader2,
  Lock,
  Building,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  PenLine,
  Trash2,
  Shield,
  Eye,
  Coins,
  Link2,
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

const SUBMIT_APPLICATION = gql`
  mutation SubmitProjectApplication(
    $title: String!
    $description: String!
    $documents: ProjectApplicationDocumentsInput!
  ) {
    submitProjectApplication(title: $title, description: $description, documents: $documents) {
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
    }
  }
`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface SignatureField {
  id: string;
  x: number; // percent of page width
  y: number; // percent of page height
  label: string;
}

interface Application {
  id: string;
  title: string;
  description: string;
  status: string;
  ndaSigned: boolean;
  reviewNotes?: string;
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
// Signing tokens give the system "signing credits". We start with 3, each
// successful NDA execution costs 1. Display the remaining count prominently.
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

// ─── PDF Viewer (vanilla canvas — no react-pdf needed) ───────────────────────
// We render a placeholder canvas-based "PDF page" when the browser can't
// load the PDF natively, and let the <embed> handle real PDF viewing.
// For signature placement we overlay a transparent drag surface.

interface PdfViewerProps {
  file: File | null;
  signatureFields: SignatureField[];
  onAddField: (x: number, y: number) => void;
  onRemoveField: (id: string) => void;
  draggingField: string | null;
  setDraggingField: (id: string | null) => void;
  onFieldMove: (id: string, x: number, y: number) => void;
}

function PdfViewer({
  file,
  signatureFields,
  onAddField,
  onRemoveField,
  draggingField,
  setDraggingField,
  onFieldMove,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [placingMode, setPlacingMode] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!file) { setObjectUrl(null); return; }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!placingMode) return;
      const rect = containerRef.current!.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      onAddField(Math.max(0, Math.min(90, x)), Math.max(0, Math.min(95, y)));
      setPlacingMode(false);
    },
    [placingMode, onAddField]
  );

  const handleFieldMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const el = (e.target as HTMLElement).closest("[data-field]") as HTMLElement;
    const rect = el?.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - (rect?.left ?? 0),
      y: e.clientY - (rect?.top ?? 0),
    };
    setDraggingField(id);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingField) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left - dragOffset.current.x) / rect.width) * 100;
    const y = ((e.clientY - rect.top - dragOffset.current.y) / rect.height) * 100;
    onFieldMove(draggingField, Math.max(0, Math.min(90, x)), Math.max(0, Math.min(95, y)));
  };

  if (!file || !objectUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-muted/20 rounded-xl border-2 border-dashed border-border/50 text-muted-foreground text-sm gap-2">
        <FileText className="w-10 h-10 opacity-30" />
        <span>No document loaded</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant={placingMode ? "gold" : "outline"}
          className="text-xs gap-1.5"
          onClick={() => setPlacingMode((p) => !p)}
        >
          <PenLine className="w-3.5 h-3.5" />
          {placingMode ? "Click to Place Signature" : "Add Signature Field"}
        </Button>
        <span className="text-xs text-muted-foreground ml-auto">
          {signatureFields.length} field{signatureFields.length !== 1 ? "s" : ""} placed
        </span>
      </div>

      {placingMode && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Click anywhere on the document to place a signature field
        </motion.div>
      )}

      {/* PDF + overlay */}
      <div
        ref={containerRef}
        className={`relative rounded-xl overflow-hidden border border-border/50 bg-neutral-900 select-none ${
          placingMode ? "cursor-crosshair" : draggingField ? "cursor-grabbing" : "cursor-default"
        }`}
        style={{ minHeight: 520 }}
        onClick={handleContainerClick}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setDraggingField(null)}
        onMouseLeave={() => setDraggingField(null)}
      >
        {/* Native PDF embed */}
        <embed
          src={objectUrl + "#toolbar=0&navpanes=0"}
          type="application/pdf"
          className="w-full"
          style={{ height: 520, pointerEvents: placingMode || draggingField ? "none" : "auto" }}
        />

        {/* Signature fields */}
        {signatureFields.map((field) => (
          <div
            key={field.id}
            data-field={field.id}
            className={`absolute group flex items-center gap-1 bg-accent/90 text-accent-foreground text-[11px] font-semibold rounded px-2 py-1 shadow-lg ${
              draggingField === field.id ? "opacity-80 scale-105" : ""
            } cursor-grab`}
            style={{ left: `${field.x}%`, top: `${field.y}%`, zIndex: 10 }}
            onMouseDown={(e) => handleFieldMouseDown(e, field.id)}
          >
            <PenLine className="w-3 h-3 shrink-0" />
            {field.label}
            <button
              className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-300 hover:text-red-500"
              onClick={(e) => { e.stopPropagation(); onRemoveField(field.id); }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ClientApplications() {
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [overviewUrl, setOverviewUrl] = useState("");
  const [featuresUrl, setFeaturesUrl] = useState("");
  const [technicalUrl, setTechnicalUrl] = useState("");

  // NDA signing modal
  const [signingAppId, setSigningAppId] = useState<string | null>(null);
  const [signerName, setSignerName] = useState("");
  const [step, setStep] = useState<"upload" | "place" | "confirm">("upload");
  const [ndaFile, setNdaFile] = useState<File | null>(null);
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [draggingField, setDraggingField] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tokens
  const { tokens, consume } = useSigningTokens();

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
    setStep("upload");
    setNdaFile(null);
    setSignatureFields([]);
    setAgreed(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are accepted for NDA signing.");
      return;
    }
    setNdaFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { toast.error("Only PDF files are accepted."); return; }
    setNdaFile(file);
  };

  const addSignatureField = (x: number, y: number) => {
    setSignatureFields((prev) => [
      ...prev,
      { id: `sig_${Date.now()}`, x, y, label: "Signature" },
    ]);
  };

  const removeSignatureField = (id: string) =>
    setSignatureFields((prev) => prev.filter((f) => f.id !== id));

  const moveField = (id: string, x: number, y: number) =>
    setSignatureFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, x, y } : f))
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
          documents: {
            overviewUrl: overviewUrl || "https://example.com/doc-overview.pdf",
            featuresUrl: featuresUrl || "https://example.com/doc-features.pdf",
            technicalUrl: technicalUrl || "https://example.com/doc-tech.pdf",
          },
        },
      });
      toast.success("Project proposal submitted successfully!");
      setTitle(""); setDescription(""); setOverviewUrl(""); setFeaturesUrl(""); setTechnicalUrl("");
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
      consume();
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

  // ── Step labels ────────────────────────────────────────────────────────────
  const steps = [
    { key: "upload", label: "Upload Document" },
    { key: "place", label: "Place Signatures" },
    { key: "confirm", label: "Execute NDA" },
  ];

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
                            onClick={() => { setSigningAppId(app.id); setStep("upload"); }}
                          >
                            <FileSignature className="w-3.5 h-3.5 mr-1" />
                            Sign Pending NDA
                          </Button>
                        )}
                        {app.ndaSigned && (
                          <div className="flex items-center gap-1.5 text-xs text-green-500 font-bold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            NDA Executed
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

        {/* ── NDA SIGNING MODAL ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {signingAppId && (
            <motion.div
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-card border border-border/50 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                style={{ maxHeight: "92vh" }}
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
              >
                {/* Modal Header */}
                <div className="p-5 border-b border-border/30 flex items-center justify-between shrink-0">
                  <h3 className="font-heading text-lg font-bold flex items-center gap-2">
                    <Lock className="w-5 h-5 text-accent" />
                    Mutual Non-Disclosure Agreement
                  </h3>
                  <div className="flex items-center gap-3">
                    <TokenBadge tokens={tokens} />
                    <button
                      onClick={resetModal}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Step Indicator */}
                <div className="px-6 pt-4 shrink-0">
                  <div className="flex items-center gap-0">
                    {steps.map((s, i) => {
                      const current = steps.findIndex((x) => x.key === step);
                      const done = i < current;
                      const active = i === current;
                      return (
                        <div key={s.key} className="flex items-center flex-1">
                          <div className={`flex flex-col items-center ${i < steps.length - 1 ? "flex-1" : ""}`}>
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                                done
                                  ? "bg-green-500 border-green-500 text-white"
                                  : active
                                  ? "bg-accent border-accent text-accent-foreground"
                                  : "bg-muted border-border/50 text-muted-foreground"
                              }`}
                            >
                              {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
                            </div>
                            <span className={`text-[10px] mt-1 font-medium ${active ? "text-accent" : "text-muted-foreground"}`}>
                              {s.label}
                            </span>
                          </div>
                          {i < steps.length - 1 && (
                            <div
                              className={`h-0.5 flex-1 mb-4 mx-1 rounded transition-colors ${done ? "bg-green-500" : "bg-border/50"}`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                  {/* STEP 1: Upload PDF */}
                  {step === "upload" && (
                    <motion.div
                      key="upload"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-5"
                    >
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Upload NDA Document</h4>
                        <p className="text-sm text-muted-foreground">
                          Upload the NDA PDF provided by your project manager. You'll place signature fields in the next step.
                        </p>
                      </div>

                      {/* Drop zone */}
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                          ndaFile
                            ? "border-green-500/50 bg-green-500/5"
                            : "border-border/50 hover:border-accent/50 hover:bg-accent/5"
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                        {ndaFile ? (
                          <div className="space-y-2">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                            <p className="font-semibold text-green-400">{ndaFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(ndaFile.size / 1024).toFixed(1)} KB — PDF ready for signing
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-muted-foreground"
                              onClick={(e) => { e.stopPropagation(); setNdaFile(null); }}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Upload className="w-12 h-12 text-muted-foreground/40 mx-auto" />
                            <div>
                              <p className="font-semibold text-foreground">Drag & drop your PDF here</p>
                              <p className="text-xs text-muted-foreground mt-1">or click to browse files</p>
                            </div>
                            <Badge variant="outline" className="text-[10px]">PDF files only</Badge>
                          </div>
                        )}
                      </div>

                      {/* NDA preview summary */}
                      <div className="bg-muted/20 rounded-xl p-4 border border-border/30 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5" /> Agreement Summary
                        </p>
                        {[
                          ["Purpose", "Protect confidentiality of proprietary information exchanged during development."],
                          ["Scope", "Covers product designs, software code, databases, system specs, and strategic roadmaps."],
                          ["Term", "3 years from the execution date."],
                          ["Obligations", "Both parties maintain strict security controls to prevent unauthorized distribution."],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <span className="text-[11px] font-bold text-foreground">{k}: </span>
                            <span className="text-[11px] text-muted-foreground">{v}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: Place signatures */}
                  {step === "place" && (
                    <motion.div
                      key="place"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Place Signature Fields</h4>
                        <p className="text-sm text-muted-foreground">
                          Use "Add Signature Field" to click where you'll sign. Drag fields to reposition them.
                        </p>
                      </div>

                      <PdfViewer
                        file={ndaFile}
                        signatureFields={signatureFields}
                        onAddField={addSignatureField}
                        onRemoveField={removeSignatureField}
                        draggingField={draggingField}
                        setDraggingField={setDraggingField}
                        onFieldMove={moveField}
                      />

                      {signatureFields.length === 0 && (
                        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          Place at least one signature field before proceeding.
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* STEP 3: Confirm & Sign */}
                  {step === "confirm" && (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-5"
                    >
                      {/* Token warning */}
                      <div
                        className={`flex items-start gap-3 p-4 rounded-xl border ${
                          tokens === 0
                            ? "bg-red-500/10 border-red-500/20 text-red-400"
                            : tokens === 1
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        <Coins className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm">
                            {tokens === 0
                              ? "No signing tokens remaining"
                              : `${tokens} signing token${tokens !== 1 ? "s" : ""} remaining`}
                          </p>
                          <p className="text-xs mt-0.5 opacity-80">
                            {tokens === 0
                              ? "You have exhausted your signing tokens. Contact support to purchase more."
                              : `Executing this NDA will consume 1 token. You will have ${tokens - 1} remaining after signing.`}
                          </p>
                        </div>
                      </div>

                      {/* Signature fields summary */}
                      <div className="bg-muted/20 border border-border/30 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" /> Signature Placement Summary
                        </p>
                        {signatureFields.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No signature fields placed.</p>
                        ) : (
                          signatureFields.map((f, i) => (
                            <div key={f.id} className="flex items-center gap-2 text-xs">
                              <PenLine className="w-3 h-3 text-accent" />
                              <span className="text-foreground font-medium">Field {i + 1}</span>
                              <span className="text-muted-foreground">
                                — position ({f.x.toFixed(0)}%, {f.y.toFixed(0)}%)
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Name input */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Digital Signature — Full Legal Name
                        </label>
                        <p className="text-[11px] text-muted-foreground">
                          Type your full legal name below. The system will record your name, timestamp, and IP address for compliance auditing.
                        </p>
                        <Input
                          placeholder="e.g., Jane Doe"
                          value={signerName}
                          onChange={(e) => setSignerName(e.target.value)}
                          className="text-sm"
                        />
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
                    </motion.div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-5 border-t border-border/30 flex items-center justify-between shrink-0 gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (step === "upload") resetModal();
                      else if (step === "place") setStep("upload");
                      else setStep("place");
                    }}
                  >
                    {step === "upload" ? "Cancel" : (
                      <><ChevronLeft className="w-4 h-4 mr-1" /> Back</>
                    )}
                  </Button>

                  <div className="flex items-center gap-3">
                    {step !== "confirm" && <TokenBadge tokens={tokens} />}

                    {step === "upload" && (
                      <Button
                        variant="gold"
                        disabled={!ndaFile}
                        onClick={() => setStep("place")}
                      >
                        Next — Place Signatures <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}

                    {step === "place" && (
                      <Button
                        variant="gold"
                        disabled={signatureFields.length === 0}
                        onClick={() => setStep("confirm")}
                      >
                        Next — Review & Sign <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}

                    {step === "confirm" && (
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
                    )}
                  </div>
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
