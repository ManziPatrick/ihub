import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  X,
  Sparkles,
  Image,
  Link2,
  FileUp,
  ScanLine,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getApiBaseUrl } from "@/lib/env";

interface ParsedLesson {
  title: string;
  duration: number;
  type: string;
  content: string;
  videoUrl: string;
  fileUrl: string;
}

interface ParsedModule {
  title: string;
  description: string;
  lessons: ParsedLesson[];
}

interface ParsedCourse {
  title: string;
  description: string;
  category: string;
  level: string;
  modules: ParsedModule[];
  errors: string[];
}

interface CourseDocumentUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (data: ParsedCourse) => void;
}

type InputTab = "document" | "image" | "google-doc";

export function CourseDocumentUpload({
  open,
  onOpenChange,
  onApply,
}: CourseDocumentUploadProps) {
  const [activeTab, setActiveTab] = useState<InputTab>("document");

  // Shared state
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsed, setParsed] = useState<ParsedCourse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});

  // Document upload state
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image OCR state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Google Docs state
  const [googleDocUrl, setGoogleDocUrl] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/rtf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    const validExts = ["pdf", "txt", "docx", "doc", "rtf"];

    if (
      !allowedTypes.includes(selectedFile.type) &&
      !validExts.includes(ext || "")
    ) {
      toast.error("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error("File size exceeds 50MB limit.");
      return;
    }

    setFile(selectedFile);
    setParsed(null);
    setError(null);
    uploadAndParse(selectedFile, "/api/upload/parse-course-document");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    const validExts = ["jpg", "jpeg", "png", "webp"];

    if (
      !allowedTypes.includes(selectedFile.type) &&
      !validExts.includes(ext || "")
    ) {
      toast.error("Unsupported image format. Please upload a JPG, PNG, or WebP image.");
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      toast.error("Image size exceeds 20MB limit.");
      return;
    }

    setImageFile(selectedFile);
    setParsed(null);
    setError(null);
    uploadAndParse(selectedFile, "/api/upload/parse-course-document");
  };

  const handleGoogleDocImport = async () => {
    if (!googleDocUrl.trim()) {
      toast.error("Please enter a Google Doc URL or document ID.");
      return;
    }

    setParsed(null);
    setError(null);
    setUploading(true);
    setProgress(20);

    try {
      const token = localStorage.getItem("ihub_token");
      const baseUrl = getApiBaseUrl();

      setProgress(40);

      const response = await fetch(`${baseUrl}/api/upload/parse-google-doc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: googleDocUrl.trim() }),
      });

      setProgress(70);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to import Google Doc");
      }

      const result = await response.json();
      setProgress(100);

      if (result.success && result.data) {
        setParsed(result.data);
        if (result.data.errors?.length > 0) {
          toast.warning(
            `Google Doc imported with ${result.data.errors.length} issue(s). Check the preview for details.`
          );
        } else {
          toast.success("Google Doc imported successfully! Review the preview below.");
        }
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      setError(err.message || "Failed to import Google Doc");
      toast.error(err.message || "Failed to import Google Doc");
    } finally {
      setUploading(false);
    }
  };

  const uploadAndParse = async (file: File, endpoint: string) => {
    setUploading(true);
    setProgress(10);
    setError(null);

    try {
      const token = localStorage.getItem("ihub_token");
      const formData = new FormData();
      formData.append("file", file);

      setProgress(30);

      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      setProgress(70);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to parse document");
      }

      const result = await response.json();
      setProgress(100);

      if (result.success && result.data) {
        setParsed(result.data);
        if (result.data.errors?.length > 0) {
          toast.warning(
            `Document parsed with ${result.data.errors.length} issue(s). Check the preview for details.`
          );
        } else {
          toast.success("Document parsed successfully! Review the preview below.");
        }
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      setError(err.message || "Failed to parse document");
      toast.error(err.message || "Failed to parse document");
    } finally {
      setUploading(false);
    }
  };

  const handleApply = () => {
    if (parsed) {
      onApply(parsed);
      handleClose();
    }
  };

  const handleClose = () => {
    setFile(null);
    setImageFile(null);
    setGoogleDocUrl("");
    setParsed(null);
    setError(null);
    setProgress(0);
    setExpandedModules({});
    setActiveTab("document");
    onOpenChange(false);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as InputTab);
    setFile(null);
    setImageFile(null);
    setGoogleDocUrl("");
    setParsed(null);
    setError(null);
    setProgress(0);
  };

  const downloadTemplate = async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/course-template`);
      const text = await response.text();
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "course-template.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Template downloaded!");
    } catch (err: any) {
      toast.error("Failed to download template");
    }
  };

  const toggleModule = (idx: number) => {
    setExpandedModules((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const totalLessons = parsed?.modules?.reduce(
    (acc, m) => acc + m.lessons.length,
    0
  ) || 0;

  const levelColors: Record<string, string> = {
    Beginner: "bg-green-500/20 text-green-400 border-green-500/30",
    Intermediate: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Advanced: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const typeColors: Record<string, string> = {
    video: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    pdf: "bg-red-500/20 text-red-400 border-red-500/30",
    ppt: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    book: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    article: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    quiz: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    assignment: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col bg-card border-border/60">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            Import Course Document
          </DialogTitle>
          <DialogDescription>
            Upload a document or image, or import from Google Docs. The system
            will extract the structure and map it to the course creation form.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 px-1">
          {/* Tab Selector */}
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-3 bg-muted/30 p-1 rounded-xl">
              <TabsTrigger
                value="document"
                className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <FileUp className="w-4 h-4" />
                <span className="hidden sm:inline">Documents</span>
              </TabsTrigger>
              <TabsTrigger
                value="image"
                className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <ScanLine className="w-4 h-4" />
                <span className="hidden sm:inline">Image OCR</span>
              </TabsTrigger>
              <TabsTrigger
                value="google-doc"
                className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Link2 className="w-4 h-4" />
                <span className="hidden sm:inline">Google Docs</span>
              </TabsTrigger>
            </TabsList>

            {/* Template Download (shown in all tabs) */}
            <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-accent/5 border border-accent/20">
              <div className="flex items-center gap-2 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span className="text-muted-foreground">
                  Need a template? Download the course format guide.
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="gap-1.5 border-accent/30 text-accent hover:bg-accent/10 h-8 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Template
              </Button>
            </div>

            {/* Tab: Document Upload */}
            <TabsContent value="document" className="mt-4 space-y-4">
              {!file && !parsed && !uploading && (
                <div
                  className="border-2 border-dashed border-border/60 rounded-2xl p-10 text-center cursor-pointer hover:border-accent/40 hover:bg-accent/5 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const f = e.dataTransfer.files[0];
                    if (f) {
                      const fakeEvent = {
                        target: { files: [f] },
                      } as unknown as React.ChangeEvent<HTMLInputElement>;
                      handleFileChange(fakeEvent);
                    }
                  }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 mx-auto flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-accent" />
                  </div>
                  <p className="text-sm font-bold mb-1">
                    Click to upload or drag & drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOCX, TXT, RTF — Max 50MB
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.docx,.doc,.txt,.rtf"
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </TabsContent>

            {/* Tab: Image OCR */}
            <TabsContent value="image" className="mt-4 space-y-4">
              {!imageFile && !parsed && !uploading && (
                <div>
                  <div
                    className="border-2 border-dashed border-border/60 rounded-2xl p-10 text-center cursor-pointer hover:border-accent/40 hover:bg-accent/5 transition-all"
                    onClick={() => imageInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const f = e.dataTransfer.files[0];
                      if (f) {
                        const fakeEvent = {
                          target: { files: [f] },
                        } as unknown as React.ChangeEvent<HTMLInputElement>;
                        handleImageChange(fakeEvent);
                      }
                    }}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 mx-auto flex items-center justify-center mb-4">
                      <Image className="w-8 h-8 text-emerald-500" />
                    </div>
                    <p className="text-sm font-bold mb-1">
                      Upload an image with text
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      JPG, PNG, WebP — Max 20MB — Text will be extracted via OCR
                    </p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest">
                      <ScanLine className="w-3 h-3" />
                      OCR Powered by Tesseract.js
                    </div>
                    <input
                      type="file"
                      ref={imageInputRef}
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleImageChange}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground/60 mt-3 text-center">
                    Best results with clean, high-contrast text documents.
                    Supports printed text in English.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Tab: Google Docs */}
            <TabsContent value="google-doc" className="mt-4 space-y-4">
              {!parsed && !uploading && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl border border-border/50 bg-muted/10 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Link2 className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Import from Google Docs</p>
                        <p className="text-xs text-muted-foreground">
                          Paste a Google Doc URL below. The document must be
                          publicly shared ("Anyone with the link").
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="https://docs.google.com/document/d/..."
                        value={googleDocUrl}
                        onChange={(e) => setGoogleDocUrl(e.target.value)}
                        className="flex-1 bg-background"
                      />
                      <Button
                        onClick={handleGoogleDocImport}
                        disabled={!googleDocUrl.trim() || uploading}
                        className="gap-2 bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Import
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground/60 space-y-1">
                      <p className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-blue-500" />
                        Make sure your doc follows the course template format (headings, lessons, etc.)
                      </p>
                      <p className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-blue-500" />
                        Docs must be shared with "Anyone with the link" as Viewer
                      </p>
                      <p className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-blue-500" />
                        Supports the same #, ##, ### heading format as the template
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-3 p-5 rounded-2xl bg-muted/30 border border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-accent" />
                  <div>
                    <p className="text-sm font-bold">
                      {activeTab === "google-doc"
                        ? "Importing Google Doc..."
                        : activeTab === "image"
                        ? "Running OCR..."
                        : "Parsing document..."}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activeTab === "google-doc"
                        ? "Fetching and extracting content"
                        : activeTab === "image"
                        ? "Extracting text with OCR"
                        : "Extracting and structuring course content"}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-accent">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Error */}
          {error && !uploading && (
            <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-400">
                    Import Error
                  </p>
                  <p className="text-xs text-muted-foreground">{error}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setImageFile(null);
                  setError(null);
                }}
                className="text-red-400 border-red-500/30 hover:bg-red-500/10"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Parsed Results Preview */}
          {parsed && !uploading && (
            <div className="space-y-5">
              {/* Summary Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">
                        {parsed.title || "Untitled Course"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {parsed.modules.length} modules · {totalLessons} lessons
                        {activeTab === "google-doc"
                          ? " · Imported from Google Docs"
                          : activeTab === "image"
                          ? " · Extracted via OCR"
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {parsed.level && (
                      <Badge
                        className={cn(
                          "border text-[10px] font-black uppercase tracking-widest",
                          levelColors[parsed.level] ||
                            "bg-muted/30 text-muted-foreground"
                        )}
                      >
                        {parsed.level}
                      </Badge>
                    )}
                    {parsed.category && (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-black uppercase tracking-widest"
                      >
                        {parsed.category}
                      </Badge>
                    )}
                  </div>
                </div>

                {parsed.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {parsed.description}
                  </p>
                )}

                {/* Validation Errors */}
                {parsed.errors.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
                      <AlertTriangle className="w-4 h-4" />
                      {parsed.errors.length} Issue
                      {parsed.errors.length > 1 ? "s" : ""}
                    </div>
                    <ul className="space-y-1">
                      {parsed.errors.map((err, i) => (
                        <li
                          key={i}
                          className="text-xs text-amber-400/80 flex items-start gap-2"
                        >
                          <span className="mt-0.5">•</span>
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Modules & Lessons Preview */}
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Course Structure Preview
                </p>

                {parsed.modules.map((mod, mIdx) => (
                  <div
                    key={mIdx}
                    className="rounded-2xl border border-border/40 overflow-hidden"
                  >
                    <button
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      onClick={() => toggleModule(mIdx)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-bold text-xs">
                          {mIdx + 1}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold">
                            {mod.title || "Untitled Module"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {mod.lessons.length} lesson
                            {mod.lessons.length !== 1 ? "s" : ""}
                            {mod.description
                              ? ` · ${mod.description.substring(0, 60)}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      {expandedModules[mIdx] ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground/50" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                      )}
                    </button>

                    {expandedModules[mIdx] && (
                      <div className="border-t border-border/40 divide-y divide-border/20">
                        {mod.lessons.map((lesson, lIdx) => (
                          <div
                            key={lIdx}
                            className="p-3 pl-14 flex items-center gap-3 hover:bg-muted/20 transition-colors"
                          >
                            <div
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0",
                                typeColors[lesson.type] ||
                                  "bg-muted/30 text-muted-foreground"
                              )}
                            >
                              {lesson.type}
                            </div>
                            <p className="text-sm flex-1 min-w-0 truncate">
                              {lesson.title || "Untitled Lesson"}
                            </p>
                            <span className="text-[10px] text-muted-foreground shrink-0 font-bold">
                              {lesson.duration} min
                            </span>
                          </div>
                        ))}
                        {mod.lessons.length === 0 && (
                          <p className="p-4 pl-14 text-xs text-muted-foreground italic">
                            No lessons in this module
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {parsed.modules.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground rounded-2xl border border-border/40">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                    No modules were detected in your document.
                    <br />
                    Make sure it follows the template format.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-border/40 pt-4 flex items-center gap-3">
          {parsed && !uploading && (
            <div className="flex items-center gap-2 flex-1">
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setImageFile(null);
                  setGoogleDocUrl("");
                  setParsed(null);
                  setError(null);
                }}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                {activeTab === "google-doc" ? "New URL" : "Upload Different"}
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose}>
              {parsed ? "Cancel" : "Close"}
            </Button>
            {parsed && !uploading && (
              <Button
                onClick={handleApply}
                className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={parsed.errors.length > 0 && !parsed.title}
              >
                <CheckCircle2 className="w-4 h-4" />
                Apply to Form
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
