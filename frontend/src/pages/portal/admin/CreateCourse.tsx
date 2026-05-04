// CreateCourse - standalone course creation wizard (v2)
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/FileUpload";
import { TextEditor } from "@/components/ui/text-editor";
import { ManageQuestionsDialog } from "@/components/portal/dialogs";
import { 
  ChevronRight, 
  ChevronDown,
  ChevronLeft, 
  Check, 
  BookOpen, 
  Image as ImageIcon, 
  Settings, 
  DollarSign, 
  Rocket,
  Info,
  Loader2,
  AlertCircle,
  Layout,
  Users,
  Trophy,
  Globe,
  Sparkles,
  Eye,
  PlayCircle,
  Paperclip,
  HelpCircle,
  Trash2,
  Plus,
  Calendar,
  ExternalLink,
  FileText,
  ClipboardList,
  Circle,
  CheckCircle2,
  ChevronUp,
} from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_USERS, GET_COURSES, GET_ADMIN_DASHBOARD_DATA, GET_CATEGORIES } from "@/lib/graphql/queries";
import { CREATE_COURSE } from "@/lib/graphql/mutations";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Lesson Card ──────────────────────────────────────────────────────────────
type LessonTab = "details" | "quiz" | "assignment";

function LessonCard({
  lesson, lIdx, mIdx, module, formData, setFormData, onQuizOpen,
}: {
  lesson: any; lIdx: number; mIdx: number; module: any;
  formData: any; setFormData: (d: any) => void;
  onQuizOpen: (lesson: any) => void;
}) {
  const [expanded, setExpanded] = useState(!lesson.title || lesson.title === "");
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
    if (patch.title && patch.title.trim() !== "" && expanded) {
      setExpanded(false);
    }
  };

  const deleteLesson = () => {
    const newModules = [...formData.modules];
    newModules[mIdx] = { ...module, lessons: module.lessons.filter((_: any, i: number) => i !== lIdx) };
    setFormData({ ...formData, modules: newModules });
  };

  const isComplete = !!lesson.title && lesson.title.trim() !== "";
  const isQuizType = lesson.type === "quiz";
  const quizCount = lesson._quizCount || 0;

  return (
    <div className={cn(
      "rounded-2xl border transition-all duration-300 group/card",
      isComplete && !expanded
        ? "border-green-500/20 bg-green-500/5 hover:bg-white/5 hover:border-green-500/40"
        : "border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20"
    )}>
      {/* ── Header (always visible) ── */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer select-none"
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
            "h-9 flex-1 font-bold bg-transparent border-transparent focus:border-white/20 text-sm placeholder:text-white/30 hover:border-white/10",
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
          className="h-9 px-3 rounded-xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/60 outline-none focus:border-accent/60 hover:border-white/20 transition-colors shrink-0"
          value={lesson.type || "video"}
          onClick={e => e.stopPropagation()}
          onChange={e => updateLesson({ type: e.target.value })}
        >
          {["video","pdf","ppt","book","article","quiz","assignment"].map(t => (
            <option key={t} value={t}>{t.toUpperCase()}</option>
          ))}
        </select>

        {/* Duration */}
        <div
          className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-xl border border-white/10 hover:border-white/20 shrink-0 transition-colors"
          onClick={e => e.stopPropagation()}
        >
          <input
            type="number"
            className="w-10 h-7 bg-transparent text-sm font-bold text-center outline-none text-white/80"
            value={lesson.duration || 0}
            onChange={e => updateLesson({ duration: parseInt(e.target.value) || 0 })}
          />
          <span className="text-[10px] text-white/40 font-black">MINS</span>
        </div>

        {/* Missing indicator */}
        {!lesson.title && (
          <div className="w-2 h-2 rounded-full bg-amber-400/80 shrink-0 animate-pulse" title="Title required" />
        )}

        {/* Delete */}
        <button
          onClick={e => { e.stopPropagation(); deleteLesson(); }}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {expanded
          ? <ChevronUp className="w-4 h-4 text-white/30 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-white/30 shrink-0" />
        }
      </div>

      {/* ── Expanded Body ── */}
      {expanded && (
        <div className="border-t border-white/10">
          {/* Tab Bar */}
          <div className="flex border-b border-white/10">
            {([
              { key: "details",    label: "Details",      icon: FileText },
              { key: "quiz",       label: "Quiz Builder",  icon: HelpCircle },
              { key: "assignment", label: "Assignment",    icon: ClipboardList },
            ] as { key: LessonTab; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors",
                  tab === key
                    ? "text-accent border-b-2 border-accent -mb-px"
                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* ── Tab: Details ── */}
          {tab === "details" && (
            <div className="p-4 space-y-4">
              {/* URLs row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                    <PlayCircle className="w-3.5 h-3.5 text-accent" /> Media Stream URL
                  </label>
                  <Input
                    className="h-10 bg-white/5 border-white/10 text-sm placeholder:text-white/25 focus:border-accent/40 hover:border-white/20"
                    placeholder="YouTube, Vimeo, AWS S3..."
                    value={lesson.videoUrl || ""}
                    onChange={e => updateLesson({ videoUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" /> Resource URL
                  </label>
                  <Input
                    className="h-10 bg-white/5 border-white/10 text-sm placeholder:text-white/25 focus:border-accent/40 hover:border-white/20"
                    placeholder="G-Drive, Dropbox, Notion link..."
                    value={lesson.fileUrl || ""}
                    onChange={e => updateLesson({ fileUrl: e.target.value })}
                  />
                </div>
              </div>

              {/* Upload — collapsible */}
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors"
                  onClick={() => setShowUpload(v => !v)}
                >
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                    <Paperclip className="w-3.5 h-3.5 text-accent/70" />
                    Upload Resource File
                    {lesson.fileUrl && <span className="px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[8px]">Uploaded</span>}
                  </span>
                  {showUpload
                    ? <ChevronUp className="w-3.5 h-3.5 text-white/30" />
                    : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
                </button>
                {showUpload && (
                  <div className="border-t border-white/10 p-3">
                    {lesson.fileUrl ? (
                      <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10">
                        <span className="text-xs text-white/50 truncate max-w-[200px]">{lesson.fileUrl.split('/').pop()}</span>
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
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors"
                  onClick={() => setShowNotes(v => !v)}
                >
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                    <FileText className="w-3.5 h-3.5 text-accent/70" />
                    Lesson Notes / Text
                    {lesson.content && <span className="px-1.5 py-0.5 rounded-full bg-accent/20 text-accent text-[8px]">Added</span>}
                  </span>
                  {showNotes
                    ? <ChevronUp className="w-3.5 h-3.5 text-white/30" />
                    : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
                </button>
                {showNotes && (
                  <div className="border-t border-white/10">
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

          {/* ── Tab: Quiz ── */}
          {tab === "quiz" && (
            <div className="p-4">
              <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white/80">Quiz Builder</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">
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

                <p className="text-xs text-white/40">
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

          {/* ── Tab: Assignment ── */}
          {tab === "assignment" && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent/80">Required Submission</p>
                  <p className="text-xs text-white/40 mt-0.5">Block lesson unlock until submitted</p>
                </div>
                <Switch
                  className="data-[state=checked]:bg-accent"
                  checked={lesson.requiredAssignment || false}
                  onCheckedChange={checked => updateLesson({ requiredAssignment: checked, isAssignment: true })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Assignment Description</label>
                <Textarea
                  className="bg-white/5 border-white/10 rounded-xl text-sm placeholder:text-white/25 focus:border-accent/40 hover:border-white/20"
                  rows={3}
                  placeholder="Describe what students need to do..."
                  value={lesson.assignmentDescription || ""}
                  onChange={e => updateLesson({ assignmentDescription: e.target.value, isAssignment: true })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Required Deliverables (comma-separated)</label>
                <Input
                  className="h-10 bg-white/5 border-white/10 text-sm placeholder:text-white/25 focus:border-accent/40 hover:border-white/20"
                  placeholder="GitHub Repo, Live URL, Screenshot..."
                  value={lesson.assignmentDeliverables?.join(", ") || ""}
                  onChange={e => updateLesson({
                    assignmentDeliverables: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean),
                    isAssignment: true,
                  })}
                />
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


const STEPS = [
  { id: 1, title: "Identity", description: "Course Personality", icon: Layout },
  { id: 2, title: "Visuals", description: "Creative Assets", icon: ImageIcon },
  { id: 3, title: "Curriculum", description: "Modules & Lessons", icon: BookOpen },
  { id: 4, title: "Logistics", description: "Mentorship & Ops", icon: Users },
  { id: 5, title: "Commercials", description: "Value & Pricing", icon: DollarSign },
  { id: 6, title: "Launch", description: "Final Verification", icon: Rocket },
];

export default function CreateCourse() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({ 0: true });
  const [questionLesson, setQuestionLesson] = useState<{ id: string, title: string, content?: string } | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Development",
    level: "Beginner",
    thumbnail: "",
    instructorId: "",
    submissionRequired: true,
    status: "draft",
    price: 0,
    discountPrice: 0,
    isFree: false,
    signerName: "",
    signerSignature: "",
    enrollmentMode: "direct",
    modules: [] as any[]
  });

  const { data: usersData } = useQuery(GET_USERS, { variables: { limit: 100 } });
  const trainers = (usersData as any)?.users?.items?.filter((u: any) => u.role === 'trainer' || u.role === 'admin' || u.role === 'super_admin') || [];

  const { data: categoryData } = useQuery(GET_CATEGORIES);
  const categories = (categoryData as any)?.categories || [];

  const [createCourse] = useMutation(CREATE_COURSE, {
    refetchQueries: [
      { query: GET_COURSES, variables: { page: 1, limit: 10 } },
      { query: GET_ADMIN_DASHBOARD_DATA }
    ],
    onCompleted: () => {
      toast.success("Course launched successfully!");
      navigate("/portal/admin/courses");
    },
    onError: (err) => {
      toast.error(err.message);
      setIsSubmitting(false);
    }
  });

  const handleNext = () => {
    if (currentStep === 1 && (!formData.title || !formData.description)) {
      toast.error("Identity check failed: Missing title or description.");
      return;
    }
    if (currentStep === 4 && !formData.instructorId) {
      toast.error("Logistics check failed: Missing instructor.");
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await createCourse({
        variables: {
          ...formData,
          price: formData.isFree ? 0 : Number(formData.price),
          discountPrice: Number(formData.discountPrice) || 0,
          modules: formData.modules.map((m: any) => ({
            title: m.title,
            description: m.description || "",
            lessons: m.lessons.map((l: any) => ({
              title: l.title,
              duration: Number(l.duration) || 0,
              videoUrl: l.videoUrl || "",
              fileUrl: l.fileUrl || "",
              type: l.type || "video",
              content: l.content || "",
              isAssignment: l.type === 'assignment',
              requiredAssignment: !!l.requiredAssignment,
              assignmentDescription: l.assignmentDescription || "",
              assignmentDeliverables: l.assignmentDeliverables || [],
            }))
          }))
        }
      });
    } catch (err) {
        setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <PortalLayout>
      <div className="min-h-[calc(100vh-100px)] flex gap-6 lg:p-4">
        
        {/* LEFT SIDEBAR: NAVIGATION */}
        <aside className="hidden xl:flex w-72 flex-col gap-4">
            <div className="glass-card rounded-[2rem] p-8 flex flex-col gap-8 h-full">
                <div className="space-y-2">
                    <h2 className="text-xl font-heading text-gradient-gold font-bold">Launchpad</h2>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">Course Creation Engine</p>
                </div>

                <nav className="flex flex-col gap-6">
                    {STEPS.map((step) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;

                        return (
                            <button
                                key={step.id}
                                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                                className={cn(
                                    "flex items-center gap-4 group transition-all duration-500 text-left",
                                    isActive ? "opacity-100" : "opacity-40 hover:opacity-100"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500",
                                    isActive ? "bg-accent shadow-gold text-accent-foreground scale-110" : 
                                    isCompleted ? "bg-green-500 text-white" : "bg-muted text-muted-foreground group-hover:scale-105"
                                )}>
                                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                </div>
                                <div className="min-w-0">
                                    <p className={cn(
                                        "text-xs font-black uppercase tracking-widest leading-none",
                                        isActive ? "text-accent" : "text-foreground"
                                    )}>{step.title}</p>
                                    <p className="text-[10px] text-muted-foreground truncate mt-1">{step.description}</p>
                                </div>
                            </button>
                        );
                    })}
                </nav>

                <div className="mt-auto p-4 rounded-2xl bg-accent/5 border border-accent/10 space-y-3">
                    <div className="flex items-center gap-2 text-accent">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase">Creator Pro Tip</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Courses with high-quality thumbnails and professional descriptions convert 3x better. Take your time!
                    </p>
                </div>
            </div>
        </aside>

        {/* CENTER: FORM CONTENT */}
        <main className="flex-1 flex flex-col gap-6">
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-8"
                    >
                        {/* Content Header */}
                        <div className="space-y-2">
                            <Badge variant="outline" className="text-accent border-accent/30 bg-accent/5 font-black uppercase text-[10px]">Step {currentStep} of 5</Badge>
                            <h1 className="text-4xl lg:text-5xl font-heading font-bold">{STEPS[currentStep-1].title}</h1>
                            <p className="text-muted-foreground text-lg">{STEPS[currentStep-1].description}</p>
                        </div>

                        {/* STEP 1: IDENTITY */}
                        {currentStep === 1 && (
                            <div className="grid gap-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Course Title</label>
                                    <Input 
                                        placeholder="e.g. Master React & Node.js"
                                        value={formData.title}
                                        onChange={(e) => updateFormData("title", e.target.value)}
                                        className="h-16 text-xl font-heading bg-muted/20 border-border/40 transition-all focus:border-accent/60 focus:ring-accent/10 rounded-2xl px-6"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Detailed Description</label>
                                    <Textarea 
                                        placeholder="Speak to your future students. What problems are you solving for them?"
                                        rows={8}
                                        value={formData.description}
                                        onChange={(e) => updateFormData("description", e.target.value)}
                                        className="bg-muted/20 border-border/40 focus:border-accent/60 rounded-2xl p-6 text-base leading-relaxed"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Specialization</label>
                                        <Input 
                                            value={formData.category}
                                            list="course-categories"
                                            onChange={(e) => updateFormData("category", e.target.value)}
                                            className="h-12 bg-muted/20 border-border/40 rounded-xl"
                                        />
                                        <datalist id="course-categories">
                                          {categories.map((cat: string) => (
                                            <option key={cat} value={cat} />
                                          ))}
                                        </datalist>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Difficulty Level</label>
                                        <Input 
                                            value={formData.level}
                                            onChange={(e) => updateFormData("level", e.target.value)}
                                            className="h-12 bg-muted/20 border-border/40 rounded-xl"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: VISUALS */}
                        {currentStep === 2 && (
                            <div className="space-y-8">
                                <div className="glass-card rounded-[2.5rem] p-1 overflow-hidden border-2 border-dashed border-accent/20">
                                    {formData.thumbnail ? (
                                        <div className="relative aspect-video rounded-[2.3rem] overflow-hidden group">
                                            <img src={formData.thumbnail} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                            <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="text-white">
                                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Visual Asset</p>
                                                    <p className="font-heading font-bold text-xl">High Definition Preview</p>
                                                </div>
                                                <Button variant="destructive" onClick={() => updateFormData("thumbnail", "")} className="rounded-2xl h-12">Replace Asset</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <FileUpload 
                                            folder="courses" 
                                            label="Elevate your course with a stunning billboard image (1920x1080)"
                                            onUploadComplete={(url) => updateFormData("thumbnail", url)}
                                        />
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-6 rounded-3xl bg-accent/5 border border-accent/10 space-y-2">
                                        <h4 className="font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent" /> Contrast Matters</h4>
                                        <p className="text-xs text-muted-foreground">Ensure your title text is readable if you burn it into the image. Use dark overlays effectively.</p>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-secondary/5 border border-secondary/10 space-y-2">
                                        <h4 className="font-bold flex items-center gap-2"><Globe className="w-4 h-4 text-secondary" /> Global Reach</h4>
                                        <p className="text-xs text-muted-foreground">This thumbnail will be social-shared. Keep important information centered for better cropping.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: CURRICULUM */}
                        {currentStep === 3 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-400">
                                <div className="flex items-center justify-between p-8 rounded-[2.5rem] bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-heading font-black flex items-center gap-2">
                                            <BookOpen className="w-6 h-6 text-accent" />
                                            Curriculum Builder
                                        </h3>
                                        <p className="text-sm text-muted-foreground">Organize your course into modules and lessons. Upload videos, documents, and attach quizzes or assignments.</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => setQuestionLesson({ id: "", title: "Course Wide" })}
                                            className="h-11 rounded-2xl gap-2 font-black uppercase text-[10px] tracking-widest border-accent/20 hover:border-accent hover:bg-accent/5"
                                        >
                                            <HelpCircle className="w-4 h-4 text-accent" /> Course Quiz
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                const newModules = [...formData.modules, { title: "New Module", description: "", lessons: [] }];
                                                setFormData({ ...formData, modules: newModules });
                                                setExpandedModules({ ...expandedModules, [newModules.length - 1]: true });
                                            }}
                                            className="h-11 rounded-2xl gap-2 font-black uppercase text-[10px] tracking-widest bg-accent text-accent-foreground hover:scale-[1.02] shadow-gold transition-transform"
                                        >
                                            <Plus className="w-4 h-4" /> Add Module
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    {formData.modules?.map((module: any, mIdx: number) => {
                                        const allDone = module.lessons?.length > 0 && module.lessons.every((l: any) => !!l.title && l.title !== "New Lesson");
                                        const missingCount = (module.lessons || []).filter((l: any) => !l.title || l.title === "New Lesson").length;
                                        return (
                                        <div key={mIdx} className={cn(
                                            "group relative glass-card rounded-[2rem] overflow-hidden border transition-all",
                                            allDone ? "border-green-500/30" : "border-border/40 hover:border-accent/30"
                                        )}>
                                            <div className={cn("absolute top-0 left-0 w-1.5 h-full transition-colors", allDone ? "bg-green-500" : "bg-accent/40 group-hover:bg-accent")} />

                                            <div className="pl-5 pr-5 py-5 space-y-4">
                                                {/* Module Header */}
                                                <div className="flex items-start gap-4 cursor-pointer" onClick={() => setExpandedModules(prev => ({ ...prev, [mIdx]: !prev[mIdx] }))}>
                                                    <div className={cn(
                                                        "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                                                        allDone ? "bg-green-500/10" : "bg-accent/10"
                                                    )}>
                                                        {allDone
                                                            ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                            : <span className="font-heading text-lg font-black text-accent">M{mIdx + 1}</span>
                                                        }
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex gap-2 items-center flex-wrap">
                                                            <Input
                                                                className="font-heading font-black text-lg bg-transparent border-0 border-b-2 border-transparent focus:border-accent focus:ring-0 rounded-none px-0 h-auto pb-0.5 flex-1 min-w-[120px]"
                                                                placeholder="Module Title"
                                                                value={module.title}
                                                                onClick={e => e.stopPropagation()}
                                                                onChange={e => {
                                                                    const nm = [...formData.modules];
                                                                    nm[mIdx] = { ...module, title: e.target.value };
                                                                    setFormData({ ...formData, modules: nm });
                                                                }}
                                                            />
                                                            <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                                                {allDone && (
                                                                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px] gap-1">
                                                                        <Check className="w-3 h-3" /> Complete
                                                                    </Badge>
                                                                )}
                                                                {!allDone && missingCount > 0 && (
                                                                    <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/5 text-[9px]">
                                                                        {missingCount} need title
                                                                    </Badge>
                                                                )}
                                                                <span className="text-xs text-muted-foreground">{module.lessons?.length || 0} lesson{module.lessons?.length !== 1 ? "s" : ""}</span>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/40 hover:text-destructive hover:bg-destructive/5" onClick={() => {
                                                                    setFormData({ ...formData, modules: formData.modules.filter((_: any, i: number) => i !== mIdx) });
                                                                }}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                                <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", expandedModules[mIdx] && "rotate-90")} />
                                                            </div>
                                                        </div>
                                                        <Input
                                                            className="text-sm h-8 bg-muted/30 border-none font-medium text-muted-foreground rounded-xl mt-1.5"
                                                            placeholder="Module description (optional)"
                                                            value={module.description || ""}
                                                            onClick={e => e.stopPropagation()}
                                                            onChange={e => {
                                                                const nm = [...formData.modules];
                                                                nm[mIdx] = { ...module, description: e.target.value };
                                                                setFormData({ ...formData, modules: nm });
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Lessons — ONLY this area scrolls, not the page */}
                                                {expandedModules[mIdx] && (
                                                    <div className="pt-3 border-t border-border/40 animate-in slide-in-from-top-4 duration-300 space-y-3">
                                                        <div className="max-h-[520px] overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                                                            {module.lessons?.map((lesson: any, lIdx: number) => (
                                                                <LessonCard
                                                                    key={lIdx}
                                                                    lesson={lesson}
                                                                    lIdx={lIdx}
                                                                    mIdx={mIdx}
                                                                    module={module}
                                                                    formData={formData}
                                                                    setFormData={setFormData}
                                                                    onQuizOpen={(l) => {
                                                                        const lessonId = l.id || `${mIdx}-${lIdx}`;
                                                                        setQuestionLesson({ id: lessonId, title: l.title || `Lesson ${lIdx + 1}`, content: l.content });
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>

                                                        <Button
                                                            variant="outline"
                                                            className="w-full h-11 border-2 border-dashed border-border/50 hover:border-accent hover:bg-accent/5 transition-all text-[10px] font-black tracking-widest uppercase gap-2 rounded-xl group"
                                                            onClick={() => {
                                                                const nm = [...formData.modules];
                                                                const nl = [...(module.lessons || []), { title: "", duration: 10, type: "video" }];
                                                                nm[mIdx] = { ...module, lessons: nl };
                                                                setFormData({ ...formData, modules: nm });
                                                            }}
                                                        >
                                                            <Plus className="w-4 h-4 text-accent transition-transform group-hover:rotate-90" />
                                                            Add Lesson to {module.title || "Module"}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* STEP 4: LOGISTICS */}
                        {currentStep === 4 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-400">
                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Designated Expert</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {trainers.map((t: any) => (
                                            <button 
                                                key={t.id}
                                                onClick={() => updateFormData("instructorId", t.id)}
                                                className={cn(
                                                    "p-5 rounded-[2rem] border-2 transition-all duration-300 text-left flex items-center gap-4",
                                                    formData.instructorId === t.id ? "bg-accent border-accent text-accent-foreground shadow-gold" : "bg-card border-border/50 hover:border-accent/40"
                                                )}
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-muted overflow-hidden shrink-0 border border-white/10">
                                                    {t.avatar ? <img src={t.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold">{t.username?.[0]}</div>}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold truncate text-sm">{t.fullName || t.username}</p>
                                                    <p className={cn("text-[9px] font-black uppercase tracking-widest", formData.instructorId === t.id ? "text-accent-foreground/60" : "text-muted-foreground")}>{t.role}</p>
                                                </div>
                                                {formData.instructorId === t.id && <div className="ml-auto w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"><Check className="w-4 h-4" /></div>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid gap-4 pt-4">
                                    <div className="group flex items-center justify-between p-8 glass-card rounded-[2.5rem] hover:ring-2 ring-accent/20 transition-all">
                                        <div className="space-y-2">
                                            <h4 className="text-lg font-heading font-black flex items-center gap-2">
                                                <Trophy className="w-5 h-5 text-accent" /> Strict Journey Mode
                                            </h4>
                                            <p className="text-xs text-muted-foreground max-w-sm">Enforce high standards. Units stay locked until assignments are reviewed and approved by the expert.</p>
                                        </div>
                                        <Switch className="data-[state=checked]:bg-accent" checked={formData.submissionRequired} onCheckedChange={(checked) => updateFormData("submissionRequired", checked)} />
                                    </div>

                                    <div className="glass-card rounded-[2.5rem] p-8 space-y-6 bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                                            <Trophy className="w-5 h-5 text-accent" />
                                            <h4 className="text-lg font-heading font-black">Certificate Configuration</h4>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Signer Full Name</label>
                                                <Input 
                                                    placeholder="e.g. Dr. John Smith"
                                                    value={formData.signerName}
                                                    onChange={(e) => updateFormData("signerName", e.target.value)}
                                                    className="h-12 bg-white/3 border-white/10 rounded-xl focus:border-accent/40"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Signer Signature Image</label>
                                                {formData.signerSignature ? (
                                                    <div className="relative h-24 rounded-2xl overflow-hidden border border-white/10 bg-white/5 p-2 flex items-center justify-center group/sig">
                                                        <img src={formData.signerSignature} className="h-full object-contain brightness-110 contrast-125" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/sig:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Button 
                                                                variant="destructive" 
                                                                size="sm" 
                                                                className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest"
                                                                onClick={() => updateFormData("signerSignature", "")}
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-[120px] rounded-2xl border-2 border-dashed border-white/5 bg-white/2 hover:border-accent/20 hover:bg-accent/5 transition-all">
                                                        <FileUpload 
                                                            folder="signatures" 
                                                            label="CLICK TO UPLOAD SCREENSHOT"
                                                            onUploadComplete={(url) => updateFormData("signerSignature", url)}
                                                        />
                                                    </div>
                                                )}
                                                <p className="text-[9px] text-white/30 italic">Upload a PNG signature or official stamp.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="group flex items-center justify-between p-8 glass-card rounded-[2.5rem] hover:ring-2 ring-accent/20 transition-all">
                                        <div className="space-y-2">
                                            <h4 className="text-lg font-heading font-black flex items-center gap-2">
                                                <Rocket className="w-5 h-5 text-accent" /> Instant Marketplace Launch
                                            </h4>
                                            <p className="text-xs text-muted-foreground max-w-sm">Skip the staging phase. Go live globally the moment you hit the launch button.</p>
                                        </div>
                                         <Switch className="data-[state=checked]:bg-accent" checked={formData.status === 'published'} onCheckedChange={(checked) => updateFormData("status", checked ? 'published' : 'draft')} />
                                     </div>

                                    <div className="group flex items-center justify-between p-8 glass-card rounded-[2.5rem] hover:ring-2 ring-accent/20 transition-all">
                                        <div className="space-y-2">
                                            <h4 className="text-lg font-heading font-black flex items-center gap-2">
                                                <Users className="w-5 h-5 text-accent" /> Require Application
                                            </h4>
                                            <p className="text-xs text-muted-foreground max-w-sm">Vet students before they can enroll. If disabled, students can enroll/pay directly.</p>
                                        </div>
                                        <Switch 
                                            className="data-[state=checked]:bg-accent" 
                                            checked={formData.enrollmentMode === 'application'} 
                                            onCheckedChange={(checked) => updateFormData("enrollmentMode", checked ? 'application' : 'direct')} 
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 5: COMMERCIALS */}
                        {currentStep === 5 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-400">
                                <div className="flex items-center justify-between p-10 rounded-[3rem] bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-heading font-bold">Philanthropic Access</h3>
                                        <p className="text-sm text-muted-foreground max-w-md">Enable "Free Mode" to make this course a community resource. This cannot be reversed later.</p>
                                    </div>
                                    <div className="flex flex-col items-center gap-3">
                                        <span className={cn("text-[10px] font-black uppercase tracking-widest", formData.isFree ? "text-accent" : "text-muted-foreground")}>{formData.isFree ? "Enabled" : "Disabled"}</span>
                                        <Switch checked={formData.isFree} onCheckedChange={(checked) => updateFormData("isFree", checked)} />
                                    </div>
                                </div>

                                {!formData.isFree && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="grid grid-cols-2 gap-8"
                                    >
                                        <div className="space-y-3 p-8 glass-card rounded-[2.5rem]">
                                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Standard Tuition (RWF)</label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-heading font-bold text-accent text-2xl">FRW</span>
                                                <Input 
                                                    type="number"
                                                    value={formData.price}
                                                    onChange={(e) => updateFormData("price", parseFloat(e.target.value) || 0)}
                                                    className="h-20 pl-24 text-3xl font-heading bg-transparent border-none focus-visible:ring-0"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3 p-8 glass-card rounded-[2.5rem]">
                                            <label className="text-xs font-black uppercase tracking-widest text-accent/60">Limited Offer Price (RWF)</label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-heading font-bold text-accent text-2xl">FRW</span>
                                                <Input 
                                                    type="number"
                                                    value={formData.discountPrice}
                                                    onChange={(e) => updateFormData("discountPrice", parseFloat(e.target.value) || 0)}
                                                    className="h-20 pl-24 text-3xl font-heading bg-transparent border-none focus-visible:ring-0"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                <div className="p-8 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 flex gap-6 items-start">
                                    <AlertCircle className="w-8 h-8 text-amber-500 shrink-0" />
                                    <div className="space-y-2">
                                        <p className="font-bold text-amber-500">Revenue Compliance Check</p>
                                        <p className="text-sm text-muted-foreground leading-relaxed">Ensure your pricing includes local taxes if applicable. Standard platform commission of 15% will be deducted from each transaction automatically.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 6: LAUNCH */}
                        {currentStep === 6 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-400">
                                <div className="glass-card rounded-[3rem] p-10 space-y-10 text-center relative overflow-hidden">
                                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
                                     <div className="space-y-4">
                                        <div className="w-20 h-20 rounded-[2rem] bg-accent shadow-gold mx-auto flex items-center justify-center text-accent-foreground">
                                            <Rocket className="w-10 h-10 animate-bounce" />
                                        </div>
                                        <h2 className="text-4xl font-heading font-black">Ready for Lift-off</h2>
                                        <p className="text-muted-foreground text-lg max-w-xl mx-auto">Your course is meticulously configured. One final launch command and your expertise will be live for the world to see.</p>
                                     </div>

                                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: "Identity", val: formData.title ? "Verified" : "Missing", ok: !!formData.title },
                                            { label: "Visuals", val: formData.thumbnail ? "Optimized" : "Empty", ok: !!formData.thumbnail },
                                            { label: "Logistics", val: formData.instructorId ? "Assigned" : "Missing", ok: !!formData.instructorId },
                                            { label: "Commercials", val: formData.isFree ? "Standard" : "Paid", ok: true }
                                        ].map(x => (
                                            <div key={x.label} className="p-4 rounded-2xl bg-muted/20 border border-border/40">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{x.label}</p>
                                                <p className={cn("text-xs font-bold", x.ok ? "text-green-500" : "text-amber-500")}>{x.val}</p>
                                            </div>
                                        ))}
                                     </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ACTION FOOTER */}
            <footer className="shrink-0 flex items-center justify-between p-8 glass-card rounded-[2.5rem] mt-auto">
                <Button 
                    variant="ghost" 
                    onClick={handleBack} 
                    disabled={currentStep === 1 || isSubmitting}
                    className="h-14 px-8 rounded-2xl gap-3 font-black uppercase text-[10px] tracking-widest text-muted-foreground hover:bg-muted/50"
                >
                    <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                
                <div className="flex gap-4">
                    {currentStep < STEPS.length ? (
                        <Button 
                            onClick={handleNext}
                            className="h-14 px-10 rounded-2xl gap-3 bg-accent text-accent-foreground font-black uppercase text-[10px] tracking-widest shadow-gold hover:scale-[1.02] transition-transform"
                        >
                        Next Step <ChevronRight className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button 
                            onClick={handleSubmit} 
                            disabled={isSubmitting}
                            className="h-14 px-14 rounded-2xl gap-3 bg-accent text-accent-foreground font-black uppercase text-[10px] tracking-widest shadow-gold hover:scale-[1.02] transition-transform"
                        >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> Execute Launch</>}
                        </Button>
                    )}
                </div>
            </footer>
        </main>

        {/* RIGHT PANEL: LIVE PREVIEW */}
        <aside className="hidden 2xl:flex w-[400px] flex-col gap-6">
            <div className="glass-card rounded-[2.5rem] flex flex-col h-full overflow-hidden">
                <div className="p-8 border-b border-border/10 flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Live Preview
                    </p>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500/40" />
                        <div className="w-2 h-2 rounded-full bg-amber-500/40" />
                        <div className="w-2 h-2 rounded-full bg-green-500/40" />
                    </div>
                </div>
                
                <div className="flex-1 p-8 flex flex-col justify-center gap-8 bg-gradient-to-b from-transparent to-accent/5">
                    <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Student Portal View</p>
                    
                    {/* The Live Course Card */}
                    <motion.div 
                        initial={false}
                        animate={{ scale: [0.98, 1], opacity: [0.9, 1] }}
                        className="w-full aspect-[4/5] glass-card rounded-[3rem] overflow-hidden flex flex-col shadow-2xl group border-2 border-white/20"
                    >
                        {/* Card Image */}
                        <div className="relative h-[55%]">
                            {formData.thumbnail ? (
                                <img src={formData.thumbnail} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-3">
                                    <ImageIcon className="w-12 h-12 text-muted-foreground/20" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Asset Pending</p>
                                </div>
                            )}
                            <div className="absolute top-6 left-6 flex items-center gap-2">
                                <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest">
                                    {formData.level}
                                </div>
                            </div>
                        </div>

                        {/* Card Info */}
                        <div className="flex-1 p-8 flex flex-col justify-between">
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase text-accent tracking-widest">{formData.category}</p>
                                <h3 className="text-2xl font-heading font-black tracking-tight leading-none line-clamp-2 italic">
                                    {formData.title || "Untitled Course"}
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <BookOpen className="w-3 h-3" />
                                    {formData.modules?.length || 0} Modules • {formData.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0} Lessons
                                </p>
                            </div>
                            
                            <div className="flex items-center justify-between pt-6 border-t border-border/10">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                                        {trainers.find(t => t.id === formData.instructorId)?.username?.[0] || "?"}
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-tighter opacity-60">Curated Expert</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tuition</p>
                                    <p className="font-heading font-black text-xl text-gradient-gold">
                                        {formData.isFree ? "GRATIS" : `FRW ${formData.discountPrice || formData.price || "0"}`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="space-y-4">
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-accent shadow-gold" 
                                animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                            />
                        </div>
                        <p className="text-center text-[10px] font-black uppercase tracking-widest text-accent">Completion {(currentStep / STEPS.length * 100).toFixed(0)}%</p>
                    </div>
                </div>
            </div>
        </aside>

      </div>
      
      {/* Quiz Modal overlay out of main container flow */}
      <ManageQuestionsDialog
        open={!!questionLesson}
        onOpenChange={(open) => !open && setQuestionLesson(null)}
        courseId=""
        courseTitle={formData.title}
        lessonId={questionLesson?.id}
        lessonTitle={questionLesson?.title}
        lessonContent={questionLesson?.content}
      />
    </PortalLayout>
  );
}
