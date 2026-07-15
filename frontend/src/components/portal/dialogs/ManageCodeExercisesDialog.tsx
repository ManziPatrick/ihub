import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { TextEditor } from "@/components/ui/text-editor";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Code,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  Eye,
  Terminal,
  FileCode,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LANGUAGE_NAMES, LANGUAGE_COLORS, DEFAULT_INITIAL_CODE } from "@shared/languageConfig";
import { useMutation } from "@apollo/client/react";
import { GENERATE_EXERCISE_TESTS } from "@/lib/graphql/mutations";

interface CodeExercise {
  id?: string;
  title: string;
  description?: string;
  language: string;
  initialCode: string;
  solutionCode?: string;
  testCode?: string;
  type: string;
  setupCode?: string;
  expectedOutput?: string;
}

interface ManageCodeExercisesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: CodeExercise[];
  onSave: (exercises: CodeExercise[]) => void;
}

const LANGUAGES = Object.entries(LANGUAGE_NAMES).map(([value, label]) => ({ value, label }));

const EXERCISE_TYPES = [
  { value: "write", label: "Write from Scratch", desc: "Student writes code from an empty editor" },
  { value: "fill-in", label: "Fill in the Blank", desc: "Student fills in missing parts of existing code" },
  { value: "fix", label: "Fix the Code", desc: "Student fixes buggy code to make it work" },
  { value: "test", label: "Test Driven", desc: "Student writes code that passes predefined tests" },
];

const TYPE_BADGES: Record<string, string> = {
  "fill-in": "text-purple-400 bg-purple-400/10 border-purple-400/30",
  write: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  fix: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  test: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
};

