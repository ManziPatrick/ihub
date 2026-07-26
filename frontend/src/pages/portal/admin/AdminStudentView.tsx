import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ManageQuestionsDialog, ManageCodeExercisesDialog } from "@/components/portal/dialogs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_COURSE } from "@/lib/graphql/queries";
import { UPDATE_COURSE } from "@/lib/graphql/mutations";
import { getVideoEmbedUrl, normalizeContent } from "@/lib/utils";
import { toast } from "sonner";
import {
  BookOpen,
  Layers,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Eye,
  PlayCircle,
  FileText,
  HelpCircle,
  Code,
  Save,
  Edit,
  X,
  Check,
  Lock,
  CheckCircle,
  Video,
  ListOrdered,
  PanelRightClose,
  PanelRightOpen,
  Loader2,
  AlertTriangle,
  ExternalLink,
  FileQuestion,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export default function AdminStudentView() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [editLessonForQuiz, setEditLessonForQuiz] = useState<any>(null);
  const [editLessonForCode, setEditLessonForCode] = useState<any>(null);

  const { data, loading, error, refetch } = useQuery(GET_COURSE, {
    variables: { id: courseId },
  });

  const [updateCourse] = useMutation(UPDATE_COURSE);

  const course = (data as any)?.course;
  const allLessons: any[] = useMemo(
    () => course?.modules?.flatMap((m: any) => m.lessons || []) || [],
    [course]
  );

  const currentLesson = useMemo(
    () => allLessons.find((l) => (l.id || l._id) === activeLessonId) || allLessons[0],
    [allLessons, activeLessonId]
  );

  const currentIndex = allLessons.findIndex((l) => (l.id || l._id) === activeLessonId);

  // Set first lesson as active on load
  useEffect(() => {
    if (!activeLessonId && allLessons.length > 0) {
      setActiveLessonId(allLessons[0].id || allLessons[0]._id);
    }
  }, [allLessons, activeLessonId]);

  // Start editing the current lesson
  const startEditing = () => {
    const lid = currentLesson?.id || currentLesson?._id;
    if (!lid) return;
    setEditingLessonId(lid);
    setEditDraft({
      title: currentLesson.title || "",
      content: currentLesson.content || "",
      videoUrl: currentLesson.videoUrl || "",
      fileUrl: currentLesson.fileUrl || "",
      duration: currentLesson.duration || 0,
      type: currentLesson.type || "video",
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingLessonId(null);
    setEditDraft(null);
  };

  // Save changes to the current lesson
  const handleSave = async () => {
    if (!courseId || !editingLessonId || !editDraft) return;
    setIsSaving(true);
    try {
      // Build the full course modules with the updated lesson
      const updatedModules = course.modules.map((mod: any) => ({
        ...mod,
        lessons: mod.lessons.map((l: any) => {
          const lid = l.id || l._id;
          if (lid !== editingLessonId) return l;
          return {
            ...l,
            title: editDraft.title,
            content: editDraft.content,
            videoUrl: editDraft.videoUrl,
            fileUrl: editDraft.fileUrl,
            duration: editDraft.duration,
            type: editDraft.type,
          };
        }),
      }));

      await updateCourse({
        variables: {
          id: courseId,
          modules: updatedModules,
        },
      });

      toast.success("Lesson saved successfully!");
      setEditingLessonId(null);
      setEditDraft(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to save lesson");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prev = allLessons[currentIndex - 1];
      setActiveLessonId(prev.id || prev._id);
    }
  };

  const handleNext = () => {
    if (currentIndex < allLessons.length - 1) {
      const next = allLessons[currentIndex + 1];
      setActiveLessonId(next.id || next._id);
    }
  };

  // ─── Loading state ───────────────────────────────────────────
  if (loading) {
    return (
      <PortalLayout>
        <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
          <div className="h-4 w-48 bg-muted/50 rounded animate-pulse" />
          <div className="h-28 w-full bg-muted/50 rounded-2xl animate-pulse" />
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-4">
              <div className="aspect-video bg-muted/60 rounded-2xl animate-pulse" />
              <div className="h-6 w-2/3 bg-muted/50 rounded animate-pulse" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-3 w-full bg-muted/40 rounded animate-pulse" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-muted/30 rounded-xl animate-pulse"
                  style={{ animationDelay: `${i * 60}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (error || !course) {
    return (
      <PortalLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold">Course Not Found</h2>
          <p className="text-muted-foreground text-sm">
            {error?.message || "The course doesn't exist or you don't have access."}
          </p>
          <Button variant="outline" onClick={() => navigate("/portal/admin/courses")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Courses
          </Button>
        </div>
      </PortalLayout>
    );
  }

  const isEditing = editingLessonId === (currentLesson?.id || currentLesson?._id);

  return (
    <PortalLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* ── Header / Admin Preview Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 p-3 bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 rounded-xl"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
              <Eye className="w-4 h-4 text-accent" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span                      className="text-xs font-bold uppercase tracking-wider text-accent">Admin Student View</span>
                                <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[8px] px-1 py-0 h-4 font-black uppercase">
                                  Preview Mode
                                </Badge>
                                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] px-1 py-0 h-4 font-black uppercase">
                                  All Unlocked
                                </Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                You're viewing <strong>{course.title}</strong> as a student would — click <Edit className="w-2.5 h-2.5 inline" /> to edit
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[10px] font-bold border-border/40"
              onClick={() => navigate(`/portal/admin/course-preview/${courseId}`)}
            >
              <ArrowLeft className="w-3 h-3 mr-1" /> Back
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[10px] font-bold border-border/40"
              asChild
            >
              <Link to={`/portal/student/courses/${courseId}`} target="_blank">
                <ExternalLink className="w-3 h-3 mr-1" /> Real Student View
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* ── Course Banner ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-muted/10 rounded-2xl border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-border/50 shadow-lg shrink-0">
              <img
                src={course.thumbnail || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600"}
                onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600"; }}
                className="w-full h-full object-cover"
                alt={course.title}
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-foreground tracking-tight line-clamp-1">
                {course.title}
              </h1>
              <div className="flex items-center flex-wrap gap-2 mt-1">
                <Badge className="text-[9px] uppercase font-black bg-accent/10 text-accent border-accent/20 px-1.5 py-0.5">
                  {course.category || "General"}
                </Badge>
                <span className="text-muted-foreground text-[10px] font-medium">
                  {course.modules?.length || 0} modules · {allLessons.length} lessons
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[10px] font-bold"
              onClick={() => navigate(`/portal/admin/courses`)}
            >
              Back to Courses
            </Button>
          </div>
        </div>

        {/* ── Sidebar Toggle ── */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen((v) => !v)}
            className="gap-2 text-xs text-muted-foreground hover:text-foreground border border-border/40 rounded-xl px-3 h-8"
          >
            {sidebarOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
            {sidebarOpen ? "Hide Track" : "Show Track"}
          </Button>
        </div>

        {/* ── Main Content + Sidebar ── */}
        <div className={`grid gap-6 transition-all duration-300 ${sidebarOpen ? "lg:grid-cols-12" : "lg:grid-cols-1"}`}>
          {/* ─── Main Lesson Area ─── */}
          <div className={sidebarOpen ? "lg:col-span-8 space-y-6" : "space-y-6"}>
            {currentLesson && (
              <div className="space-y-4">
                {/* Edit / Save toolbar */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[9px] font-black uppercase tracking-wider">
                      Lesson {currentIndex + 1} of {allLessons.length}
                    </Badge>
                    {currentLesson.type && (
                      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[9px] font-black uppercase tracking-wider">
                        {currentLesson.type}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-[10px] font-bold border-red-500/30 text-red-500 hover:bg-red-500/10"
                          onClick={cancelEditing}
                          disabled={isSaving}
                        >
                          <X className="w-3 h-3 mr-1" /> Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-[10px] font-bold bg-green-500 hover:bg-green-600 text-white"
                          onClick={handleSave}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Save className="w-3 h-3 mr-1" />
                          )}
                          {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-[10px] font-bold border-accent/30 text-accent hover:bg-accent/10"
                          onClick={startEditing}
                        >
                          <Edit className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={handlePrevious}
                            disabled={currentIndex === 0}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={handleNext}
                            disabled={currentIndex === allLessons.length - 1}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* ─── Lesson Content Card ─── */}
                <Card className="border-border/50 overflow-hidden shadow-2xl">
                  {isEditing ? (
                    /* ── TYPE-SPECIFIC INLINE EDITOR ── */
                    <div className="p-6 space-y-6">
                      {/* Always show title + type selector + duration */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            Lesson Title
                          </label>
                          <Input
                            className="h-10 text-base font-bold"
                            value={editDraft?.title || ""}
                            onChange={(e) => setEditDraft((d: any) => ({ ...d, title: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            Duration (min)
                          </label>
                          <Input
                            type="number"
                            className="h-10 text-sm"
                            value={editDraft?.duration || 0}
                            onChange={(e) => setEditDraft((d: any) => ({ ...d, duration: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                          Lesson Type
                        </label>
                        <select
                          className="h-10 w-full max-w-xs px-3 rounded-xl border border-border/40 bg-background text-sm outline-none focus:border-accent/60"
                          value={editDraft?.type || "video"}
                          onChange={(e) => setEditDraft((d: any) => ({ ...d, type: e.target.value }))}
                        >
                          {["video", "article", "pdf", "ppt", "book", "quiz", "assignment"].map((t) => (
                            <option key={t} value={t}>
                              {t.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* ── TYPE: Video / PDF / PPT / Book ── */}
                      {["video", "pdf", "ppt", "book"].includes(editDraft?.type) && (
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1">
                              <Video className="w-3 h-3" /> Media / Stream URL
                            </label>
                            <Input
                              className="h-10 text-sm font-mono"
                              placeholder="YouTube, Vimeo, AWS S3..."
                              value={editDraft?.videoUrl || ""}
                              onChange={(e) => setEditDraft((d: any) => ({ ...d, videoUrl: e.target.value }))}
                            />
                            {/* Live video preview */}
                            {editDraft?.videoUrl && (
                              <div className="mt-2 aspect-video bg-black rounded-xl overflow-hidden">
                                <iframe
                                  src={getVideoEmbedUrl(editDraft.videoUrl)}
                                  className="w-full h-full"
                                  allowFullScreen
                                  loading="lazy"
                                />
                              </div>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" /> File / Resource URL
                            </label>
                            <Input
                              className="h-10 text-sm font-mono"
                              placeholder="G-Drive, Dropbox link..."
                              value={editDraft?.fileUrl || ""}
                              onChange={(e) => setEditDraft((d: any) => ({ ...d, fileUrl: e.target.value }))}
                            />
                          </div>
                        </div>
                      )}

                      {/* ── TYPE: Article (content-focused) ── */}
                      {editDraft?.type === "article" && (
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                              Content / Description (Markdown)
                            </label>
                            <Textarea
                              className="min-h-[200px] text-sm font-mono leading-relaxed"
                              placeholder="Write lesson content in markdown. HTML tags like <code>code</code> will render as styled."
                              value={editDraft?.content || ""}
                              onChange={(e) => setEditDraft((d: any) => ({ ...d, content: e.target.value }))}
                            />
                          </div>
                          {/* Live markdown preview */}
                          {editDraft?.content && (
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                Preview
                              </label>
                              <div className="prose dark:prose-invert max-w-none p-4 rounded-xl bg-muted/10 border border-border/40 lesson-content-viewer">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                  {normalizeContent(editDraft.content)}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── TYPE: Quiz ── */}
                      {editDraft?.type === "quiz" && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                              Quiz Questions
                            </label>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px] font-bold"
                              onClick={() => {
                                setEditLessonForQuiz(currentLesson);
                                setQuizDialogOpen(true);
                              }}
                            >
                              <HelpCircle className="w-3 h-3 mr-1" /> Manage Quiz
                            </Button>
                          </div>
                          {currentLesson.quizQuestions?.length > 0 ? (
                            <div className="space-y-3">
                              {currentLesson.quizQuestions.map((q: any, qi: number) => (
                                <div key={q.id || qi} className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                                  <p className="text-sm font-bold mb-2 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-[10px] font-black shrink-0">
                                      {qi + 1}
                                    </span>
                                    {q.questionText}
                                  </p>
                                  <div className="ml-8 space-y-1.5">
                                    {(q.options || []).map((opt: string, oi: number) => (
                                      <div
                                        key={oi}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
                                          oi === q.correctOptionIndex
                                            ? "bg-green-500/10 text-green-500 border border-green-500/20 font-semibold"
                                            : "bg-muted/20 text-muted-foreground border border-border/20"
                                        }`}
                                      >
                                        {oi === q.correctOptionIndex ? (
                                          <CheckCircle className="w-3 h-3 shrink-0" />
                                        ) : (
                                          <div className="w-3 h-3 rounded-full border border-border shrink-0" />
                                        )}
                                        {opt}
                                        {oi === q.correctOptionIndex && (
                                          <span className="text-[8px] font-black uppercase ml-auto text-green-500">Correct</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 text-center rounded-xl bg-amber-500/5 border border-dashed border-amber-500/30">
                              <HelpCircle className="w-8 h-8 text-amber-500/50 mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">No quiz questions yet</p>
                              <p className="text-xs text-muted-foreground/60 mt-1">Click "Manage Quiz" to add questions</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── TYPE: Assignment / Exam ── */}
                      {editDraft?.type === "assignment" && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                              Exam / Assignment Questions
                            </label>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px] font-bold"
                              onClick={() => {
                                setEditLessonForQuiz(currentLesson);
                                setQuizDialogOpen(true);
                              }}
                            >
                              <HelpCircle className="w-3 h-3 mr-1" /> Manage Exam
                            </Button>
                          </div>
                          {currentLesson.assignmentQuestions?.length > 0 ? (
                            <div className="space-y-3">
                              {currentLesson.assignmentQuestions.map((q: any, qi: number) => (
                                <div key={q.id || qi} className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                                  <p className="text-sm font-bold mb-2 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center text-[10px] font-black shrink-0">
                                      {qi + 1}
                                    </span>
                                    {q.questionText}
                                  </p>
                                  {q.options?.length > 0 && (
                                    <div className="ml-8 space-y-1.5">
                                      {(q.options || []).map((opt: string, oi: number) => (
                                        <div
                                          key={oi}
                                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
                                            oi === q.correctOptionIndex
                                              ? "bg-green-500/10 text-green-500 border border-green-500/20 font-semibold"
                                              : "bg-muted/20 text-muted-foreground border border-border/20"
                                          }`}
                                        >
                                          {oi === q.correctOptionIndex ? (
                                            <CheckCircle className="w-3 h-3 shrink-0" />
                                          ) : (
                                            <div className="w-3 h-3 rounded-full border border-border shrink-0" />
                                          )}
                                          {opt}
                                          {oi === q.correctOptionIndex && (
                                            <span className="text-[8px] font-black uppercase ml-auto text-green-500">Correct</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 text-center rounded-xl bg-purple-500/5 border border-dashed border-purple-500/30">
                              <GraduationCap className="w-8 h-8 text-purple-500/50 mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">No exam questions yet</p>
                              <p className="text-xs text-muted-foreground/60 mt-1">Click "Manage Exam" to add questions</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Code Exercises (shown for all types that can have them) ── */}
                      {currentLesson.codeExercises?.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-border/40">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                              Code Exercises
                            </label>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px] font-bold"
                              onClick={() => {
                                setEditLessonForCode(currentLesson);
                                setCodeDialogOpen(true);
                              }}
                            >
                              <Code className="w-3 h-3 mr-1" /> Manage Exercises
                            </Button>
                          </div>
                          {currentLesson.codeExercises.map((ex: any, ei: number) => (
                            <div key={ex.id || ei} className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-bold">{ei + 1}. {ex.title || `Exercise ${ei + 1}`}</p>
                                <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[8px] font-black">{ex.language}</Badge>
                              </div>
                              {ex.description && <p className="text-[11px] text-muted-foreground">{ex.description}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ── STUDENT VIEW (read-only preview) ── */
                    <div className="space-y-6">
                      {/* Video / Media */}
                      <div className="aspect-video bg-black relative group">
                        {currentLesson.videoUrl ? (
                          <iframe
                            src={getVideoEmbedUrl(currentLesson.videoUrl)}
                            className="w-full h-full"
                            allowFullScreen
                            loading="lazy"
                          />
                        ) : currentLesson.fileUrl ? (
                          <div className="w-full h-full flex flex-col items-center justify-center text-center p-12 bg-muted/20">
                            <FileText className="w-16 h-16 text-accent mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">{currentLesson.title}</h3>
                            <Button variant="outline" asChild>
                              <a href={currentLesson.fileUrl} target="_blank" rel="noopener noreferrer">
                                Open Resource
                              </a>
                            </Button>
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-center p-12 bg-muted/20">
                            <PlayCircle className="w-16 h-16 text-muted-foreground/30 mb-4" />
                            <h3 className="text-xl font-bold text-white">{currentLesson.title}</h3>
                            <p className="text-muted-foreground/60 text-sm mt-2">No media attached</p>
                          </div>
                        )}
                        {/* Edit overlay button */}
                        <button
                          onClick={startEditing}
                          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-accent/80 border border-white/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105"
                          title="Edit lesson"
                        >
                          <Edit className="w-4 h-4 text-white" />
                        </button>
                      </div>

                      <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-bold">{currentLesson.title}</h2>
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px] font-black uppercase">
                            {currentLesson.duration || "?"} min
                          </Badge>
                        </div>

                        {/* Content */}
                        <div className="prose dark:prose-invert max-w-none mb-8 lesson-content-viewer">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                            {normalizeContent(currentLesson.content || currentLesson.description || "")}
                          </ReactMarkdown>
                        </div>

                        {/* Quiz preview */}
                        {(currentLesson.quizQuestions?.length > 0 || currentLesson.type === "quiz") && (
                          <div className="mt-8 p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-bold flex items-center gap-2 text-amber-500">
                                <HelpCircle className="w-5 h-5" />
                                Module Quiz Preview
                              </h3>
                              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                                {currentLesson.quizQuestions?.length || 0} Questions
                              </Badge>
                            </div>
                            {currentLesson.quizQuestions?.length > 0 ? (
                              <div className="space-y-3">
                                {currentLesson.quizQuestions.map((q: any, qi: number) => (
                                  <div
                                    key={q.id || qi}
                                    className="p-3 rounded-xl bg-card border border-border/40"
                                  >
                                    <p className="text-sm font-medium mb-2">
                                      {qi + 1}. {q.questionText}
                                    </p>
                                    <div className="space-y-1">
                                      {(q.options || []).map((opt: string, oi: number) => (
                                        <div
                                          key={oi}
                                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
                                            oi === q.correctOptionIndex
                                              ? "bg-green-500/10 text-green-500 border border-green-500/20"
                                              : "bg-muted/20 text-muted-foreground border border-border/20"
                                          }`}
                                        >
                                          {oi === q.correctOptionIndex ? (
                                            <CheckCircle className="w-3 h-3 shrink-0" />
                                          ) : (
                                            <div className="w-3 h-3 rounded-full border border-border shrink-0" />
                                          )}
                                          {opt}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">No questions added yet. Click Edit to add quiz questions.</p>
                            )}
                          </div>
                        )}

                        {/* Assignment preview */}
                        {(currentLesson.assignmentQuestions?.length > 0 || currentLesson.type === "assignment") && (
                          <div className="mt-8 p-6 rounded-2xl border border-purple-500/20 bg-purple-500/5">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-bold flex items-center gap-2 text-purple-500">
                                <GraduationCap className="w-5 h-5" />
                                Exam / Assignment Preview
                              </h3>
                              <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                                {currentLesson.assignmentQuestions?.length || 0} Questions
                              </Badge>
                            </div>
                            {currentLesson.assignmentQuestions?.length > 0 ? (
                              <div className="space-y-3">
                                {currentLesson.assignmentQuestions.map((q: any, qi: number) => (
                                  <div
                                    key={q.id || qi}
                                    className="p-3 rounded-xl bg-card border border-border/40"
                                  >
                                    <p className="text-sm font-medium mb-2">
                                      {qi + 1}. {q.questionText}
                                    </p>
                                    {q.options?.length > 0 && (
                                      <div className="space-y-1">
                                        {(q.options || []).map((opt: string, oi: number) => (
                                          <div
                                            key={oi}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
                                              oi === q.correctOptionIndex
                                                ? "bg-green-500/10 text-green-500 border border-green-500/20"
                                                : "bg-muted/20 text-muted-foreground border border-border/20"
                                            }`}
                                          >
                                            {oi === q.correctOptionIndex ? (
                                              <CheckCircle className="w-3 h-3 shrink-0" />
                                            ) : (
                                              <div className="w-3 h-3 rounded-full border border-border shrink-0" />
                                            )}
                                            {opt}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">No exam questions added yet.</p>
                            )}
                          </div>
                        )}

                        {/* Code Exercise preview */}
                        {currentLesson.codeExercises?.length > 0 && (
                          <div className="mt-8 p-6 rounded-2xl border border-blue-500/20 bg-blue-500/5">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-bold flex items-center gap-2 text-blue-500">
                                <Code className="w-5 h-5" />
                                Code Exercises Preview
                              </h3>
                              <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                {currentLesson.codeExercises.length} Exercises
                              </Badge>
                            </div>
                            <div className="space-y-3">
                              {currentLesson.codeExercises.map((ex: any, ei: number) => (
                                <div
                                  key={ex.id || ei}
                                  className="p-4 rounded-xl bg-card border border-border/40"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-bold">
                                      {ei + 1}. {ex.title || `Exercise ${ei + 1}`}
                                    </p>
                                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[8px] font-black uppercase">
                                      {ex.language || "javascript"}
                                    </Badge>
                                  </div>
                                  {ex.description && (
                                    <p className="text-xs text-muted-foreground mb-2">{ex.description}</p>
                                  )}
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                    {ex.initialCode && (
                                      <span className="flex items-center gap-1">
                                        <Check className="w-3 h-3 text-green-500" /> Initial code set
                                      </span>
                                    )}
                                    {ex.testCode && (
                                      <span className="flex items-center gap-1">
                                        <Check className="w-3 h-3 text-green-500" /> Tests defined
                                      </span>
                                    )}
                                    {ex.expectedOutput && (
                                      <span className="flex items-center gap-1">
                                        <Check className="w-3 h-3 text-green-500" /> Expected output
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Navigation buttons (disabled, this is a preview) */}
                        <div className="flex justify-between mt-10 gap-4">
                          <Button
                            variant="outline"
                            className="w-full sm:w-auto border-border/50"
                            onClick={handlePrevious}
                            disabled={currentIndex === 0 || isEditing}
                          >
                            <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                          </Button>
                          <Button
                            variant="gold"
                            className="w-full sm:w-auto"
                            onClick={handleNext}
                            disabled={currentIndex === allLessons.length - 1 || isEditing}
                          >
                            Next <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>

          {/* ─── Track Overview Sidebar ─── */}
          {sidebarOpen && (
            <div className="lg:col-span-4 h-fit lg:sticky lg:top-24">
              <Card className="border-border/50">
                <div className="p-3 border-b border-border/30 bg-muted/10 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                  <ListOrdered className="w-3.5 h-3.5 text-accent" />
                  Curriculum — All Unlocked
                </div>
                <CardContent className="p-0">
                  <ScrollArea className="max-h-[60vh] lg:h-[calc(100vh-220px)] lg:max-h-[700px]">
                    <div className="p-3 space-y-2">
                      <Accordion
                        type="multiple"
                        defaultValue={course.modules?.map((_: any, i: number) => `mod-${i}`)}
                        className="w-full space-y-2"
                      >
                        {course.modules?.map((mod: any, mIdx: number) => (
                          <AccordionItem
                            key={mod.id || mod._id}
                            value={`mod-${mIdx}`}
                            className="border rounded-xl px-3 bg-background"
                          >
                            <AccordionTrigger className="hover:no-underline flex-1 text-left py-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-3 h-3 shrink-0" />
                                <h4 className="text-[10px] font-bold text-accent uppercase tracking-wide line-clamp-1">
                                  {mod.title}
                                </h4>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-1 pb-2 space-y-1">
                              {mod.lessons?.map((les: any) => {
                                const lesId = les.id || les._id;
                                const isActive = lesId === activeLessonId;
                                return (
                                  <button
                                    key={lesId}
                                    onClick={() => {
                                      setActiveLessonId(lesId);
                                      if (editingLessonId) {
                                        setEditingLessonId(null);
                                        setEditDraft(null);
                                      }
                                    }}
                                    className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-center gap-2 ${
                                      isActive
                                        ? "bg-accent/10 border border-accent/20 text-accent font-bold"
                                        : "hover:bg-muted/10 text-muted-foreground"
                                    }`}
                                  >
                                    <div className="flex-1 min-w-0 flex items-center gap-2">
                                      {les.type === "quiz" ? (
                                        <HelpCircle className="w-3 h-3 shrink-0" />
                                      ) : les.type === "assignment" ? (
                                        <GraduationCap className="w-3 h-3 shrink-0" />
                                      ) : (
                                        <BookOpen className="w-3 h-3 shrink-0" />
                                      )}
                                      <p className="truncate">{les.title}</p>
                                    </div>
                                    {isActive && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* ─── Quiz / Exam Questions Dialog ─── */}
      {editLessonForQuiz && (
        <ManageQuestionsDialog
          open={quizDialogOpen}
          onOpenChange={(open) => {
            setQuizDialogOpen(open);
            if (!open) {
              refetch();
            }
          }}
          courseId={courseId!}
          lessonId={editLessonForQuiz.id || editLessonForQuiz._id}
          type={editLessonForQuiz.type === "assignment" ? "assignment" : "quiz"}
        />
      )}

      {/* ─── Code Exercises Dialog ─── */}
      {editLessonForCode && (
        <ManageCodeExercisesDialog
          open={codeDialogOpen}
          onOpenChange={(open) => {
            setCodeDialogOpen(open);
            if (!open) {
              refetch();
            }
          }}
          courseId={courseId!}
          lessonId={editLessonForCode.id || editLessonForCode._id}
        />
      )}
    </PortalLayout>
  );
}
