import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextEditor } from "@/components/ui/text-editor";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  HelpCircle,
  Lock,
  Trash2,
  Info,
  DollarSign,
  BookOpen,
  Layout,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  ExternalLink,
  Paperclip,
  PlayCircle,
  Check,
  ChevronUp,
  ChevronDown,
  ClipboardList,
  Code,
  Terminal,
  ListOrdered,
  Settings2,
  FileText as FileTextIcon,
  FileUp
} from "lucide-react";
import { ManageQuestionsDialog } from "./ManageQuestionsDialog";
import { ResourceBankDialog } from "./ResourceBankDialog";
import { CourseDocumentUpload } from "@/components/portal/CourseDocumentUpload";
import { ManageAssignmentQuestionsDialog } from "./ManageAssignmentQuestionsDialog";
import { ManageCodeExercisesDialog } from "./ManageCodeExercisesDialog";
import { AssignmentConfigDialog } from "./AssignmentConfigDialog";
import { ExamConfigDialog } from "../ExamConfigDialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FileUpload } from "@/components/FileUpload";

interface EditCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: any | null;
  trainers?: any[];
  onSave?: (course: any) => void;
  onQuizSave?: (course: any) => void;
  isLoading?: boolean;
}

import { useQuery } from "@apollo/client/react";
import { GET_CATEGORIES } from "@/lib/graphql/queries";

// ─── Lesson Card (Modernized) ──────────────────────────────────────────────────
type LessonTab = "details" | "quiz" | "assignment" | "codeExercises";

