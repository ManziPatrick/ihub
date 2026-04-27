import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation } from "@apollo/client/react";
import { EXPLAIN_TASK } from "@/lib/graphql/mutations";
import { Loader2, Sparkles, Brain, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ExplainTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  description: string;
}

export function ExplainTaskDialog({
  open,
  onOpenChange,
  taskTitle,
  description,
}: ExplainTaskDialogProps) {
  const [explanation, setExplanation] = useState<string | null>(null);

  const [getExplanation, { loading, error }] = useMutation(EXPLAIN_TASK, {
    onCompleted: (data: any) => {
      setExplanation(data.explainTask.content);
    },
  });

  useEffect(() => {
    if (open && taskTitle && description && !explanation) {
      getExplanation({
        variables: {
          taskTitle,
          description,
        },
      });
    }
  }, [open, taskTitle, description, getExplanation, explanation]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-heading">
            <Brain className="w-5 h-5 text-accent" />
            AI Coach: Understanding Your Task
          </DialogTitle>
          <DialogDescription>
            Get a clear explanation of <strong>{taskTitle}</strong> without spoilers.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
              <p className="text-sm text-muted-foreground animate-pulse">
                Analyzing task requirements...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
              <Info className="w-5 h-5" />
              <p>Failed to get explanation. Please try again soon.</p>
            </div>
          ) : explanation ? (
            <div className="space-y-6">
              <div className="prose prose-sm dark:prose-invert max-w-none bg-accent/5 p-6 rounded-xl border border-accent/10">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold text-accent" {...props} />,
                    em: ({ node, ...props }) => <em className="italic" {...props} />,
                    a: ({ node, ...props }) => <a className="text-accent underline hover:opacity-80 transition-opacity" {...props} />
                  }}
                >
                  {explanation}
                </ReactMarkdown>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg border border-border/50 text-[11px] text-muted-foreground flex items-start gap-3 italic">
                <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <p>
                  Note: This coach is designed to help you understand the requirements and concepts. 
                  It will not provide direct answers or code, as solving the task yourself is key to your growth!
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="pt-4 border-t flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close Coach
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
