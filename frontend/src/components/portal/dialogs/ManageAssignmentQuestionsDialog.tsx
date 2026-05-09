import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Trash2, 
  AlertCircle, 
  Pencil, 
  X, 
  Type,
  FileText,
  ListOrdered,
  ChevronLeft,
  Upload
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface AssignmentQuestion {
  id?: string;
  questionText: string;
  type: 'mcq' | 'open';
  options?: string[];
  correctOptionIndex?: number;
  points: number;
}

interface ManageAssignmentQuestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: AssignmentQuestion[];
  onSave: (questions: AssignmentQuestion[]) => void;
}

export function ManageAssignmentQuestionsDialog({
  open,
  onOpenChange,
  questions: initialQuestions,
  onSave
}: ManageAssignmentQuestionsDialogProps) {
  const [mode, setMode] = useState<"list" | "form" | "bulk">("list");
  const [localQuestions, setLocalQuestions] = useState<AssignmentQuestion[]>(initialQuestions || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [bulkText, setBulkText] = useState("");

  const [formData, setFormData] = useState<AssignmentQuestion>({
    questionText: "",
    type: "open",
    options: ["", ""],
    correctOptionIndex: 0,
    points: 10
  });

  useEffect(() => {
    setLocalQuestions(initialQuestions || []);
  }, [initialQuestions]);

  const handleAddOrUpdate = () => {
    if (!formData.questionText) {
      toast.error("Question text is required");
      return;
    }

    const updated = [...localQuestions];
    if (editingIndex !== null) {
      updated[editingIndex] = formData;
    } else {
      updated.push(formData);
    }

    setLocalQuestions(updated);
    resetForm();
    setMode("list");
  };

  const resetForm = () => {
    setEditingIndex(null);
    setFormData({
      questionText: "",
      type: "open",
      options: ["", ""],
      correctOptionIndex: 0,
      points: 10
    });
  };

  const handleBulkParse = () => {
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l);
    const parsed: AssignmentQuestion[] = [];
    let currentQuestion: AssignmentQuestion | null = null;

    lines.forEach(line => {
      const questionMatch = line.match(/^(\d+[\.\)]|Question\s*\d+:?)\s*(.*)/i);
      const optionMatch = line.match(/^([a-d][\.\)]|\([a-d]\))\s*(.*)/i);

      if (questionMatch) {
        if (currentQuestion) parsed.push(currentQuestion);
        currentQuestion = {
          questionText: questionMatch[2],
          type: "open",
          points: 10
        };
      } else if (optionMatch && currentQuestion) {
        currentQuestion.type = "mcq";
        if (!currentQuestion.options) currentQuestion.options = [];
        currentQuestion.options.push(optionMatch[2]);
        currentQuestion.correctOptionIndex = 0;
      } else if (currentQuestion) {
        currentQuestion.questionText += " " + line;
      } else {
        currentQuestion = {
          questionText: line,
          type: "open",
          points: 10
        };
      }
    });

    if (currentQuestion) parsed.push(currentQuestion);

    if (parsed.length > 0) {
      setLocalQuestions([...localQuestions, ...parsed]);
      setBulkText("");
      setMode("list");
      toast.success(`Successfully parsed ${parsed.length} questions!`);
    } else {
      toast.error("Could not parse any questions. Check your format.");
    }
  };

  const handleFinalSave = () => {
    onSave(localQuestions);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] sm:max-w-4xl w-full h-[100dvh] sm:h-[90vh] flex flex-col p-0 overflow-hidden bg-[#1A1A1A] text-white border-white/10 rounded-none sm:rounded-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            {mode !== "list" && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-white/5 rounded-full" 
                onClick={() => { setMode("list"); resetForm(); }}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {mode === 'list' && <><ListOrdered className="w-5 h-5 text-accent" /> Manage Exam Questions</>}
                {mode === 'form' && <><Plus className="w-5 h-5 text-accent" /> {editingIndex !== null ? 'Edit' : 'Add'} Question</>}
                {mode === 'bulk' && <><Upload className="w-5 h-5 text-accent" /> Bulk Import Questions</>}
              </DialogTitle>
              {mode === 'list' && <p className="text-xs text-muted-foreground mt-0.5">{localQuestions.length} questions added to this assessment</p>}
            </div>
          </div>

          {mode === 'list' && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setMode("bulk")}
                className="h-9 border-white/10 hover:bg-white/5 bg-transparent"
              >
                <Upload className="w-4 h-4 mr-2" /> Bulk Import
              </Button>
              <Button 
                variant="gold" 
                size="sm" 
                onClick={() => { resetForm(); setMode("form"); }}
                className="h-9"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Question
              </Button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {mode === 'list' ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
              <div className="space-y-4 max-w-4xl mx-auto">
                {localQuestions.map((q, idx) => (
                  <div key={idx} className="p-5 rounded-2xl border border-white/5 bg-white/[0.03] group hover:border-accent/30 hover:bg-white/[0.05] transition-all">
                    <div className="flex justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-accent/10 text-accent text-[11px] font-black">
                            {idx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {q.type === 'mcq' ? 'Multiple Choice' : 'Open Question'}
                          </span>
                          <span className="text-[11px] font-medium text-accent/80 ml-auto">{q.points} Points</span>
                        </div>
                        <h4 className="font-semibold text-base leading-snug text-white/90 mb-3">{q.questionText}</h4>
                        {q.type === 'mcq' && q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt, i) => (
                              <div key={i} className={`text-xs p-3 rounded-xl border ${i === q.correctOptionIndex ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-white/[0.02] border-white/5 text-white/50'}`}>
                                <span className="font-bold mr-2 opacity-50">{String.fromCharCode(65 + i)}.</span>
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-9 w-9 rounded-xl hover:bg-white/10" 
                          onClick={() => {
                            setFormData(q);
                            setEditingIndex(idx);
                            setMode("form");
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-9 w-9 rounded-xl hover:bg-destructive/10 text-destructive hover:text-destructive" 
                          onClick={() => setLocalQuestions(localQuestions.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {localQuestions.length === 0 && (
                  <div className="text-center py-32 border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01]">
                    <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertCircle className="w-8 h-8 text-white/20" />
                    </div>
                    <h3 className="text-lg font-bold text-white/80 mb-2">No Questions Yet</h3>
                    <p className="text-sm text-white/40 max-w-[240px] mx-auto mb-8">
                      Start building your exam by adding questions manually or importing them in bulk.
                    </p>
                    <div className="flex justify-center gap-3">
                      <Button variant="outline" onClick={() => setMode("bulk")} className="border-white/10 hover:bg-white/5">
                        <Upload className="w-4 h-4 mr-2" /> Bulk Import
                      </Button>
                      <Button variant="gold" onClick={() => setMode("form")}>
                        <Plus className="w-4 h-4 mr-2" /> Add Question
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : mode === 'form' ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-8">
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => setFormData({...formData, type: 'open'})}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 ${formData.type === 'open' ? 'border-accent bg-accent/5' : 'border-white/5 bg-white/[0.02] hover:border-white/20'}`}
                  >
                    <Type className={`w-6 h-6 ${formData.type === 'open' ? 'text-accent' : 'text-white/40'}`} />
                    <span className={`text-sm font-bold ${formData.type === 'open' ? 'text-white' : 'text-white/40'}`}>Open Question</span>
                  </div>
                  <div 
                    onClick={() => setFormData({...formData, type: 'mcq', options: formData.options || ["", ""]})}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 ${formData.type === 'mcq' ? 'border-accent bg-accent/5' : 'border-white/5 bg-white/[0.02] hover:border-white/20'}`}
                  >
                    <ListOrdered className={`w-6 h-6 ${formData.type === 'mcq' ? 'text-accent' : 'text-white/40'}`} />
                    <span className={`text-sm font-bold ${formData.type === 'mcq' ? 'text-white' : 'text-white/40'}`}>Multiple Choice</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-accent/80">Question Description</label>
                  <Textarea 
                    value={formData.questionText}
                    onChange={(e) => setFormData({...formData, questionText: e.target.value})}
                    placeholder="Enter the question text here..."
                    className="min-h-[150px] bg-white/[0.03] border-white/10 rounded-2xl focus:border-accent transition-colors text-base"
                  />
                </div>

                {formData.type === 'mcq' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-widest text-accent/80">Answer Options</label>
                      <Button variant="ghost" size="sm" className="h-8 text-accent hover:bg-accent/10 rounded-lg" onClick={() => setFormData({...formData, options: [...(formData.options || []), ""]})}>
                        <Plus className="w-4 h-4 mr-2" /> Add Option
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {formData.options?.map((opt, i) => (
                        <div key={i} className="flex gap-3 group">
                          <div className="relative flex-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-white/20 group-focus-within:text-accent/50 transition-colors">
                              {String.fromCharCode(65 + i)}
                            </span>
                            <Input 
                              value={opt}
                              onChange={(e) => {
                                const opts = [...(formData.options || [])];
                                opts[i] = e.target.value;
                                setFormData({...formData, options: opts});
                              }}
                              placeholder={`Option ${i + 1}`}
                              className="pl-10 h-12 bg-white/[0.03] border-white/10 rounded-xl focus:border-accent transition-colors"
                            />
                          </div>
                          <Button 
                            variant={formData.correctOptionIndex === i ? 'gold' : 'outline'}
                            onClick={() => setFormData({...formData, correctOptionIndex: i})}
                            className={`px-6 h-12 rounded-xl font-bold text-xs uppercase tracking-wider ${formData.correctOptionIndex === i ? '' : 'border-white/10 bg-transparent hover:bg-white/5'}`}
                          >
                            {formData.correctOptionIndex === i ? 'Correct' : 'Mark'}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-12 w-12 rounded-xl hover:bg-destructive/10 text-white/20 hover:text-destructive"
                            onClick={() => setFormData({...formData, options: formData.options?.filter((_, idx) => idx !== i)})}
                          >
                            <X className="w-5 h-5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-8 pt-4">
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-accent/80">Points Value</label>
                    <div className="relative">
                      <Input 
                        type="number"
                        value={formData.points}
                        onChange={(e) => setFormData({...formData, points: parseInt(e.target.value) || 0})}
                        className="h-12 pl-4 pr-10 bg-white/[0.03] border-white/10 rounded-xl focus:border-accent transition-colors text-lg font-bold"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20">PTS</span>
                    </div>
                  </div>
                </div>

                <div className="pt-10 flex gap-4 border-t border-white/5">
                  <Button variant="outline" className="flex-1 h-14 rounded-2xl border-white/10 hover:bg-white/5 font-bold uppercase tracking-widest" onClick={() => { setMode("list"); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button variant="gold" className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-accent/10" onClick={handleAddOrUpdate}>
                    {editingIndex !== null ? 'Save Changes' : 'Add to Assessment'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="bg-accent/5 p-8 rounded-[2rem] border border-accent/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                    <FileText className="w-32 h-32" />
                  </div>
                  <h4 className="text-lg font-bold text-accent mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Bulk Import Guide
                  </h4>
                  <p className="text-sm text-white/60 leading-relaxed max-wxl">
                    Paste your raw exam text below. Our AI parser will automatically detect questions and options.
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-6">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 text-accent">Valid Format</p>
                      <code className="text-[11px] text-white/70 block space-y-1">
                        1. What is React?<br/>
                        a) Library<br/>
                        b) Framework
                      </code>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 text-accent">Open Format</p>
                      <code className="text-[11px] text-white/70 block space-y-1">
                        1. Explain the DOM.<br/>
                        (Leave options blank)
                      </code>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Textarea 
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder="Paste your exam text here..."
                    className="min-h-[350px] bg-white/[0.02] border-white/10 rounded-[2rem] p-6 font-mono text-sm focus:border-accent transition-all"
                  />
                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1 h-14 rounded-2xl border-white/10 hover:bg-white/5 font-bold uppercase tracking-widest" onClick={() => setMode("list")}>
                      Cancel
                    </Button>
                    <Button variant="gold" className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-accent/10" onClick={handleBulkParse}>
                      Parse & Import Questions
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {mode === 'list' && (
          <div className="p-6 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-white/40 uppercase font-black tracking-widest">Total Assessment</span>
              <span className="text-lg font-bold text-accent">{localQuestions.reduce((acc, q) => acc + q.points, 0)} Points</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="h-12 px-6 rounded-xl border-white/10 hover:bg-white/5">
                Discard
              </Button>
              <Button variant="gold" className="h-12 px-10 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-accent/10" onClick={handleFinalSave}>
                Save & Update Assessment
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
