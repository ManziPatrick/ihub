import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, CheckCircle2, AlertCircle, Loader2, Pencil, Sparkles, Save, X, ArrowLeft, Settings, Type, Shuffle } from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_QUESTIONS, GET_COURSE } from "@/lib/graphql/queries";
import { CREATE_QUESTION, UPDATE_QUESTION, DELETE_QUESTION, GENERATE_AI_QUIZ, GENERATE_QUESTION_EXPLANATION, UPDATE_QUIZ_CONFIG } from "@/lib/graphql/mutations";
import { toast } from "sonner";
import { FileUpload } from "@/components/FileUpload";
import { Image as ImageIcon, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { TextEditor } from "@/components/ui/text-editor";

interface ManageQuestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  lessonId?: string;
  lessonTitle?: string;
  courseTitle?: string;
  questions: any[];
  config: any;
  onSave: (questions: any[], config: any) => void;
  isLoading?: boolean;
  lessonContent?: string;
}

export function ManageQuestionsDialog({
  open,
  onOpenChange,
  courseId,
  lessonId,
  lessonTitle,
  courseTitle,
  questions,
  config,
  onSave,
  isLoading = false,
  lessonContent
}: ManageQuestionsDialogProps) {
  const [activeTab, setActiveTab] = useState("import");
  const [isAdding, setIsAdding] = useState(false);
  const [creationMode, setCreationMode] = useState<'manual' | 'ai' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: "multiple_choice",
    questionText: "",
    imageUrl: "",
    options: ["", ""],
    correctOptionIndex: 0,
    matchingPairs: [{ id: "1", left: "", right: "" }, { id: "2", left: "", right: "" }],
    explanation: ""
  });

  const [bulkImportText, setBulkImportText] = useState("");
  
  const [localQuestions, setLocalQuestions] = useState<any[]>([]);
  const [localConfig, setLocalConfig] = useState({
    disableRightClick: false,
    timeLimit: 0,
    quizType: 'exercise',
    questionsPerPage: 5
  });

  const [generateAIQuiz] = useMutation(GENERATE_AI_QUIZ);
  const [generateAIExplanation] = useMutation<{ generateQuestionExplanation: string }>(GENERATE_QUESTION_EXPLANATION);

  const isInitialized = useRef(false);

  useEffect(() => {
    if (open && !isInitialized.current) {
      console.log(`[ManageQuestionsDialog] Initializing state for lesson: ${lessonTitle}`);
      setLocalQuestions(questions || []);
      setLocalConfig({
        disableRightClick: config?.disableRightClick || false,
        timeLimit: config?.timeLimit || 0,
        quizType: config?.quizType || 'exercise',
        questionsPerPage: config?.questionsPerPage || 5
      });
      isInitialized.current = true;
    } else if (!open) {
      isInitialized.current = false;
    }
  }, [open, questions, config, lessonTitle]);

  const handleFinalSave = () => {
    console.log(`[ManageQuestionsDialog] PASSING BACK ${localQuestions.length} QUESTIONS to parent`);
    onSave(localQuestions, localConfig);
  };
  const [isExplaining, setIsExplaining] = useState(false);
  const [aiQuestionCount, setAiQuestionCount] = useState(3);
  const [aiPrompt, setAiPrompt] = useState("");
  const [draftQuestions, setDraftQuestions] = useState<any[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [wasSaved, setWasSaved] = useState(false);
  const prevLoading = useRef(isLoading);

  useEffect(() => {
    if (prevLoading.current && !isLoading && open) {
      setWasSaved(true);
      setTimeout(() => {
        setWasSaved(false);
        onOpenChange(false);
      }, 1000);
    }
    prevLoading.current = isLoading;
  }, [isLoading, open, onOpenChange]);

  // Reset state whenever the dialog opens for a new lesson
  useEffect(() => {
    if (open) {
      setIsAdding(false);
      setCreationMode(null);
      setEditingId(null);
    }
  }, [open, lessonId]);


  const handleSaveQuestion = async () => {
    if (!formData.questionText) {
      toast.error("Please enter a question");
      return;
    }

    try {
      const newQuestion = {
        id: editingId || `new-${Date.now()}`,
        ...formData,
        options: formData.type === 'open_ended' || formData.type === 'matching' ? [] : formData.options
      };

      if (editingId) {
        setLocalQuestions(prev => prev.map(q => (q.id === editingId || q._id === editingId) ? newQuestion : q));
        toast.success("Question updated locally!");
      } else {
        setLocalQuestions(prev => [...prev, newQuestion]);
        toast.success("Question added locally!");
      }

      setFormData({ type: "multiple_choice", questionText: "", imageUrl: "", options: ["", ""], correctOptionIndex: 0, matchingPairs: [{ id: "1", left: "", right: "" }, { id: "2", left: "", right: "" }], explanation: "" });
      setIsAdding(false);
      setEditingId(null);
    } catch (err: any) {
      toast.error("Failed to save question");
    }
  };

  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) return;

    const lines = bulkImportText.split('\n').map((l: string) => l.trim()).filter((l: string) => l);
    const parsed: any[] = [];
    let current: any = null;

    lines.forEach((line: string) => {
      const qMatch = line.match(/^(Q:|Question\s*\d*[:.]?|\d+[.)\s])\s*(.*)/i);
      const optMatch = line.match(/^([a-dA-D][.)\s]|\([a-dA-D]\))\s*(.*)/i);
      const correctMatch = line.match(/^(Correct|Answer):\s*([a-dA-D])/i);
      const openMatch = line.match(/\(Open\s*Ended\)/i);

      if (qMatch) {
        if (current) parsed.push(current);
        current = { id: `bulk-${Date.now()}-${parsed.length}`, type: 'multiple_choice', questionText: qMatch[2], options: [], correctOptionIndex: 0, explanation: '' };
        if (openMatch) current.type = 'open_ended';
      } else if (optMatch && current) {
        current.type = 'multiple_choice';
        current.options.push(optMatch[2]);
      } else if (correctMatch && current) {
        const letter = correctMatch[2].toUpperCase();
        current.correctOptionIndex = letter.charCodeAt(0) - 65;
      } else if (openMatch && current) {
        current.type = 'open_ended';
      } else if (current) {
        current.questionText += ' ' + line;
      } else {
        current = { id: `bulk-${Date.now()}-${parsed.length}`, type: 'open_ended', questionText: line, options: [], correctOptionIndex: 0, explanation: '' };
      }
    });

    if (current) parsed.push(current);

    if (parsed.length === 0) {
      toast.error("No questions found. Check your format.");
      return;
    }

    setLocalQuestions(prev => [...prev, ...parsed]);
    setBulkImportText("");
    setActiveTab('questions');
    toast.success(`Parsed ${parsed.length} questions locally! Click Save to finish.`);
  };

  const handleSaveQuizConfig = () => {
    toast.success("Quiz settings updated locally!");
    // Already in localConfig state
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    setLocalQuestions(prev => prev.filter(q => q.id !== id && q._id !== id));
    toast.success("Question removed from quiz draft");
  };

  const startEdit = (q: any) => {
    setFormData({
      type: q.type || 'multiple_choice',
      questionText: q.questionText,
      imageUrl: q.imageUrl || "",
      options: q.options?.length ? [...q.options] : ["", ""],
      correctOptionIndex: q.correctOptionIndex || 0,
      matchingPairs: q.matchingPairs?.length ? [...q.matchingPairs] : [{ id: "1", left: "", right: "" }, { id: "2", left: "", right: "" }],
      explanation: q.explanation || ""
    });
    setEditingId(q.id);
    setIsAdding(true);
  };

  const handleGenerateAI = async () => {
    if (!courseId || courseId === "" || courseId.length !== 24) {
      toast.error("Please save your course as a draft first to use AI generation.");
      return;
    }
    if (!lessonId && !lessonTitle) {
      toast.error("AI Generation requires a specific lesson.");
      return;
    }
    setIsGenerating(true);
    try {
      const { data } = await generateAIQuiz({
        variables: { 
          courseId: courseId || null, 
          lessonId: (lessonId && lessonId.includes('-')) ? null : lessonId, 
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

  const handleGenerateExplanation = async () => {
    if (!formData.questionText) {
      toast.error("Please fill in the question first.");
      return;
    }
    setIsExplaining(true);
    try {
      const { data } = await generateAIExplanation({
        variables: {
          questionText: formData.questionText,
          options: formData.options,
          correctOptionIndex: formData.correctOptionIndex
        }
      });
      if (data?.generateQuestionExplanation) {
        setFormData(prev => ({ ...prev, explanation: data.generateQuestionExplanation }));
        toast.success("Explanation generated!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate explanation");
    } finally {
      setIsExplaining(false);
    }
  };

  const handleSaveDraft = (draft: any, index: number) => {
    setLocalQuestions(prev => [...prev, { ...draft, id: `draft-${Date.now()}-${index}` }]);
    toast.success("AI Draft added to quiz!");
    setDraftQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditDraft = (draft: any, index: number) => {
    setFormData({
      type: draft.type || 'multiple_choice',
      questionText: draft.questionText,
      imageUrl: draft.imageUrl || "",
      options: draft.options?.length ? [...draft.options] : ["", ""],
      correctOptionIndex: draft.correctOptionIndex || 0,
      matchingPairs: draft.matchingPairs?.length ? [...draft.matchingPairs] : [{ id: "1", left: "", right: "" }, { id: "2", left: "", right: "" }],
      explanation: draft.explanation || ""
    });
    setDraftQuestions(prev => prev.filter((_, i) => i !== index));
    setIsAdding(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] sm:max-w-3xl w-full h-[100dvh] sm:h-[85vh] flex flex-col p-0 border-accent/20 overflow-hidden bg-background rounded-none sm:rounded-lg">
        <DialogHeader className="px-4 py-4 sm:px-6 border-b border-border/20 bg-muted/30">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-black uppercase tracking-widest text-foreground/80">
              Manage Quiz {lessonTitle ? `- ${lessonTitle}` : ""}
            </DialogTitle>
            {!isAdding && activeTab === 'questions' && (
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

        {(!courseId || courseId === "" || courseId.length !== 24) && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-500 uppercase tracking-tight">Draft Mode Restriction</p>
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed font-medium">
                This course hasn't been saved to our database yet. You can design questions here, but you must <b>save the course as a draft</b> in the main builder before questions can be persisted.
              </p>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="px-6 border-b border-border/40">
            <TabsList className="bg-transparent space-x-2">
              <TabsTrigger 
                value="import" 
                className="data-[state=active]:bg-accent/10 data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none h-12 text-[10px] font-black uppercase tracking-widest"
              >
                Bulk Import
              </TabsTrigger>
              <TabsTrigger 
                value="questions" 
                className="data-[state=active]:bg-accent/10 data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none h-12 text-[10px] font-black uppercase tracking-widest"
              >
                Questions
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="data-[state=active]:bg-accent/10 data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none h-12 text-[10px] font-black uppercase tracking-widest"
              >
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="questions" className="hidden data-[state=active]:flex flex-col flex-1 min-h-0">
            <ScrollArea className="flex-1 px-4 sm:px-6 custom-scrollbar">
              <div className="py-4 space-y-6">
                {isAdding ? (
                  <div className="space-y-6">
                    {!creationMode && !editingId ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in zoom-in-95 duration-300">
                        <button 
                          onClick={() => setCreationMode('manual')}
                          className="p-6 rounded-2xl border-2 border-dashed border-accent/20 bg-accent/5 hover:border-accent/40 hover:bg-accent/10 transition-all group text-left"
                        >
                          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Plus className="w-5 h-5 text-accent" />
                          </div>
                          <h4 className="font-bold text-base mb-1">Create Manually</h4>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">Draft your own question, options, and explanation from scratch.</p>
                        </button>

                        <button 
                          onClick={() => {
                            setActiveTab('import');
                            setIsAdding(false);
                          }}
                          className="p-6 rounded-2xl border-2 border-dashed border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 hover:bg-amber-500/10 transition-all group text-left"
                        >
                          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Type className="w-5 h-5 text-amber-500" />
                          </div>
                          <h4 className="font-bold text-base mb-1">Bulk Import</h4>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">Paste large amounts of text or multiple questions to parse them at once.</p>
                        </button>

                        <button 
                          onClick={() => setCreationMode('ai')}
                          disabled={!lessonId}
                          className={`p-6 rounded-2xl border-2 border-dashed transition-all group text-left ${!lessonId ? 'opacity-50 cursor-not-allowed border-border/10' : 'border-indigo-500/20 bg-indigo-500/5 hover:border-indigo-500/40 hover:bg-indigo-500/10'}`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${!lessonId ? 'bg-muted/30' : 'bg-indigo-500/20'}`}>
                            <Sparkles className={`w-5 h-5 ${!lessonId ? 'text-muted-foreground/30' : 'text-indigo-400'}`} />
                          </div>
                          <h4 className="font-bold text-base mb-1">Generate with AI</h4>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            {lessonId ? "Instantly create high-quality questions based on this lesson's content." : "AI generation requires this question to be attached to a specific lesson."}
                          </p>
                        </button>

                        <div className="sm:col-span-3 flex justify-center">
                          <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
                          </Button>
                        </div>
                      </div>
                    ) : (creationMode === 'manual' || editingId) ? (
                      <div className="p-4 bg-muted/30 rounded-lg border border-border/50 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-sm flex items-center gap-2">
                            <Pencil className="w-4 h-4 text-accent" />
                            {editingId ? "Edit Question" : "New Manual Question"}
                          </h4>
                          {!editingId && (
                            <Button variant="ghost" size="sm" onClick={() => setCreationMode(null)} className="h-7 text-[10px] uppercase font-bold">
                              Change Method
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-4 gap-3 bg-muted/30 p-3 rounded-lg border border-border/20">
                          <Button 
                            variant={formData.type === 'multiple_choice' ? 'gold' : 'ghost'}
                            size="sm"
                            className="h-9 text-[9px] font-black uppercase tracking-widest rounded-lg"
                            onClick={() => setFormData({ ...formData, type: 'multiple_choice', options: formData.options.length >= 2 ? formData.options : ["", ""] })}
                          >
                            Multiple Choice
                          </Button>
                          <Button 
                            variant={formData.type === 'true_false' ? 'gold' : 'ghost'}
                            size="sm"
                            className="h-9 text-[9px] font-black uppercase tracking-widest rounded-lg"
                            onClick={() => setFormData({ ...formData, type: 'true_false', options: ["True", "False"], correctOptionIndex: 0 })}
                          >
                            True / False
                          </Button>
                          <Button 
                            variant={formData.type === 'matching' ? 'gold' : 'ghost'}
                            size="sm"
                            className="h-9 text-[9px] font-black uppercase tracking-widest rounded-lg"
                            onClick={() => setFormData({ ...formData, type: 'matching', matchingPairs: [{ id: "1", left: "", right: "" }, { id: "2", left: "", right: "" }] })}
                          >
                            Matching
                          </Button>
                          <Button 
                            variant={formData.type === 'open_ended' ? 'gold' : 'ghost'}
                            size="sm"
                            className="h-9 text-[9px] font-black uppercase tracking-widest rounded-lg"
                            onClick={() => setFormData({ ...formData, type: 'open_ended' })}
                          >
                            Open-ended
                          </Button>
                        </div>

                        <div>
                          <label className="text-xs font-medium mb-1.5 block">Question Text *</label>
                          <TextEditor
                            value={formData.questionText}
                            onChange={(val) => setFormData({ ...formData, questionText: val })}
                            placeholder="Enter the question here..."
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                            <ImageIcon className="w-3.5 h-3.5 text-accent" /> Question Image (Optional)
                          </label>
                          
                          {formData.imageUrl ? (
                            <div className="relative group rounded-xl overflow-hidden border border-border/40 bg-muted/20 aspect-video">
                              <img src={formData.imageUrl} alt="Question preview" className="w-full h-full object-contain" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  className="h-8 gap-2 rounded-lg text-[10px] font-black uppercase tracking-widest"
                                  onClick={() => setFormData({ ...formData, imageUrl: "" })}
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Remove Image
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border-2 border-dashed border-border/20 bg-muted/10 p-4 hover:border-accent/30 transition-colors">
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
                              className="h-9 text-[10px] font-bold bg-muted/20 border-border/40"
                            />
                          </div>
                        </div>

                        {(formData.type === 'multiple_choice' || formData.type === 'true_false') && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Answer Options *</label>
                              {formData.type === 'multiple_choice' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 px-2 text-[9px] font-black uppercase border-dashed border-accent/30 text-accent hover:bg-accent/5"
                                  onClick={() => setFormData({ ...formData, options: [...formData.options, ""] })}
                                >
                                  <Plus className="w-3 h-3 mr-1" /> Add Choice
                                </Button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {formData.options.map((opt, i) => (
                                <div key={i} className="group/opt relative p-3 rounded-xl border border-border/20 bg-muted/20 hover:border-border/40 hover:bg-muted/30 transition-all">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">Option {i + 1}</span>
                                    <div className="flex items-center gap-2">
                                      {formData.type === 'multiple_choice' && formData.options.length > 2 && (
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
                                            : "text-muted-foreground/30 border-border/40 hover:border-border/60"
                                          }`}
                                      >
                                        {formData.correctOptionIndex === i ? "Correct" : "Mark"}
                                      </button>
                                    </div>
                                  </div>
                                  <TextEditor
                                    value={opt}
                                    onChange={(val) => {
                                      const newOpts = [...formData.options];
                                      newOpts[i] = val;
                                      setFormData({ ...formData, options: newOpts });
                                    }}
                                    placeholder={`Enter choice ${i + 1}...`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {formData.type === 'matching' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                <Shuffle className="w-3.5 h-3.5 inline mr-1" /> Matching Pairs *
                              </label>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 px-2 text-[9px] font-black uppercase border-dashed border-accent/30 text-accent hover:bg-accent/5"
                                onClick={() => {
                                  const newId = String(Date.now());
                                  setFormData({ ...formData, matchingPairs: [...formData.matchingPairs, { id: newId, left: "", right: "" }] });
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" /> Add Pair
                              </Button>
                            </div>
                            
                            <div className="space-y-3">
                              {formData.matchingPairs.map((pair, i) => (
                                <div key={pair.id} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-start p-3 rounded-xl border border-border/20 bg-muted/20">
                                  <div>
                                    <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1 block">Left Item</label>
                                    <TextEditor
                                      value={pair.left}
                                      onChange={(val) => {
                                        const newPairs = [...formData.matchingPairs];
                                        newPairs[i] = { ...newPairs[i], left: val };
                                        setFormData({ ...formData, matchingPairs: newPairs });
                                      }}
                                      placeholder="e.g. Rwanda"
                                    />
                                  </div>
                                  <div className="flex items-center justify-center pt-6">
                                    <div className="w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                                      <Shuffle className="w-3 h-3 text-muted-foreground/40" />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1 block">Right Item</label>
                                    <TextEditor
                                      value={pair.right}
                                      onChange={(val) => {
                                        const newPairs = [...formData.matchingPairs];
                                        newPairs[i] = { ...newPairs[i], right: val };
                                        setFormData({ ...formData, matchingPairs: newPairs });
                                      }}
                                      placeholder="e.g. Kigali"
                                    />
                                  </div>
                                  {formData.matchingPairs.length > 2 && (
                                    <div className="sm:col-span-3 flex justify-end">
                                      <button 
                                        className="text-[9px] font-black text-red-400/50 hover:text-red-400 uppercase tracking-widest"
                                        onClick={() => {
                                          setFormData({ ...formData, matchingPairs: formData.matchingPairs.filter((_, idx) => idx !== i) });
                                        }}
                                      >
                                        <Trash2 className="w-3 h-3 inline mr-1" /> Remove
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center justify-between">
                            <span>Explanation (Optional)</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 gap-1.5 text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                              onClick={handleGenerateExplanation}
                              disabled={isExplaining}
                            >
                              {isExplaining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                              AI Explain
                            </Button>
                          </label>
                          <TextEditor
                            value={formData.explanation}
                            onChange={(val) => setFormData({ ...formData, explanation: val })}
                            placeholder="Provide reasoning for the correct answer..."
                          />
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-border/20">
                          <Button 
                            variant="gold" 
                            className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-gold/20" 
                            onClick={handleSaveQuestion}
                          >
                            {editingId ? 'Update Question' : 'Add Question'}
                          </Button>
                          <Button
                            variant="outline"
                            className="h-11 px-6 font-black uppercase tracking-widest text-[11px]"
                            onClick={() => {
                              setIsAdding(false);
                              setCreationMode(null);
                              setEditingId(null);
                              setFormData({ type: "multiple_choice", questionText: "", imageUrl: "", options: ["", ""], correctOptionIndex: 0, matchingPairs: [{ id: "1", left: "", right: "" }, { id: "2", left: "", right: "" }], explanation: "" });
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 p-6 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                          <div className="flex items-center justify-between mb-6">
                            <div>
                              <h4 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
                                <Sparkles className="w-6 h-6" /> AI Quiz Generator
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                Crafting intelligent questions from your lesson content.
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setCreationMode(null)} className="h-8 text-[10px] uppercase font-bold text-muted-foreground">
                              Change Method
                            </Button>
                          </div>
                                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 block">Quantity</label>
                              <Input 
                                type="number" 
                                min={1} max={20} 
                                value={aiQuestionCount} 
                                onChange={e => setAiQuestionCount(parseInt(e.target.value) || 3)}
                                className="h-10 bg-muted/20 border-border/40"
                              />
                            </div>
                            <div className="sm:col-span-2 space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 block">Focus / Instructions</label>
                              <Input 
                                placeholder="e.g. Focus on technical details, make it challenging..." 
                                value={aiPrompt}
                                onChange={e => setAiPrompt(e.target.value)}
                                className="h-10 bg-muted/20 border-border/40"
                              />
                            </div>
                          </div>

                          <Button 
                            variant="default" 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-900/20"
                            onClick={handleGenerateAI}
                            disabled={isGenerating}
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-3" /> Generating Questions...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-3" /> Generate Now
                              </>
                            )}
                          </Button>
                        </div>

                        <div className="flex justify-center pt-2">
                          <Button variant="ghost" size="sm" onClick={() => { setIsAdding(false); setCreationMode(null); }} className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Question List
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-[10px] flex items-center gap-2 text-muted-foreground/60 uppercase tracking-widest">
                        Existing Questions
                        <span className="text-[10px] font-black bg-muted/30 text-muted-foreground/60 px-2.5 py-1 rounded-full border border-border/40 ml-2">
                          {localQuestions.length}
                        </span>
                      </h3>
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
                                  <span className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1 block">Draft {idx + 1} ({q.type || 'multiple_choice'})</span>
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
                              {q.type !== 'open_ended' && q.type !== 'matching' && q.options && (
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
                              )}
                              {q.type === 'matching' && q.matchingPairs && (
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  {q.matchingPairs.map((pair: any, pi: number) => (
                                    <div key={pair.id || pi} className="text-[10px] p-2 rounded-lg border border-border/30 flex items-center gap-2 bg-muted/20">
                                      <span className="font-bold text-accent">{pair.left}</span>
                                      <span className="text-muted-foreground">⟷</span>
                                      <span className="font-bold text-green-500">{pair.right}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
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
                  {false ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="w-6 h-6 animate-spin text-accent" />
                    </div>
                  ) : localQuestions.length === 0 ? (
                    <div className="text-center py-12 bg-muted/10 rounded-xl border border-dashed">
                      <AlertCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No questions set yet for this {lessonId ? "lesson" : "course"}.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {localQuestions.map((q: any, idx: number) => (
                        <div
                          key={q.id}
                          className="p-4 bg-card border border-border/50 rounded-xl hover:shadow-card transition-all group"
                        >
                          <div className="flex justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <span className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1 block">Question {idx + 1} ({q.type || 'multiple_choice'})</span>
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
                          {q.type !== 'open_ended' && q.type !== 'matching' && q.options && (
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
                          )}
                          {q.type === 'matching' && q.matchingPairs && (
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              {q.matchingPairs.map((pair: any, pi: number) => (
                                <div key={pair.id || pi} className="text-[10px] p-2 rounded-lg border border-border/30 flex items-center gap-2 bg-muted/20">
                                  <span className="font-bold text-accent">{pair.left}</span>
                                  <span className="text-muted-foreground">⟷</span>
                                  <span className="font-bold text-green-500">{pair.right}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {q.explanation && (
                            <div className="text-[10px] text-muted-foreground bg-muted/20 p-2 rounded italic">
                              Explanation: {q.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                      {localQuestions.length > 5 && (
                        <Button
                          variant="outline"
                          className="w-full border-dashed py-6 border-2 hover:bg-accent/5 hover:border-accent/40 transition-all group mt-6"
                          onClick={() => {
                            setIsAdding(true);
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
          </TabsContent>

          <TabsContent value="settings" className="hidden data-[state=active]:flex flex-col flex-1 min-h-0 overflow-y-auto">
            <div className="p-6 space-y-6 flex-1">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-accent border-b border-border/20 pb-2">Quiz Settings</h3>
                <p className="text-sm text-muted-foreground">Configure the behavior of this quiz for students.</p>

                <div className="space-y-4 bg-muted/20 p-5 rounded-xl border border-border/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">Quiz Type</h4>
                      <p className="text-xs text-muted-foreground">Should students take it once, or multiple times as an exercise?</p>
                    </div>
                    <select 
                      className="bg-background border border-border p-2 rounded text-sm"
                      value={localConfig.quizType}
                      onChange={(e) => setLocalConfig({...localConfig, quizType: e.target.value})}
                    >
                      <option value="exercise">Exercise (Unlimited)</option>
                      <option value="once">Once (Graded)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">Disable Right-Click</h4>
                      <p className="text-xs text-muted-foreground">Prevent students from copying questions or inspecting the page.</p>
                    </div>
                    <Switch 
                      checked={localConfig.disableRightClick}
                      onCheckedChange={(c) => setLocalConfig({...localConfig, disableRightClick: c})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">Time Limit (Minutes)</h4>
                      <p className="text-xs text-muted-foreground">0 means no time limit. Quiz autosubmits when time is up.</p>
                    </div>
                    <Input 
                      type="number"
                      min={0}
                      className="w-24 text-center"
                      value={localConfig.timeLimit}
                      onChange={(e) => setLocalConfig({...localConfig, timeLimit: parseInt(e.target.value) || 0})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">Questions Per Page</h4>
                      <p className="text-xs text-muted-foreground">Number of questions shown at a time. Default 5.</p>
                    </div>
                    <Input 
                      type="number"
                      min={1}
                      className="w-24 text-center"
                      value={localConfig.questionsPerPage}
                      onChange={(e) => setLocalConfig({...localConfig, questionsPerPage: parseInt(e.target.value) || 5})}
                    />
                  </div>
                </div>

                <Button 
                  className="w-full font-bold uppercase tracking-widest text-xs h-12" 
                  variant="gold" 
                  onClick={handleSaveQuizConfig}
                  disabled={false}
                >
                  {false ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Settings
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="import" className="hidden data-[state=active]:flex flex-col flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="flex-1 custom-scrollbar">
              <div className="p-4 sm:p-6 space-y-6">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-accent border-b border-border/20 pb-2 flex items-center gap-2">
                    <Type className="w-5 h-5" /> Bulk Import
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">Paste questions in text format. Our AI will automatically parse them into structured quiz questions.</p>
                </div>
                  
                <Textarea 
                  value={bulkImportText}
                  onChange={e => setBulkImportText(e.target.value)}
                  className="min-h-[400px] w-full font-mono text-xs p-4 bg-muted/20 border-border/40 custom-scrollbar resize-none rounded-xl"
                  placeholder="Example format:
Q: What is React?
A) A library
B) A framework
C) A database
Correct: A

Q: Describe the virtual DOM. (Open Ended)
"
                />

                <Button 
                  className="w-full font-black uppercase tracking-widest text-[11px] h-14 rounded-xl shadow-lg shadow-gold/20" 
                  onClick={handleBulkImport}
                  variant="gold"
                >
                  <Upload className="w-5 h-5 mr-2" /> Process & Import Questions
                </Button>

                <div className="p-4 rounded-xl bg-muted/30 border border-border/20 space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/60">Formatting Tips</h4>
                  <ul className="text-[10px] text-muted-foreground space-y-1.5 list-disc pl-4">
                    <li>Start each question with <b>Q:</b> or a number (e.g., <b>1.</b>)</li>
                    <li>List options as <b>A)</b>, <b>B)</b>, etc.</li>
                    <li>Mark the correct answer with <b>Correct: A</b> or <b>Answer: B</b></li>
                    <li>Add <b>(Open Ended)</b> to the question text for text-based responses.</li>
                  </ul>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer for Final Save */}
        {!isAdding && (
          <div className="p-6 border-t border-border/20 bg-muted/30 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground/40 uppercase font-black tracking-widest">Quiz Summary</span>
              <span className="text-sm font-black text-accent uppercase tracking-widest">{localQuestions.length} Total Questions</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 px-6 rounded-xl border-border/40 hover:bg-muted/50 text-[10px] font-black uppercase tracking-widest">
                Cancel
              </Button>
              <Button 
                variant="gold" 
                className="h-11 px-10 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-gold/20 text-[10px] gap-2" 
                onClick={handleFinalSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Syncing to Course...
                  </>
                ) : wasSaved ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    Saved & Synced!
                  </>
                ) : (
                  "Save & Sync to Course"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
