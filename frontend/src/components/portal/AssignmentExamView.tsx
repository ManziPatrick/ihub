import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useMutation } from "@apollo/client/react";
import { SUBMIT_ASSIGNMENT_EXAM } from "@/lib/graphql/mutations";
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
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";

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
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answersRef = useRef<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSecureStarted, setIsSecureStarted] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [showViolation, setShowViolation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const startTime = useRef<number>(Date.now());
  const isSubmittedRef = useRef(false);
  const isViolating = useRef(false);
  const MAX_VIOLATIONS = 3;

  const [submitExam] = useMutation(SUBMIT_ASSIGNMENT_EXAM);

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
    } catch (_) {}

    try {
      await submitExam({ variables: { courseId, lessonId, answers: formattedAnswers, timeTaken } });
      setIsSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit exam");
      isSubmittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [courseId, lessonId, submitExam]);

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
    } catch (_) {}
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
    } catch (_) {}
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
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-12 space-y-8"
      >
        <div className="w-32 h-32 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-500/10">
          <Trophy className="w-16 h-16" />
        </div>
        <div className="space-y-4">
          <h3 className="text-4xl font-black text-foreground tracking-tighter">
            EXAM COMPLETED! 🏆
          </h3>
          <p className="text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
            Congratulations! Your responses have been securely transmitted. Our AI grading system and your lead trainer will review your open responses shortly.
          </p>
        </div>
        <div className="flex flex-col items-center gap-4">
          <Button onClick={onComplete} className="h-16 px-12 rounded-2xl text-lg font-black bg-amber-500 hover:bg-amber-600 shadow-lg">
            RETURN TO COURSE TRACK
          </Button>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
            <History className="w-3 h-3" /> Result will appear in your gradebook
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
        className="max-w-2xl mx-auto p-8 text-center space-y-8 bg-indigo-500/5 rounded-[2.5rem] border-2 border-indigo-500/10"
      >
        <div className="w-20 h-20 bg-indigo-500/20 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-black tracking-tight">Secure Exam Mode</h2>
          <div className="space-y-3 text-muted-foreground text-sm font-medium leading-relaxed">
            <p>To ensure academic integrity, this exam will lock your screen:</p>
            <ul className="text-left max-w-xs mx-auto space-y-2 list-none">
              {[
                { icon: Maximize2, text: "Fullscreen will be forced – you cannot minimize" },
                { icon: EyeOff, text: "Switching tabs flags a violation" },
                { icon: AlertTriangle, text: `3 violations = automatic submission` },
                { icon: Lock, text: "Right-click is disabled" },
              ].map(({ icon: Icon, text }, i) => (
                <li key={i} className="flex items-center gap-3 bg-background/60 rounded-xl p-3 border border-border/50">
                  <Icon className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-foreground">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Button
          onClick={startSecureExam}
          className="h-16 px-12 rounded-2xl text-lg font-black flex items-center gap-3 w-full sm:w-auto mx-auto bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20"
        >
          <Maximize2 className="w-5 h-5" />
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
      <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 bg-[#13162a] border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/30">
            {currentPage + 1}
          </div>
          <div>
            <p className="text-white font-bold text-sm">Module Assessment</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">
              Question {currentPage + 1} of {totalPages} • {config?.mode?.toUpperCase() || "EXAM"} MODE
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
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl border-2 font-black tracking-widest transition-colors ${
                timeRemaining < 300
                  ? "bg-red-500/10 text-red-400 border-red-500/30 animate-pulse"
                  : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="text-lg tabular-nums">{formatTime(timeRemaining)}</span>
            </div>
          )}

          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest border border-white/10">
            <Lock className="w-3 h-3" />
            Secure
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Question area */}
        <div className="flex-1 overflow-y-auto px-10 py-8 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
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

              <h3 className="text-2xl md:text-3xl font-bold text-white leading-snug">
                {currentQuestion?.questionText}
              </h3>

              {currentQuestion?.type === "mcq" ? (
                <div className="grid gap-4">
                  {currentQuestion.options?.map((option, i) => {
                    const qId = currentQuestion._id || currentQuestion.id || "";
                    const isSelected = answers[qId] === i.toString();
                    return (
                      <button
                        key={i}
                        onClick={() => handleAnswerChange(qId, i.toString())}
                        className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-5 font-semibold text-base ${
                          isSelected
                            ? "bg-indigo-500/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                            : "bg-white/3 border-white/10 text-white/70 hover:border-indigo-500/40 hover:bg-white/5"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 font-black text-sm transition-all flex-shrink-0 ${
                            isSelected
                              ? "bg-indigo-500 border-indigo-500 text-white"
                              : "border-white/20 text-white/40"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="flex-1">{option}</span>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0" />}
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

        {/* Right: Sidebar */}
        <div className="w-72 flex-shrink-0 border-l border-white/5 bg-[#11142a]/80 flex flex-col overflow-y-auto px-6 py-6 gap-6">
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
                    onClick={() => setCurrentPage(i)}
                    className={`aspect-square flex items-center justify-center rounded-xl text-xs font-black transition-all border ${
                      isAnswered
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
                  className={`flex-1 h-3 rounded-full transition-all ${
                    i < violationCount ? "bg-red-500 shadow-lg shadow-red-500/30" : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom nav bar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-8 py-5 bg-[#13162a] border-t border-white/5">
        <Button
          variant="ghost"
          disabled={currentPage === 0}
          onClick={() => setCurrentPage((p) => p - 1)}
          className="rounded-xl text-white/60 hover:text-white hover:bg-white/5"
        >
          <ChevronLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        {currentPage < totalPages - 1 ? (
          <Button
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-10 font-black uppercase tracking-widest h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 group"
          >
            Next Question <ChevronRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        ) : (
          <Button
            onClick={() => {
              if (confirm("Are you sure you want to submit? You won't be able to change your answers.")) {
                handleSubmit();
              }
            }}
            disabled={submitting}
            className="px-10 font-black uppercase tracking-widest h-14 rounded-2xl bg-green-600 hover:bg-green-700 shadow-xl shadow-green-500/20"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
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
