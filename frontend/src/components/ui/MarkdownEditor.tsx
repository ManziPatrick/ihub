import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Link,
  List,
  ListOrdered,
  Quote,
  Code,
  Code2,
  Image,
  Maximize2,
  Minimize2,
  Eye,
  Edit3,
  Sparkles,
  CheckCircle,
  Table,
  Strikethrough,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, normalizeContent } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

type ToolbarAction = {
  icon: React.ElementType;
  label: string;
  action: (textarea: HTMLTextAreaElement, value: string) => { newValue: string; cursorPos: number };
  shortcut?: string;
};

const wrapSelection = (prefix: string, suffix: string = prefix) => {
  return (textarea: HTMLTextAreaElement, value: string) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || prefix.replace(/\*/g, "").replace(/#/g, "").replace(/`/g, "").trim() || "text";
    const newText = prefix + selectedText + suffix;
    return {
      newValue: value.substring(0, start) + newText + value.substring(end),
      cursorPos: start + newText.length - suffix.length,
    };
  };
};

const insertAtCursor = (text: string) => {
  return (textarea: HTMLTextAreaElement, value: string) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    return {
      newValue: value.substring(0, start) + text + value.substring(end),
      cursorPos: start + text.length,
    };
  };
};

const insertLinePrefix = (prefix: string) => {
  return (textarea: HTMLTextAreaElement, value: string) => {
    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = value.indexOf("\n", start);
    const line = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd);
    const newLine = prefix + line;
    return {
      newValue: value.substring(0, lineStart) + newLine + value.substring(lineStart + line.length),
      cursorPos: lineStart + newLine.length,
    };
  };
};

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { icon: Bold, label: "Bold", shortcut: "Ctrl+B", action: wrapSelection("**", "**") },
  { icon: Italic, label: "Italic", shortcut: "Ctrl+I", action: wrapSelection("*", "*") },
  { icon: Strikethrough, label: "Strikethrough", action: wrapSelection("~~", "~~") },
  { icon: Heading1, label: "Heading 1", action: insertLinePrefix("# ") },
  { icon: Heading2, label: "Heading 2", action: insertLinePrefix("## ") },
  { icon: Heading3, label: "Heading 3", action: insertLinePrefix("### ") },
  { icon: Link, label: "Link", shortcut: "Ctrl+K", action: wrapSelection("[", "](url)") },
  { icon: Image, label: "Image", action: wrapSelection("![", "](url)") },
  { icon: List, label: "Bullet List", action: insertLinePrefix("- ") },
  { icon: ListOrdered, label: "Numbered List", action: insertLinePrefix("1. ") },
  { icon: Quote, label: "Blockquote", action: insertLinePrefix("> ") },
  { icon: Code, label: "Inline Code", action: wrapSelection("`", "`") },
  { icon: Code2, label: "Code Block", action: wrapSelection("```\n", "\n```") },
  { icon: Table, label: "Table", action: insertAtCursor("\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n") },
];

