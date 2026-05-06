import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { TextEditor } from "@/components/ui/text-editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PlayCircle,
  CheckCircle,
  Lock,
  Clock,
  BookOpen,
  FileText,
  Download,
  MessageSquare,
  Users,
  Award,
  ChevronLeft,
  ChevronRight,
  Code,
  FolderOpen,
  HelpCircle,
  Video,
  FileBox,
  Calendar,
  AlertCircle,
  Star,
  Flame,
  Trophy,
  Printer,
} from "lucide-react";
import { RequestHelpDialog, BookCallDialog } from "@/components/portal/dialogs";
import { LessonQuiz } from "@/components/portal/LessonQuiz";
import { AssignmentExamView } from "@/components/portal/AssignmentExamView";
import { PPTViewer } from "@/components/portal/PPTViewer";
import { toast } from "sonner";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_COURSE, GET_ME, GET_ASSIGNMENT_SUBMISSIONS } from "@/lib/graphql/queries";
import { COMPLETE_LESSON, SUBMIT_ASSIGNMENT } from "@/lib/graphql/mutations";
import { triggerFileDownload } from "@/lib/download";

interface AssignmentSubmission {
  id: string;
  userId: string;
  content: string;
  status: string;
  grade?: number;
  feedback?: string;
}

interface GetAssignmentSubmissionsData {
  getAssignmentSubmissions: {
    items: AssignmentSubmission[];
    pagination: any;
  };
}

