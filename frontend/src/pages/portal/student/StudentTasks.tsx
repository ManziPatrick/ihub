import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@apollo/client/react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
  GET_MY_PROJECT_TASKS,
  MOVE_PROJECT_TASK,
} from "@/lib/graphql/project-tasks";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee?: { id: string; username: string; fullName?: string; avatar?: string; phone?: string } | null;

  dueDate?: string;
  order: number;
  approved: boolean;
  createdAt: string;
  project?: { id: string; title: string; status: string; progress: number };
}

const COLUMNS = [
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

const PAGE_SIZE = 50;

export default function StudentTasks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  const { data, loading, error } = useQuery(GET_MY_PROJECT_TASKS, {
    variables: { page, limit: PAGE_SIZE },
    fetchPolicy: "network-only",
  });
  const tasks: Task[] = (data as any)?.myProjectTasks?.items || [];
  const pagination = (data as any)?.myProjectTasks?.pagination;

  const totalPages = pagination?.totalPages || 1;
  const totalCount = pagination?.totalCount || tasks.length;

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const [moveTask] = useMutation(MOVE_PROJECT_TASK, {
    onError: (err) => toast.error(err.message || "Failed to move task"),
    refetchQueries: [{ query: GET_MY_PROJECT_TASKS, variables: { page, limit: PAGE_SIZE } }],
  });

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
      toast.success("Task moved");
    } catch (e) {
      // Error handled by onError
    }
  };

  const columns = COLUMNS.map((col) => ({
    ...col,
    tasks: tasks
      .filter((t) => t.status === col.id)
      .sort((a, b) => a.order - b.order),
  }));

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done" && t.approved).length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  if (error) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">Error loading tasks: {error.message}</p>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
            My Tasks
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all tasks assigned to you across your projects
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-wrap gap-3"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-xl border border-border/50">
            <span className="text-sm text-muted-foreground">Total:</span>
            <span className="font-bold text-foreground">{totalTasks}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-xl border border-border/50">
            <span className="text-sm text-muted-foreground">Done:</span>
            <span className="font-bold text-green-500">{doneTasks}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-xl border border-border/50">
            <span className="text-sm text-muted-foreground">Completion:</span>
            <span className="font-bold text-accent">{completionRate}%</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-xl border border-border/50">
            <span className="text-sm text-muted-foreground">In Progress:</span>
            <span className="font-bold text-amber-500">
              {tasks.filter(t => t.status === "in_progress").length}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-xl border border-border/50">
            <span className="text-sm text-muted-foreground">In Review:</span>
            <span className="font-bold text-purple-500">
              {tasks.filter(t => t.status === "in_review").length}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-xl border border-border/50">
            <span className="text-sm text-muted-foreground">Blocked:</span>
            <span className="font-bold text-red-500">
              {tasks.filter(t => t.status === "blocked").length}
            </span>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading your tasks...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && tasks.length === 0 && (
          <Card className="border-border/50 py-16 text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">No tasks assigned yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              You don't have any tasks assigned yet. Tasks will appear here once a trainer or admin assigns them to you.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => navigate("/portal/student/projects")}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Go to My Projects
            </Button>
          </Card>
        )}

        {/* Kanban Board */}
        {!loading && tasks.length > 0 && (
          <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Drag & drop tasks between columns to update their status
          </div>
        )}
        {!loading && tasks.length > 0 && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 min-h-[400px]">
              {columns.map((column) => (
                <div key={column.id} className="flex flex-col">
                  <div className={`rounded-xl border ${column.color} p-3 mb-2`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <column.icon className="w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-wider">
                          {column.title}
                        </h3>
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
                        className={`flex-1 space-y-2 p-1 rounded-xl min-h-[150px] transition-colors ${
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
                                className={`p-3 rounded-xl border bg-card cursor-grab transition-all hover:border-accent/40 hover:shadow-md ${
                                  snapshot.isDragging
                                    ? "shadow-xl border-accent/50 rotate-2 scale-105"
                                    : "border-border/50"
                                } ${task.approved ? "border-green-500/30 bg-green-500/5" : ""}`}
                                style={provided.draggableProps.style}
                              >
                                {/* Project indicator */}
                                {task.project && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/portal/student/projects/${task.projectId}`);
                                    }}
                                    className="flex items-center gap-1 text-[9px] text-accent font-bold uppercase tracking-wider mb-2 hover:underline"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5" />
                                    {task.project.title}
                                  </button>
                                )}

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

                                <div className="flex items-center justify-between mt-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {task.assignee ? (
                                      <div className="group relative">
                                        <Avatar className="w-5 h-5 shrink-0">
                                          <AvatarFallback className="text-[8px] bg-accent/20 text-accent font-bold">
                                            {(
                                              task.assignee.fullName ||
                                              task.assignee.username ||
                                              "?"
                                            ).charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-50">
                                          <div className="bg-popover border border-border/50 rounded-lg shadow-lg p-2 min-w-[140px]">
                                            <p className="text-[10px] font-semibold whitespace-nowrap">
                                            {task.assignee.fullName || task.assignee.username}

                                            </p>
                                            {task.assignee.phone && (

                                              <p className="text-[9px] text-muted-foreground whitespace-nowrap">
                                                📞 {task.assignee.phone}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-muted/30 flex items-center justify-center shrink-0">
                                        <span className="text-[8px] text-muted-foreground">?</span>
                                      </div>
                                    )}
                                    <span className="text-[9px] text-muted-foreground truncate max-w-[70px]">
                                      {task.assignee ? (task.assignee.fullName || task.assignee.username) : "Unassigned"}
                                    </span>
                                  </div>
                                  {task.dueDate && (
                                    <span className="text-[9px] text-muted-foreground">
                                      {new Date(task.dueDate).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                  )}
                                </div>

                                {/* Approval status */}
                                {task.approved && (
                                  <div className="mt-2 pt-2 border-t border-green-500/20">
                                    <span className="text-[9px] text-green-500 font-bold flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" /> Approved
                                    </span>
                                  </div>
                                )}
                                {task.status === "in_review" && !task.approved && (
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
                </div>
              ))}
            </div>
          </DragDropContext>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between px-2 py-4 bg-card rounded-xl border border-border/50"
          >
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{tasks.length}</span> of{" "}
              <span className="font-semibold text-foreground">{totalCount}</span> total tasks
              {totalCount > PAGE_SIZE && (
                <span className="ml-1">— Page {page} of {totalPages}</span>
              )}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="h-8 px-3 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>

              {/* Page number buttons */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  // Show pages around current page
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (page <= 4) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 p-0 text-xs ${
                        page === pageNum
                          ? "bg-accent text-accent-foreground hover:bg-accent/90"
                          : ""
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="h-8 px-3 text-xs"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </PortalLayout>
  );
}
