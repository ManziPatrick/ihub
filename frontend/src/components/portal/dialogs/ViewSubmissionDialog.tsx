import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Download,
  ExternalLink,
  FileText,
  Clock,
  User,
  Link as LinkIcon,
  AlignLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Timer,
  Star,
  MessageSquare,
  Brain,
} from "lucide-react";
import { toast } from "sonner";
import { triggerFileDownload, openInNewTab } from "@/lib/download";

interface AssignmentAnswer {
  questionId: string;
  answerText: string;
  score?: number;
  aiFeedback?: string;
}

interface AssignmentQuestion {
  id: string;
  questionText: string;
  type: string;
  options?: string[];
  correctOptionIndex?: number;
  points?: number;
}

interface Submission {
  id: string | number;
  student: string;
  assignment: string;
  course: string;
  submittedAt: string;
  type: string;
  description?: string;
  submissionUrl?: string;
  // Exam specific
  content?: string;
  answers?: AssignmentAnswer[];
  totalScore?: number;
  timeTaken?: number;
  lessonQuestions?: AssignmentQuestion[];
}

interface ViewSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: Submission | null;
}

const formatTime = (seconds?: number) => {
  if (!seconds) return "N/A";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

export function ViewSubmissionDialog({
  open,
  onOpenChange,
  submission,
}: ViewSubmissionDialogProps) {
  if (!submission) return null;

  const lessonQuestions = submission.lessonQuestions || [];
  const answers = submission.answers || [];

  // is exam if there are embedded questions OR answers array present
  const isExamSubmission = lessonQuestions.length > 0 || answers.length > 0;

  // Build an answer map keyed by questionId for fast lookup
  const answerMap: Record<string, typeof answers[0]> = {};
  answers.forEach((a) => {
    if (a.questionId) answerMap[a.questionId] = a;
  });

  // Primary rendering list:
  // - If we have lesson questions → use those as the source (covers all questions)
  // - If we only have raw answers (old quiz model) → use answers as fallback
  const questionList = lessonQuestions.length > 0
    ? lessonQuestions.map((q) => ({
        question: q,
        answer: answerMap[q.id] || null,
      }))
    : answers.map((a, i) => ({
        question: null as AssignmentQuestion | null,
        answer: a,
      }));

  const handleDownload = () => {
    if (submission.submissionUrl) {
      triggerFileDownload(
        submission.submissionUrl,
        `${submission.assignment || "submission"}`
      );
      toast.success("Download started (or opened in new tab).");
    } else {
      toast.error("No submission URL available.");
    }
  };

  const handleOpenExternal = () => {
    if (submission.submissionUrl) {
      openInNewTab(submission.submissionUrl);
    } else {
      toast.error("No preview URL available.");
    }
  };

  // Build a question map for fast lookup
  const questionMap: Record<string, AssignmentQuestion> = {};
  (submission.lessonQuestions || []).forEach((q) => {
    questionMap[q.id] = q;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 border-border/50">
        <DialogHeader className="px-6 py-4 bg-muted/20 border-b border-border/50 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <FileText className="w-5 h-5 text-accent" />
            Submission Review
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Meta info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/30 rounded-2xl space-y-1">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Student</p>
                <p className="font-bold flex items-center gap-2">
                  <User className="w-4 h-4 text-accent" />
                  {submission.student}
                </p>
              </div>
              <div className="p-4 bg-muted/30 rounded-2xl space-y-1">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Submitted At</p>
                <p className="font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" />
                  {submission.submittedAt}
                </p>
              </div>
              <div className="p-4 bg-muted/30 rounded-2xl space-y-1 col-span-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                  Course &amp; Lesson
                </p>
                <p className="font-bold">{submission.course}</p>
                <p className="text-sm text-muted-foreground">
                  Lesson: {submission.assignment}
                </p>
              </div>

              {/* Exam stats */}
              {isExamSubmission && (
                <>
                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl space-y-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Questions Answered</p>
                    <p className="font-black text-xl text-indigo-400">
                      {submission.answers?.filter(a => a.answerText?.trim()).length ?? 0}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        / {submission.lessonQuestions?.length || submission.answers?.length || "?"}
                      </span>
                    </p>
                  </div>
                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl space-y-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Time Taken</p>
                    <p className="font-black text-xl text-indigo-400 flex items-center gap-2">
                      <Timer className="w-4 h-4" />
                      {formatTime(submission.timeTaken)}
                    </p>
                  </div>
                  {submission.totalScore != null && (
                    <div className="col-span-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-1">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">AI Auto-Score</p>
                      <p className="font-black text-2xl text-amber-400 flex items-center gap-2">
                        <Star className="w-5 h-5" />
                        {submission.totalScore} pts
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Exam Q&A Panel */}
            {isExamSubmission ? (
              <div className="space-y-4">
                <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-400" />
                  Student Answers
                </h3>

                {submission.answers?.map((answer, idx) => {
                  const question = questionMap[answer.questionId];
                  const hasQuestion = !!question;
                  const isMcq = question?.type === "mcq";
                  const isCorrect =
                    isMcq &&
                    question?.correctOptionIndex != null &&
                    answer.answerText === question.correctOptionIndex.toString();

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-border/50 overflow-hidden"
                    >
                      {/* Question header */}
                      <div className="px-5 py-4 bg-muted/20 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm leading-snug">
                              {hasQuestion ? question.questionText : `Question ${idx + 1}`}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-[10px] capitalize">
                                {question?.type || "open"}
                              </Badge>
                              {question?.points && (
                                <span className="text-[10px] text-muted-foreground">
                                  {question.points} pts
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {isMcq && (
                          isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          )
                        )}
                        {!hasQuestion && answer.aiFeedback && (
                          answer.aiFeedback.toLowerCase().startsWith("correct") ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : answer.aiFeedback.toLowerCase().startsWith("incorrect") ? (
                            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          ) : null
                        )}
                      </div>

                      {/* MCQ options */}
                      {isMcq && question?.options && (
                        <div className="px-5 py-3 bg-background/30 flex flex-wrap gap-2">
                          {question.options.map((opt, oi) => {
                            const isStudentAnswer = answer.answerText === oi.toString();
                            const isCorrectOption = question.correctOptionIndex === oi;
                            return (
                              <span
                                key={oi}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                  isCorrectOption
                                    ? "bg-green-500/10 border-green-500/40 text-green-400"
                                    : isStudentAnswer && !isCorrectOption
                                    ? "bg-red-500/10 border-red-500/40 text-red-400"
                                    : "bg-muted/30 border-border/50 text-muted-foreground"
                                }`}
                              >
                                {String.fromCharCode(65 + oi)}. {opt}
                                {isStudentAnswer && !isCorrectOption && " ← Student"}
                                {isStudentAnswer && isCorrectOption && " ← ✓ Student"}
                                {!isStudentAnswer && isCorrectOption && " ✓"}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Open answer (or fallback when question not found) */}
                      {(!isMcq) && (
                        <div className="px-5 py-4 bg-background/20">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                            Student's Answer
                          </p>
                          {answer.answerText?.trim() ? (
                            <p className="text-sm leading-relaxed bg-muted/30 rounded-xl p-4 border border-border/50">
                              {answer.answerText}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic flex items-center gap-2">
                              <HelpCircle className="w-3.5 h-3.5" /> No answer provided
                            </p>
                          )}
                        </div>
                      )}

                      {/* AI Feedback */}
                      {answer.aiFeedback && (
                        <div className="px-5 py-3 bg-indigo-500/5 border-t border-indigo-500/10">
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1 flex items-center gap-1">
                            <Brain className="w-3 h-3" /> AI Feedback
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {answer.aiFeedback}
                          </p>
                        </div>
                      )}

                      {/* Score */}
                      {answer.score != null && (
                        <div className="px-5 py-2 bg-muted/10 border-t border-border/30 flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Score</span>
                          <span className={`text-sm font-black ${answer.score > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                            {answer.score} / {question?.points || "?"} pts
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Regular assignment content (URL / text) */
              <div className="space-y-4">
                {submission.description && (
                  <div className="p-4 border border-border/50 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlignLeft className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">Description</p>
                    </div>
                    <p className="text-sm">
                      {submission.description?.replace(/<[^>]*>?/gm, "")}
                    </p>
                  </div>
                )}

                {submission.content && !submission.submissionUrl && (
                  <div className="p-4 border border-border/50 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">Submission Content</p>
                    </div>
                    <div
                      className="text-sm prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: submission.content }}
                    />
                  </div>
                )}

                <div className="p-4 border border-border/50 rounded-2xl">
                  <p className="text-sm text-muted-foreground mb-3">Submitted File / URL:</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-xl">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-accent" />
                        <span className="text-sm truncate max-w-[250px]">
                          {submission.submissionUrl || "No URL provided"}
                        </span>
                      </div>
                      {submission.submissionUrl && (
                        <Button variant="ghost" size="sm" onClick={handleOpenExternal}>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer actions (only for file submissions) */}
        {!isExamSubmission && (
          <div className="flex gap-2 p-4 border-t border-border/50 flex-shrink-0">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDownload}
              disabled={!submission.submissionUrl}
            >
              <Download className="w-4 h-4 mr-2" />
              Download / Open
            </Button>
            <Button
              variant="default"
              className="flex-1"
              onClick={handleOpenExternal}
              disabled={!submission.submissionUrl}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Preview
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