export default function CourseDetail() {
  const { courseId } = useParams();
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [submissionContent, setSubmissionContent] = useState("");
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [forcedProgressLessonIds, setForcedProgressLessonIds] = useState<string[]>([]);

  // Queries
  const { data: userData, refetch: refetchUser } = useQuery(GET_ME);
  const { data, loading, error } = useQuery(GET_COURSE, {
    variables: { id: courseId }
  });

  const course = (data as any)?.course;
  const me = (userData as any)?.me;
  const completedLessons = me?.completedLessons || [];

  const [completeLessonMutation] = useMutation(COMPLETE_LESSON);
  const [submitAssignmentMutation] = useMutation(SUBMIT_ASSIGNMENT);

  const { data: submissionsData, refetch: refetchSubmissions } = useQuery<GetAssignmentSubmissionsData>(GET_ASSIGNMENT_SUBMISSIONS, {
    variables: { courseId, lessonId: activeLessonId },
    skip: !activeLessonId
  });

  const existingSubmission = submissionsData?.getAssignmentSubmissions?.items?.[0];

  useEffect(() => {
    if (existingSubmission?.content) {
      setSubmissionContent(existingSubmission.content);
    } else {
      setSubmissionContent("");
    }
  }, [existingSubmission, activeLessonId]);

  useEffect(() => {
    if (!activeLessonId && course?.modules?.[0]?.lessons?.[0]) {
      const firstLesson = course.modules[0].lessons[0];
      setActiveLessonId(firstLesson.id || firstLesson._id);
    }
  }, [course, activeLessonId]);

  if (loading) return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="h-64 lg:h-96 bg-muted rounded-xl animate-pulse"></div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-8 w-64 bg-muted rounded animate-pulse"></div>
            <div className="h-32 bg-muted rounded-xl animate-pulse"></div>
          </div>
          <div className="space-y-4">
            <div className="h-64 bg-muted rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );

  if (error || !course) return (
    <PortalLayout>
      <div className="text-center p-12 space-y-4">
        <p className="text-muted-foreground">Course not found or error loading contents.</p>
        {error && <p className="text-red-500 text-sm font-mono bg-red-50 p-2 rounded">{error.message}</p>}
        <Button variant="outline" asChild>
          <Link to="/portal/student/courses">Back to My Courses</Link>
        </Button>
      </div>
    </PortalLayout>
  );

  const allLessons: any[] = course.modules?.flatMap((m: any) => m.lessons || []) || [];
  const currentLesson = allLessons.find(l => (l.id || l._id) === activeLessonId) || allLessons[0];
  const currentIndex = allLessons.findIndex(l => (l.id || l._id) === activeLessonId);

  const totalSatisfied = allLessons.filter(l => completedLessons.some((cl: any) => cl.courseId === courseId && cl.lessonId === (l.id || l._id)) || forcedProgressLessonIds.includes(l.id || l._id)).length;
  const progressPercent = Math.round((totalSatisfied / allLessons.length) * 100) || 0;

  const isCourseCompleted = me?.completedCourses?.some((cc: any) => cc.id === courseId);

  const isModuleCompleted = (mod: any) => {
    const modLessons = mod.lessons || [];
    if (modLessons.length === 0) return false;
    return modLessons.every((l: any) => {
      const lid = l.id || l._id;
      return completedLessons.some((cl: any) => cl.lessonId === lid) || forcedProgressLessonIds.includes(lid);
    });
  };

  const handleDownloadModuleCert = (mod: any) => {
    const content = `
      <html>
      <head>
        <title>Module Certificate</title>
        <style>
          body { font-family: 'Georgia', serif; background: #0d0d0d; color: #fff; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .cert { border: 3px solid #d4a843; padding: 60px; max-width: 800px; text-align: center; background: linear-gradient(135deg, #1a1a1a, #111); }
          .badge { font-size: 48px; margin-bottom: 16px; }
          .subtitle { color: #d4a843; font-size: 13px; letter-spacing: 0.3em; text-transform: uppercase; margin-bottom: 24px; }
          h1 { font-size: 42px; font-weight: 900; margin: 8px 0; }
          h2 { font-size: 28px; color: #d4a843; margin: 16px 0; }
          .name { font-size: 36px; font-style: italic; color: #f5f5f5; border-bottom: 2px solid #d4a843; display: inline-block; padding-bottom: 4px; margin: 24px 0; }
          .course { font-size: 18px; color: #aaa; margin-bottom: 8px; }
          .module-name { font-size: 22px; font-weight: bold; color: #d4a843; margin: 8px 0 32px; }
          .footer { margin-top: 40px; font-size: 12px; color: #555; }
          .date { font-size: 14px; color: #888; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="cert">
          <div class="badge">🏅</div>
          <div class="subtitle">Module Completion Certificate</div>
          <div class="name">This certifies that</div>
          <h1>${me?.username || me?.fullName || 'Student'}</h1>
          <p class="course">has successfully completed</p>
          <h2 class="module-name">${mod.title}</h2>
          <p class="course">in the course</p>
          <p class="module-name" style="font-size:18px;">${course.title}</p>
          <div class="date">Completed on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div class="footer">IHUB Academy · ihub.com</div>
        </div>
      </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(content);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  };
  const currentLessonRequiresAssignment = !!(currentLesson?.type === 'assignment' || currentLesson?.isAssignment);
  const currentLessonSubmission = submissionsData?.getAssignmentSubmissions?.items?.find((submission) => !me?.id || submission.userId === me.id);
  const currentLessonSubmissionStatus = currentLessonSubmission?.status;
  const currentLessonCompleted = completedLessons.some((cl: any) => cl.lessonId === (currentLesson?.id || currentLesson?._id));
  const canMarkCurrentLessonComplete = !currentLessonRequiresAssignment || currentLessonCompleted || currentLessonSubmissionStatus === 'approved';
  const currentLessonFirstSlidePreview = currentLesson?.resources?.find((resource: any) =>
    resource?.type === 'image' && /first slide/i.test(resource?.title || '')
  )?.url;

  const handleDownloadResource = (resourceUrl?: string, filename?: string) => {
    if (!resourceUrl) {
      toast.error("No downloadable file available for this lesson yet.");
      return;
    }

    triggerFileDownload(resourceUrl, filename || currentLesson?.title || "lesson-resource");
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevLesson = allLessons[currentIndex - 1];
      setActiveLessonId(prevLesson.id || prevLesson._id);
    }
  };

  const isLessonSatisfied = (lesson: any) => {
    const lessonId = lesson?.id || lesson?._id;
    if (!lessonId) return false;

    return completedLessons.some((cl: any) => cl.courseId === courseId && cl.lessonId === lessonId)
      || forcedProgressLessonIds.includes(lessonId);
  };

  const handleNext = () => {
    if (currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];
      const nextId = nextLesson.id || nextLesson._id;

      // Check if next lesson is locked
      const nextIndex = currentIndex + 1;
      const previousRequired = allLessons.slice(0, nextIndex).filter(l =>
        l.requiredAssignment || l.type === 'assignment' || l.type === 'quiz' || l.isAssignment
      );
      const isNextLocked = previousRequired.some((pl) => !isLessonSatisfied(pl));

      if (isNextLocked) {
        const blockingLesson = previousRequired.find((pl) => {
          return !isLessonSatisfied(pl);
        });

        if (blockingLesson?.type === 'assignment' || blockingLesson?.isAssignment) {
          toast.error(`Unit Locked: Submit and get approval for assignment "${blockingLesson.title}" first.`);
        } else {
          toast.error(`Unit Locked: Finish previous requirements first.`);
        }
        return;
      }

      setActiveLessonId(nextId);
    }
  };

  const handleForceProceed = () => {
    const lessonId = currentLesson?.id || currentLesson?._id;
    if (!lessonId) return;

    if (!forcedProgressLessonIds.includes(lessonId)) {
      setForcedProgressLessonIds((prev) => [...prev, lessonId]);
    }

    toast.warning("You forced progress. Please still submit this assignment later.");
    handleNext();
  };

  const handleMarkComplete = async () => {
    if (!activeLessonId) return;
    try {
      await completeLessonMutation({
        variables: {
          courseId,
          lessonId: activeLessonId
        }
      });
      toast.success("Lesson marked as complete!");
      refetchUser();
      handleNext();
    } catch (err: any) {
      toast.error(err.message || "Failed to mark lesson as complete");
    }
  };

  const handleSaveNotes = () => {
    toast.success("Notes saved successfully!");
  };

  const handleSubmitAssignment = async () => {
    if (!submissionContent.trim()) {
      toast.error("Please provide your submission content (URL or text)");
      return;
    }

    setIsSubmittingAssignment(true);
    try {
      await submitAssignmentMutation({
        variables: {
          courseId,
          lessonId: activeLessonId,
          content: submissionContent
        }
      });
      toast.success("Assignment submitted successfully!");
      refetchSubmissions();
      handleMarkComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit assignment");
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "video": return Video;
      case "quiz": return HelpCircle;
      case "assignment": return Code;
      default: return BookOpen;
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header/Breadcrumbs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Link to="/portal/student/courses" className="hover:text-gold">My Courses</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-semibold">{course.title}</span>
        </motion.div>

        {/* Course Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-6 bg-muted/10 rounded-2xl border border-border/50"
        >
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-border/50 shadow-xl">
              <img src={course.thumbnail} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold">{course.title}</h1>
              <div className="flex items-center gap-3 mt-1.5">
                <Badge variant="outline" className="text-[10px] uppercase text-accent">{course.level}</Badge>
                <p className="text-muted-foreground text-sm">{progressPercent}% Completed</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/20 rounded-2xl">
              <Star className="w-4 h-4 text-gold fill-current" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-gold/60 leading-none">XP Points</span>
                <span className="text-sm font-black text-gold">{me?.xp || 0}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-2xl">
              <Flame className="w-4 h-4 text-accent fill-current" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-accent/60 leading-none">Streak</span>
                <span className="text-sm font-black text-accent">{me?.streak || 0} Days</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/10 border border-border/20 rounded-2xl">
              <Trophy className="w-4 h-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-muted-foreground leading-none">Level</span>
                <span className="text-sm font-black text-foreground">{me?.level || 1}</span>
              </div>
            </div>
            <div className="w-48 bg-muted/20 rounded-full h-2 hidden md:block">
              <div className="bg-gold h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </motion.div>

        {/* Course Completion Celebration */}
        {isCourseCompleted && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-3xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Trophy className="w-32 h-32 text-green-500" />
            </div>
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white shadow-xl shadow-green-500/20">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-foreground">Course Mastered! 🎉</h2>
                <p className="text-muted-foreground">Congratulations! You've successfully completed every unit in this track.</p>
              </div>
            </div>
            <Link to="/portal/student/certificates">
              <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 rounded-2xl shadow-lg shadow-green-500/20">
                <Award className="w-5 h-5 mr-2" /> Full Course Certificate
              </Button>
            </Link>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Main Area */}
          <div className="lg:col-span-8 space-y-6">
            {(() => {
              const lessonIndex = allLessons.findIndex(l => (l.id || l._id) === activeLessonId);
              const previousRequiredLessons = allLessons.slice(0, lessonIndex).filter((pl) =>
                pl.requiredAssignment || pl.type === 'assignment' || pl.type === 'quiz' || pl.isAssignment
              );
              const isLocked = previousRequiredLessons.some((pl) => !isLessonSatisfied(pl));

              if (isLocked) {
                return (
                  <Card className="border-border/50 min-h-[500px] flex flex-col items-center justify-center p-12 text-center">
                    <Lock className="w-16 h-16 text-muted-foreground/30 mb-6" />
                    <h2 className="text-2xl font-bold mb-2">Unit Locked</h2>
                    <p className="text-muted-foreground mb-8">Complete the previous module requirements to unlock this content.</p>
                    <div className="p-4 bg-muted/20 rounded-xl border border-border/30 text-left max-w-sm w-full">
                      <p className="text-[10px] font-bold uppercase text-accent mb-2 tracking-widest">Incomplete Requirements:</p>
                      <ul className="space-y-1">
                        {previousRequiredLessons.filter((pl) => !isLessonSatisfied(pl)).map(pl => (
                          <li key={pl.id || pl._id} className="text-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                            {pl.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                );
              }

              if (currentLesson?.type === 'quiz') {
                return (
                  <Card className="border-border/50 p-8 shadow-2xl">
                    <LessonQuiz
                      courseId={courseId!}
                      lessonId={(currentLesson.id || currentLesson._id)}
                      onComplete={handleMarkComplete}
                    />
                  </Card>
                );
              }

              if (currentLesson?.assignmentQuestions?.length > 0) {
                return (
                  <Card className="border-border/50 p-8 shadow-2xl">
                    <AssignmentExamView
                      courseId={courseId!}
                      lessonId={(currentLesson.id || currentLesson._id)}
                      questions={currentLesson.assignmentQuestions}
                      config={currentLesson.assignmentConfig}
                      onComplete={handleMarkComplete}
                    />
                  </Card>
                );
              }

              return (
                <div className="space-y-6">
                  <Card className="border-border/50 overflow-hidden shadow-2xl">
                    <div className="aspect-video bg-black relative">
                      {currentLesson?.type === 'ppt' || (currentLesson?.fileUrl && (currentLesson.fileUrl.endsWith('.ppt') || currentLesson.fileUrl.endsWith('.pptx'))) ? (
                        <PPTViewer url={currentLesson.fileUrl} title={currentLesson.title} startSlide={1} />
                      ) : currentLesson?.videoUrl ? (
                        <iframe src={currentLesson.videoUrl.replace("watch?v=", "embed/")} className="w-full h-full" allowFullScreen />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center p-12">
                          {React.createElement(getLessonIcon(currentLesson?.type), { className: "w-16 h-16 text-accent mb-4" })}
                          <h3 className="text-xl font-bold">{currentLesson?.title}</h3>
                          {currentLesson?.fileUrl && (
                            <div className="mt-6 flex items-center gap-2">
                              <Button variant="gold" asChild>
                                <a href={currentLesson.fileUrl} target="_blank" rel="noopener noreferrer">Open File</a>
                              </Button>
                              <Button variant="outline" onClick={() => handleDownloadResource(currentLesson.fileUrl, `${currentLesson?.title || 'lesson'}.pptx`)}>
                                <Download className="w-4 h-4 mr-2" /> Download
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-8">
                      <h2 className="text-2xl font-bold mb-4">{currentLesson?.title}</h2>
                      <div className="prose prose-invert max-w-none mb-8" dangerouslySetInnerHTML={{ __html: currentLesson?.content || currentLesson?.description || "" }} />

                      {currentLessonFirstSlidePreview && (
                        <div className="mb-6 p-4 rounded-xl border border-border/40 bg-muted/10 flex items-center justify-between gap-3">
                          <p className="text-xs text-muted-foreground">Start from slide 1 using the official preview image.</p>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <a href={currentLessonFirstSlidePreview} target="_blank" rel="noopener noreferrer">Open First Slide</a>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDownloadResource(currentLesson?.fileUrl, `${currentLesson?.title || 'lesson'}.pptx`)}>
                              <Download className="w-4 h-4 mr-1" /> Download Deck
                            </Button>
                          </div>
                        </div>
                      )}

                      {currentLessonRequiresAssignment && (
                        <div className="mt-8 pt-8 border-t border-border/50 space-y-6">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-accent/5 p-6 rounded-2xl border border-accent/20 shadow-sm"
                          >
                            <h4 className="font-bold flex items-center gap-2 text-accent mb-3"><Code className="w-4 h-4" /> Exercise Mission</h4>
                            <p className="text-sm text-card-foreground/90 leading-relaxed">{currentLesson.assignmentDescription || "Complete the task as described above."}</p>
                          </motion.div>
                          {existingSubmission ? (
                            <div className="space-y-4">
                              <div className={`p-4 rounded-xl border ${existingSubmission.status === 'approved' || existingSubmission.status === 'reviewed' && existingSubmission.grade >= 70 ? 'bg-green-500/10 border-green-500/20' : existingSubmission.status === 'rejected' || existingSubmission.status === 'reviewed' && existingSubmission.grade < 70 ? 'bg-red-500/10 border-red-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
                                <h4 className={`font-bold flex items-center gap-2 mb-2 ${existingSubmission.status === 'approved' || existingSubmission.status === 'reviewed' && existingSubmission.grade >= 70 ? 'text-green-500' : existingSubmission.status === 'rejected' || existingSubmission.status === 'reviewed' && existingSubmission.grade < 70 ? 'text-red-500' : 'text-orange-500'}`}>
                                  {existingSubmission.status === 'approved' || existingSubmission.status === 'reviewed' && existingSubmission.grade >= 70 ?
                                    <><CheckCircle className="w-5 h-5 mr-1" /> Passed / Approved</> :
                                    (existingSubmission.status === 'rejected' || existingSubmission.status === 'reviewed' && existingSubmission.grade < 70 ?
                                      <><AlertCircle className="w-5 h-5 mr-1" /> Revision Required / Rejected</> :
                                      <><Clock className="w-5 h-5 mr-1" /> Waiting for Approval</>)
                                  }
                                </h4>
                                {existingSubmission.grade !== undefined && (
                                  <p className="text-sm">Grade: <strong>{existingSubmission.grade}/100</strong></p>
                                )}
                                {existingSubmission.feedback && (
                                  <div className="text-sm mt-3 p-3 bg-background border border-border/50 rounded-lg text-muted-foreground">
                                    <p className="font-semibold text-foreground mb-1">Trainer Feedback:</p>
                                    <div dangerouslySetInnerHTML={{ __html: existingSubmission.feedback }} />
                                  </div>
                                )}
                              </div>

                              {(existingSubmission.status === 'pending' || existingSubmission.status === 'rejected' || (existingSubmission.status === 'reviewed' && existingSubmission.grade < 70)) && (
                                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                                  <Button variant="outline" className="flex-1 border-border/50 py-6" onClick={() => setIsAssignmentDialogOpen(true)}>
                                    <MessageSquare className="w-4 h-4 mr-2" /> {existingSubmission.status === 'rejected' || (existingSubmission.status === 'reviewed' && existingSubmission.grade < 70) ? "Resubmit Mission" : "Update Submission"}
                                  </Button>
                                  <Button variant="outline" className="flex-1 border-border/50 py-6" onClick={() => setBookingOpen(true)}>
                                    <Calendar className="w-4 h-4 mr-2" /> Book Review Call
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <Button variant="gold" className="w-full py-6 text-lg tracking-wide shadow-xl shadow-gold/20 hover:scale-[1.02] transition-transform" onClick={() => setIsAssignmentDialogOpen(true)}>
                              <Code className="w-5 h-5 mr-2" /> Start Mission
                            </Button>
                          )}

                          <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>{existingSubmission ? "Update Mission Submission" : "Complete Exercise Mission"}</DialogTitle>
                              </DialogHeader>
                              <div className="py-4 space-y-4">
                                <TextEditor
                                  value={submissionContent}
                                  onChange={setSubmissionContent}
                                  placeholder="Provide your text submission or add links here..."
                                />
                              </div>
                              <div className="flex justify-between items-center bg-muted/5 p-4 rounded-xl border border-border/20 mt-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-gold" />
                                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Required: 70% Pass Score</p>
                                </div>
                                <Button
                                  variant="gold"
                                  className="px-8 shadow-xl shadow-gold/20"
                                  onClick={async () => {
                                    await handleSubmitAssignment();
                                    setIsAssignmentDialogOpen(false);
                                  }}
                                  disabled={isSubmittingAssignment || !submissionContent.trim()}
                                >
                                  {isSubmittingAssignment ? "Transmitting..." : "Submit Mission"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}

                      <div className="flex justify-between mt-10 gap-2">
                        <Button variant="outline" className="border-border/50 hover:bg-muted/10" onClick={handlePrevious} disabled={currentIndex === 0}>
                          <ChevronLeft className="w-4 h-4 mr-2" /> Previous Block
                        </Button>
                        <div className="flex items-center gap-2">
                          {currentLessonRequiresAssignment && !canMarkCurrentLessonComplete && (
                            <Button variant="outline" onClick={handleForceProceed}>
                              Force Proceed
                            </Button>
                          )}
                          <Button
                            variant="gold"
                            className="shadow-lg shadow-gold/10"
                            onClick={handleMarkComplete}
                            disabled={!canMarkCurrentLessonComplete}
                          >
                            {currentIndex === allLessons.length - 1 ? "Complete Journey" : "Mark Finalized"}
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 h-fit sticky top-24">
            <Card className="border-border/50">
              <div className="p-4 border-b border-border/30 bg-muted/10 font-bold text-xs uppercase tracking-widest">Track Overview</div>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="p-4 space-y-6">
                    <Accordion type="single" collapsible className="w-full space-y-4">
                      {course.modules?.map((mod: any, mIdx: number) => {
                        const modCompleted = isModuleCompleted(mod);
                        return (
                          <AccordionItem key={mod.id || mod._id} value={`module-${mIdx}`} className="border rounded-xl px-4 bg-background">
                            <div className="flex items-center justify-between w-full">
                              <AccordionTrigger className="hover:no-underline flex-1 text-left py-4">
                                <h4 className="text-xs font-bold text-accent uppercase">{mod.title}</h4>
                              </AccordionTrigger>
                              {modCompleted && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDownloadModuleCert(mod); }}
                                  title="Download Module Certificate"
                                  className="flex items-center gap-1 text-[10px] font-black text-gold hover:text-gold/80 transition-colors mr-2 z-10 relative"
                                >
                                  <Award className="w-3 h-3" />
                                  <span>Cert</span>
                                </button>
                              )}
                            </div>
                            <AccordionContent className="pt-2 pb-4 space-y-1">
                              {mod.lessons?.map((les: any) => {
                                const lesId = les.id || les._id;
                                const isActive = lesId === activeLessonId;
                                const isComp = completedLessons.some((cl: any) => cl.lessonId === lesId) || forcedProgressLessonIds.includes(lesId);

                                const lIdx = allLessons.findIndex(l => (l.id || l._id) === lesId);
                                const prevRequiredLessons = allLessons.slice(0, lIdx).filter((pl) =>
                                  pl.requiredAssignment || pl.type === 'assignment' || pl.type === 'quiz' || pl.isAssignment
                                );
                                const isLock = prevRequiredLessons.some((pl) => !isLessonSatisfied(pl));

                                return (
                                  <button
                                    key={lesId}
                                    disabled={isLock}
                                    onClick={() => !isLock && setActiveLessonId(lesId)}
                                    className={`w-full text-left p-3 rounded-xl text-sm transition-all flex items-center gap-3 ${isActive ? 'bg-accent/10 border border-accent/20 text-accent font-bold' : isLock ? 'opacity-30 cursor-not-allowed grayscale pointer-events-none' : 'hover:bg-muted/10'}`}
                                  >
                                    {isComp ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : isLock ? <Lock className="w-3.5 h-3.5" /> : React.createElement(getLessonIcon(les.type), { className: "w-3.5 h-3.5" })}
                                    <div className="flex-1 min-w-0">
                                      <p className="truncate">{les.title}</p>
                                      {les.type === 'quiz' && me?.grades?.some((g: any) => g.lessonId === lesId) && (
                                        <p className="text-[10px] text-accent font-black uppercase">
                                          Grade: {me.grades.find((g: any) => g.lessonId === lesId).score}%
                                        </p>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <BookCallDialog open={bookingOpen} onOpenChange={setBookingOpen} mentorId={course?.instructor?.id || course?.instructor} purpose="assignment-review" />
    </PortalLayout>
  );
}
