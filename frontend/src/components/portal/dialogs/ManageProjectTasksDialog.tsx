import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Check,
} from "lucide-react";
import { useMutation } from "@apollo/client/react";
import { APPROVE_PROJECT_TASK } from "@/lib/graphql/project-tasks";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ManageProjectTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
  refetch: () => void;
}

export function ManageProjectTasksDialog({ open, onOpenChange, project, refetch }: ManageProjectTasksDialogProps) {
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});

  const [approveTask, { loading: updating }] = useMutation(APPROVE_PROJECT_TASK, {
    onCompleted: () => {
      toast.success("Task approved!");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  if (!project) return null;

  const handleApprove = (taskId: string) => {
    approveTask({
      variables: {
        id: taskId,
        feedback: feedbackMap[taskId] || ""
      }
    });
  };

  const tasks = project.tasks || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 border-b border-border/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-heading font-bold">
              Review Project Tasks: {project.title}
            </DialogTitle>
            <Badge variant="outline" className="bg-accent/5 text-accent border-accent/20">
              {tasks.filter((t: any) => t.completed).length} / {tasks.length} Completed
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-background">
          {tasks.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground italic">
              No tasks defined for this project.
            </div>
          ) : (
            tasks.map((task: any) => (
              <div 
                key={task.id}
                className={`p-4 rounded-xl border transition-all ${
                  task.approved 
                    ? "bg-green-500/5 border-green-500/30" 
                    : task.completed 
                      ? "bg-amber-500/5 border-amber-500/30 shadow-sm"
                      : "bg-muted/5 border-border/50"
                }`}
              >
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                       <p className={`font-bold ${task.completed ? "" : "text-muted-foreground"}`}>
                         {task.title}
                       </p>
                       {task.completed ? (
                         <Badge className="bg-green-500/20 text-green-500 border-none text-[10px] uppercase font-bold">Task Done</Badge>
                       ) : (
                         <Badge variant="outline" className="text-[10px] uppercase font-bold opacity-50">In Progress</Badge>
                       )}
                    </div>
                    
                    {task.completed && (
                       <div className="mt-3 space-y-3">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Feedback for Student</label>
                          <div className="flex gap-2">
                            <Input 
                              placeholder="Great job! / Missing some details..." 
                              className="bg-background border-border/50 text-sm h-9"
                              value={feedbackMap[task.id] || task.feedback || ""}
                              onChange={(e) => setFeedbackMap({...feedbackMap, [task.id]: e.target.value})}
                            />
                          </div>
                       </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                    {task.completed && (
                      <div className="flex gap-2">
                         <Button 
                            size="sm" 
                            variant={task.approved ? "default" : "outline"}
                            className={task.approved ? "bg-green-600 hover:bg-green-700 h-9 px-4" : "h-9 px-4 border-green-500/30 text-green-600 hover:bg-green-500/10"}
                            onClick={() => handleApprove(task.id)}
                            disabled={updating || task.approved}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            {task.approved ? "Approved" : "Approve"}
                         </Button>
                      </div>
                    )}
                    {!task.completed && (
                      <p className="text-[11px] font-medium text-muted-foreground italic text-center">Waiting for student to complete...</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-border/50 bg-muted/30 flex justify-end">
           <Button variant="ghost" onClick={() => onOpenChange(false)}>
             Done Reviewing
           </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