export function ManageCodeExercisesDialog({
  open,
  onOpenChange,
  exercises,
  onSave,
}: ManageCodeExercisesDialogProps) {
  const [mode, setMode] = useState<"list" | "form">("list");
  const [localExercises, setLocalExercises] = useState<CodeExercise[]>(exercises || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedPreview, setExpandedPreview] = useState<number | null>(null);
  const [testCodeSectionOpen, setTestCodeSectionOpen] = useState(false);

  const [generateTestsMutation, { loading: generating }] = useMutation<{ generateExerciseTests: { testCode: string; saved: boolean } }>(GENERATE_EXERCISE_TESTS);

  const [formData, setFormData] = useState<CodeExercise>({
    title: "",
    description: "",
    language: "javascript",
    initialCode: DEFAULT_INITIAL_CODE.javascript,
    solutionCode: "",
    testCode: "",
    type: "write",
    setupCode: "",
    expectedOutput: "",
  });

  const handleGenerateTests = async () => {
    if (!formData.title.trim()) {
      toast.error("Please set an exercise title first");
      return;
    }
    if (!formData.initialCode.trim()) {
      toast.error("Please set the starter code first");
      return;
    }

    try {
      const { data } = await generateTestsMutation({
        variables: {
          exerciseId: formData.id || "",
          courseId: "",
          title: formData.title,
          description: formData.description || null,
          language: formData.language,
          initialCode: formData.initialCode,
          setupCode: formData.setupCode || null,
          expectedOutput: formData.expectedOutput || null,
        },
      });

      if (data?.generateExerciseTests?.testCode) {
        setFormData({ ...formData, testCode: data.generateExerciseTests.testCode });
        toast.success("AI-generated test code added!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate tests");
    }
  };

  useEffect(() => {
    if (open) {
      setLocalExercises(exercises || []);
    }
  }, [open, exercises]);

  const resetForm = () => {
    setEditingIndex(null);
    setFormData({
      title: "",
      description: "",
      language: "javascript",
      initialCode: DEFAULT_INITIAL_CODE.javascript,
      solutionCode: "",
      testCode: "",
      type: "write",
      setupCode: "",
      expectedOutput: "",
    });
  };

  const handleAddOrUpdate = () => {
    if (!formData.title.trim()) {
      toast.error("Exercise title is required");
      return;
    }

    const updated = [...localExercises];
    const exercise: CodeExercise = {
      id: editingIndex !== null ? updated[editingIndex].id : `code-ex-${Date.now()}`,
      title: formData.title,
      description: formData.description || "",
      language: formData.language,
      initialCode: formData.initialCode,
      solutionCode: formData.solutionCode || "",
      testCode: formData.testCode || "",
      type: formData.type,
      setupCode: formData.setupCode || "",
      expectedOutput: formData.expectedOutput || "",
    };

    if (editingIndex !== null) {
      updated[editingIndex] = exercise;
      toast.success("Exercise updated");
    } else {
      updated.push(exercise);
      toast.success("Exercise added");
    }

    setLocalExercises(updated);
    resetForm();
    setMode("list");
  };

  const handleDelete = (idx: number) => {
    setLocalExercises(localExercises.filter((_, i) => i !== idx));
    toast.success("Exercise removed");
  };

  const startEdit = (idx: number) => {
    const ex = localExercises[idx];
    setFormData({
      title: ex.title || "",
      description: ex.description || "",
      language: ex.language || "javascript",
      initialCode: ex.initialCode || DEFAULT_INITIAL_CODE[ex.language] || "",
      solutionCode: ex.solutionCode || "",
      testCode: ex.testCode || "",
      type: ex.type || "write",
      setupCode: ex.setupCode || "",
      expectedOutput: ex.expectedOutput || "",
    });
    setEditingIndex(idx);
    setMode("form");
  };

  const handleFinalSave = () => {
    onSave(localExercises);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] sm:max-w-4xl w-full h-[100dvh] sm:h-[90vh] flex flex-col p-0 overflow-hidden bg-background border-accent/20 rounded-none sm:rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border/20 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            {mode !== "list" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-muted/50 rounded-full"
                onClick={() => { setMode("list"); resetForm(); }}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-widest text-foreground/80 flex items-center gap-2">
                {mode === "list" ? (
                  <><Code className="w-5 h-5 text-accent" /> Manage Code Exercises</>
                ) : (
                  <><FileCode className="w-5 h-5 text-accent" /> {editingIndex !== null ? "Edit" : "Add"} Exercise</>
                )}
              </DialogTitle>
              {mode === "list" && (
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mt-0.5">
                  {localExercises.length} exercise{localExercises.length !== 1 ? "s" : ""} in this lesson
                </p>
              )}
            </div>
          </div>

          {mode === "list" && (
            <Button
              variant="gold"
              size="sm"
              onClick={() => { resetForm(); setMode("form"); }}
              className="h-9 text-[10px] font-black uppercase tracking-widest"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Exercise
            </Button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {mode === "list" ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
              <div className="space-y-4 max-w-4xl mx-auto">
                {localExercises.map((ex, idx) => {
                  const testCount = ex.testCode
                    ? (ex.testCode.match(/\bit\s*\(/g) || []).length
                    : 0;
                  const hasTests = testCount > 0;
                  return (
                  <div
                    key={ex.id || idx}
                    className="p-5 rounded-2xl border border-border/40 bg-muted/30 group hover:border-accent/30 hover:bg-muted/50 transition-all shadow-sm"
                  >
                    <div className="flex justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-accent/10 text-accent text-[11px] font-black shadow-gold/10">
                            {idx + 1}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn("text-[9px] font-bold uppercase tracking-widest px-2 py-0.5", LANGUAGE_COLORS[ex.language] || "")}
                          >
                            {ex.language}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn("text-[9px] font-bold uppercase tracking-widest px-2 py-0.5", TYPE_BADGES[ex.type] || "")}
                          >
                            {ex.type === "fill-in" ? "Fill In" : ex.type === "fix" ? "Fix Code" : ex.type === "test" ? "Test" : "Write"}
                          </Badge>
                          {/* Test status badge */}
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5",
                              hasTests
                                ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30"
                                : "text-muted-foreground/40 bg-muted/20 border-border/30"
                            )}
                          >
                            {hasTests ? (
                              <><CheckCircle2 className="w-2.5 h-2.5 mr-1" /> {testCount} Test{testCount !== 1 ? 's' : ''}</>
                            ) : (
                              <><AlertCircle className="w-2.5 h-2.5 mr-1" /> No Tests</>
                            )}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-base leading-snug text-foreground/90 mb-1">
                          {ex.title}
                        </h4>
                        {ex.description && (
                          <p className="text-xs text-muted-foreground/70 line-clamp-2 mb-2" dangerouslySetInnerHTML={{ __html: ex.description }} />
                        )}

                        {/* Expandable preview */}
                        <button
                          onClick={() => setExpandedPreview(expandedPreview === idx ? null : idx)}
                          className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-accent transition-colors"
                        >
                          {expandedPreview === idx ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {expandedPreview === idx ? "Hide Code" : "Preview Code"}
                        </button>
                        {expandedPreview === idx && (
                          <div className="mt-3 space-y-2">
                            {ex.initialCode && (
                              <div>
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Initial Code</p>
                                <pre className="p-3 rounded-xl bg-[#1a1b2e] text-white/80 text-[11px] font-mono overflow-x-auto max-h-32 leading-relaxed">{ex.initialCode}</pre>
                              </div>
                            )}
                            {ex.testCode && (
                              <div>
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Test Code</p>
                                <pre className="p-3 rounded-xl bg-[#1a1b2e] text-green-400/80 text-[11px] font-mono overflow-x-auto max-h-32 leading-relaxed">{ex.testCode}</pre>
                              </div>
                            )}
                            {ex.expectedOutput && (
                              <div>
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Expected Output</p>
                                <pre className="p-3 rounded-xl bg-muted/30 text-foreground/70 text-[11px] font-mono overflow-x-auto border border-border/40 leading-relaxed">{ex.expectedOutput}</pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>                        <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          className="h-9 px-3 rounded-xl hover:bg-indigo-500/10 text-indigo-400/70 hover:text-indigo-400 text-[9px] font-bold uppercase tracking-widest gap-1.5"
                          onClick={() => {
                            const ex = localExercises[idx];
                            setFormData({
                              title: ex.title || "",
                              description: ex.description || "",
                              language: ex.language || "javascript",
                              initialCode: ex.initialCode || DEFAULT_INITIAL_CODE[ex.language] || "",
                              solutionCode: ex.solutionCode || "",
                              testCode: ex.testCode || "",
                              type: ex.type || "write",
                              setupCode: ex.setupCode || "",
                              expectedOutput: ex.expectedOutput || "",
                            });
                            setEditingIndex(idx);
                            setTestCodeSectionOpen(true);
                            setMode("form");
                          }}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Tests
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 rounded-xl hover:bg-muted/50"
                          onClick={() => startEdit(idx)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 rounded-xl hover:bg-destructive/10 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );})}

                {localExercises.length === 0 && (
                  <div className="text-center py-32 border-2 border-dashed border-border/20 rounded-[2.5rem] bg-muted/10">
                    <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Code className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-widest text-foreground/60 mb-2">No Code Exercises</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 max-w-[240px] mx-auto mb-8">
                      Add interactive coding challenges for your students to solve directly in the browser.
                    </p>
                    <Button
                      variant="gold"
                      onClick={() => { resetForm(); setMode("form"); }}
                      className="text-[10px] font-black uppercase tracking-widest h-11 px-6"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Exercise
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-8">
              <div className="max-w-3xl mx-auto space-y-8">
                {/* Language Selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Programming Language</label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            language: lang.value,
                            initialCode: formData.initialCode || DEFAULT_INITIAL_CODE[lang.value],
                          });
                        }}
                        className={cn(
                          "relative px-3 py-2 rounded-xl border cursor-pointer transition-all text-[10px] font-bold uppercase tracking-widest",
                          formData.language === lang.value
                            ? "border-accent bg-accent/10 text-accent shadow-sm shadow-accent/10"
                            : "border-border/20 bg-muted/20 text-muted-foreground/60 hover:border-border/40 hover:text-foreground/60"
                        )}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exercise Type */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Exercise Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {EXERCISE_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setFormData({ ...formData, type: type.value })}
                        className={cn(
                          "p-4 rounded-2xl border-2 cursor-pointer transition-all text-left",
                          formData.type === type.value
                            ? "border-accent bg-accent/5"
                            : "border-border/20 bg-muted/20 hover:border-border/40"
                        )}
                      >
                        <span className={cn("text-sm font-black uppercase tracking-widest block", formData.type === type.value ? "text-foreground" : "text-muted-foreground/60")}>
                          {type.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60 mt-1 block leading-tight">{type.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Exercise Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Hello World Function, Reverse a String"
                    className="h-12 bg-muted/20 border-border/40 rounded-xl focus:border-accent transition-colors text-base"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Description / Instructions</label>
                  <TextEditor
                    value={formData.description || ""}
                    onChange={(val) => setFormData({ ...formData, description: val })}
                    placeholder="Describe what the student needs to do..."
                  />
                </div>

                {/* Initial Code */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-accent" /> Starter Code
                  </label>
                  <Textarea
                    value={formData.initialCode}
                    onChange={(e) => setFormData({ ...formData, initialCode: e.target.value })}
                    placeholder="// Code that appears in the editor when the student opens the exercise"
                    className="min-h-[150px] bg-[#1a1b2e] text-white/80 font-mono text-sm border-border/40 rounded-xl focus:border-accent transition-colors resize-y leading-relaxed"
                  />
                </div>

                {/* Solution Code (collapsible) */}
                <details className="rounded-xl border border-border/40 overflow-hidden group">
                  <summary className="px-4 py-3 bg-muted/20 cursor-pointer text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5" /> Solution Code (Optional)
                  </summary>
                  <div className="border-t border-border/40 p-4">
                    <Textarea
                      value={formData.solutionCode || ""}
                      onChange={(e) => setFormData({ ...formData, solutionCode: e.target.value })}
                      placeholder="Reference solution for instructors"
                      className="min-h-[120px] bg-[#1a1b2e] text-green-400/80 font-mono text-sm border-border/40 rounded-xl focus:border-accent transition-colors resize-y leading-relaxed"
                    />
                  </div>
                </details>

                {/* Test Code (collapsible) */}
                <details className="rounded-xl border border-border/40 overflow-hidden group" open={testCodeSectionOpen}>
                  <summary
                    className="px-4 py-3 bg-muted/20 cursor-pointer text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors flex items-center gap-2"
                    onClick={(e) => {
                      e.preventDefault();
                      setTestCodeSectionOpen(v => !v);
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" /> Test Code (Optional - uses describe/it/assert)
                  </summary>
                  <div className="border-t border-border/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-muted-foreground/40 font-mono">
                        describe / it / assert.equals
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateTests}
                        disabled={generating}
                        className="h-8 text-[9px] font-black uppercase tracking-widest border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 hover:border-indigo-500/50 gap-1.5 rounded-lg transition-all"
                      >
                        {generating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        {generating ? "Generating..." : "Generate with AI"}
                      </Button>
                    </div>
                    <Textarea
                      value={formData.testCode || ""}
                      onChange={(e) => setFormData({ ...formData, testCode: e.target.value })}
                      placeholder={`describe("My Function", () => {\n  it("should return the correct result", () => {\n    assert.equals(myFunction(1), 2);\n  });\n});`}
                      className="min-h-[150px] bg-[#1a1b2e] text-emerald-400/80 font-mono text-sm border-border/40 rounded-xl focus:border-accent transition-colors resize-y leading-relaxed"
                    />
                  </div>
                </details>

                {/* Setup Code (collapsible) */}
                <details className="rounded-xl border border-border/40 overflow-hidden group">
                  <summary className="px-4 py-3 bg-muted/20 cursor-pointer text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5" /> Setup Code (Optional - runs before student code)
                  </summary>
                  <div className="border-t border-border/40 p-4">
                    <Textarea
                      value={formData.setupCode || ""}
                      onChange={(e) => setFormData({ ...formData, setupCode: e.target.value })}
                      placeholder="// Code that runs before the student's code (e.g., helper functions, test data)"
                      className="min-h-[100px] bg-[#1a1b2e] text-yellow-400/80 font-mono text-sm border-border/40 rounded-xl focus:border-accent transition-colors resize-y leading-relaxed"
                    />
                  </div>
                </details>

                {/* Expected Output (collapsible) */}
                <details className="rounded-xl border border-border/40 overflow-hidden group">
                  <summary className="px-4 py-3 bg-muted/20 cursor-pointer text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Expected Output (Optional - alternative to tests)
                  </summary>
                  <div className="border-t border-border/40 p-4">
                    <Textarea
                      value={formData.expectedOutput || ""}
                      onChange={(e) => setFormData({ ...formData, expectedOutput: e.target.value })}
                      placeholder="The exact output the student's code should produce. Used to check correctness without tests."
                      className="min-h-[80px] bg-muted/20 border-border/40 rounded-xl focus:border-accent transition-colors resize-y font-mono text-sm"
                    />
                  </div>
                </details>

                {/* Action Buttons */}
                <div className="pt-8 flex gap-4 border-t border-border/20">
                  <Button
                    variant="outline"
                    className="flex-1 h-14 rounded-2xl border-border/40 hover:bg-muted/50 font-black uppercase tracking-widest text-[10px]"
                    onClick={() => { setMode("list"); resetForm(); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="gold"
                    className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-gold/20"
                    onClick={handleAddOrUpdate}
                  >
                    {editingIndex !== null ? "Save Changes" : "Add to Lesson"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {mode === "list" && (
          <div className="p-6 border-t border-border/20 bg-muted/30 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground/40 uppercase font-black tracking-widest">Total Exercises</span>
              <span className="text-lg font-black text-accent uppercase tracking-widest">{localExercises.length} Exercise{localExercises.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="h-12 px-6 rounded-xl border-border/40 hover:bg-muted/50 text-[10px] font-black uppercase tracking-widest">
                Discard
              </Button>
              <Button variant="gold" className="h-12 px-10 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-gold/20 text-[10px]" onClick={handleFinalSave}>
                Save & Update Lesson
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
