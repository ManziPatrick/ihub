import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, BrainCircuit } from "lucide-react";
import { useMutation } from "@apollo/client/react";
import { EXPLAIN_TASK, REVIEW_SUBMISSION } from "@/lib/graphql/mutations";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ExplainTaskData {
    explainTask: {
        content: string;
    };
}

interface ReviewSubmissionData {
    reviewSubmission: {
        content: string;
    };
}

interface AIHelperProps {
    type: "explain" | "review";
    taskTitle: string;
    description?: string;
    submissionContent?: string;
}

export function AIHelper({ type, taskTitle, description, submissionContent }: AIHelperProps) {
    const [open, setOpen] = useState(false);
    const [result, setResult] = useState("");

    const [explain, { loading: explaining }] = useMutation<ExplainTaskData>(EXPLAIN_TASK, {
        onCompleted: (data) => setResult(data.explainTask.content),
    });

    const [review, { loading: reviewing }] = useMutation<ReviewSubmissionData>(REVIEW_SUBMISSION, {
        onCompleted: (data) => setResult(data.reviewSubmission.content),
    });

    const handleAction = () => {
        setOpen(true);
        if (type === "explain") {
            explain({ variables: { taskTitle, description: description || "" } });
        } else {
            review({ variables: { taskTitle, submissionContent: submissionContent || "" } });
        }
    };

    return (
        <>
            <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[10px] text-accent hover:text-accent hover:bg-accent/10 gap-1.5"
                onClick={handleAction}
            >
                <Sparkles className="w-3 h-3" />
                {type === "explain" ? "Explain" : "Get Feedback"}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-xl border-border/50 bg-card/95 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <BrainCircuit className="w-5 h-5 text-accent" />
                            AI {type === "explain" ? "Explanation" : "Mentor Feedback"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {explaining || reviewing ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <Loader2 className="w-8 h-8 text-accent animate-spin" />
                                <p className="text-sm text-muted-foreground animate-pulse font-medium">
                                    {type === "explain" ? "Consulting the Qwen-core..." : "Analyzing your work..."}
                                </p>
                            </div>
                        ) : (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <div className="p-4 rounded-xl bg-accent/5 border border-accent/10 whitespace-pre-wrap leading-relaxed text-foreground">
                                    {result}
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest italic opacity-50">
                                        Powered by Bootskills Ai
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
