import { useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useMutation } from "@apollo/client/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Clock, AlertCircle, CheckCircle2, Loader2, ThumbsUp, MessageSquare } from "lucide-react";
import {
  MOVE_PROJECT_TASK,
  GET_PROJECT_TASKS,
  APPROVE_PROJECT_TASK,
} from "@/lib/graphql/project-tasks";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee?: { id: string; username: string; fullName?: string; avatar?: string } | null;
  assigneeId?: string;
  labels?: string[];
  storyPoints?: number;
  dueDate?: string;
  order: number;
  approved: boolean;
  feedback?: string;
}

interface Column {
  id: string;
  title: string;
  color: string;
  icon: any;
}

interface KanbanBoardProps {
  tasks: Task[];
  projectId: string;
  userRole?: string;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
}

const COLUMNS: Column[] = [
  { id: "backlog", title: "Backlog", color: "border-slate-500/30 bg-slate-500/5", icon: AlertCircle },
  { id: "todo", title: "To Do", color: "border-blue-500/30 bg-blue-500/5", icon: Clock },
  { id: "in_progress", title: "In Progress", color: "border-amber-500/30 bg-amber-500/5", icon: Loader2 },
  { id: "in_review", title: "In Review", color: "border-purple-500/30 bg-purple-500/5", icon: AlertCircle },
  { id: "done", title: "Done", color: "border-green-500/30 bg-green-500/5", icon: CheckCircle2 },
  { id: "blocked", title: "Blocked", color: "border-red-500/30 bg-red-500/5", icon: AlertCircle },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-500/20 text-slate-400",
  medium: "bg-blue-500/20 text-blue-400",
  high: "bg-amber-500/20 text-amber-400",
  critical: "bg-red-500/20 text-red-400",
};

const LABEL_COLORS: Record<string, string> = {
  frontend: "bg-blue-500/20 text-blue-400",
  backend: "bg-green-500/20 text-green-400",
  bug: "bg-red-500/20 text-red-400",
  feature: "bg-purple-500/20 text-purple-400",
  design: "bg-pink-500/20 text-pink-400",
  docs: "bg-amber-500/20 text-amber-400",
  testing: "bg-orange-500/20 text-orange-400",
};

