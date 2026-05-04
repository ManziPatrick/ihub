import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, CheckCircle2, AlertCircle, Loader2, Pencil, Sparkles, Save, X } from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_QUESTIONS } from "@/lib/graphql/queries";
import { CREATE_QUESTION, UPDATE_QUESTION, DELETE_QUESTION, GENERATE_AI_QUIZ } from "@/lib/graphql/mutations";
import { toast } from "sonner";
import { FileUpload } from "@/components/FileUpload";
import { Image as ImageIcon, Upload } from "lucide-react";

interface ManageQuestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  lessonId?: string;
  lessonTitle?: string;
  courseTitle?: string;
  lessonContent?: string;
}

export function ManageQuestionsDialog({
  open,
  onOpenChange,
  courseId,
  lessonId,
  lessonTitle,
  courseTitle,
  lessonContent
}: ManageQuestionsDialogProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    questionText: "",
    imageUrl: "",
    options: ["", ""], // Start with 2 options minimum
    correctOptionIndex: 0,
    explanation: ""
  });

  const { data, loading, refetch } = useQuery(GET_QUESTIONS, {
    variables: { courseId, lessonId: lessonId || null },
    skip: !open || !courseId
  });

  const [createQuestion] = useMutation(CREATE_QUESTION);
  const [updateQuestion] = useMutation(UPDATE_QUESTION);
  const [deleteQuestion] = useMutation(DELETE_QUESTION);
  const [generateAIQuiz] = useMutation(GENERATE_AI_QUIZ);

  const [draftQuestions, setDraftQuestions] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiQuestionCount, setAiQuestionCount] = useState(3);
  const [aiPrompt, setAiPrompt] = useState("");

  const questions = (data as any)?.questions || [];

  const handleSave = async () => {
    if (!formData.questionText || formData.options.some(o => !o)) {
      toast.error("Please fill in the question and all options");
      return;
    }

    try {
      if (editingId) {
        await updateQuestion({
          variables: {
            id: editingId,
            ...formData
          }
        });
        toast.success("Question updated!");
      } else {
        await createQuestion({
          variables: {
            courseId,
            lessonId: lessonId || null,
            ...formData
          }
        });
        toast.success("Question added!");
      }

      setFormData({ questionText: "", imageUrl: "", options: ["", ""], correctOptionIndex: 0, explanation: "" });
      setIsAdding(false);
      setEditingId(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to save question");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await deleteQuestion({ variables: { id } });
      toast.success("Question deleted");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete question");
    }
  };

  const startEdit = (q: any) => {
    setFormData({
      questionText: q.questionText,
      imageUrl: q.imageUrl || "",
      options: [...q.options],
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation || ""
    });
    setEditingId(q.id);
    setIsAdding(true);
  };

  const handleGenerateAI = async () => {
    if (!lessonId && !lessonTitle) {
      toast.error("AI Generation requires a specific lesson.");
      return;
    }
    setIsGenerating(true);
    try {
      const { data } = await generateAIQuiz({
        variables: { 
          courseId: courseId || null, 
          lessonId: (lessonId && lessonId.includes('-')) ? null : lessonId, // Handle temp IDs like "0-0"
          courseTitle,
          lessonTitle,
          lessonContent,
          questionCount: aiQuestionCount, 
          prompt: aiPrompt 
        }
      }) as any;
      
      if (data?.generateAIQuiz) {
        setDraftQuestions(prev => [...prev, ...data.generateAIQuiz]);
        toast.success(`Generated ${data.generateAIQuiz.length} questions!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate questions");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async (draft: any, index: number) => {
    try {
      await createQuestion({
        variables: {
          courseId,
          lessonId: lessonId || null,
          questionText: draft.questionText,
          imageUrl: draft.imageUrl || "",
          options: draft.options,
          correctOptionIndex: draft.correctOptionIndex,
          explanation: draft.explanation
        }
      });
      toast.success("Draft saved to course!");
      setDraftQuestions(prev => prev.filter((_, i) => i !== index));
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to save draft");
    }
  };

  const handleEditDraft = (draft: any, index: number) => {
    setFormData({
      questionText: draft.questionText,
      imageUrl: draft.imageUrl || "",
      options: [...draft.options],
      correctOptionIndex: draft.correctOptionIndex,
      explanation: draft.explanation || ""
    });
    setDraftQuestions(prev => prev.filter((_, i) => i !== index));
    setIsAdding(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 border-accent/20 overflow-hidden bg-background">
        <DialogHeader className="px-4 py-4 sm:px-6 border-b border-white/5 bg-white/3">
          <div className="flex items-center justify-between">
            <DialogTitle>
              Manage Questions {lessonTitle ? `- ${lessonTitle}` : ""}
            </DialogTitle>
            {!isAdding && (
              <Button 
                variant="gold" 
                size="sm" 
                className="h-8 gap-2 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-gold/20"
                onClick={() => setIsAdding(true)}
              >
                <Plus className="w-3.5 h-3.5" /> Add Question
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4 sm:px-6 custom-scrollbar">
          <div className="py-4 space-y-6">
            {isAdding ? (
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50 space-y-4">
                <h4 className="font-medium text-sm">
                  {editingId ? "Edit Question" : "Add New Question"}
                </h4>
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Question Text *</label>
                  <Input
                    value={formData.questionText}
                    onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                    placeholder="Enter the question here..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5 text-accent" /> Question Image (Optional)
                  </label>
                  
                  {formData.imageUrl ? (
                    <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-white/5 aspect-video">
                      <img src={formData.imageUrl} alt="Question preview" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="h-8 gap-2"
                          onClick={() => setFormData({ ...formData, imageUrl: "" })}
                        >
                          <Trash2 className="w-4 h-4" /> Remove Image
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 bg-white/3 p-4">
                      <FileUpload
                        folder="quiz_questions"
                        label="Drag & drop question image or click to browse"
                        onUploadComplete={(url) => setFormData({ ...formData, imageUrl: url })}
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Input
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="Or paste an image URL here..."
                      className="h-9 text-xs bg-white/5 border-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">Answer Options *</label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 px-2 text-[9px] font-black uppercase border-dashed border-accent/30 text-accent hover:bg-accent/5"
                      onClick={() => setFormData({ ...formData, options: [...formData.options, ""] })}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Choice
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {formData.options.map((opt, i) => (
                      <div key={i} className="group/opt relative p-3 rounded-xl border border-white/5 bg-white/3 hover:border-white/10 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Option {i + 1}</span>
                          <div className="flex items-center gap-2">
                            {formData.options.length > 2 && (
                              <button 
                                className="opacity-0 group-hover/opt:opacity-100 transition-opacity text-red-400/50 hover:text-red-400"
                                onClick={() => {
                                  const newOpts = formData.options.filter((_, idx) => idx !== i);
                                  let newCorrect = formData.correctOptionIndex;
                                  if (newCorrect === i) newCorrect = 0;
                                  else if (newCorrect > i) newCorrect -= 1;
                                  setFormData({ ...formData, options: newOpts, correctOptionIndex: newCorrect });
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => setFormData({ ...formData, correctOptionIndex: i })}
                              className={`text-[9px] font-black px-2 py-0.5 rounded-full border transition-all uppercase tracking-tighter ${formData.correctOptionIndex === i
                                  ? "bg-green-500/20 text-green-400 border-green-500/50"
                                  : "text-white/20 border-white/10 hover:border-white/30"
                                }`}
                            >
                              {formData.correctOptionIndex === i ? "Correct" : "Mark"}
                            </button>
                          </div>
                        </div>
                        <Input
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...formData.options];
                            newOpts[i] = e.target.value;
                            setFormData({ ...formData, options: newOpts });
                          }}
                          placeholder={`Enter choice ${i + 1}...`}
                          className="h-9 text-sm bg-transparent border-transparent focus:border-white/10 p-0"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Explanation (Optional)</label>
                  <Input
                    value={formData.explanation}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    placeholder="Provide reasoning for the correct answer..."
                    className="h-10 bg-white/5 border-white/10 text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <Button variant="gold" className="flex-1 h-11 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-gold/10" onClick={handleSave}>
                    {editingId ? "Update Question" : "Save Question"}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 px-6 font-black uppercase tracking-widest text-[11px]"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingId(null);
                      setFormData({ questionText: "", imageUrl: "", options: ["", ""], correctOptionIndex: 0, explanation: "" });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {lessonId && (
                  <div className="bg-gradient-to-br from-accent/10 to-accent/5 p-5 rounded-xl border border-accent/20 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-accent flex items-center gap-2">
                        <Sparkles className="w-5 h-5" /> AI Quiz Generator
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Automatically generate multiple-choice questions based on this lesson's content.
                      </p>
                    </div>
                    
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-medium mb-1.5 block">Number of Questions</label>
                        <Input 
                          type="number" 
                          min={1} max={20} 
                          value={aiQuestionCount} 
                          onChange={e => setAiQuestionCount(parseInt(e.target.value) || 3)}
                          className="h-9"
                        />
                      </div>
                      <div className="flex-[2]">
                        <label className="text-xs font-medium mb-1.5 block">Custom Instructions (Optional)</label>
                        <Input 
                          placeholder="e.g. Focus on X, easy/hard, etc." 
                          value={aiPrompt}
                          onChange={e => setAiPrompt(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <Button 
                        variant="default" 
                        className="bg-accent hover:bg-accent/90 text-accent-foreground h-9 px-6"
                        onClick={handleGenerateAI}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" /> Generate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    Existing Questions
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {questions.length}
                    </span>
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-[10px] font-black uppercase tracking-widest border-dashed"
                    onClick={() => setIsAdding(true)}
                  >
                    <Plus className="w-3 h-3" /> New Question
                  </Button>
                </div>
              </div>
            )}

            {draftQuestions.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-accent">
                  AI Draft Questions
                  <span className="text-xs font-normal bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                    {draftQuestions.length}
                  </span>
                </h3>
                  <ScrollArea className="h-[400px] w-full rounded-md border p-4 custom-scrollbar">
                    <div className="space-y-4">
                      {draftQuestions.map((q: any, idx: number) => (
                        <div
                          key={q.id || idx}
                          className="p-4 bg-accent/5 border border-accent/30 rounded-xl hover:shadow-card transition-all group"
                        >
                          <div className="flex justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <span className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1 block">Draft {idx + 1}</span>
                              <h4 className="font-medium text-card-foreground leading-snug">{q.questionText}</h4>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10" onClick={() => handleSaveDraft(q, idx)} title="Save to Course">
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10" onClick={() => handleEditDraft(q, idx)} title="Edit Draft">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setDraftQuestions(prev => prev.filter((_, i) => i !== idx))} title="Discard">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {q.options.map((opt: string, i: number) => (
                              <div
                                key={i}
                                className={`text-xs p-2 rounded-lg border flex items-center gap-2 ${i === q.correctOptionIndex
                                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                                    : "bg-muted/30 border-transparent text-muted-foreground"
                                  }`}
                              >
                                {i === q.correctOptionIndex && <CheckCircle2 className="w-3 h-3" />}
                                <span className="truncate">{opt}</span>
                              </div>
                            ))}
                          </div>
                          {q.explanation && (
                            <div className="text-[10px] text-muted-foreground bg-muted/20 p-2 rounded italic">
                              Explanation: {q.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
              </div>
            )}

            <div className="space-y-4">
              {!isAdding && questions.length > 0 && (
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                   <h3 className="font-semibold text-xs text-white/40 uppercase tracking-widest">
                    Question List
                  </h3>
                </div>
              )}

              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-12 bg-muted/10 rounded-xl border border-dashed">
                  <AlertCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No questions set yet for this {lessonId ? "lesson" : "course"}.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q: any, idx: number) => (
                    <div
                      key={q.id}
                      className="p-4 bg-card border border-border/50 rounded-xl hover:shadow-card transition-all group"
                    >
                      <div className="flex justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <span className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1 block">Question {idx + 1}</span>
                          <h4 className="font-medium text-card-foreground leading-snug">{q.questionText}</h4>
                          {q.imageUrl && (
                             <img src={q.imageUrl} alt="Question" className="mt-2 rounded-md max-h-32 object-contain bg-muted/30" />
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(q)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(q.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {q.options.map((opt: string, i: number) => (
                          <div
                            key={i}
                            className={`text-xs p-2 rounded-lg border flex items-center gap-2 ${i === q.correctOptionIndex
                                ? "bg-green-500/10 border-green-500/30 text-green-400"
                                : "bg-muted/30 border-transparent text-muted-foreground"
                              }`}
                          >
                            {i === q.correctOptionIndex && <CheckCircle2 className="w-3 h-3" />}
                            <span className="truncate">{opt}</span>
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <div className="text-[10px] text-muted-foreground bg-muted/20 p-2 rounded italic">
                          Explanation: {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                  {questions.length > 5 && (
                    <Button
                      variant="outline"
                      className="w-full border-dashed py-6 border-2 hover:bg-accent/5 hover:border-accent/40 transition-all group mt-6"
                      onClick={() => {
                        setIsAdding(true);
                        // Scroll to top where the form appears
                        const scrollArea = document.querySelector('.custom-scrollbar [data-radix-scroll-area-viewport]');
                        if (scrollArea) scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" /> 
                      Add Another Question
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-muted/10">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
