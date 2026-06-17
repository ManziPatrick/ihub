import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation } from "@apollo/client/react";
import { RUN_CODE } from "@/lib/graphql/mutations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Loader2,
  Code,
  AlertTriangle,
  Lightbulb,
  Copy,
  Terminal,
  Bug,
} from "lucide-react";

interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
}

interface CodeExerciseData {
  id?: string;
  title: string;
  description?: string;
  language: string;
  initialCode: string;
  solutionCode?: string;
  testCode?: string;
  type: "fill-in" | "write" | "fix" | "test";
  setupCode?: string;
  expectedOutput?: string;
}

interface CodeExerciseProps {
  exercise: CodeExerciseData;
  onComplete?: () => void;
  compact?: boolean;
}

const LANGUAGE_NAMES: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  html: "HTML/CSS",
  css: "CSS",
};

const LANGUAGE_COLORS: Record<string, string> = {
  javascript: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  typescript: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  python: "text-green-400 bg-green-400/10 border-green-400/30",
  html: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  css: "text-sky-400 bg-sky-400/10 border-sky-400/30",
};

// CodeMirror-based editor with syntax highlighting
function SimpleCodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
}: {
  value: string;
  onChange: (val: string) => void;
  language: string;
  readOnly?: boolean;
}) {
  const extensions = useMemo(() => {
    const ext: any[] = [];

    // Language-specific syntax highlighting
    switch (language) {
      case "javascript":
      case "typescript":
        ext.push(javascript({ jsx: true, typescript: language === "typescript" }));
        break;
      case "python":
        ext.push(python());
        break;
      case "html":
        ext.push(html());
        break;
      case "css":
        ext.push(css());
        break;
      default:
        ext.push(javascript());
    }

    // Read-only mode
    if (readOnly) {
      ext.push(EditorView.editable.of(false));
    }

    return ext;
  }, [language, readOnly]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-border/50">
      {/* Language indicator bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#12132a] border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className={`ml-3 text-[10px] font-bold uppercase tracking-widest ${LANGUAGE_COLORS[language]?.split(" ")[0] || "text-blue-400"}`}>
            {LANGUAGE_NAMES[language] || language}
          </span>
        </div>
        {!readOnly && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(value);
              toast.success("Code copied to clipboard");
            }}
            className="text-white/30 hover:text-white/60 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* CodeMirror Editor */}
      <CodeMirror
        value={value}
        onChange={(val) => onChange(val)}
        extensions={extensions}
        theme={oneDark}
        height="auto"
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false,
          rectangularSelection: true,
          crosshairCursor: false,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: false,
          searchKeymap: false,
          foldKeymap: false,
          completionKeymap: false,
          lintKeymap: false,
        }}
        editable={!readOnly}
        className="text-[13px]"
      />
    </div>
  );
}

// HTML Preview iframe
function HtmlPreview({ html }: { html: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-border/50 bg-white mt-3">
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border-b border-gray-200">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
        <span className="ml-2 text-[10px] font-bold uppercase text-gray-500 tracking-widest">Preview</span>
      </div>
      <iframe
        srcDoc={html}
        title="HTML Preview"
        className="w-full h-64 border-0"
        sandbox="allow-scripts"
      />
    </div>
  );
}

