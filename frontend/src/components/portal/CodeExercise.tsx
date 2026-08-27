import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useMutation } from "@apollo/client/react";
import { RUN_CODE, SAVE_CODE_EXERCISE_ANSWER } from "@/lib/graphql/mutations";
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
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { php } from "@codemirror/lang-php";
import { rust } from "@codemirror/lang-rust";
import { sql } from "@codemirror/lang-sql";
import { xml } from "@codemirror/lang-xml";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { lintGutter, linter } from "@codemirror/lint";
import { syntaxTree } from "@codemirror/language";
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Loader2,
  Code,
  AlertTriangle,
  Lightbulb,
  Terminal,
  ListChecks,
  Eye,
} from "lucide-react";
import { LANGUAGE_NAMES, LANGUAGE_COLORS } from "@shared/languageConfig";

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
  onComplete?: (code: string) => void;
  compact?: boolean;
  courseId?: string;
  lessonId?: string;
  savedCode?: string;
}

// ─── CodeMirror Editor ─────────────────────────────────────────────
function SimpleCodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  onSyntaxErrors,
}: {
  value: string;
  onChange: (val: string) => void;
  language: string;
  readOnly?: boolean;
  onSyntaxErrors?: (count: number) => void;
}) {
  const lastErrorCount = useRef(0);

  const extensions = useMemo(() => {
    const ext: any[] = [];

    const syntaxLinter = linter((view) => {
      const diagnostics: { from: number; to: number; severity: "error" | "warning"; message: string }[] = [];
      syntaxTree(view.state).iterate({
        enter: (node) => {
          if (node.type.isError) {
            const from = node.from;
            const to = node.to;
            if (from === to) {
              const line = view.state.doc.lineAt(from);
              diagnostics.push({
                from,
                to,
                severity: "error",
                message: `Syntax error at line ${line.number}`,
              });
            } else {
              const text = view.state.sliceDoc(from, to);
              diagnostics.push({
                from,
                to,
                severity: "error",
                message: text
                  ? `Unexpected token '${text.length > 30 ? text.slice(0, 30) + "..." : text}'`
                  : "Syntax error",
              });
            }
          }
        },
      });

      if (onSyntaxErrors && diagnostics.length !== lastErrorCount.current) {
        lastErrorCount.current = diagnostics.length;
        onSyntaxErrors(diagnostics.length);
      }

      return diagnostics;
    });

    ext.push(lintGutter());
    ext.push(syntaxLinter);

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
      case "c":
      case "cpp":
        ext.push(cpp());
        break;
      case "java":
        ext.push(java());
        break;
      case "php":
        ext.push(php());
        break;
      case "rust":
        ext.push(rust());
        break;
      case "sql":
        ext.push(sql());
        break;
      case "json":
        ext.push(json());
        break;
      case "xml":
        ext.push(xml());
        break;
      case "markdown":
        ext.push(markdown());
        break;
      default:
        ext.push(javascript());
    }

    if (readOnly) {
      ext.push(EditorView.editable.of(false));
    }

    if (!readOnly) {
      ext.push(EditorView.domEventHandlers({
        paste: (event: ClipboardEvent) => {
          event.preventDefault();
          toast.error("Pasting is not allowed. Please type your code manually.");
          return true;
        },
      }));
    }

    return ext;
  }, [language, readOnly, onSyntaxErrors]);

  return (
    <CodeMirror
      value={value}
      onChange={(val) => onChange(val)}
      extensions={extensions}
      theme={oneDark}
      height="100%"
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
      className="text-[13px] h-full"
    />
  );
}