export function KanbanBoard({ tasks, projectId, userRole, onAddTask, onEditTask }: KanbanBoardProps) {
  const [moveTask] = useMutation(MOVE_PROJECT_TASK, {
    onError: (err) => toast.error(err.message || "Failed to move task"),
    refetchQueries: [{ query: GET_PROJECT_TASKS, variables: { projectId } }],
  });

  const [approveTask] = useMutation(APPROVE_PROJECT_TASK, {
    onError: (err) => toast.error(err.message || "Failed to approve task"),
    refetchQueries: [{ query: GET_PROJECT_TASKS, variables: { projectId } }],
  });

  const [approvalTask, setApprovalTask] = useState<Task | null>(null);
  const [approvalFeedback, setApprovalFeedback] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    if (!approvalTask) return;
    setIsApproving(true);
    try {
      await approveTask({
        variables: {
          id: approvalTask.id,
          feedback: approvalFeedback || undefined,
        },
      });
      toast.success("Task approved");
      setApprovalTask(null);
      setApprovalFeedback("");
    } catch {
      // handled by onError
    } finally {
      setIsApproving(false);
    }
  };

  const isStaff = userRole && ['admin', 'super_admin', 'trainer'].includes(userRole);


  const columns = useMemo(() => {
    return COLUMNS.map((col) => ({
      ...col,
      tasks: tasks
        .filter((t) => t.status === col.id)
        .sort((a, b) => a.order - b.order),
    }));
  }, [tasks]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    try {
      await moveTask({
        variables: {
          id: draggableId,
          status: destination.droppableId,
          order: destination.index,
        },
      });
    } catch {
      // Error handled by onError above
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 min-h-[600px]">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col">
            <div className={`rounded-xl border ${column.color} p-3 mb-2`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <column.icon className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">{column.title}</h3>
                </div>
                <Badge variant="outline" className="text-[10px] bg-background/50">
                  {column.tasks.length}
                </Badge>
              </div>
            </div>
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 space-y-2 p-1 rounded-xl min-h-[200px] transition-colors ${
                    snapshot.isDraggingOver ? "bg-accent/5 ring-1 ring-accent/20" : ""
                  }`}
                >
                  {column.tasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => onEditTask(task)}
                          className={`p-3 rounded-xl border bg-card cursor-pointer transition-all hover:border-accent/40 hover:shadow-md ${
                            snapshot.isDragging
                              ? "shadow-xl border-accent/50 rotate-2 scale-105"
                              : "border-border/50"
                          } ${task.approved ? "border-green-500/30 bg-green-500/5" : ""} ${task.status === 'in_review' && isStaff ? "border-purple-500/40" : ""}`}
                          style={{ ...provided.draggableProps.style }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-xs font-semibold line-clamp-2 leading-relaxed">
                              {task.title}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-[9px] uppercase font-bold shrink-0 border-0 ${
                                PRIORITY_COLORS[task.priority] || "bg-muted/30"
                              }`}
                            >
                              {task.priority}
                            </Badge>
                          </div>

                          {task.description && (
                            <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">
                              {task.description}
                            </p>
                          )}

                          {task.labels && task.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {task.labels.slice(0, 3).map((label) => (
                                <span
                                  key={label}
                                  className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                    LABEL_COLORS[label] || "bg-muted/30 text-muted-foreground"
                                  }`}
                                >
                                  {label}
                                </span>
                              ))}
                              {task.labels.length > 3 && (
                                <span className="text-[8px] text-muted-foreground">
                                  +{task.labels.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-1.5">
                              {task.assignee ? (
                                <Avatar className="w-5 h-5">
                                  <AvatarFallback className="text-[8px] bg-accent/20 text-accent font-bold">
                                    {(task.assignee.fullName || task.assignee.username || "?").charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-muted/30 flex items-center justify-center">
                                  <span className="text-[8px] text-muted-foreground">?</span>
                                </div>
                              )}
                              {task.storyPoints && (
                                <span className="text-[9px] text-muted-foreground font-mono">
                                  {task.storyPoints}pts
                                </span>
                              )}
                            </div>
                            {task.dueDate && (
                              <span className="text-[9px] text-muted-foreground">
                                {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>

                          {/* Approval status or approve action */}
                          {task.approved ? (
                            <div className="mt-2 pt-2 border-t border-green-500/20">
                              <span className="text-[9px] text-green-500 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Approved
                                {task.feedback && (
                                  <span className="text-[8px] text-muted-foreground font-normal ml-1">
                                    — "{task.feedback}"
                                  </span>
                                )}
                              </span>
                            </div>
                          ) : task.status === 'in_review' && isStaff ? (
                            <div className="mt-2 pt-2 border-t border-purple-500/20">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-6 text-[10px] gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setApprovalTask(task);
                                  setApprovalFeedback("");
                                }}
                              >
                                <ThumbsUp className="w-3 h-3" />
                                Approve Task
                              </Button>
                            </div>
                          ) : task.status === 'in_review' && (
                            <div className="mt-2 pt-2 border-t border-purple-500/20">
                              <span className="text-[9px] text-purple-500 font-medium flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Awaiting review
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
            {column.id === "backlog" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onAddTask}
                className="mt-2 text-xs text-muted-foreground hover:text-accent w-full"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Task
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Approval feedback dialog */}
      <Dialog open={!!approvalTask} onOpenChange={(open) => !open && setApprovalTask(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-green-500" />
              Approve Task
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm font-medium">{approvalTask?.title}</p>
              {approvalTask?.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {approvalTask.description}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" />
                Feedback (optional)
              </label>
              <Textarea
                value={approvalFeedback}
                onChange={(e) => setApprovalFeedback(e.target.value)}
                placeholder="Great work! Consider adding..."
                className="min-h-[80px] text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setApprovalTask(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleApprove} disabled={isApproving}>
              {isApproving ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Approve & Mark Done
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DragDropContext>
  );
}