function LessonCard({
  lesson, lIdx, mIdx, module, formData, setFormData, onQuizOpen, onAssignmentQuestionsOpen, onAssignmentConfigOpen, onCodeExercisesOpen
}: {
  lesson: any; lIdx: number; mIdx: number; module: any;
  formData: any; setFormData: (d: any) => void;
  onQuizOpen: (lesson: any) => void;
  onAssignmentQuestionsOpen: (lesson: any) => void;
  onAssignmentConfigOpen: (lesson: any) => void;
  onCodeExercisesOpen: (lesson: any) => void;
}) {
  const [expanded, setExpanded] = useState(!lesson.title || lesson.title === "New Lesson" || lesson.title === "");
  const [tab, setTab] = useState<LessonTab>("details");
  const [showUpload, setShowUpload] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const updateLesson = (patch: any) => {
    const newModules = [...formData.modules];
    const newLessons = [...module.lessons];
    const updated = { ...lesson, ...patch };
    newLessons[lIdx] = updated;
    newModules[mIdx] = { ...module, lessons: newLessons };
    setFormData({ ...formData, modules: newModules });
    // Auto-collapse when title is filled in
    if (patch.title && patch.title.trim() !== "" && patch.title !== "New Lesson" && expanded) {
      setExpanded(false);
    }
  };

  const deleteLesson = () => {
    const newModules = [...formData.modules];
    newModules[mIdx] = { ...module, lessons: module.lessons.filter((_: any, i: number) => i !== lIdx) };
    setFormData({ ...formData, modules: newModules });
  };

  const isComplete = !!lesson.title && lesson.title.trim() !== "" && lesson.title !== "New Lesson";
  const isQuizType = lesson.type === "quiz";
  const quizCount = lesson.quizQuestions?.length || 0;

  return (
    <div className={cn(
      "rounded-2xl border transition-all duration-300 group/card",
      isComplete && !expanded
        ? "border-green-500/20 bg-green-500/5 hover:bg-muted/10 hover:border-green-500/40"
        : "border-border/40 bg-muted/30 hover:bg-muted/50 hover:border-accent/40"
    )}>
      {/* ── Header (always visible) ── */}
      <div
        className="flex flex-wrap items-center gap-3 p-4 cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}
      >
        {/* L-pill */}
        <div className={cn(
          "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 transition-colors",
          isComplete ? "bg-green-500/80 text-white" : "bg-accent/80 text-accent-foreground shadow-gold"
        )}>
          {isComplete ? <Check className="w-3 h-3 inline" /> : null} L{lIdx + 1}
        </div>

        {/* Title input */}
        <Input
          placeholder="Lesson Title *"
          className={cn(
            "h-9 flex-1 font-bold bg-transparent border-transparent focus:border-border text-sm placeholder:text-muted-foreground/50 hover:border-border/50",
            !lesson.title && "border-amber-500/30"
          )}
          value={lesson.title || ""}
          onClick={e => e.stopPropagation()}
          onChange={e => updateLesson({ title: e.target.value })}
        />

        {/* Quiz count chip — shown when type=quiz */}
        {isQuizType && (
          <div
            className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl shrink-0"
            onClick={e => { e.stopPropagation(); onQuizOpen(lesson); }}
            title="Click to manage quiz questions"
          >
            <HelpCircle className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
              {quizCount > 0 ? `${quizCount} Q` : "Quiz"}
            </span>
          </div>
        )}

        {/* Type selector */}
        <select
          className="h-9 px-3 rounded-xl border border-border/40 bg-muted/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground outline-none focus:border-accent/60 hover:border-border/60 transition-colors shrink-0"
          value={lesson.type || "video"}
          onClick={e => e.stopPropagation()}
          onChange={e => updateLesson({ type: e.target.value })}
        >
          {["video", "pdf", "ppt", "book", "article", "quiz", "assignment"].map(t => (
            <option key={t} value={t}>{t.toUpperCase()}</option>
          ))}
        </select>

        {/* Duration */}
        <div
          className="flex items-center gap-1 bg-muted/50 px-2.5 py-1 rounded-xl border border-border/40 hover:border-border/60 shrink-0 transition-colors"
          onClick={e => e.stopPropagation()}
        >
          <input
            type="number"
            className="w-10 h-7 bg-transparent text-sm font-bold text-center outline-none text-foreground"
            value={lesson.duration || 0}
            onChange={e => updateLesson({ duration: parseInt(e.target.value) || 0 })}
          />
          <span className="text-[10px] text-muted-foreground font-black">MINS</span>
        </div>

        {/* Missing indicator */}
        {!lesson.title && (
          <div className="w-2 h-2 rounded-full bg-amber-400/80 shrink-0 animate-pulse" title="Title required" />
        )}

        {/* Delete */}
        <button
          onClick={e => { e.stopPropagation(); deleteLesson(); }}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {expanded
          ? <ChevronUp className="w-4 h-4 text-muted-foreground/50 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground/50 shrink-0" />
        }
      </div>

      {/* ── Expanded Body ── */}
      {expanded && (
        <div className="border-t border-border/40">
          {/* Tab Bar */}
          <div className="flex border-b border-border/40">
            {([
              { key: "details", label: "Details", icon: FileTextIcon },
              { key: "quiz", label: "Quiz Builder", icon: HelpCircle },
              { key: "assignment", label: "Assignment", icon: ClipboardList },
              { key: "codeExercises", label: "Code", icon: Code },
            ] as { key: LessonTab; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors",
                  tab === key
                    ? "text-accent border-b-2 border-accent -mb-px"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab: Details */}
          {tab === "details" && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                    <PlayCircle className="w-3.5 h-3.5 text-accent" /> Media Stream URL
                  </label>
                  <Input
                    className="h-10 bg-muted/30 border-border/40 text-sm placeholder:text-muted-foreground/30 focus:border-accent/40 hover:border-border/60"
                    placeholder="YouTube, Vimeo, AWS S3..."
                    value={lesson.videoUrl || ""}
                    onChange={e => updateLesson({ videoUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" /> Resource URL
                  </label>
                  <Input
                    className="h-10 bg-muted/30 border-border/40 text-sm placeholder:text-muted-foreground/30 focus:border-accent/40 hover:border-border/60"
                    placeholder="G-Drive, Dropbox, Notion link..."
                    value={lesson.fileUrl || ""}
                    onChange={e => updateLesson({ fileUrl: e.target.value })}
                  />
                </div>
              </div>

              {/* Upload — collapsible */}
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors"
                  onClick={() => setShowUpload(v => !v)}
                >
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    <Paperclip className="w-3.5 h-3.5 text-accent/70" />
                    Upload Resource File
                    {lesson.fileUrl && <span className="px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[8px]">Uploaded</span>}
                  </span>
                  {showUpload ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/30" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/30" />}
                </button>
                {showUpload && (
                  <div className="border-t border-border/40 p-3">
                    {lesson.fileUrl ? (
                      <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg border border-border/40">
                        <span className="text-xs text-muted-foreground/50 truncate max-w-[200px]">{lesson.fileUrl.split('/').pop()}</span>
                        <Button variant="ghost" size="sm" className="h-7 text-red-400 text-[10px] hover:bg-red-500/10" onClick={() => updateLesson({ fileUrl: "" })}>Remove</Button>
                      </div>
                    ) : (
                      <FileUpload
                        folder="course_resources"
                        label="Drag & drop or click to browse"
                        onUploadComplete={url => { updateLesson({ fileUrl: url }); setShowUpload(false); }}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Lesson Notes / Text — collapsible */}
              <div className="rounded-xl border border-border/40 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors"
                  onClick={() => setShowNotes(v => !v)}
                >
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    <FileTextIcon className="w-3.5 h-3.5 text-accent/70" />
                    Lesson Notes / Text
                    {lesson.content && <span className="px-1.5 py-0.5 rounded-full bg-accent/20 text-accent text-[8px]">Added</span>}
                  </span>
                  {showNotes ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/30" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/30" />}
                </button>
                {showNotes && (
                  <div className="border-t border-border/40 prose dark:prose-invert max-w-none lesson-content-viewer">
                    <TextEditor
                      value={lesson.content || ""}
                      onChange={content => updateLesson({ content })}
                      placeholder="Add lesson notes or rich text content for students..."
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Quiz */}
          {tab === "quiz" && (
            <div className="p-4">
              <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground/80">Quiz Builder</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                      {quizCount > 0 ? `${quizCount} question${quizCount !== 1 ? "s" : ""} added` : "No questions yet"}
                    </p>
                  </div>
                  {quizCount > 0 && (
                    <div className="ml-auto px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">{quizCount} Q</span>
                    </div>
                  )}
                </div>

                {/* Question preview pills */}
                {quizCount > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: quizCount }).map((_, i) => (
                      <div key={i} className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                        <span className="text-[10px] font-bold text-amber-400">Q{i + 1}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Multiple-choice questions students answer after completing this lesson.
                </p>
                <Button
                  variant="outline"
                  className="h-10 w-full text-[10px] font-black uppercase tracking-widest border-amber-500/20 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/40 gap-2 transition-colors"
                  onClick={() => onQuizOpen(lesson)}
                >
                  <HelpCircle className="w-4 h-4" />
                  {quizCount > 0 ? "Manage Quiz Questions" : "Add Quiz Questions"}
                </Button>
              </div>
            </div>
          )}

          {/* Tab: Assignment */}
          {tab === "assignment" && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <ListOrdered className="w-5 h-5 text-blue-400" />
                    <p className="font-bold text-sm text-white/80">Exam Questions</p>
                  </div>
                  <Button
                    variant="outline"
                    className="h-10 w-full text-[10px] font-black uppercase tracking-widest border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                    onClick={() => onAssignmentQuestionsOpen(lesson)}
                  >
                    Manage {lesson.assignmentQuestions?.length || 0} Questions
                  </Button>
                </div>

                <div className="rounded-xl border border-orange-500/15 bg-orange-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Settings2 className="w-5 h-5 text-orange-400" />
                    <p className="font-bold text-sm text-white/80">Exam Config</p>
                  </div>
                  <Button
                    variant="outline"
                    className="h-10 w-full text-[10px] font-black uppercase tracking-widest border-orange-500/20 text-orange-400 hover:bg-orange-500/10"
                    onClick={() => onAssignmentConfigOpen(lesson)}
                  >
                    Configure Settings
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/40">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent/80">Required Submission</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Block lesson unlock until submitted</p>
                </div>
                <Switch
                  className="data-[state=checked]:bg-accent"
                  checked={lesson.requiredAssignment || false}
                  onCheckedChange={checked => updateLesson({ requiredAssignment: checked, isAssignment: true })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Assignment Description</label>
                <Textarea
                  className="bg-muted/30 border-border/40 rounded-xl text-sm placeholder:text-muted-foreground/30 focus:border-accent/40 hover:border-border/60"
                  rows={3}
                  placeholder="Describe what students need to do..."
                  value={lesson.assignmentDescription || ""}
                  onChange={e => updateLesson({ assignmentDescription: e.target.value, isAssignment: true })}
                />
              </div>
            </div>
          )}

          {/* Tab: Code Exercises */}
          {tab === "codeExercises" && (
            <div className="p-4">
              <div className="rounded-xl border border-indigo-500/15 bg-indigo-500/5 p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <Terminal className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground/80">Code Exercises</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                      {lesson.codeExercises?.length > 0
                        ? `${lesson.codeExercises.length} exercise${lesson.codeExercises.length !== 1 ? "s" : ""} added`
                        : "No exercises yet"}
                    </p>
                  </div>
                  {lesson.codeExercises?.length > 0 && (
                    <div className="ml-auto px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{lesson.codeExercises.length}</span>
                    </div>
                  )}
                </div>

                {/* Exercise preview pills */}
                {lesson.codeExercises?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {lesson.codeExercises.map((ex: any, i: number) => (
                      <div key={ex.id || i} className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-1">
                        <Code className="w-3 h-3 text-indigo-400" />
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{ex.language}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Interactive coding challenges students complete directly in the browser. Supports JavaScript, Python, and HTML/CSS.
                </p>
                <Button
                  variant="outline"
                  className="h-10 w-full text-[10px] font-black uppercase tracking-widest border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 hover:border-indigo-500/40 gap-2 transition-colors"
                  onClick={() => onCodeExercisesOpen(lesson)}
                >
                  <Terminal className="w-4 h-4" />
                  {lesson.codeExercises?.length > 0 ? "Manage Code Exercises" : "Add Code Exercises"}
                </Button>
              </div>
            </div>
          )}

          {/* ── Action Bar (Done Button) ── */}
          <div className="p-4 pt-0 flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent/5 gap-2"
              onClick={() => setExpanded(false)}
            >
              <Check className="w-3.5 h-3.5" /> Done Editing
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function EditCourseDialog({
  open,
  onOpenChange,
  course,
  trainers = [],
  onSave,
  onQuizSave,
  isLoading = false
}: EditCourseDialogProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const { data: categoryData } = useQuery(GET_CATEGORIES);
  const categories = (categoryData as any)?.categories || [];

  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    thumbnail: "",
    price: "0",
    discountPrice: "0",
    isFree: false,
    level: "Beginner",
    category: "Development",
    school: "",
    instructorId: "",
    status: "draft",
    allowedDeliveryModes: ["online"],
    enrollmentMode: "direct",
    submissionRequired: true,
    signerName: "",
    signerSignature: "",
    applicationQuestions: [],
    modules: []
  });

  const [hasInitialized, setHasInitialized] = useState(false);
  const [questionLesson, setQuestionLesson] = useState<{ id: string, title: string, mIdx: number, lIdx: number } | null>(null);
  const [assignmentQuestionLesson, setAssignmentQuestionLesson] = useState<{ mIdx: number, lIdx: number, title: string } | null>(null);
  const [assignmentConfigLesson, setAssignmentConfigLesson] = useState<{ mIdx: number, lIdx: number, title: string } | null>(null);
  const [codeExerciseLesson, setCodeExerciseLesson] = useState<{ mIdx: number, lIdx: number, title: string } | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({ 0: true });
  const [showResourceBank, setShowResourceBank] = useState(false);
  const [resourceBankTarget, setResourceBankTarget] = useState<{ mIdx: number, lIdx: number } | null>(null);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);

  // Reset initialization when dialog closes or the course ID changes
  useEffect(() => {
    if (!open) {
      setHasInitialized(false);
    }
  }, [open, course?.id]);

  // 1. Core initialization and background sync
  useEffect(() => {
    // Only update formData from props if we are NOT currently editing a sub-component
    // This prevents background refetches from wiping out local edits in ManageQuestionsDialog
    if (course && open && !questionLesson && !assignmentQuestionLesson && !assignmentConfigLesson) {
      setFormData((prev: any) => {
        // If this is the FIRST time we're loading THIS course in THIS session
        if (!hasInitialized || prev.id !== course.id) {
          setHasInitialized(true);
          return {
            id: course.id,
            title: course.title || "",
            description: course.description || "",
            thumbnail: course.thumbnail || "",
            price: course.price?.toString() || "0",
            discountPrice: course.discountPrice?.toString() || "0",
            isFree: course.price === 0,
            level: course.level || "Beginner",
            category: course.category || "Development",
            school: course.school || "",
            instructorId: course.instructor?.id || course.instructor || "",
            status: course.status || "draft",
            allowedDeliveryModes: course.allowedDeliveryModes || ["online"],
            enrollmentMode: course.enrollmentMode || "direct",
            submissionRequired: course.submissionRequired !== false,
            signerName: course.signerName || "",
            signerSignature: course.signerSignature || "",
            applicationQuestions: course.applicationQuestions?.map((q: any) => ({
              label: q.label || "",
              type: q.type || "text",
              required: !!q.required,
              options: q.options || []
            })) || [],
            modules: course.modules?.map((m: any) => ({
              ...m,
              title: m.title || "",
              description: m.description || "",
              lessons: m.lessons?.map((l: any) => ({
                ...l,
                title: l.title || "",
                duration: l.duration || 0,
                content: l.content || "",
                videoUrl: l.videoUrl || "",
                fileUrl: l.fileUrl || "",
                type: l.type || "video",
                requiredAssignment: !!l.requiredAssignment,
                isAssignment: !!l.isAssignment || l.type === 'assignment',
                assignmentDescription: l.assignmentDescription || "",
                assignmentDeliverables: l.assignmentDeliverables || [],
                assignmentQuestions: l.assignmentQuestions?.map((q: any) => ({
                  id: q.id || q._id,
                  questionText: q.questionText || "",
                  type: q.type || "mcq",
                  options: q.options || [],
                  correctOptionIndex: q.correctOptionIndex ?? 0,
                  points: q.points || 10,
                  explanation: q.explanation || ""
                })) || [],
                assignmentConfig: l.assignmentConfig ? {
                  timeLimit: l.assignmentConfig.timeLimit || null,
                  allowRetakes: !!l.assignmentConfig.allowRetakes,
                  disableRightClick: !!l.assignmentConfig.disableRightClick,
                  mode: l.assignmentConfig.mode || 'exam'
                } : { timeLimit: null, allowRetakes: true, disableRightClick: false, mode: 'exam' },
                quizQuestions: l.quizQuestions?.map((q: any) => ({
                  id: q.id || q._id,
                  questionText: q.questionText || "",
                  type: q.type || "multiple_choice",
                  imageUrl: q.imageUrl || "",
                  options: q.options || [],
                  correctOptionIndex: q.correctOptionIndex ?? 0,
                  explanation: q.explanation || ""
                })) || [],
                quizConfig: l.quizConfig ? {
                  disableRightClick: !!l.quizConfig.disableRightClick,
                  timeLimit: l.quizConfig.timeLimit || 0,
                  quizType: l.quizConfig.quizType || 'exercise',
                  questionsPerPage: l.quizConfig.questionsPerPage || 5
                } : { disableRightClick: false, timeLimit: 0, quizType: 'exercise', questionsPerPage: 5 },
                codeExercises: l.codeExercises?.map((ex: any) => ({
                  id: ex.id || ex._id,
                  title: ex.title || "",
                  description: ex.description || "",
                  language: ex.language || "javascript",
                  initialCode: ex.initialCode || "",
                  solutionCode: ex.solutionCode || "",
                  testCode: ex.testCode || "",
                  type: ex.type || "write",
                  setupCode: ex.setupCode || "",
                  expectedOutput: ex.expectedOutput || "",
                })) || [],
              })) || []
            })) || []
          };
        }

        // Subsequent background updates (e.g. curriculum arriving)
        const hasMoreModules = (course.modules?.length || 0) > (prev.modules?.length || 0);
        const hasMoreLessons = course.modules?.some((m: any, idx: number) => (m.lessons?.length || 0) > (prev.modules[idx]?.lessons?.length || 0));
        const hasQuestionsNow = course.modules?.some((m: any, mIdx: number) =>
          m.lessons?.some((l: any, lIdx: number) =>
            (l.assignmentQuestions?.length || 0) > (prev.modules[mIdx]?.lessons?.[lIdx]?.assignmentQuestions?.length || 0)
          )
        );
        const shouldUpdatePricing = (prev.price === "0" && course.price > 0);
        const shouldUpdateDetails = (prev.thumbnail === "" && course.thumbnail);
        const curriculumArrived = hasMoreModules || hasMoreLessons || hasQuestionsNow;

        if (curriculumArrived || shouldUpdatePricing || shouldUpdateDetails) {
          return {
            ...prev,
            price: shouldUpdatePricing ? course.price.toString() : prev.price,
            isFree: shouldUpdatePricing ? (course.price === 0) : prev.isFree,
            thumbnail: shouldUpdateDetails ? course.thumbnail : prev.thumbnail,
            level: (prev.level === "Beginner" && course.level && course.level !== "Beginner") ? course.level : prev.level,
            category: (prev.category === "Development" && course.category && course.category !== "Development") ? course.category : prev.category,
            school: (!prev.school && course.school) ? course.school : prev.school,
            modules: curriculumArrived ? course.modules.map((m: any) => ({
              ...m,
              title: m.title || "",
              description: m.description || "",
              lessons: m.lessons?.map((l: any) => ({
                ...l,
                title: l.title || "",
                duration: l.duration || 0,
                content: l.content || "",
                videoUrl: l.videoUrl || "",
                fileUrl: l.fileUrl || "",
                type: l.type || "video",
                requiredAssignment: !!l.requiredAssignment,
                isAssignment: !!l.isAssignment || l.type === 'assignment',
                assignmentDescription: l.assignmentDescription || "",
                assignmentDeliverables: l.assignmentDeliverables || [],
                assignmentQuestions: l.assignmentQuestions?.map((q: any) => ({
                  id: q.id || q._id,
                  questionText: q.questionText || "",
                  type: q.type || "mcq",
                  options: q.options || [],
                  correctOptionIndex: q.correctOptionIndex ?? 0,
                  points: q.points || 10,
                  explanation: q.explanation || ""
                })) || [],
                assignmentConfig: l.assignmentConfig ? {
                  timeLimit: l.assignmentConfig.timeLimit || null,
                  allowRetakes: !!l.assignmentConfig.allowRetakes,
                  disableRightClick: !!l.assignmentConfig.disableRightClick,
                  mode: l.assignmentConfig.mode || 'exam'
                } : { timeLimit: null, allowRetakes: true, disableRightClick: false, mode: 'exam' },
                quizQuestions: l.quizQuestions?.map((q: any) => ({
                  id: q.id || q._id,
                  questionText: q.questionText || "",
                  type: q.type || "multiple_choice",
                  imageUrl: q.imageUrl || "",
                  options: q.options || [],
                  correctOptionIndex: q.correctOptionIndex ?? 0,
                  explanation: q.explanation || ""
                })) || [],
                quizConfig: l.quizConfig ? {
                  disableRightClick: !!l.quizConfig.disableRightClick,
                  timeLimit: l.quizConfig.timeLimit || 0,
                  quizType: l.quizConfig.quizType || 'exercise',
                  questionsPerPage: l.quizConfig.questionsPerPage || 5
                } : { disableRightClick: false, timeLimit: 0, quizType: 'exercise', questionsPerPage: 5 },
                codeExercises: l.codeExercises?.map((ex: any) => ({
                  id: ex.id || ex._id,
                  title: ex.title || "",
                  description: ex.description || "",
                  language: ex.language || "javascript",
                  initialCode: ex.initialCode || "",
                  solutionCode: ex.solutionCode || "",
                  testCode: ex.testCode || "",
                  type: ex.type || "write",
                  setupCode: ex.setupCode || "",
                  expectedOutput: ex.expectedOutput || "",
                })) || [],
              })) || []
            })) : prev.modules
          };
        }

        return prev;
      });
    }
  }, [course, open, hasInitialized]);

  // Shared helper — builds the full payload from current formData and an optional module override
  const buildUpdatedCourse = (modulesOverride?: any[]) => {
    const modules = (modulesOverride ?? formData.modules).map((m: any) => ({
      id: m.id || m._id,
      title: m.title,
      description: m.description || "",
      lessons: m.lessons.map((l: any) => ({
        id: l.id || l._id,
        title: l.title,
        duration: Number(l.duration) || 0,
        videoUrl: l.videoUrl || "",
        fileUrl: l.fileUrl || "",
        type: l.type || "video",
        content: l.content || "",
        isAssignment: l.type === 'assignment' || l.type === 'exam' || l.type === 'quiz',
        requiredAssignment: !!l.requiredAssignment,
        assignmentDescription: l.assignmentDescription || "",
        assignmentDeliverables: l.assignmentDeliverables || [],
        assignmentQuestions: l.assignmentQuestions?.map((q: any) => ({
          id: q.id || q._id,
          questionText: q.questionText,
          type: q.type,
          options: q.options || [],
          correctOptionIndex: q.correctOptionIndex,
          points: q.points
        })) || [],
        assignmentConfig: l.assignmentConfig ? {
          timeLimit: Number(l.assignmentConfig.timeLimit) || null,
          allowRetakes: !!l.assignmentConfig.allowRetakes,
          disableRightClick: !!l.assignmentConfig.disableRightClick,
          mode: l.assignmentConfig.mode || 'exam'
        } : null,
        quizQuestions: l.quizQuestions?.map((q: any) => ({
          id: q.id || q._id,
          questionText: q.questionText,
          type: q.type,
          imageUrl: q.imageUrl,
          options: q.options || [],
          correctOptionIndex: q.correctOptionIndex,
          explanation: q.explanation
        })) || [],
        quizConfig: l.quizConfig ? {
          disableRightClick: !!l.quizConfig.disableRightClick,
          timeLimit: Number(l.quizConfig.timeLimit) || 0,
          quizType: l.quizConfig.quizType || 'exercise',
          questionsPerPage: Number(l.quizConfig.questionsPerPage) || 5
        } : null,
        resources: l.resources?.map((r: any) => ({
          id: r.id || r._id,
          title: r.title,
          url: r.url,
          type: r.type,
          source: r.source,
          visibility: r.visibility
        })) || [],
        codeExercises: l.codeExercises?.map((ex: any) => ({
          id: ex.id || ex._id,
          title: ex.title,
          description: ex.description || "",
          language: ex.language,
          initialCode: ex.initialCode || "",
          solutionCode: ex.solutionCode || "",
          testCode: ex.testCode || "",
          type: ex.type || "write",
          setupCode: ex.setupCode || "",
          expectedOutput: ex.expectedOutput || "",
        })) || [],
      }))
    }));

    return {
      id: course.id || course._id,
      title: formData.title,
      description: formData.description,
      thumbnail: formData.thumbnail,
      price: formData.isFree ? 0 : parseFloat(formData.price) || 0,
      discountPrice: parseFloat(formData.discountPrice) || 0,
      level: formData.level,
      category: formData.category,
      school: formData.school,
      instructorId: formData.instructorId,
      status: formData.status,
      allowedDeliveryModes: formData.allowedDeliveryModes,
      enrollmentMode: formData.enrollmentMode,
      submissionRequired: formData.submissionRequired,
      signerName: formData.signerName,
      signerSignature: formData.signerSignature,
      applicationQuestions: formData.applicationQuestions.map((q: any) => ({
        label: q.label,
        type: q.type,
        required: q.required,
        options: q.options || []
      })),
      modules
    };
  };

  const handleSave = () => {
    if (!course) return;
    onSave?.(buildUpdatedCourse());
    onOpenChange(false);
  };

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] sm:max-w-4xl w-full h-[100dvh] sm:h-[90vh] flex flex-col p-0 overflow-hidden border-accent/20 rounded-none sm:rounded-lg">
        <DialogHeader className="px-6 py-4 bg-accent/5 flex-shrink-0 border-b border-accent/10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Layout className="w-5 h-5 text-accent" />
                Edit Course: {formData.title || "Untitled"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Manage your course content, pricing, and curriculum from a single place.
              </DialogDescription>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${formData.status === 'published' ? 'bg-green-500/10 text-green-500' :
              formData.status === 'archived' ? 'bg-red-500/10 text-red-500' :
                'bg-amber-500/10 text-amber-500'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${formData.status === 'published' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                formData.status === 'archived' ? 'bg-red-500' : 'bg-amber-500'
                }`} />
              {formData.status}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 bg-muted/20 border-b">
            <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
              <TabsTrigger
                value="basic"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none shadow-none text-xs font-bold gap-2 px-1"
              >
                <Info className="w-4 h-4" /> Basic Details
              </TabsTrigger>
              <TabsTrigger
                value="pricing"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none shadow-none text-xs font-bold gap-2 px-1"
              >
                <DollarSign className="w-4 h-4" /> Pricing & Access
              </TabsTrigger>
              <TabsTrigger
                value="application"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none shadow-none text-xs font-bold gap-2 px-1"
              >
                <HelpCircle className="w-4 h-4" /> Application Questions
              </TabsTrigger>
              <TabsTrigger
                value="curriculum"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none shadow-none text-xs font-bold gap-2 px-1"
              >
                <BookOpen className="w-4 h-4" /> Curriculum
                {isLoading && <Loader2 className="w-3 h-3 animate-spin text-accent" />}
              </TabsTrigger>
              <TabsTrigger
                value="import"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none shadow-none text-xs font-bold gap-2 px-1"
              >
                <FileUp className="w-4 h-4" /> Import
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {isLoading && !formData.modules.length && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
                  <Layout className="w-5 h-5 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm">Syncing Course Data...</p>
                  <p className="text-xs text-muted-foreground mt-1">Downloading the latest modules and lessons</p>
                </div>
              </div>
            )}

            <ScrollArea className="h-full">
              <div className="p-6">
                <TabsContent value="basic" className="m-0 space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Block 1: General Info */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 border-b border-accent/10 pb-2">
                        <Layout className="w-5 h-5 text-accent" />
                        <h3 className="font-bold text-sm uppercase tracking-tight">General Information</h3>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold mb-1.5 text-muted-foreground flex items-center gap-2">
                            Course Title
                            {!isAdmin && <Lock className="w-2.5 h-2.5" />}
                          </label>
                          <Input
                            placeholder="e.g., Master React with TypeScript"
                            className="h-11 font-medium bg-background border-accent/10 focus:border-accent"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            disabled={!isAdmin}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold mb-1.5 block text-muted-foreground">Difficulty Level</label>
                            <Input
                              placeholder="Beginner"
                              list="course-levels"
                              className="bg-background border-accent/10 h-10 font-medium"
                              value={formData.level}
                              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                              disabled={!isAdmin}
                            />
                            <datalist id="course-levels">
                              <option value="Beginner" />
                              <option value="Intermediate" />
                              <option value="Advanced" />
                              <option value="Expert" />
                            </datalist>
                          </div>
                          <div>
                            <label className="text-xs font-bold mb-1.5 block text-muted-foreground">Subject Category</label>
                            <Input
                              placeholder="Development"
                              list="course-categories"
                              className="bg-background border-accent/10 h-10 font-medium"
                              value={formData.category}
                              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                              disabled={!isAdmin}
                            />
                            <datalist id="course-categories">
                              {categories.map((cat: string) => (
                                <option key={cat} value={cat} />
                              ))}
                            </datalist>
                          </div>
                          <div className="col-span-2">
                            <label className="text-xs font-bold mb-1.5 block text-muted-foreground">Provider / School</label>
                            <Input
                              placeholder="e.g. Kingdavid, Greenhill Academy"
                              list="course-schools"
                              className="bg-background border-accent/10 h-10 font-medium"
                              value={formData.school || ""}
                              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                              disabled={!isAdmin}
                            />
                            <datalist id="course-schools">
                              <option value="Kingdavid" />
                              <option value="Greenhill Academy" />
                              <option value="Andela" />
                              <option value="Bootskills" />
                            </datalist>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold mb-3 block text-muted-foreground">Course Status</label>
                          <div className="flex gap-2 p-1 bg-muted/30 rounded-xl border border-border/50">
                            {['draft', 'published', 'archived'].map((status) => (
                              <Button
                                key={status}
                                type="button"
                                variant={formData.status === status ? 'gold' : 'ghost'}
                                size="sm"
                                className="flex-1 h-9 text-[10px] font-black uppercase transition-all rounded-lg"
                                onClick={() => setFormData({ ...formData, status })}
                              >
                                {status === 'published' ? 'Live' : status}
                              </Button>
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2 italic px-1">
                            {formData.status === 'published' ? 'Visible to students on the platform.' : 'Private and cannot be accessed by students.'}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold mb-1.5 block text-muted-foreground">Delivery Modes</label>
                            <div className="flex flex-col gap-2">
                              {['online', 'physical', 'hybrid'].map((mode) => (
                                <label key={mode} className="flex items-center gap-2 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={formData.allowedDeliveryModes?.includes(mode) || false}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      const modes = formData.allowedDeliveryModes || [];
                                      setFormData({
                                        ...formData,
                                        allowedDeliveryModes: checked ? [...modes, mode] : modes.filter((m: string) => m !== mode)
                                      });
                                    }}
                                  />
                                  <span className="capitalize">{mode}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-bold mb-1.5 block text-muted-foreground">Enrollment Mode</label>
                            <select
                              className="w-full h-10 px-3 rounded-lg border border-accent/10 bg-background text-sm font-medium focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                              value={formData.enrollmentMode || "direct"}
                              onChange={(e) => setFormData({ ...formData, enrollmentMode: e.target.value })}
                            >
                              <option value="direct">Direct Enrollment (Pay & Join)</option>
                              <option value="application">Application Required</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Block 2: Settings & Media */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 border-b border-accent/10 pb-2">
                        <CheckCircle2 className="w-5 h-5 text-accent" />
                        <h3 className="font-bold text-sm uppercase tracking-tight">Settings & Requirements</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl shadow-sm">
                          <div className="space-y-1 pr-4">
                            <label className="text-sm font-bold flex items-center gap-2">
                              Strict Progress Control
                              <Badge variant="outline" className="text-[8px] h-4 py-0 bg-amber-500/10 border-amber-500/20 text-amber-600">Pro</Badge>
                            </label>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              Require assignment submission and <b>trainer approval</b> before students can move to the next unit.
                            </p>
                          </div>
                          <Switch
                            checked={formData.submissionRequired}
                            onCheckedChange={(checked) => setFormData({ ...formData, submissionRequired: checked })}
                            className="data-[state=checked]:bg-amber-500"
                          />
                        </div>

                        {isAdmin && (
                          <div>
                            <label className="text-xs font-bold mb-1.5 block text-muted-foreground">Primary Instructor (Lead Trainer)</label>
                            <select
                              className="w-full h-11 px-3 rounded-xl border border-accent/10 bg-background text-sm font-medium focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                              value={formData.instructorId}
                              onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                            >
                              <option value="">Choose an instructor...</option>
                              {trainers.map((t: any) => (
                                <option key={t.id} value={t.id}>{t.username} ({t.role})</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="text-xs font-bold mb-1.5 block text-muted-foreground">Cover Thumbnail</label>
                          <div className="group relative aspect-[21/9] rounded-2xl overflow-hidden border-2 border-dashed border-accent/10 bg-muted/5 hover:border-accent/30 transition-all flex items-center justify-center">
                            {formData.thumbnail ? (
                              <>
                                <img src={formData.thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="h-8 gap-2 rounded-lg"
                                    onClick={() => setFormData({ ...formData, thumbnail: "" })}
                                  >
                                    <Trash2 className="w-4 h-4" /> Replace
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full p-2">
                                <FileUpload
                                  folder="courses"
                                  label="Drag & Drop Cover Image"
                                  onUploadComplete={(url) => setFormData({ ...formData, thumbnail: url })}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-5 bg-muted/30 rounded-2xl border border-border/40 space-y-5 shadow-sm">
                          <div className="flex items-center gap-2 border-b border-border/20 pb-3">
                            <Plus className="w-4 h-4 text-accent" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-accent">Certificate Issuance Details</h4>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Official Signer Name</label>
                              <Input
                                placeholder="e.g. Jean Doe, Program Manager"
                                className="h-10 text-sm bg-muted/20 border-border/40 focus:border-accent/40"
                                value={formData.signerName}
                                onChange={(e) => setFormData({ ...formData, signerName: e.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Official Signature (Stamp/Sign)</label>
                              {formData.signerSignature ? (
                                <div className="relative h-24 rounded-xl overflow-hidden border border-border/40 bg-muted/30 p-2 flex items-center justify-center group/sig">
                                  <img src={formData.signerSignature} className="h-full object-contain brightness-110 contrast-125" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/sig:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest"
                                      onClick={() => setFormData({ ...formData, signerSignature: "" })}
                                    >
                                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="min-h-[120px] rounded-xl border-2 border-dashed border-border/20 bg-muted/10 hover:border-accent/20 hover:bg-accent/5 transition-all">
                                  <FileUpload
                                    folder="signatures"
                                    label="CLICK TO UPLOAD SCREENSHOT"
                                    onUploadComplete={(url) => setFormData({ ...formData, signerSignature: url })}
                                  />
                                </div>
                              )}
                              <p className="text-[9px] text-muted-foreground/30 italic">Upload a PNG with a transparent background for best results.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 space-y-4 pt-8 border-t border-border/20">
                    <div className="flex items-center gap-2">
                      <FileTextIcon className="w-5 h-5 text-accent" />
                      <label className="text-sm font-bold uppercase tracking-tight">
                        Course Description & Syllabus
                      </label>
                    </div>
                    <div className="rounded-2xl border border-border/40 overflow-hidden shadow-2xl shadow-black/20 bg-muted/10">
                      <TextEditor
                        value={formData.description}
                        onChange={(content) => setFormData({ ...formData, description: content })}
                        placeholder="Provide a comprehensive overview of what students will learn..."
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="max-w-2xl space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="relative group">
                        <label className="text-sm font-bold flex items-center gap-2 mb-3">
                          <DollarSign className="w-4 h-4 text-accent" />
                          Base Price ($)
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            className="h-12 pl-10 bg-background font-bold text-lg border-accent/10"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            disabled={formData.isFree || !isAdmin}
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                        </div>
                      </div>

                      <div className="relative group">
                        <label className="text-sm font-bold flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="text-accent bg-accent/5 border-accent/20">Holiday Special</Badge>
                          Discounted Price ($)
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            className="h-12 pl-10 bg-background font-bold text-lg border-accent/10 text-accent"
                            value={formData.discountPrice}
                            onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                            disabled={!isAdmin}
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/50 font-bold">$</span>
                        </div>
                      </div>
                    </div>

                    <div className={`p-6 rounded-2xl border-2 border-dashed transition-all ${formData.isFree ? 'border-green-500/50 bg-green-500/5' : 'border-accent/10 bg-muted/5'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="font-bold text-lg flex items-center gap-2">
                            {formData.isFree ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-blue-500" />}
                            Make Course Free
                          </h4>
                          <p className="text-sm text-muted-foreground max-w-sm">
                            Allow all enrolled students and visitors to access the full course content without payment.
                          </p>
                        </div>
                        <Switch
                          checked={formData.isFree}
                          onCheckedChange={(checked) => setFormData({ ...formData, isFree: checked })}
                          disabled={!isAdmin}
                          className="scale-125"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="application" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-accent" />
                        Application Questions
                      </h3>
                      <p className="text-xs text-muted-foreground">Define the information you need from students who apply for this course.</p>
                    </div>
                    <Button
                      variant="gold"
                      size="sm"
                      className="h-9 gap-2 font-bold text-xs rounded-xl"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          applicationQuestions: [
                            ...formData.applicationQuestions,
                            { label: "", type: "text", required: true, options: [] }
                          ]
                        });
                      }}
                    >
                      <Plus className="w-4 h-4" /> Add Question
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {formData.applicationQuestions?.map((question: any, qIdx: number) => (
                      <div key={qIdx} className="p-4 bg-muted/20 rounded-2xl border border-accent/10 space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase">Question Label</label>
                                <Input
                                  placeholder="e.g. Why do you want to join this course?"
                                  className="h-9 text-sm bg-background border-accent/10"
                                  value={question.label}
                                  onChange={(e) => {
                                    const newQuestions = [...formData.applicationQuestions];
                                    newQuestions[qIdx] = { ...question, label: e.target.value };
                                    setFormData({ ...formData, applicationQuestions: newQuestions });
                                  }}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase">Input Type</label>
                                <select
                                  className="w-full h-9 px-3 rounded-lg border border-accent/10 bg-background text-sm font-medium focus:ring-2 focus:ring-accent/20 outline-none"
                                  value={question.type}
                                  onChange={(e) => {
                                    const newQuestions = [...formData.applicationQuestions];
                                    newQuestions[qIdx] = { ...question, type: e.target.value };
                                    setFormData({ ...formData, applicationQuestions: newQuestions });
                                  }}
                                >
                                  <option value="text">Short Answer</option>
                                  <option value="textarea">Long Answer</option>
                                  <option value="link">URL / Link</option>
                                  <option value="select">Multiple Choice</option>
                                </select>
                              </div>
                            </div>

                            {question.type === 'select' && (
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase block">Options (comma separated)</label>
                                <Input
                                  placeholder="Option 1, Option 2, Option 3"
                                  className="h-9 text-sm bg-background border-accent/10"
                                  value={question.options?.join(', ')}
                                  onChange={(e) => {
                                    const options = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                    const newQuestions = [...formData.applicationQuestions];
                                    newQuestions[qIdx] = { ...question, options };
                                    setFormData({ ...formData, applicationQuestions: newQuestions });
                                  }}
                                />
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <Switch
                                checked={question.required}
                                onCheckedChange={(checked) => {
                                  const newQuestions = [...formData.applicationQuestions];
                                  newQuestions[qIdx] = { ...question, required: checked };
                                  setFormData({ ...formData, applicationQuestions: newQuestions });
                                }}
                                className="scale-75"
                              />
                              <label className="text-xs font-medium text-muted-foreground">Required Question</label>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive/50 hover:text-destructive hover:bg-destructive/5"
                            onClick={() => {
                              const newQuestions = formData.applicationQuestions.filter((_: any, i: number) => i !== qIdx);
                              setFormData({ ...formData, applicationQuestions: newQuestions });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {(!formData.applicationQuestions || formData.applicationQuestions.length === 0) && (
                      <div className="text-center py-12 bg-muted/10 rounded-3xl border border-dashed border-accent/10">
                        <div className="w-12 h-12 rounded-2xl bg-accent/5 flex items-center justify-center mx-auto mb-4">
                          <HelpCircle className="w-6 h-6 text-accent/40" />
                        </div>
                        <h4 className="font-bold text-sm">No questions added</h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
                          Click "Add Question" to start building your application form.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="import" className="m-0 space-y-6 animate-in fade-in slide-in-from-right-2 duration-400 p-6">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-accent/10 pb-2">
                      <FileUp className="w-5 h-5 text-accent" />
                      <h3 className="font-bold text-sm uppercase tracking-tight">Import Course from Document</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload a PDF, DOCX, or TXT file, or paste a Google Doc URL to bulk-import course structure.
                      The system will extract modules, lessons, and metadata and populate the fields below.
                    </p>
                    <div className="p-8 text-center rounded-2xl border-2 border-dashed border-border/40 hover:border-accent/30 hover:bg-accent/5 transition-all cursor-pointer" onClick={() => setShowDocumentUpload(true)}>
                      <div className="w-16 h-16 rounded-2xl bg-accent/10 mx-auto flex items-center justify-center mb-4">
                        <FileUp className="w-8 h-8 text-accent" />
                      </div>
                      <p className="text-sm font-bold mb-1">Import Course Structure</p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Upload a PDF, DOCX, TXT, or image with course content
                      </p>
                      <Button variant="gold" className="gap-2">
                        <FileUp className="w-4 h-4" />
                        Open Document Importer
                      </Button>
                    </div>
                    {formData.modules.length > 0 && (
                      <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Course currently has <strong>{formData.modules.length} modules</strong> and{' '}
                          <strong>{formData.modules.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0)} lessons</strong>.
                          Importing a document will replace the existing course structure.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="curriculum" className="m-0 space-y-6 animate-in fade-in slide-in-from-right-2 duration-400">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold font-heading text-card-foreground flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-accent" />
                        Curriculum Builder
                      </h3>
                      <p className="text-xs text-muted-foreground">Organize your course into modules and lessons</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2 font-bold text-xs rounded-xl"
                        onClick={() => {
                          setQuestionLesson({ id: "", title: "Course Wide", mIdx: -1, lIdx: -1 });
                        }}
                      >
                        <HelpCircle className="w-4 h-4 text-accent" />
                        Manage Course Quiz
                      </Button>
                      <Button
                        variant="gold"
                        size="sm"
                        className="h-9 gap-2 font-bold text-xs rounded-xl shadow-lg shadow-gold/10"
                        onClick={() => {
                          const newModules = [...formData.modules, { title: "New Module", description: "", lessons: [] }];
                          setFormData({ ...formData, modules: newModules });
                          setExpandedModules({ ...expandedModules, [newModules.length - 1]: true });
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        Add Module
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {formData.modules?.map((module: any, mIdx: number) => (
                      <div key={mIdx} className="group relative bg-background border border-accent/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-accent/20 group-hover:bg-accent transition-colors" />

                        <div className="p-4 sm:p-6 space-y-4">
                          <div className="flex items-start gap-4 cursor-pointer" onClick={() => setExpandedModules(prev => ({ ...prev, [mIdx]: !prev[mIdx] }))}>
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                              <span className="font-heading text-lg font-bold text-accent">M{mIdx + 1}</span>
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  className="font-bold text-lg bg-transparent border-0 border-b border-transparent focus:border-accent focus:ring-0 rounded-none px-0 h-auto pb-1"
                                  placeholder="Module Title"
                                  value={module.title}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    const newModules = [...formData.modules];
                                    newModules[mIdx] = { ...module, title: e.target.value };
                                    setFormData({ ...formData, modules: newModules });
                                  }}
                                />
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive/40 hover:text-destructive hover:bg-destructive/5"
                                    onClick={() => {
                                      const newModules = formData.modules.filter((_: any, i: number) => i !== mIdx);
                                      setFormData({ ...formData, modules: newModules });
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                  <div className="w-8 h-8 flex items-center justify-center text-muted-foreground">
                                    {expandedModules[mIdx] ? <Info className="w-4 h-4 rotate-180 transition-transform" /> : <Info className="w-4 h-4 transition-transform" />}
                                  </div>
                                </div>
                              </div>
                              <Input
                                className="text-xs h-7 bg-muted/30 border-none italic"
                                placeholder="Module description..."
                                value={module.description || ""}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const newModules = [...formData.modules];
                                  newModules[mIdx] = { ...module, description: e.target.value };
                                  setFormData({ ...formData, modules: newModules });
                                }}
                              />
                            </div>
                          </div>

                          {expandedModules[mIdx] && (
                            <div className="space-y-4 pt-4 border-t border-accent/5 animate-in slide-in-from-top-2 duration-300">
                              <div className="grid grid-cols-1 gap-4">
                                {module.lessons?.map((lesson: any, lIdx: number) => (
                                  <LessonCard
                                    key={lIdx}
                                    lesson={lesson}
                                    lIdx={lIdx}
                                    mIdx={mIdx}
                                    module={module}
                                    formData={formData}
                                    setFormData={setFormData}
                                    onQuizOpen={(lesson) => {
                                      setQuestionLesson({ id: lesson.id || `${mIdx}-${lIdx}`, title: lesson.title, mIdx, lIdx });
                                    }}
                                    onAssignmentQuestionsOpen={(lesson) => {
                                      setAssignmentQuestionLesson({ mIdx, lIdx, title: lesson.title });
                                    }}
                                    onAssignmentConfigOpen={(lesson) => {
                                      setAssignmentConfigLesson({ mIdx, lIdx, title: lesson.title });
                                    }}
                                    onCodeExercisesOpen={(lesson) => {
                                      setCodeExerciseLesson({ mIdx, lIdx, title: lesson.title });
                                    }}
                                  />
                                ))}

                                <Button
                                  variant="outline"
                                  className="w-full h-11 border-dashed border-accent/20 hover:border-accent/40 hover:bg-accent/5 transition-all text-[10px] font-bold gap-2 rounded-xl group"
                                  onClick={() => {
                                    const newModules = [...formData.modules];
                                    const newLessons = [...(module.lessons || []), { title: "New Lesson", duration: 10, type: "video" }];
                                    newModules[mIdx] = { ...module, lessons: newLessons };
                                    setFormData({ ...formData, modules: newModules });
                                  }}
                                >
                                  <Plus className="w-4 h-4 text-accent transition-transform group-hover:rotate-90" />
                                  Add Lesson to {module.title}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </div>
        </Tabs>

        <div className="flex gap-4 p-6 border-t border-accent/10 bg-background/80 backdrop-blur-md flex-shrink-0">
          <Button variant="outline" className="flex-1 font-bold h-11 rounded-xl shadow-sm" onClick={() => onOpenChange(false)}>
            Discard Changes
          </Button>
          <Button
            variant="outline"
            className="flex-1 font-bold h-11 rounded-xl shadow-sm gap-2"
            onClick={() => window.open(`/courses/${formData.id || course?.id}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4" /> Preview Public Page
          </Button>
          <Button
            variant="gold"
            className="flex-1 font-bold h-11 rounded-xl shadow-lg shadow-gold/20 gap-2"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Publish Course Updates
          </Button>
        </div>
      </DialogContent >
      <ManageQuestionsDialog
        open={!!questionLesson}
        onOpenChange={(open) => !open && setQuestionLesson(null)}
        courseId={course?.id}
        courseTitle={formData.title}
        lessonId={questionLesson?.id}
        lessonTitle={questionLesson?.title}
        questions={questionLesson && questionLesson.mIdx !== -1 ? formData.modules[questionLesson.mIdx].lessons[questionLesson.lIdx].quizQuestions : []}
        config={questionLesson && questionLesson.mIdx !== -1 ? formData.modules[questionLesson.mIdx].lessons[questionLesson.lIdx].quizConfig : {}}
        isLoading={isLoading}
        onSave={(questions, localConfig) => {
          if (questionLesson && questionLesson.mIdx !== -1) {
            const newModules = [...formData.modules];
            const newLessons = [...newModules[questionLesson.mIdx].lessons];
            newLessons[questionLesson.lIdx] = {
              ...newLessons[questionLesson.lIdx],
              quizQuestions: questions,
              quizConfig: localConfig
            };
            newModules[questionLesson.mIdx] = { ...newModules[questionLesson.mIdx], lessons: newLessons };
            setFormData({ ...formData, modules: newModules });
            // Immediately persist to DB without closing the editor dialog
            if (course) {
              onQuizSave?.(buildUpdatedCourse(newModules));
            }
          }
        }}
      />
      <ResourceBankDialog
        open={showResourceBank}
        onOpenChange={setShowResourceBank}
        onSelect={(resource) => {
          if (resourceBankTarget) {
            const { mIdx, lIdx } = resourceBankTarget;
            const newModules = [...formData.modules];
            const newLessons = [...newModules[mIdx].lessons];

            // Map bank resource to lesson resource
            if (resource.type === 'video') {
              newLessons[lIdx] = { ...newLessons[lIdx], videoUrl: resource.url };
            } else {
              newLessons[lIdx] = { ...newLessons[lIdx], fileUrl: resource.url };
            }

            newModules[mIdx] = { ...newModules[mIdx], lessons: newLessons };
            setFormData({ ...formData, modules: newModules });
            setShowResourceBank(false);
            setResourceBankTarget(null);
          }
        }}
      />
      <ManageAssignmentQuestionsDialog
        open={!!assignmentQuestionLesson}
        onOpenChange={(open) => !open && setAssignmentQuestionLesson(null)}
        questions={assignmentQuestionLesson ? formData.modules[assignmentQuestionLesson.mIdx].lessons[assignmentQuestionLesson.lIdx].assignmentQuestions : []}
        onSave={(questions) => {
          if (assignmentQuestionLesson) {
            const newModules = [...formData.modules];
            const newLessons = [...newModules[assignmentQuestionLesson.mIdx].lessons];
            newLessons[assignmentQuestionLesson.lIdx] = { ...newLessons[assignmentQuestionLesson.lIdx], assignmentQuestions: questions };
            newModules[assignmentQuestionLesson.mIdx] = { ...newModules[assignmentQuestionLesson.mIdx], lessons: newLessons };
            setFormData({ ...formData, modules: newModules });
          }
        }}
      />

      <ExamConfigDialog
        open={!!assignmentConfigLesson}
        onOpenChange={(open) => !open && setAssignmentConfigLesson(null)}
        config={assignmentConfigLesson ? formData.modules[assignmentConfigLesson.mIdx].lessons[assignmentConfigLesson.lIdx].assignmentConfig : {}}
        onSave={(config) => {
          if (assignmentConfigLesson) {
            const newModules = [...formData.modules];
            const newLessons = [...newModules[assignmentConfigLesson.mIdx].lessons];
            newLessons[assignmentConfigLesson.lIdx] = { ...newLessons[assignmentConfigLesson.lIdx], assignmentConfig: config };
            newModules[assignmentConfigLesson.mIdx] = { ...newModules[assignmentConfigLesson.mIdx], lessons: newLessons };
            setFormData({ ...formData, modules: newModules });
          }
        }}
        title={`Exam Settings: ${assignmentConfigLesson?.title || 'Module Assessment'}`}
      />
      <ManageCodeExercisesDialog
        open={!!codeExerciseLesson}
        onOpenChange={(open) => !open && setCodeExerciseLesson(null)}
        exercises={codeExerciseLesson ? formData.modules[codeExerciseLesson.mIdx].lessons[codeExerciseLesson.lIdx].codeExercises : []}
        onSave={(exercises) => {
          if (codeExerciseLesson) {
            const newModules = [...formData.modules];
            const newLessons = [...newModules[codeExerciseLesson.mIdx].lessons];
            newLessons[codeExerciseLesson.lIdx] = { ...newLessons[codeExerciseLesson.lIdx], codeExercises: exercises };
            newModules[codeExerciseLesson.mIdx] = { ...newModules[codeExerciseLesson.mIdx], lessons: newLessons };
            setFormData({ ...formData, modules: newModules });
          }
        }}
      />
      <CourseDocumentUpload
        open={showDocumentUpload}
        onOpenChange={setShowDocumentUpload}
        onApply={(parsedData) => {
          const newFormData: any = { ...formData };
          if (parsedData.title) newFormData.title = parsedData.title;
          if (parsedData.description) newFormData.description = parsedData.description;
          if (parsedData.category) newFormData.category = parsedData.category;
          if (parsedData.level) newFormData.level = parsedData.level;
          if (parsedData.modules.length > 0) {
            newFormData.modules = parsedData.modules.map((m) => ({
              title: m.title,
              description: m.description,
              lessons: m.lessons.map((l) => ({
                title: l.title,
                duration: l.duration,
                type: l.type,
                content: l.content,
                videoUrl: l.videoUrl,
                fileUrl: l.fileUrl,
              })),
            }));
          }
          setFormData(newFormData);
          setShowDocumentUpload(false);
          toast.success('Course structure imported from document! Review the Curriculum tab.');
        }}
      />
    </Dialog >
  );
}
