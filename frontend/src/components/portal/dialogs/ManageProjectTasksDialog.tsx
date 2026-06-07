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
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  ThumbsUp,
  MessageSquare,
  User,
} from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_PROJECT_TASKS, APPROVE_PROJECT_TASK } from "@/lib/graphql/project-tasks";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ManageProjectTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
  refetch: () => void;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee?: { id: string; username: string; fullName?: string; avatar?: string } | null;
  assigneeId?: string;
  labels?: string[];
  approved: boolean;
  feedback?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_SECTIONS = [
  { key: "in_review", label: "Awaiting Approval", color: "border-purple-500/30 bg-purple-500/5", textColor: "text-purple-400", icon: AlertCircle },
  { key: "done", label: "Completed", color: "border-green-500/30 bg-green-500/5", textColor: "text-green-400", icon: CheckCircle2 },
  { key: "in_progress", label: "In Progress", color: "border-amber-500/30 bg-amber-500/5", textColor: "text-amber-400", icon: Clock },
  { key: "todo", label: "To Do", color: "border-blue-500/30 bg-blue-500/5", textColor: "text-blue-400", icon: Clock },
  { key: "backlog", label: "Backlog", color: "border-slate-500/30 bg-slate-500/5", textColor: "text-slate-400", icon: AlertCircle },
  { key: "blocked", label: "Blocked", color: "border-red-500/30 bg-red-500/5", textColor: "text-red-400", icon: AlertCircle },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-500/20 text-slate-400",
  medium: "bg-blue-500/20 text-blue-400",
  high: "bg-amber-500/20 text-amber-400",
  critical: "bg-red-500/20 text-red-400",
};

export function ManageProjectTasksDialog({ open, onOpenChange, project, refetch }: ManageProjectTasksDialogProps) {
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});

  const { data: tasksData, loading: tasksLoading, refetch: refetchBoardTasks } = useQuery(GET_PROJECT_TASKS, {
    variables: { projectId: project?.id },
    skip: !project?.id,
    fetchPolicy: "network-only",
  });

  const boardTasks: Task[] = (tasksData as any)?.projectTasks || [];

  const [approveTask, { loading: updating }] = useMutation(APPROVE_PROJECT_TASK, {
    onCompleted: () => {
      toast.success("Task approved and marked as done!");
      refetchBoardTasks();
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

  const totalTasks = boardTasks.length;
  const doneTasks = boardTasks.filter(t => t.status === "done").length;
  const reviewTasks = boardTasks.filter(t => t.status === "in_review").length;

  // Group tasks by status
  const groupedTasks = STATUS_SECTIONS.map(section => ({
    ...section,
    tasks: boardTasks.filter(t => t.status === section.key),
  })).filter(s => s.tasks.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-heading font-bold">
                Task Board: {project.title}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Review and approve student tasks. Tasks marked as "done" must be approved to close them out.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {reviewTasks > 0 && (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                  {reviewTasks} pending review
                </Badge>
              )}
              <Badge variant="outline" className="bg-accent/5 text-accent border-accent/20">
                {doneTasks} / {totalTasks} done
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-background">
          {tasksLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading tasks...</span>
            </div>
          ) : boardTasks.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No board tasks found</p>
              <p className="text-sm mt-1">Create tasks using the Kanban Board view to see them here.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedTasks.map((section) => (
                <motion.div
                  key={section.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={`rounded-xl border ${section.color} p-3 mb-3`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <section.icon className={`w-4 h-4 ${section.textColor}`} />
                        <h3 className={`text-xs font-bold uppercase tracking-wider ${section.textColor}`}>
                          {section.label}
                        </h3>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-background/50">
                        {section.tasks.length}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3 pl-2">
                    {section.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-4 rounded-xl border transition-all ${
                          task.approved
                            ? "bg-green-500/5 border-green-500/30"
                            : task.status === "in_review"
                              ? "bg-purple-500/5 border-purple-500/30 shadow-sm"
                              : "bg-muted/5 border-border/50"
                        }`}
                      >
                        <div className="flex flex-col gap-4">
                          {/* Task Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className={`font-semibold text-sm ${task.approved ? "text-green-500" : ""}`}>
                                  {task.title}
                                </p>
                                {task.approved ? (
                                  <Badge className="bg-green-500/20 text-green-500 border-none text-[10px] uppercase font-bold shrink-0">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
                                  </Badge>
                                ) : task.status === "in_review" ? (
                                  <Badge className="bg-purple-500/20 text-purple-400 border-none text-[10px] uppercase font-bold shrink-0 animate-pulse">
                                    Needs Approval
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] uppercase font-bold opacity-50 shrink-0">
                                    {task.status.replace(/_/g, " ")}
                                  </Badge>
                                )}
                              </div>

                              {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                  {task.description}
                                </p>
                              )}

                              {/* Meta row */}
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                {task.assignee && (
                                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <User className="w-3 h-3" />
                                    {task.assignee.fullName || task.assignee.username}
                                  </span>
                                )}
                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                  PRIORITY_COLORS[task.priority] || "bg-muted/30 text-muted-foreground"
                                }`}>
                                  {task.priority}
                                </span>
                                {task.labels && task.labels.length > 0 && (
                                  <div className="flex gap-1">
                                    {task.labels.slice(0, 2).map((label) => (
                                      <span key={label} className="text-[9px] bg-muted/20 text-muted-foreground px-1.5 py-0.5 rounded">
                                        {label}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {task.dueDate && (
                                  <span className="text-[10px] text-muted-foreground">
                                    Due: {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Feedback & Approve action for in_review tasks */}
                          {task.status === "in_review" && !task.approved && (
                            <div className="space-y-3 pt-3 border-t border-purple-500/20">
                              <div className="flex gap-2 items-start">
                                <div className="flex-1">
                                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-1 mb-1.5">
                                    <MessageSquare className="w-3 h-3" />
                                    Feedback (optional)
                                  </label>
                                  <Input
                                    placeholder="Great work! / Consider adding..."
                                    className="bg-background border-border/50 text-sm h-9"
                                    value={feedbackMap[task.id] || task.feedback || ""}
                                    onChange={(e) => setFeedbackMap({...feedbackMap, [task.id]: e.target.value})}
                                  />
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-9 px-4 border-purple-500/30 text-purple-600 hover:bg-purple-500/10 mt-6 shrink-0"
                                  onClick={() => handleApprove(task.id)}
                                  disabled={updating}
                                >
                                  <ThumbsUp className="w-4 h-4 mr-2" />
                                  Approve & Mark Done
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Show feedback if task is approved */}
                          {task.approved && task.feedback && (
                            <div className="pt-2 border-t border-green-500/20">
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <MessageSquare className="w-3 h-3 text-green-500" />
                                Feedback: <span className="text-green-600 dark:text-green-400 italic">"{task.feedback}"</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}

              {/* Also show any tasks without known status groupings */}
              {groupedTasks.length === 0 && !tasksLoading && (
                <div className="py-12 text-center text-muted-foreground italic">
                  No tasks found on the board for this project.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border/50 bg-muted/30 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            <strong>{reviewTasks}</strong> task{reviewTasks !== 1 ? "s" : ""} awaiting approval
            {reviewTasks > 0 && " — click Approve & Mark Done to close them out"}
          </span>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Done Reviewing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