// ─── Live Preview Iframe (HTML / CSS) ──────────────────────────────
function LiveHtmlPreview({ code, language }: { code: string; language: string }) {
  const srcDoc = useMemo(() => {
    if (language === "css") {
      return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 16px; margin: 0; background: #fff; color: #333; }
  ${code}
</style>
</head><body>
  <h1>Heading 1</h1>
  <h2>Heading 2</h2>
  <p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
  <a href="#">This is a link</a>
  <ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>
  <ol><li>First</li><li>Second</li><li>Third</li></ol>
  <button>Button</button>
  <input type="text" placeholder="Text input" style="margin-left:8px">
  <div class="card">Card Content</div>
  <table><thead><tr><th>Name</th><th>Value</th></tr></thead>
    <tbody><tr><td>Row 1</td><td>Data 1</td></tr>
    <tr><td>Row 2</td><td>Data 2</td></tr></tbody></table>
  <div class="container"><p>Nested container content</p></div>
</body></html>`;
    }
    // HTML — pass through directly
    return code;
  }, [code, language]);

  return (
    <iframe
      srcDoc={srcDoc}
      title="Live Preview"
      className="w-full h-full border-0 bg-white"
      sandbox="allow-scripts"
    />
  );
}

// ─── Live JavaScript Console Preview ───────────────────────────────
function LiveJsPreview({ code }: { code: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!iframeRef.current) return;

      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: 'SF Mono', 'Fira Code', monospace; background: #0d0f1a; color: #e2e8f0; padding: 12px; margin: 0; font-size: 13px; line-height: 1.6; }
  .log { padding: 2px 0; border-bottom: 1px solid rgba(255,255,255,0.05); white-space: pre-wrap; word-break: break-all; }
  .log-info { color: #94a3b8; }
  .log-warn { color: #fbbf24; background: rgba(251,191,36,0.05); padding: 2px 6px; border-radius: 3px; }
  .log-error { color: #f87171; background: rgba(248,113,113,0.05); padding: 2px 6px; border-radius: 3px; }
  .log-result { color: #34d399; font-weight: bold; }
  .separator { border-top: 1px solid rgba(255,255,255,0.1); margin: 8px 0; }
</style></head><body>
<script>
  const _logs = [];
  const _origConsole = {};
  ['log','warn','error','info'].forEach(m => {
    _origConsole[m] = console[m];
    console[m] = (...args) => {
      _origConsole[m](...args);
      _logs.push({ type: m, text: args.map(a => {
        if (a === undefined) return 'undefined';
        if (a === null) return 'null';
        if (typeof a === 'object') { try { return JSON.stringify(a, null, 2); } catch(e) { return String(a); } }
        return String(a);
      }).join(' ') });
      window.parent.postMessage({ type: 'console', logs: _logs }, '*');
    };
  });
  window.onerror = (msg, src, line, col, err) => {
    _logs.push({ type: 'error', text: msg + (line ? ' (line ' + line + ')' : '') });
    window.parent.postMessage({ type: 'console', logs: _logs }, '*');
  };
  window.addEventListener('unhandledrejection', (e) => {
    _logs.push({ type: 'error', text: 'Unhandled Promise Rejection: ' + (e.reason?.message || e.reason || 'Unknown') });
    window.parent.postMessage({ type: 'console', logs: _logs }, '*');
  });
  try {
    ${code}
  } catch(e) {
    _logs.push({ type: 'error', text: e.message });
    window.parent.postMessage({ type: 'console', logs: _logs }, '*');
  }
</script>
</body></html>`;

      iframeRef.current.srcdoc = html;
    }, 300);

    return () => clearTimeout(timer);
  }, [code]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "console") {
        const allLogs = e.data.logs || [];
        setLogs(allLogs.filter((l: any) => l.type !== "error").map((l: any) => l.text));
        setErrors(allLogs.filter((l: any) => l.type === "error").map((l: any) => l.text));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#0d0f1a]">
      {/* Hidden iframe to execute the JS */}
      <iframe ref={iframeRef} className="hidden" title="JS Executor" sandbox="allow-scripts" />
      {/* Console output */}
      <div className="flex-1 overflow-auto p-3 font-mono text-[12px]">
        {logs.length === 0 && errors.length === 0 && (
          <div className="text-white/30 italic text-[11px]">Console output will appear here...</div>
        )}
        {logs.map((log, i) => (
          <div key={`log-${i}`} className="text-green-400 py-0.5 border-b border-white/5 whitespace-pre-wrap break-all">
            <span className="text-white/20 mr-2 select-none">&gt;</span>
            {log}
          </div>
        ))}
        {errors.map((err, i) => (
          <div key={`err-${i}`} className="text-red-400 bg-red-500/5 px-1 py-0.5 rounded my-0.5 whitespace-pre-wrap break-all">
            <span className="text-red-500 mr-1">✕</span>
            {err}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Resizable Split Pane ──────────────────────────────────────────
function ResizableSplit({
  left,
  right,
  defaultRatio = 0.5,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultRatio?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(defaultRatio);
  const [isDragging, setIsDragging] = useState(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newRatio = Math.min(Math.max(x / rect.width, 0.2), 0.8);
      setRatio(newRatio);
    };

    const onMouseUp = () => setIsDragging(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className="relative flex h-[500px] lg:h-[600px] rounded-xl overflow-hidden border border-white/10"
      style={{ userSelect: isDragging ? "none" : undefined }}
    >
      {/* Left panel (editor) */}
      <div className="overflow-hidden bg-[#1e1e2e]" style={{ width: `${ratio * 100}%` }}>
        {left}
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        className={`relative z-10 w-[5px] cursor-col-resize flex-shrink-0
          ${isDragging ? "bg-indigo-500" : "bg-white/10 hover:bg-indigo-400/60"}
          transition-colors`}
      >
        {/* Grip dots */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-[3px]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-[3px] h-[3px] rounded-full bg-white/30" />
          ))}
        </div>
      </div>

      {/* Right panel (preview) */}
      <div className="overflow-hidden bg-[#0d0f1a]" style={{ width: `${(1 - ratio) * 100}%` }}>
        {right}
      </div>
    </div>
  );
}

interface RunCodeResponse {
  runCode: {
    output: string;
    passed: boolean;
    testResults: Array<{ name: string; passed: boolean; expected: string; actual: string; error?: string }>;
    error?: string;
    generatedTestCode?: string;
  };
}

// ═══════════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ───────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
export function CodeExercise({ exercise, onComplete, compact = false, courseId, lessonId, savedCode }: CodeExerciseProps) {
  const [code, setCode] = useState(savedCode || exercise.initialCode || "");
  const [output, setOutput] = useState<string>("");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [passed, setPassed] = useState(false);
  const [running, setRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [saving, setSaving] = useState(false);
  const [syntaxErrorCount, setSyntaxErrorCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"output" | "tests">("output");
  const [previewTab, setPreviewTab] = useState<"preview" | "console">("preview");

  const [runCodeMutation] = useMutation<RunCodeResponse>(RUN_CODE);
  const [saveCodeAnswerMutation] = useMutation(SAVE_CODE_EXERCISE_ANSWER);

  const codeRef = useRef(code);
  useEffect(() => { codeRef.current = code; }, [code]);

  const [localTestCode, setLocalTestCode] = useState<string | null>(exercise.testCode || null);

  // ── Auto-save code to backend (debounced) ──
  const lastSavedCodeRef = useRef(savedCode || exercise.initialCode || "");
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync savedCode from backend into editor when it loads (after mount)
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!initialized && savedCode) {
      setCode(savedCode);
      lastSavedCodeRef.current = savedCode;
      setInitialized(true);
    } else if (!initialized) {
      setInitialized(true);
    }
  }, [savedCode, initialized]);

  useEffect(() => {
    if (!courseId || !lessonId || !exercise.id) return;
    if (code === lastSavedCodeRef.current) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      if (code !== lastSavedCodeRef.current) {
        lastSavedCodeRef.current = code;
        saveCodeAnswerMutation({
          variables: { courseId, lessonId, exerciseId: exercise.id, code },
        }).catch((err: any) => console.warn("Auto-save failed:", err?.message));
      }
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [code, courseId, lessonId, exercise.id, saveCodeAnswerMutation]);

  // ── Language detection ──
  const isHtml = exercise.language === "html";
  const isCss = exercise.language === "css";
  const isJs = exercise.language === "javascript" || exercise.language === "typescript";
  const isPreviewLanguage = isHtml || isCss || isJs;

  // ── Run code (for grading/tests) ──
  const handleRun = useCallback(async () => {
    setRunning(true);
    setError(null);
    setShowOutput(true);

    try {
      const freshCode = codeRef.current;
      const { data } = await runCodeMutation({
        variables: {
          code: freshCode,
          language: exercise.language,
          testCode: localTestCode,
          exerciseType: exercise.type,
          setupCode: exercise.setupCode || null,
          exerciseTitle: exercise.title || null,
          exerciseDescription: exercise.description || null,
          expectedOutput: exercise.expectedOutput || null,
          exerciseId: exercise.id || null,
          courseId: courseId || null,
        },
      });

      const result = data?.runCode;
      if (result) {
        const normalizedTestResults = Array.isArray(result.testResults) ? result.testResults : [];
        setOutput(result.output || "");
        setTestResults(normalizedTestResults);
        setError(result.error || null);
        setPassed(result.passed);
        setAttempts((prev) => prev + 1);
        if (result.generatedTestCode) setLocalTestCode(result.generatedTestCode);
      }
    } catch (err: any) {
      setError(err.message || "Failed to execute code");
      setPassed(false);
    } finally {
      setRunning(false);
    }
  }, [exercise, runCodeMutation, localTestCode, courseId]);

  const matchesExpectedOutput = exercise.expectedOutput && output.trim() === exercise.expectedOutput.trim();
  const allPassed = testResults.length > 0 && testResults.every((t) => t.passed);

  const handleContinue = useCallback(() => {
    if (courseId && lessonId && exercise.id) {
      saveCodeAnswerMutation({
        variables: { courseId, lessonId, exerciseId: exercise.id, code: codeRef.current },
      }).catch((err: any) => console.warn("Failed to save code answer:", err?.message));
    }
    onComplete?.(codeRef.current);
  }, [courseId, lessonId, exercise.id, onComplete, saveCodeAnswerMutation]);

  const handleReset = () => {
    setCode(exercise.initialCode || "");
    setOutput("");
    setTestResults([]);
    setError(null);
    setPassed(false);
    setShowOutput(false);
    setAttempts(0);
  };

  // Keyboard shortcut: Ctrl+Enter to run
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !running) {
        handleRun();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRun, running]);

  const failedCount = testResults.filter((t) => !t.passed).length;
  const passedCount = testResults.filter((t) => t.passed).length;

  // ── VS Code-like header language colors ──
  const langColor = LANGUAGE_COLORS[exercise.language]?.split(" ")[0] || "text-blue-400";

  return (
    <Card className={`border-border/50 overflow-hidden ${compact ? "" : "shadow-xl"}`}>
      <CardContent className="p-0">
        {/* ═══ Exercise Header ═══ */}
        <div className="p-4 sm:p-6 border-b border-border/50 bg-muted/5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant="outline" className={`text-[9px] uppercase font-bold px-2 py-0.5 ${LANGUAGE_COLORS[exercise.language] || "text-blue-400 bg-blue-400/10 border-blue-400/30"}`}>
                  <Code className="w-3 h-3 mr-1" />
                  {LANGUAGE_NAMES[exercise.language] || exercise.language}
                </Badge>
                <Badge variant="outline" className="text-[9px] uppercase font-bold text-purple-400 bg-purple-400/10 border-purple-400/30">
                  {exercise.type === "fill-in" ? "Fill in the Blank" : exercise.type === "fix" ? "Fix the Code" : exercise.type === "test" ? "Test Driven" : "Write from Scratch"}
                </Badge>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                {exercise.title || "Code Exercise"}
              </h3>
              {exercise.description && (
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: exercise.description }} />
              )}
            </div>
            {allPassed && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="shrink-0">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Passed
                </Badge>
              </motion.div>
            )}
          </div>
        </div>

        {/* ═══ Editor + Preview Area ═══ */}
        <div className="p-4 sm:p-6 space-y-4">
          {isPreviewLanguage ? (
            /* ─── VS Code Split View: Editor + Live Preview ─── */
            <div>
              {/* Tab bar above the split pane */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPreviewTab("preview")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      previewTab === "preview" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    Live Preview
                  </button>
                  {isJs && (
                    <button
                      onClick={() => setPreviewTab("console")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                        previewTab === "console" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
                      }`}
                    >
                      <Terminal className="w-3 h-3" />
                      Console
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-white/30 font-mono">
                  <kbd className="px-1 py-0.5 bg-white/5 rounded border border-white/10">Ctrl+Enter</kbd>
                  <span>to run tests</span>
                </div>
              </div>

              <ResizableSplit
                defaultRatio={0.5}
                left={
                  <div className="h-full flex flex-col">
                    {/* Editor top bar (VS Code tabs) */}
                    <div className="flex items-center h-9 bg-[#181825] border-b border-white/5 px-2 gap-1">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1e1e2e] rounded-t-md text-[11px] font-medium border-t-2 border-t-indigo-500">
                        <div className={`w-2 h-2 rounded-full ${
                          isHtml ? "bg-orange-400" : isCss ? "bg-blue-400" : "bg-yellow-400"
                        }`} />
                        <span className="text-white/80">
                          {isHtml ? "index.html" : isCss ? "style.css" : isJs ? "script.js" : "code"}
                        </span>
                      </div>
                      <div className="flex-1" />
                      {syntaxErrorCount > 0 && (
                        <span className="text-[9px] text-red-400 font-mono">
                          {syntaxErrorCount} error{syntaxErrorCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {/* Editor body */}
                    <div className="flex-1 overflow-auto">
                      <SimpleCodeEditor
                        value={code}
                        onChange={setCode}
                        language={exercise.language}
                        readOnly={false}
                        onSyntaxErrors={setSyntaxErrorCount}
                      />
                    </div>
                  </div>
                }
                right={
                  <div className="h-full flex flex-col">
                    {/* Preview top bar */}
                    <div className="flex items-center h-9 bg-[#0d0f1a] border-b border-white/5 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                          {previewTab === "preview" ? "Live Preview" : "Console Output"}
                        </span>
                      </div>
                    </div>
                    {/* Preview body */}
                    <div className="flex-1 overflow-auto">
                      {previewTab === "preview" ? (
                        isJs ? (
                          <LiveJsPreview code={code} />
                        ) : (
                          <LiveHtmlPreview code={code} language={exercise.language} />
                        )
                      ) : (
                        <LiveJsPreview code={code} />
                      )}
                    </div>
                  </div>
                }
              />
            </div>
          ) : (
            /* ─── Standard single editor for non-preview languages ─── */
            <div className="rounded-xl overflow-hidden border border-white/10">
              {/* VS Code-style top bar */}
              <div className="flex items-center h-9 bg-[#181825] border-b border-white/5 px-3 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className={`ml-2 text-[10px] font-bold uppercase tracking-widest ${langColor}`}>
                  {LANGUAGE_NAMES[exercise.language] || exercise.language}
                </span>
                {syntaxErrorCount > 0 && (
                  <span className="ml-auto text-[9px] text-red-400 font-mono">
                    {syntaxErrorCount} error{syntaxErrorCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="max-h-[500px] overflow-auto">
                <SimpleCodeEditor
                  value={code}
                  onChange={setCode}
                  language={exercise.language}
                  readOnly={false}
                  onSyntaxErrors={setSyntaxErrorCount}
                />
              </div>
            </div>
          )}

          {/* ═══ Action Buttons ═══ */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                onClick={handleRun}
                disabled={running || !code.trim() || syntaxErrorCount > 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl gap-2 h-10 px-5 text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                title={syntaxErrorCount > 0 ? `${syntaxErrorCount} syntax error${syntaxErrorCount !== 1 ? "s" : ""} — fix before running` : "Run your code (Ctrl+Enter)"}
              >
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                {running ? "Running..." : "Run & Test"}
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
              {syntaxErrorCount > 0 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/25"
                >
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-[10px] font-bold text-red-400">
                    {syntaxErrorCount} error{syntaxErrorCount !== 1 ? "s" : ""}
                  </span>
                </motion.div>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[9px] font-mono border border-border/50">
                {navigator.platform?.includes("Mac") ? "⌘" : "Ctrl"}
              </kbd>
              <span>+ Enter to run tests</span>
            </div>
          </div>

          {/* ═══ Output / Tests Panel ═══ */}
          <AnimatePresence>
            {showOutput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {/* Tab Header */}
                <div className="flex items-center border-b border-border/40 mb-4">
                  <button
                    onClick={() => setActiveTab("output")}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
                      activeTab === "output" ? "border-indigo-500 text-indigo-400" : "border-transparent text-muted-foreground/60 hover:text-muted-foreground"
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    Output
                    {error && activeTab !== "output" && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                  </button>
                  <button
                    onClick={() => setActiveTab("tests")}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
                      activeTab === "tests" ? "border-indigo-500 text-indigo-400" : "border-transparent text-muted-foreground/60 hover:text-muted-foreground"
                    }`}
                  >
                    <ListChecks className="w-3.5 h-3.5" />
                    Tests
                    {testResults.length > 0 && (
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${allPassed ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                        {passedCount}/{testResults.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* ─── OUTPUT TAB ─── */}
                {activeTab === "output" && (
                  <div className="space-y-3">
                    {output ? (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Terminal className="w-3.5 h-3.5 text-muted-foreground/60" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Program Output</p>
                        </div>
                        <div className="p-4 rounded-xl font-mono text-sm leading-relaxed bg-[#0d0f1a] border border-white/5 text-green-400 max-h-48 overflow-auto">
                          <pre className="whitespace-pre-wrap break-all">{output}</pre>
                        </div>
                      </div>
                    ) : (
                      !error && (
                        <div className="p-4 rounded-xl bg-muted/10 border border-border/30 text-center">
                          <p className="text-xs text-muted-foreground/60">No program output. The code may have run without console.log statements.</p>
                        </div>
                      )
                    )}

                    {error && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-red-400/60">Runtime Error</p>
                        </div>
                        <div className="p-4 rounded-xl font-mono text-sm leading-relaxed bg-red-500/5 border border-red-500/20 text-red-400 max-h-48 overflow-auto">
                          <pre className="whitespace-pre-wrap break-all">{error}</pre>
                        </div>
                        {!error.includes("Syntax") && !error.includes("syntax") && (
                          <div className="mt-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-400/80">
                              Check your code for logic errors or undefined variables. Make sure all functions are called correctly and return the expected types.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {exercise.expectedOutput && output && !error && (
                      <div className={`p-3 rounded-xl border text-sm ${matchesExpectedOutput ? "bg-green-500/5 border-green-500/20 text-green-400" : "bg-amber-500/5 border-amber-500/20 text-amber-400"}`}>
                        <div className="flex items-center gap-2 font-bold mb-1">
                          {matchesExpectedOutput ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                          {matchesExpectedOutput ? "Output matches expected result!" : "Output does not match expected result"}
                        </div>
                        {!matchesExpectedOutput && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Expected: <span className="text-green-400 font-mono">{exercise.expectedOutput}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {!output && !error && testResults.length > 0 && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400/80 text-center flex items-center justify-center gap-2">
                        <Lightbulb className="w-4 h-4 shrink-0" />
                        <span>The code had no console output. Switch to the Tests tab to see test results.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── TESTS TAB ─── */}
                {activeTab === "tests" && (
                  <div className="space-y-3">
                    {testResults.length > 0 ? (
                      <>
                        <div className={`p-3 rounded-xl border text-sm flex items-center gap-3 ${allPassed ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                          {allPassed ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
                          <div className="flex-1">
                            <p className="font-bold text-sm">
                              {allPassed ? `All ${testResults.length} test${testResults.length !== 1 ? "s" : ""} passed!` : `${failedCount} test${failedCount !== 1 ? "s" : ""} failed, ${passedCount} passed`}
                            </p>
                            {!allPassed && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden max-w-xs">
                                  <div className="h-full rounded-full bg-green-500 transition-all duration-300" style={{ width: `${(passedCount / testResults.length) * 100}%` }} />
                                </div>
                                <span className="text-[10px] text-muted-foreground font-mono">{testResults.length - passedCount} remaining</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {testResults.map((test, i) => (
                            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${test.passed ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                              {test.passed ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold ${test.passed ? "text-green-400" : "text-red-400"}`}>{test.name || "Test Case"}</p>
                                {!test.passed && (
                                  <div className="mt-1 space-y-0.5 text-xs font-mono">
                                    {test.expected && <p className="text-muted-foreground">Expected: <span className="text-green-400">{test.expected}</span></p>}
                                    {test.actual && <p className="text-muted-foreground">Actual: <span className="text-red-400">{test.actual}</span></p>}
                                    {test.error && <p className="text-red-400/80 mt-1 text-[11px]">{test.error}</p>}
                                  </div>
                                )}
                                {test.passed && <p className="text-[10px] text-green-400/60 mt-0.5 font-medium">✓ Passed</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400/80 text-center flex items-center justify-center gap-2">
                        <Lightbulb className="w-4 h-4 shrink-0" />
                        <span>{output ? "Code executed successfully but no test results were returned." : "No test results. Run your code first to see test results here."}</span>
                      </div>
                    )}

                    {error && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-red-400/60">Runtime Error</p>
                        </div>
                        <div className="p-4 rounded-xl font-mono text-sm leading-relaxed bg-red-500/5 border border-red-500/20 text-red-400 max-h-48 overflow-auto">
                          <pre className="whitespace-pre-wrap break-all">{error}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── Success + Continue ─── */}
                {(allPassed || matchesExpectedOutput) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-between gap-4 mt-4"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-green-400">All tests passed!</p>
                        <p className="text-[10px] text-muted-foreground">
                          {attempts > 1 ? `Solved in ${attempts} attempt${attempts !== 1 ? "s" : ""}` : "Solved on first try! 🎉"}
                        </p>
                      </div>
                    </div>
                    {onComplete && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleContinue}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs h-9 px-5 shadow-lg shadow-green-500/20"
                      >
                        {saving ? "Saving..." : "Continue"}
                      </Button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══ Footer Stats ═══ */}
        {attempts > 0 && (
          <div className="px-4 sm:px-6 py-3 border-t border-border/30 bg-muted/5">
            <div className="flex items-center gap-4 text-[10px] font-medium text-muted-foreground flex-wrap">
              <span>Runs: <strong className="text-foreground">{attempts}</strong></span>
              {testResults.length > 0 && (
                <span>
                  Tests: <strong className="text-green-400">{passedCount}</strong>/{testResults.length} passing
                </span>
              )}
              {error && (
                <span className="text-red-400">
                  <AlertTriangle className="w-3 h-3 inline mr-0.5" />
                  Error
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
