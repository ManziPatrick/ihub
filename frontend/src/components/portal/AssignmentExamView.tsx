import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useMutation } from "@apollo/client/react";
import { SUBMIT_ASSIGNMENT_EXAM } from "@/lib/graphql/mutations";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Clock,
  Send,
  ShieldAlert,
  AlertCircle,
  Trophy,
  History,
  Maximize2,
  AlertTriangle,
  EyeOff,
  X,
  Lock,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LayoutGrid, Volume2, VolumeX, Pause, Play, RotateCcw } from "lucide-react";
import { tts } from "@/lib/tts";


interface AssignmentQuestion {
  _id?: string;
  id?: string;
  questionText: string;
  type: "mcq" | "open";
  options?: string[];
  points: number;
}

interface AssignmentConfig {
  timeLimit?: number;
  disableRightClick: boolean;
  mode: "exam" | "exercise";
  allowRetakes?: boolean;
}

interface AssignmentExamViewProps {
  courseId: string;
  lessonId: string;
  questions: AssignmentQuestion[];
  config: AssignmentConfig;
  onComplete: () => void;
}

/* ------------------------------------------------------------------ */
/*  Violation warning overlay                                           */
/* ------------------------------------------------------------------ */
function ViolationWarning({
  count,
  maxViolations,
  onDismiss,
  onAutoSubmit,
}: {
  count: number;
  maxViolations: number;
  onDismiss: () => void;
  onAutoSubmit: () => void;
}) {
  const remaining = maxViolations - count;
  useEffect(() => {
    if (remaining <= 0) {
      onAutoSubmit();
    }
  }, [remaining]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
    >
      <div className="max-w-md w-full mx-6 bg-red-950/90 border-2 border-red-500/60 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-red-500/20">
        <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-red-400 mb-2">
            Security Violation Detected!
          </h3>
          <p className="text-red-200/80 text-sm leading-relaxed">
            You left the exam window. This is violation{" "}
            <span className="font-bold text-white">#{count}</span> of {maxViolations}.
          </p>
          {remaining > 0 ? (
            <p className="mt-3 text-amber-400 text-sm font-bold">
              ⚠️ {remaining} more violation{remaining !== 1 ? "s" : ""} will auto-submit your exam.
            </p>
          ) : (
            <p className="mt-3 text-red-400 font-bold">
              Submitting exam automatically…
            </p>
          )}
        </div>
        {remaining > 0 && (
          <Button
            onClick={onDismiss}
            className="w-full h-12 font-black text-sm bg-red-600 hover:bg-red-700 rounded-2xl"
          >
            I understand – Return to Exam
          </Button>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */
export function AssignmentExamView({
  courseId,
  lessonId,
  questions,
  config,
  onComplete,
}: AssignmentExamViewProps) {
  const storageKey = `examState_${courseId}_${lessonId}`;

  const loadState = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  };
  const savedState = loadState();

  const [currentPage, setCurrentPage] = useState(savedState?.currentPage || 0);
  const [answers, setAnswers] = useState<Record<string, string>>(savedState?.answers || {});
  const answersRef = useRef<Record<string, string>>(savedState?.answers || {});
  const [isSubmitted, setIsSubmitted] = useState(savedState?.isSubmitted || false);
  const [gradeResult, setGradeResult] = useState<{ grade: number; totalScore: number; status: string; answers?: any[] } | null>(savedState?.gradeResult || null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(savedState?.timeRemaining ?? null);
  const [isSecureStarted, setIsSecureStarted] = useState(savedState?.isSecureStarted || false);
  const [violationCount, setViolationCount] = useState(savedState?.violationCount || 0);

  useEffect(() => {
    if (!isSubmitted) {
      localStorage.setItem(storageKey, JSON.stringify({
        currentPage,
        answers,
        isSubmitted,
        gradeResult,
        timeRemaining,
        isSecureStarted,
        violationCount
      }));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [currentPage, answers, isSubmitted, gradeResult, timeRemaining, isSecureStarted, violationCount, storageKey]);
  const [showViolation, setShowViolation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<"idle" | "playing" | "paused">("idle");

  const startTime = useRef<number>(Date.now());
  const isSubmittedRef = useRef(false);
  const isViolating = useRef(false);
  const MAX_VIOLATIONS = 3;

  const [submitExam] = useMutation(SUBMIT_ASSIGNMENT_EXAM);
  const { isOffline, enqueueAction } = useOfflineSync();

  /* ── Timer ── */
  useEffect(() => {
    if (config?.timeLimit > 0 && timeRemaining === null && !isSubmitted && questions.length > 0) {
      setTimeRemaining(config.timeLimit * 60);
    }
  }, [config, questions.length, isSubmitted]);

  useEffect(() => {
    if (timeRemaining === null || isSubmitted) return;
    if (timeRemaining <= 0) {
      toast.warning("Time is up! Auto-submitting your exam.");
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeRemaining((prev) => prev! - 1), 1000);
    return () => clearInterval(timer);
  }, [timeRemaining, isSubmitted]);

  /* ── Submit handler ── */
  const handleSubmit = useCallback(async () => {
    tts.stop();
    setSpeechStatus("idle");
    localStorage.removeItem(storageKey);
    if (isSubmittedRef.current) return;
    isSubmittedRef.current = true;
    setSubmitting(true);

    const formattedAnswers = Object.entries(answersRef.current).map(([qid, text]) => ({
      questionId: qid,
      answerText: text,
    }));
    const timeTaken = Math.round((Date.now() - startTime.current) / 1000);

    // Exit fullscreen cleanly before submitting
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch (_) { }

    // Offline mode: queue the exam submission for later sync
    if (isOffline) {
      enqueueAction({
        type: 'SUBMIT_EXAM',
        variables: { courseId, lessonId, answers: formattedAnswers, timeTaken },
        description: `Submit exam answers for lesson ${lessonId}`,
      });
      // Show a mock pending state so the student can continue
      setGradeResult({
        grade: 0,
        totalScore: 100,
        status: 'pending',
        answers: formattedAnswers.map(a => ({
          questionId: a.questionId,
          score: 0,
          aiFeedback: 'Will be graded when back online.'
        }))
      });
      setIsSubmitted(true);
      setSubmitting(false);
      return;
    }

    try {
      const { data } = await submitExam({ variables: { courseId, lessonId, answers: formattedAnswers, timeTaken } });
      const result = (data as any)?.submitAssignmentExam;
      if (result) {
        setGradeResult({
          grade: result.grade ?? 0,
          totalScore: result.totalScore ?? 0,
          status: result.status ?? 'reviewed',
          answers: result.answers || []
        });
      }
      setIsSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit exam");
      isSubmittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [courseId, lessonId, submitExam, isOffline, enqueueAction]);

  /* ── Anti-cheat: visibility / blur detection ── */
  useEffect(() => {
    if (!isSecureStarted || isSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && !isViolating.current && !isSubmittedRef.current) {
        isViolating.current = true;
        setViolationCount((prev) => {
          const next = prev + 1;
          if (next >= MAX_VIOLATIONS) {
            toast.error("Maximum violations reached. Submitting exam automatically.");
            handleSubmit();
          } else {
            setShowViolation(true);
          }
          return next;
        });
      }
    };

    // Fullscreen exit = violation
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !isSubmittedRef.current && !isViolating.current) {
        isViolating.current = true;
        setViolationCount((prev) => {
          const next = prev + 1;
          if (next >= MAX_VIOLATIONS) {
            toast.error("Maximum violations reached. Submitting exam automatically.");
            handleSubmit();
          } else {
            setShowViolation(true);
          }
          return next;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isSecureStarted, isSubmitted, handleSubmit]);

  /* ── Start secure exam ── */
  const startSecureExam = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (_) { }
    setIsSecureStarted(true);
    startTime.current = Date.now();
  };

  /* ── Dismiss violation ── */
  const dismissViolation = async () => {
    isViolating.current = false;
    setShowViolation(false);
    // Re-enter fullscreen
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (_) { }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => {
      const updated = { ...prev, [questionId]: answer };
      answersRef.current = updated;
      return updated;
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  /* ─────────────────────────── SUBMITTED ─────────────────────────── */
  if (isSubmitted) {
    const passed = gradeResult ? gradeResult.grade >= 50 : false;
    const grade = gradeResult?.grade ?? null;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-6 sm:p-10 space-y-5 sm:space-y-6"
      >
        {/* Score circle */}
        <div className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full flex items-center justify-center mx-auto shadow-xl ${grade === null ? 'bg-green-500/10 text-green-500' :
          passed ? 'bg-green-500/15 shadow-green-500/20' : 'bg-red-500/15 shadow-red-500/20'
          }`}>
          {grade !== null ? (
            <div className="flex flex-col items-center leading-none">
              <span className={`text-2xl sm:text-3xl font-black ${passed ? 'text-green-400' : 'text-red-400'}`}>
                {grade}%
              </span>
              <span className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${passed ? 'text-green-400/70' : 'text-red-400/70'}`}>
                {passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
          ) : (
            <Trophy className="w-10 h-10 sm:w-14 sm:h-14 text-green-500" />
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {grade !== null ? (passed ? 'Exam Passed! 🎉' : 'Exam Submitted') : 'EXAM COMPLETED! 🏆'}
          </h3>
          {grade !== null ? (
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black border ${passed
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
              }`}>
              {passed ? '✓ Auto-Graded & Passed' : '❌ Auto-Graded & Failed'}
            </div>
          ) : null}
          <p className="text-muted-foreground text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
            {grade !== null && passed
              ? `Great work! You scored ${grade}% on this exam. Your result has been recorded.`
              : grade !== null
                ? `You scored ${grade}%. A score of 50% or higher is required to pass. You may retake the exam.`
                : 'Your responses have been securely transmitted and are being reviewed.'}
          </p>
        </div>
        
        {/* Graded Answers Summary */}
        {gradeResult?.answers && gradeResult.answers.length > 0 && (
          <div className="max-w-xl mx-auto w-full space-y-4 pt-4 border-t border-white/5">
            <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-4">
              Detailed Assessment Breakdown
            </h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {questions.map((q, i) => {
                const qid = q._id || q.id;
                const userAns = gradeResult.answers?.find(a => a.questionId === qid);
                const isCorrect = userAns ? userAns.score > 0 : false;
                
                return (
                  <div key={i} className={`text-left p-4 rounded-2xl border ${
                    isCorrect ? 'bg-green-500/5 border-green-500/10' : 'bg-red-500/5 border-red-500/10'
                  }`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-xs font-bold text-white leading-relaxed flex-1">
                        <span className="text-white/40 mr-2">Q{i+1}:</span>
                        {q.questionText}
                      </p>
                      {isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <p className={`text-[10px] font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        Your Answer: {q.type === 'mcq' ? q.options?.[parseInt(userAns?.answerText)] || userAns?.answerText : userAns?.answerText || "No answer"}
                      </p>
                      {!isCorrect && userAns?.aiFeedback && (
                        <p className="text-[10px] text-white/50 bg-white/5 p-2 rounded-lg italic">
                          💡 {userAns.aiFeedback}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          <Button
            onClick={onComplete}
            className={`w-full sm:w-auto h-11 sm:h-12 px-8 rounded-xl font-black text-sm ${passed || grade === null
              ? 'bg-indigo-600 hover:bg-indigo-700'
              : 'bg-muted hover:bg-muted/80'
              } shadow-lg shadow-indigo-500/20`}
          >
            {passed ? '🏆 Return to Course' : 'Return to Course'}
          </Button>

          {/* Improved Retake Button */}
          <Button 
            variant={passed ? "outline" : "default"}
            onClick={() => {
              if (confirm("Are you sure you want to retake the exam? Your previous score will be overwritten.")) {
                setIsSubmitted(false);
                setGradeResult(null);
                setCurrentPage(0);
                setAnswers({});
                answersRef.current = {};
                setIsSecureStarted(false);
              }
            }} 
            className={`w-full sm:w-auto h-11 sm:h-12 px-8 rounded-xl font-black text-sm ${
              passed 
                ? 'border-dashed border-white/20 hover:bg-white/5' 
                : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
            }`}
          >
            <RefreshCcw className="w-3.5 h-3.5 mr-2" /> 
            {passed ? 'RETAKE TO IMPROVE' : 'TRY AGAIN (RETAKE)'}
          </Button>

          <p className="text-[9px] sm:text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
            <History className="w-2.5 h-2.5" /> Grade saved in your gradebook
          </p>
        </div>
      </motion.div>
    );
  }

  /* ─────────────────────────── START SCREEN ──────────────────────── */
  if (!isSecureStarted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto p-4 sm:p-10 text-center space-y-5 sm:space-y-7 bg-indigo-500/5 rounded-2xl sm:rounded-[2.5rem] border-2 border-indigo-500/10"
      >
        <div className="w-14 h-14 sm:w-20 sm:h-20 bg-indigo-500/20 text-indigo-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7 sm:w-10 sm:h-10" />
        </div>
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-3xl font-black tracking-tight">Secure Exam Mode</h2>
          <div className="space-y-3 text-muted-foreground text-xs sm:text-sm font-medium leading-relaxed max-w-sm mx-auto">
            <p>To ensure academic integrity, this exam will lock your screen:</p>
            <ul className="text-left max-w-xs mx-auto space-y-1.5 list-none">
              {[
                { icon: Maximize2, text: "Fullscreen will be forced – you cannot minimize" },
                { icon: EyeOff, text: "Switching tabs flags a violation" },
                { icon: AlertTriangle, text: `3 violations = automatic submission` },
                { icon: Lock, text: "Right-click is disabled" },
              ].map(({ icon: Icon, text }, i) => (
                <li key={i} className="flex items-center gap-2.5 bg-background/60 rounded-xl p-2.5 border border-border/50">
                  <Icon className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="text-foreground text-xs">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Button
          onClick={startSecureExam}
          className="h-11 sm:h-14 px-8 sm:px-12 rounded-xl sm:rounded-2xl text-sm sm:text-base font-black flex items-center gap-2 w-full sm:w-auto mx-auto bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20"
        >
          <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
          START SECURE EXAM
        </Button>
      </motion.div>
    );
  }

  /* ─────────────────────── EXAM PORTAL OVERLAY ───────────────────── */
  const totalPages = questions.length;
  const currentQuestion = questions[currentPage];
  const answeredCount = Object.values(answers).filter((a) => a !== "").length;
  const progressPct = Math.round((answeredCount / totalPages) * 100);

  const examUI = (
    <div
      className="fixed inset-0 z-[9999] bg-[#0d0f1a] flex flex-col overflow-hidden select-none"
      onContextMenu={(e) => {
        e.preventDefault();
        toast.warning("Right-click is disabled during this exam.");
      }}
    >
      {/* ── Top bar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 bg-[#13162a] border-b border-white/5">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/30 text-xs sm:text-base">
            {currentPage + 1}
          </div>
          <div className="hidden xs:block">
            <p className="text-white font-bold text-xs sm:text-sm">Assessment</p>
            <p className="text-[8px] sm:text-[10px] text-white/40 uppercase tracking-widest font-black">
              Q{currentPage + 1} of {totalPages}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Violation indicator */}
          {violationCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-widest">
              <AlertTriangle className="w-3.5 h-3.5" />
              {violationCount}/{MAX_VIOLATIONS} Violations
            </div>
          )}

          {/* Timer */}
          {timeRemaining !== null && (
            <div
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl border-2 font-black tracking-tighter sm:tracking-widest transition-colors ${timeRemaining < 300
                ? "bg-red-500/10 text-red-400 border-red-500/30 animate-pulse"
                : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                }`}
            >
              <Clock className="w-3.5 h-3.5 sm:w-4 h-4" />
              <span className="text-sm sm:text-lg tabular-nums">{formatTime(timeRemaining)}</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest border border-white/10">
            <Lock className="w-3 h-3" />
            Secure
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-white/70">
                <LayoutGrid className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#11142a] border-white/5 text-white p-6 overflow-y-auto">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-white font-black tracking-tight uppercase text-sm">Assessment Map</SheetTitle>
              </SheetHeader>

              <div className="space-y-8">
                <div className="grid grid-cols-4 gap-3">
                  {questions.map((q, i) => {
                    const qid = q._id || q.id || "";
                    const isAnswered = answers[qid] !== undefined && answers[qid] !== "";
                    const isCurrent = i === currentPage;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          tts.stop();
                          setSpeechStatus("idle");
                          setCurrentPage(i);
                        }}
                        className={`aspect-square flex items-center justify-center rounded-xl text-xs font-black transition-all border ${isAnswered
                          ? "bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                          : "bg-white/5 border-white/10 text-white/40 hover:border-indigo-500/40"
                          } ${isCurrent ? "ring-2 ring-indigo-400/50 scale-110 z-10" : ""}`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                    <span>Progress</span>
                    <span className="text-indigo-400">{progressPct}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-indigo-500"
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-red-400 tracking-widest flex items-center gap-2">
                    <ShieldAlert className="w-3 h-3" /> Integrity Notice
                  </h4>
                  <p className="text-[10px] text-white/40 leading-relaxed">
                    This exam is proctored. Tab switching or exiting fullscreen counts as a violation. {MAX_VIOLATIONS} violations = auto-submit.
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Question area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-10 py-6 sm:py-8 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              {/* Points badge */}
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                  {currentQuestion?.points || 10} pts
                </span>
                <span className="text-white/20 text-xs">·</span>
                <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold">
                  {currentQuestion?.type === "mcq" ? "Multiple Choice" : "Open Response"}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <h3 className="text-2xl md:text-3xl font-bold text-white leading-snug flex-1">
                  {currentQuestion?.questionText}
                </h3>
                <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-full border border-white/10 shrink-0 transition-all duration-300">
                  {speechStatus === "idle" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSpeechStatus("playing");
                        const optionsText = currentQuestion?.options ? `. The options are: ${currentQuestion.options.join(', ')}` : '';
                        const textToRead = `${currentQuestion?.questionText}${optionsText}`;
                        tts.speak(textToRead, () => setSpeechStatus("idle"));
                      }}
                      className="h-9 w-9 rounded-full text-white/40 hover:text-white hover:bg-white/10"
                    >
                      <Volume2 className="w-5 h-5" />
                    </Button>
                  ) : speechStatus === "playing" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        tts.pause();
                        setSpeechStatus("paused");
                      }}
                      className="h-9 w-9 rounded-full text-indigo-400 bg-indigo-400/20 hover:bg-indigo-400/30 animate-pulse"
                    >
                      <Pause className="w-5 h-5" />
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          tts.resume();
                          setSpeechStatus("playing");
                        }}
                        className="h-9 w-9 rounded-full text-indigo-400 bg-indigo-400/20 hover:bg-indigo-400/30"
                      >
                        <Play className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          tts.stop();
                          setSpeechStatus("playing");
                          const optionsText = currentQuestion?.options ? `. The options are: ${currentQuestion.options.join(', ')}` : '';
                          const textToRead = `${currentQuestion?.questionText}${optionsText}`;
                          tts.speak(textToRead, () => setSpeechStatus("idle"));
                        }}
                        className="h-9 w-9 rounded-full text-amber-400 hover:bg-amber-400/10"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                  {speechStatus !== "idle" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        tts.stop();
                        setSpeechStatus("idle");
                      }}
                      className="h-9 w-9 rounded-full text-red-400 hover:text-red-500 hover:bg-red-500/10 border-l border-white/10 ml-1 pl-2"
                    >
                      <VolumeX className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>

              {currentQuestion?.type === "mcq" ? (
                <div className="grid gap-3 sm:gap-4">
                  {currentQuestion.options?.map((option, i) => {
                    const qId = currentQuestion._id || currentQuestion.id || "";
                    const isSelected = answers[qId] === i.toString();
                    return (
                      <button
                        key={i}
                        onClick={() => handleAnswerChange(qId, i.toString())}
                        className={`w-full text-left p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all flex items-center gap-3 sm:gap-5 font-semibold text-sm sm:text-base ${isSelected
                          ? "bg-indigo-500/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                          : "bg-white/3 border-white/10 text-white/70 hover:border-indigo-500/40 hover:bg-white/5"
                          }`}
                      >
                        <div
                          className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center border-2 font-black text-xs sm:text-sm transition-all flex-shrink-0 ${isSelected
                            ? "bg-indigo-500 border-indigo-500 text-white"
                            : "border-white/20 text-white/40"
                            }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="flex-1">{option}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Type your detailed answer here…"
                    className="min-h-[280px] p-6 text-base bg-white/5 focus:bg-white/7 border-2 border-white/10 focus:border-indigo-500/60 rounded-2xl transition-all text-white placeholder:text-white/30 resize-none"
                    value={answers[currentQuestion._id || currentQuestion.id || ""] || ""}
                    onChange={(e) =>
                      handleAnswerChange(currentQuestion._id || currentQuestion.id || "", e.target.value)
                    }
                  />
                  <div className="flex items-center gap-2 text-white/30">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">
                      AI Assisted Grading Active
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: Sidebar - Hidden on mobile, or can be toggled if needed */}
        <div className="hidden lg:flex w-72 flex-shrink-0 border-l border-white/5 bg-[#11142a]/80 flex-col overflow-y-auto px-6 py-6 gap-6">
          {/* Question map */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em]">
              Assessment Map
            </p>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, i) => {
                const qid = q._id || q.id || "";
                const isAnswered = answers[qid] !== undefined && answers[qid] !== "";
                const isCurrent = i === currentPage;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      tts.stop();
                      setSpeechStatus("idle");
                      setCurrentPage(i);
                    }}
                    className={`aspect-square flex items-center justify-center rounded-xl text-xs font-black transition-all border ${isAnswered
                      ? "bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                      : "bg-white/5 border-white/10 text-white/40 hover:border-indigo-500/40"
                      } ${isCurrent ? "ring-2 ring-indigo-400/50 scale-110 z-10" : ""}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
              <span>Progress</span>
              <span className="text-indigo-400">{progressPct}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-indigo-500"
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Integrity notice */}
          <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-2">
            <h4 className="text-[10px] font-black uppercase text-red-400 tracking-widest flex items-center gap-2">
              <ShieldAlert className="w-3 h-3" /> Integrity Notice
            </h4>
            <p className="text-[10px] text-white/40 leading-relaxed">
              This exam is proctored. Tab switching or exiting fullscreen counts as a violation. {MAX_VIOLATIONS} violations = auto-submit.
            </p>
          </div>

          {/* Violation meter */}
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
              Violations
            </p>
            <div className="flex gap-2">
              {Array.from({ length: MAX_VIOLATIONS }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-3 rounded-full transition-all ${i < violationCount ? "bg-red-500 shadow-lg shadow-red-500/30" : "bg-white/10"
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom nav bar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-8 py-3 sm:py-5 bg-[#13162a] border-t border-white/5">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage === 0}
          onClick={() => {
            tts.stop();
            setSpeechStatus("idle");
            setCurrentPage((p) => p - 1);
          }}
          className="rounded-xl text-white/60 hover:text-white hover:bg-white/5"
        >
          <ChevronLeft className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden xs:inline">Back</span>
        </Button>

        {currentPage < totalPages - 1 ? (
          <Button
            size="lg"
            onClick={() => {
              tts.stop();
              setSpeechStatus("idle");
              if (currentPage < totalPages - 1) {
                setCurrentPage((p) => p + 1);
              }
            }}
            className="px-6 sm:px-10 font-black uppercase tracking-widest h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 group text-xs sm:text-sm"
          >
            Next <span className="hidden xs:inline">Question</span> <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={() => {
              if (confirm("Are you sure you want to submit? You won't be able to change your answers.")) {
                handleSubmit();
              }
            }}
            disabled={submitting}
            className="px-6 sm:px-10 font-black uppercase tracking-widest h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-green-600 hover:bg-green-700 shadow-xl shadow-green-500/20 text-xs sm:text-sm"
          >
            {submitting ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />}
            Final Submission
          </Button>
        )}
      </div>

      {/* ── Violation overlay ── */}
      <AnimatePresence>
        {showViolation && (
          <ViolationWarning
            count={violationCount}
            maxViolations={MAX_VIOLATIONS}
            onDismiss={dismissViolation}
            onAutoSubmit={handleSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  );

  // Use a portal to render OVER everything (sidebar, navbar, etc.)
  return createPortal(examUI, document.body);
}
