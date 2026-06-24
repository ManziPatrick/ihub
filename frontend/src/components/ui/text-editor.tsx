import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Maximize2, Minimize2, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['link', 'image', 'video'],
    ['blockquote', 'code-block'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'color', 'background',
  'align',
  'link', 'image', 'video',
  'blockquote', 'code-block'
];

export function TextEditor({ value, onChange, placeholder }: TextEditorProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  // Handle escape key to exit full screen
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMaximized) {
        setIsMaximized(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    
    // Block body scroll when maximized
    if (isMaximized) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isMaximized]);

  return (
    <div className={cn(
      "bg-background rounded-md overflow-hidden border border-border/50 focus-within:ring-1 focus-within:ring-accent/50 transition-all shadow-sm",
      isMaximized ? "fixed inset-0 z-[9999] rounded-none border-none bg-background/95 backdrop-blur-xl flex flex-col items-center animate-in fade-in duration-300" : "relative min-h-[220px]"
    )}>
      <style>{`
        .quill {
          background: transparent;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .ql-toolbar.ql-snow {
          border: none;
          border-bottom: 1px solid rgba(139, 139, 139, 0.1);
          background: rgba(255, 255, 255, 0.02);
          padding: 8px 12px;
          flex-shrink: 0;
        }
        .ql-container.ql-snow {
          border: none;
          font-family: inherit;
          font-size: 1rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .ql-editor {
          padding: 24px;
          flex: 1;
          overflow-y: auto;
          color: var(--text-editor-color, inherit);
          line-height: 1.6;
        }
        /* Word-like layout when maximized */
        .maximized-content .ql-editor {
          max-width: 850px;
          margin: 40px auto;
          background: var(--card);
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          min-height: calc(100vh - 160px);
          border: 1px solid rgba(139,139,139,0.1);
          border-radius: 4px;
        }
        .ql-editor.ql-blank::before {
          color: rgba(139, 139, 139, 0.5);
          font-style: normal;
          left: 24px;
        }
        .ql-snow .ql-stroke {
          stroke: var(--text-editor-color, currentColor);
          opacity: var(--text-editor-toolbar-opacity, 0.75);
        }
        .ql-snow .ql-fill {
          fill: var(--text-editor-color, currentColor);
          opacity: var(--text-editor-toolbar-opacity, 0.75);
        }
        .ql-snow .ql-picker {
          color: var(--text-editor-color, currentColor);
          opacity: var(--text-editor-toolbar-opacity, 0.75);
        }
        .ql-snow.ql-toolbar button:hover .ql-stroke,
        .ql-snow.ql-toolbar button:hover .ql-fill,
        .ql-snow.ql-toolbar button.ql-active .ql-stroke,
        .ql-snow.ql-toolbar button.ql-active .ql-fill {
          stroke: var(--text-editor-accent, #818cf8);
          fill: var(--text-editor-accent, #818cf8);
          opacity: 1;
        }
      `}</style>

      {/* Control Bar for Maximized State */}
      {isMaximized && (
        <div className="w-full h-16 bg-card border-b border-border/50 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground shadow-gold">
               <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-accent">Creative Session</p>
              <p className="text-[10px] text-muted-foreground font-black uppercase">Word-like Page Mode</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button 
                onClick={() => setIsMaximized(false)}
                className="h-10 rounded-xl px-6 bg-accent text-accent-foreground font-black uppercase text-[10px] tracking-widest gap-2 shadow-gold"
             >
                <CheckCircle className="w-4 h-4" /> Finish & Return
             </Button>
             <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setIsMaximized(false)}
                className="h-10 w-10 rounded-xl border-border/50"
             >
                <Minimize2 className="w-4 h-4" />
             </Button>
          </div>
        </div>
      )}

      {/* The Toggle Button for Minimized State */}
      {!isMaximized && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsMaximized(true)}
          className="absolute top-2 right-2 z-10 h-8 w-8 text-muted-foreground/50 hover:text-accent hover:bg-accent/10 transition-colors"
          title="Full Screen Mode"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      )}

      <div className={cn("flex-1 w-full", isMaximized && "maximized-content bg-muted/20 overflow-y-auto")}>
        <ReactQuill 
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          className="h-full"
        />
      </div>
    </div>
  );
}