export function CodeExercise({ exercise, onComplete, compact = false }: CodeExerciseProps) {
  const [code, setCode] = useState(exercise.initialCode || "");
  const [output, setOutput] = useState<string>("");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [passed, setPassed] = useState(false);
  const [running, setRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [outputTab, setOutputTab] = useState<"output" | "tests">("output");

  const [runCode] = useMutation(RUN_CODE);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setError(null);
    setShowOutput(true);
    setOutputTab("output");

    try {
      const { data } = await runCode({
        variables: {
          code,
          language: exercise.language,
          testCode: exercise.testCode || null,
          exerciseType: exercise.type,
          setupCode: exercise.setupCode || null,
        },
      });

      const result = data?.runCode;
      if (result) {
        setOutput(result.output || "");
        setTestResults(result.testResults || []);
        setError(result.error || null);
        setPassed(result.passed);
        setAttempts((prev) => prev + 1);
      }
    } catch (err: any) {
      setError(err.message || "Failed to execute code");
      setPassed(false);
    } finally {
      setRunning(false);
    }
  }, [code, exercise.language, exercise.testCode, exercise.type, exercise.setupCode, runCode]);

  // Check if expected output matches
  const matchesExpectedOutput = exercise.expectedOutput && output.trim() === exercise.expectedOutput.trim();

  // All tests must pass or output must match for completion
  const isComplete = passed && (testResults.length === 0 || testResults.every((t) => t.passed)) || matchesExpectedOutput;

  // HTML-specific: render preview
  const isHtml = exercise.language === "html";

  const handleReset = () => {
    setCode(exercise.initialCode || "");
    setOutput("");
    setTestResults([]);
    setError(null);
    setPassed(false);
    setShowOutput(false);
    setAttempts(0);
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter to run
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !running) {
        handleRun();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRun, running]);

  const allPassed = testResults.length > 0 && testResults.every((t) => t.passed);

  return (
    <Card className={`border-border/50 overflow-hidden ${compact ? "" : "shadow-xl"}`}>
      <CardContent className="p-0">
        {/* Exercise Header */}
        <div className="p-4 sm:p-6 border-b border-border/50 bg-muted/5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge
                  variant="outline"
                  className={`text-[9px] uppercase font-bold px-2 py-0.5 ${LANGUAGE_COLORS[exercise.language] || "text-blue-400 bg-blue-400/10 border-blue-400/30"}`}
                >
                  <Code className="w-3 h-3 mr-1" />
                  {LANGUAGE_NAMES[exercise.language] || exercise.language}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[9px] uppercase font-bold text-purple-400 bg-purple-400/10 border-purple-400/30"
                >
                  {exercise.type === "fill-in"
                    ? "Fill in the Blank"
                    : exercise.type === "fix"
                      ? "Fix the Code"
                      : exercise.type === "test"
                        ? "Test Driven"
                        : "Write from Scratch"}
                </Badge>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                {exercise.title || "Code Exercise"}
              </h3>
              {exercise.description && (
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: exercise.description }} />
              )}
            </div>

            {/* Status badge */}
            {allPassed && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="shrink-0"
              >
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Passed
                </Badge>
              </motion.div>
            )}
          </div>
        </div>

        {/* Code Editor */}
        <div className="p-4 sm:p-6 space-y-4">
          <SimpleCodeEditor
            value={code}
            onChange={setCode}
            language={exercise.language}
            readOnly={false}
          />

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                onClick={handleRun}
                disabled={running || !code.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl gap-2 h-10 px-5 text-sm shadow-lg shadow-indigo-500/20"
              >
                {running ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                {running ? "Running..." : "Run Code"}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                size="icon"
                className="h-10 w-10 rounded-xl border-border/50"
                title="Reset code"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[9px] font-mono border border-border/50">
                {navigator.platform?.includes("Mac") ? "⌘" : "Ctrl"}
              </kbd>
              <span>+ Enter to run</span>
            </div>
          </div>

          {/* Output Section with Tabs */}
          <AnimatePresence>
            {showOutput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {/* Tab bar */}
                <div className="flex items-center gap-1 border-b border-border/30 pb-2">
                  <button
                    onClick={() => setOutputTab("output")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      outputTab === "output"
                        ? "bg-accent/10 text-accent"
                        : "text-muted-foreground/50 hover:text-muted-foreground"
                    }`}
                  >
                    <Terminal className="w-3 h-3" />
                    Output
                    {output && <span className="w-1.5 h-1.5 rounded-full bg-green-400/60" />}
                  </button>
                  {(testResults.length > 0 || error) && (
                    <button
                      onClick={() => setOutputTab("tests")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                        outputTab === "tests"
                          ? "bg-accent/10 text-accent"
                          : "text-muted-foreground/50 hover:text-muted-foreground"
                      }`}
                    >
                      <Bug className="w-3 h-3" />
                      {error ? "Error" : "Tests"}
                      {error ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400/60" />
                      ) : testResults.filter(t => !t.passed).length > 0 ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400/60" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400/60" />
                      )}
                    </button>
                  )}
                </div>

                {/* Output Tab Content */}
                {outputTab === "output" && (
                  <div className="space-y-3">
                    {/* Program Output */}
                    {output && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
                          Program Output
                        </p>
                        <div className="p-4 rounded-xl font-mono text-sm leading-relaxed bg-[#0d0f1a] border border-white/5 text-green-400">
                          <pre className="whitespace-pre-wrap break-all">{output || "(no output)"}</pre>
                        </div>
                      </div>
                    )}

                    {/* Expected output comparison */}
                    {exercise.expectedOutput && !error && output && (
                      <div
                        className={`p-3 rounded-xl border text-sm ${
                          matchesExpectedOutput
                            ? "bg-green-500/5 border-green-500/20 text-green-400"
                            : "bg-amber-500/5 border-amber-500/20 text-amber-400"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold mb-1">
                          {matchesExpectedOutput ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <AlertTriangle className="w-4 h-4" />
                          )}
                          {matchesExpectedOutput
                            ? "Output matches expected result!"
                            : "Output does not match expected result"}
                        </div>
                        {!matchesExpectedOutput && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Expected:{" "}
                            <span className="text-green-400 font-mono">
                              {exercise.expectedOutput}
                            </span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* HTML Preview */}
                    {isHtml && !error && output && (
                      <HtmlPreview html={output} />
                    )}
                  </div>
                )}

                {/* Tests / Error Tab Content */}
                {outputTab === "tests" && (
                  <div className="space-y-3">
                    {/* Error (shown first and prominent) */}
                    {error && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-400/60 mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3" />
                          Error Output
                        </p>
                        <div className="p-4 rounded-xl font-mono text-sm leading-relaxed bg-red-500/5 border border-red-500/20 text-red-400">
                          <pre className="whitespace-pre-wrap break-all">{error}</pre>
                        </div>
                        {/* Hint */}
                        <div className="mt-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-400/80">
                            Check your code for syntax errors or logic issues. Make sure
                            all variables are defined and functions are called correctly.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Test Results */}
                    {testResults.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                          Test Results
                        </p>
                        {testResults.map((test, i) => (
                          <div
                            key={i}
                            className={`flex items-start gap-3 p-3 rounded-xl border ${
                              test.passed
                                ? "bg-green-500/5 border-green-500/20"
                                : "bg-red-500/5 border-red-500/20"
                            }`}
                          >
                            {test.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold ${test.passed ? "text-green-400" : "text-red-400"}`}>
                                {test.name}
                              </p>
                              {!test.passed && (
                                <div className="mt-1 space-y-0.5 text-xs font-mono">
                                  {test.expected && (
                                    <p className="text-muted-foreground">
                                      Expected: <span className="text-green-400">{test.expected}</span>
                                    </p>
                                  )}
                                  {test.actual && (
                                    <p className="text-muted-foreground">
                                      Actual: <span className="text-red-400">{test.actual}</span>
                                    </p>
                                  )}
                                  {test.error && (
                                    <p className="text-red-400/80 mt-1 text-[11px]">{test.error}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* No tests and no error case */}
                    {testResults.length === 0 && !error && (
                      <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 text-sm text-accent/70 text-center">
                        No test results to display. Check the Output tab for program output.
                      </div>
                    )}
                  </div>
                )}

                {/* Success Message (shown regardless of tab) */}
                {(allPassed || matchesExpectedOutput) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-green-400">
                          All tests passed!
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {attempts > 1
                            ? `Solved in ${attempts} attempts`
                            : "Solved on first try! 🎉"}
                        </p>
                      </div>
                    </div>
                    {onComplete && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={onComplete}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs h-9 px-5 shadow-lg shadow-green-500/20"
                      >
                        Continue
                      </Button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer with stats */}
        {attempts > 0 && (
          <div className="px-4 sm:px-6 py-3 border-t border-border/30 bg-muted/5">
            <div className="flex items-center gap-4 text-[10px] font-medium text-muted-foreground">
              <span>
                Attempts: <strong className="text-foreground">{attempts}</strong>
              </span>
              {!allPassed && testResults.length > 0 && (
                <span>
                  Passing:{" "}
                  <strong className="text-green-400">
                    {testResults.filter((t) => t.passed).length}
                  </strong>
                  /{testResults.length}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