export function MarkdownEditor({ value, onChange, placeholder, minHeight = 120 }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Block body scroll when maximized
  useEffect(() => {
    if (isMaximized) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMaximized]);

  // Escape to close fullscreen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMaximized) setIsMaximized(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isMaximized]);

  const handleToolbarAction = useCallback(
    (action: ToolbarAction) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const { newValue, cursorPos } = action.action(textarea, value);
      onChange(newValue);
      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(cursorPos, cursorPos);
      });
    },
    [value, onChange]
  );

  const editorContent = (
    <>
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 bg-muted/20 border-b border-border/30 rounded-t-xl overflow-x-auto">
        {TOOLBAR_ACTIONS.map((action, i) => (
          <button
            key={action.label}
            type="button"
            onClick={() => handleToolbarAction(action)}
            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-accent/10 hover:border-accent/30 transition-all border border-transparent"
            title={`${action.label}${action.shortcut ? ` (${action.shortcut})` : ""}`}
          >
            <action.icon className="w-3.5 h-3.5" />
          </button>
        ))}
        <div className="w-px h-5 bg-border/40 mx-1 shrink-0" />
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`w-7 h-7 flex items-center justify-center rounded-md transition-all border ${
            showPreview
              ? "text-accent bg-accent/10 border-accent/20"
              : "text-muted-foreground/70 hover:text-foreground hover:bg-accent/10 border-transparent"
          }`}
          title={showPreview ? "Hide Preview" : "Show Preview"}
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setIsMaximized(true)}
          className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-accent/10 border border-transparent hover:border-accent/30 transition-all"
          title="Full Screen (Ctrl+Shift+F)"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        {value && (
          <span className="ml-auto text-[9px] text-muted-foreground/40 font-mono tabular-nums mr-1">
            {value.length} chars
          </span>
        )}
      </div>

      {/* ── Editor + Preview Split ── */}
      <div className={cn("flex", showPreview ? "flex-col sm:flex-row" : "flex-col")}>
        {/* Textarea */}
        <div className={cn("relative flex-1", showPreview && "sm:border-r border-border/20")}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Write in Markdown..."}
            className={cn(
              "w-full resize-none bg-transparent p-4 text-sm font-mono leading-relaxed outline-none",
              "placeholder:text-muted-foreground/30",
              "scrollbar-thin scrollbar-thumb-border/30 scrollbar-track-transparent"
            )}
            style={{ minHeight: isMaximized ? "50vh" : minHeight }}
            spellCheck
          />
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="flex-1 p-4 overflow-y-auto">
            {value.trim() ? (
              <div className="prose dark:prose-invert prose-sm max-w-none lesson-content-viewer">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                  {normalizeContent(value)}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-muted-foreground/30 text-sm italic">Preview will appear here...</p>
            )}
          </div>
        )}
      </div>
    </>
  );

  // ─── Maximized / Fullscreen Mode ───
  if (isMaximized) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background/98 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
        {/* Maximized Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border/30 bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center">
              <Edit3 className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-accent">Markdown Editor</p>
              <p className="text-[9px] text-muted-foreground/50 font-medium">Full-Screen Mode</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[10px] font-bold gap-1.5 border-border/40"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-3.5 h-3.5" />
              {showPreview ? "Hide Preview" : "Show Preview"}
            </Button>
            <Button
              size="sm"
              className="h-8 text-[10px] font-bold gap-1.5 bg-accent text-accent-foreground shadow-gold"
              onClick={() => setIsMaximized(false)}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Done
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground/50 hover:text-foreground"
              onClick={() => setIsMaximized(false)}
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Full toolbar + editor in maximized mode */}
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
          {/* Toolbar */}
          <div className="flex items-center gap-0.5 flex-wrap px-3 py-2 border-b border-border/20 bg-muted/10">
            {TOOLBAR_ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => handleToolbarAction(action)}
                className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-accent/10 hover:border-accent/30 transition-all border border-transparent"
                title={`${action.label}${action.shortcut ? ` (${action.shortcut})` : ""}`}
              >
                <action.icon className="w-3.5 h-3.5" />
              </button>
            ))}
            {value && (
              <span className="ml-auto text-[10px] text-muted-foreground/40 font-mono tabular-nums">
                {value.length} chars
              </span>
            )}
          </div>

          {/* Split editor/preview */}
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-1.5 border-b border-border/10">
                <Badge className="text-[8px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border-blue-500/20">
                  Editor
                </Badge>
              </div>
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder || "Write in Markdown..."}
                className="flex-1 w-full resize-none bg-transparent p-6 text-sm font-mono leading-relaxed outline-none placeholder:text-muted-foreground/20 scrollbar-thin"
                spellCheck
              />
            </div>
            <div className="w-px bg-border/20 shrink-0" />
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-1.5 border-b border-border/10">
                <Badge className="text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  Preview
                </Badge>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {value.trim() ? (
                  <div className="prose dark:prose-invert prose-sm max-w-none lesson-content-viewer">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                      {normalizeContent(value)}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-muted-foreground/30 text-sm italic">Nothing to preview yet...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Inline / Normal Mode ───
  return (
    <div className="bg-background rounded-xl border border-border/40 overflow-hidden transition-all hover:border-border/60 focus-within:ring-1 focus-within:ring-accent/40 shadow-sm">
      {editorContent}
    </div>
  );
}

export default MarkdownEditor;
