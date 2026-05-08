import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Pencil, 
  Save, 
  X, 
  Type,
  FileText,
  ListOrdered
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [activeTab, setActiveTab] = useState("list");
  const [localQuestions, setLocalQuestions] = useState<AssignmentQuestion[]>(initialQuestions || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [bulkText, setBulkText] = useState("");

  // Sync local state when initialQuestions prop changes
  useEffect(() => {
    setLocalQuestions(initialQuestions || []);
  }, [initialQuestions]);

  const [formData, setFormData] = useState<AssignmentQuestion>({
    questionText: "",
    type: "open",
    options: ["", ""],
    correctOptionIndex: 0,
    points: 10
  });

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
    setEditingIndex(null);
    setFormData({
      questionText: "",
      type: "open",
      options: ["", ""],
      correctOptionIndex: 0,
      points: 10
    });
    setActiveTab("list");
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
      setActiveTab("list");
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
      <DialogContent className="max-w-[100vw] sm:max-w-4xl w-full h-[100dvh] sm:h-[85vh] flex flex-col p-0 overflow-hidden bg-background rounded-none sm:rounded-2xl">
        <DialogHeader className="px-6 py-4 border-b border-white/5">
          <DialogTitle className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-accent" />
            Manage Assignment Questions
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-6 border-b border-border/50">
            <TabsList className="bg-transparent space-x-2">
              <TabsTrigger value="list" className="data-[state=active]:text-accent">Questions List</TabsTrigger>
              <TabsTrigger value="add" className="data-[state=active]:text-accent">{editingIndex !== null ? 'Edit Question' : 'Add Question'}</TabsTrigger>
              <TabsTrigger value="bulk" className="data-[state=active]:text-accent">Bulk Import</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="px-6 py-4 space-y-3">
                {localQuestions.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-border/50 bg-card group hover:border-accent/30 transition-all">
                    <div className="flex justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-accent uppercase tracking-widest">Q{idx + 1}</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{q.type}</span>
                          <span className="text-[10px] font-bold text-muted-foreground ml-auto">{q.points} pts</span>
                        </div>
                        <h4 className="font-medium text-sm leading-relaxed">{q.questionText}</h4>
                        {q.type === 'mcq' && q.options && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {q.options.map((opt, i) => (
                              <div key={i} className={`text-[10px] p-2 rounded border ${i === q.correctOptionIndex ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-muted/30 border-transparent'}`}>
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                          setFormData(q);
                          setEditingIndex(idx);
                          setActiveTab("add");
                        }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => {
                          setLocalQuestions(localQuestions.filter((_, i) => i !== idx));
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {localQuestions.length === 0 && (
                  <div className="text-center py-20 border-2 border-dashed rounded-3xl opacity-50">
                    <AlertCircle className="w-10 h-10 mx-auto mb-4" />
                    <p className="text-sm font-medium">No questions added yet.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="add" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full px-6 py-6">
              <div className="space-y-4 max-w-2xl mx-auto pb-8">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant={formData.type === 'open' ? 'default' : 'outline'}
                  onClick={() => setFormData({...formData, type: 'open'})}
                  className="h-12"
                >
                  <Type className="w-4 h-4 mr-2" /> Open Question
                </Button>
                <Button 
                  variant={formData.type === 'mcq' ? 'default' : 'outline'}
                  onClick={() => setFormData({...formData, type: 'mcq', options: formData.options || ["", ""]})}
                  className="h-12"
                >
                  <ListOrdered className="w-4 h-4 mr-2" /> Multiple Choice
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Question Text</label>
                <Textarea 
                  value={formData.questionText}
                  onChange={(e) => setFormData({...formData, questionText: e.target.value})}
                  placeholder="e.g. Solve for x: 2x + 5 = 15"
                  className="min-h-[120px]"
                />
              </div>

              {formData.type === 'mcq' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Options</label>
                    <Button variant="ghost" size="sm" className="h-7 text-accent" onClick={() => setFormData({...formData, options: [...(formData.options || []), ""]})}>
                      <Plus className="w-3 h-3 mr-1" /> Add Option
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.options?.map((opt, i) => (
                      <div key={i} className="flex gap-2">
                        <Input 
                          value={opt}
                          onChange={(e) => {
                            const opts = [...(formData.options || [])];
                            opts[i] = e.target.value;
                            setFormData({...formData, options: opts});
                          }}
                          placeholder={`Option ${i + 1}`}
                          className="flex-1"
                        />
                        <Button 
                          variant={formData.correctOptionIndex === i ? 'default' : 'outline'}
                          onClick={() => setFormData({...formData, correctOptionIndex: i})}
                          className="w-20"
                        >
                          {formData.correctOptionIndex === i ? 'Correct' : 'Mark'}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setFormData({...formData, options: formData.options?.filter((_, idx) => idx !== i)})}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Points</label>
                <Input 
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({...formData, points: parseInt(e.target.value) || 0})}
                  className="w-32"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button className="flex-1 h-12 font-black uppercase tracking-widest" onClick={handleAddOrUpdate}>
                  {editingIndex !== null ? 'Update Question' : 'Add to List'}
                </Button>
                {editingIndex !== null && (
                  <Button variant="outline" className="h-12 px-6" onClick={() => {
                    setEditingIndex(null);
                    setFormData({ questionText: "", type: "open", options: ["", ""], correctOptionIndex: 0, points: 10 });
                    setActiveTab("list");
                  }}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="bulk" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6 max-w-2xl mx-auto">
                <div className="bg-accent/5 p-4 rounded-xl border border-accent/20">
                  <h4 className="text-sm font-bold text-accent mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Bulk Import Guide
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Paste your exam questions here. The parser will detect numbering like "1. ", "2) " and options like "a) ", "b. ".
                    <br /><br />
                    Example format:<br />
                    1. What is 2+2?<br />
                    a) 3<br />
                    b) 4<br />
                    2. Explain photosynthesis in your own words.
                  </p>
                </div>
                <Textarea 
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Paste your exam text here..."
                  className="min-h-[300px] font-mono text-xs bg-white/5 border-white/10"
                />
                <Button variant="gold" className="w-full h-12 font-black uppercase tracking-widest" onClick={handleBulkParse}>
                  Parse & Import Questions
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="p-6 border-t border-white/5 bg-white/2 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Discard Changes</Button>
          <Button variant="gold" className="px-10 font-black uppercase tracking-widest" onClick={handleFinalSave}>
            Save All Questions ({localQuestions.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
