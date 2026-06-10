import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Clock,
  User,
  MessageSquare,
  ThumbsUp,
  Link as LinkIcon,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Edit2
} from "lucide-react";
import { toast } from "sonner";
import { SEND_TASK_FEEDBACK } from "@/lib/graphql/project-tasks";
import { useAuth } from "@/contexts/AuthContext";

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any | null;
  onEdit?: (task: any) => void;
  onRefresh?: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  high: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  blocked: "Blocked",
};

const STATUS_COLORS: Record<string, string> = {
  backlog: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  todo: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse",
  in_review: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  done: "bg-green-500/10 text-green-400 border-green-500/20",
  blocked: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function TaskDetailDialog({ open, onOpenChange, task, onEdit, onRefresh }: TaskDetailDialogProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [resources, setResources] = useState<{ title: string; url: string }[]>([]);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");

  const [sendFeedback, { loading: sending }] = useMutation(SEND_TASK_FEEDBACK, {
    onCompleted: () => {
      toast.success("Feedback submitted successfully!");
      setMessage("");
      setResources([]);
      onRefresh?.();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit feedback");
    },
  });

  if (!task) return null;

  const isStaff = user?.role && ["admin", "super_admin", "trainer"].includes(user.role);

  const addResource = () => {
    if (!resourceTitle.trim() || !resourceUrl.trim()) {
      toast.error("Please fill in both the title and URL for the resource.");
      return;
    }
    // Simple URL validation
    if (!resourceUrl.startsWith("http://") && !resourceUrl.startsWith("https://")) {
      toast.error("URL must start with http:// or https://");
      return;
    }
    setResources([...resources, { title: resourceTitle.trim(), url: resourceUrl.trim() }]);
    setResourceTitle("");
    setResourceUrl("");
  };

  const removeResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    await sendFeedback({
      variables: {
        taskId: task.id,
        message: message.trim(),
        resources: resources,
      },
    });
  };

  const getInitials = (u: any) => {
    if (!u) return "?";
    if (u.fullName) return u.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase();
    return u.username ? u.username.slice(0, 2).toUpperCase() : "?";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-background/95 backdrop-blur-md border-border/50 shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-border/50 bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={`${STATUS_COLORS[task.status]} uppercase font-bold text-[10px]`}>
                  {STATUS_LABELS[task.status]}
                </Badge>
                <Badge variant="outline" className={`${PRIORITY_COLORS[task.priority]} uppercase font-bold text-[10px]`}>
                  {task.priority} Priority
                </Badge>
                {task.storyPoints && (
                  <Badge variant="outline" className="bg-muted text-muted-foreground border-border/50 text-[10px]">
                    {task.storyPoints} Story Points
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-xl font-heading font-bold text-foreground mt-2">
                {task.title}
              </DialogTitle>
            </div>
            {isStaff && onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-border/50 hover:bg-accent/15 hover:text-accent gap-1.5 shrink-0"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(task);
                }}
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Task
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</h4>
            <p className="text-sm leading-relaxed text-foreground/80 bg-muted/10 border border-border/30 p-4 rounded-xl whitespace-pre-wrap">
              {task.description || "No description provided for this task."}
            </p>
          </div>

          {/* Meta Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Assignee */}
            <div className="p-4 bg-muted/10 border border-border/30 rounded-xl flex items-center gap-3">
              <Avatar className="w-10 h-10 border border-border/50">
                <AvatarFallback className="bg-accent/10 text-accent font-bold text-sm">
                  {getInitials(task.assignee)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Assignee</p>
                <p className="text-sm font-semibold text-foreground">
                  {task.assignee?.fullName || task.assignee?.username || "Unassigned"}
                </p>
              </div>
            </div>

            {/* Due Date */}
            <div className="p-4 bg-muted/10 border border-border/30 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/5 border border-border/50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Due Date</p>
                <p className="text-sm font-semibold text-foreground">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  }) : "No due date set"}
                </p>
              </div>
            </div>
          </div>

          {/* Approval & Mentor Feedback */}
          {task.approved && (
            <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-bold text-sm uppercase tracking-wide">Approved Task</span>
              </div>
              {task.feedback && (
                <p className="text-sm text-green-700 dark:text-green-300 italic pl-7">
                  "{task.feedback}"
                </p>
              )}
            </div>
          )}

          {/* Developer Feedback History */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-accent" />
              Developer Comments & Resources ({task.developerFeedback?.length || 0})
            </h4>

            {task.developerFeedback && task.developerFeedback.length > 0 ? (
              <div className="space-y-4">
                {task.developerFeedback.map((fb: any, idx: number) => (
                  <div key={idx} className="flex gap-3 items-start border-b border-border/20 pb-4 last:border-0 last:pb-0">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="bg-accent/10 text-accent font-bold text-xs">
                        {getInitials(fb.user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-bold text-foreground">
                          {fb.user?.fullName || fb.user?.username || "Developer"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(parseInt(fb.createdAt) || fb.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap">{fb.message}</p>

                      {fb.resources && fb.resources.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {fb.resources.map((res: any, rIdx: number) => (
                            <a
                              key={rIdx}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/5 hover:bg-accent/10 text-accent border border-accent/20 hover:border-accent/40 rounded-full text-xs transition-all"
                            >
                              <LinkIcon className="w-3 h-3" />
                              <span>{res.title}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center bg-muted/5 border border-dashed border-border/30 rounded-xl">
                <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No resources or feedback submitted yet.</p>
              </div>
            )}
          </div>

          {/* Resource & Comment Submission Form */}
          <form onSubmit={handleSubmitFeedback} className="space-y-4 border-t border-border/40 pt-6">
            <div className="space-y-2">
              <Label htmlFor="comment-msg" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Add Progress Update / Comment
              </Label>
              <Textarea
                id="comment-msg"
                placeholder="Share your progress, describe links, or add notes for review..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                required
                className="bg-background border-border/50 text-sm"
              />
            </div>

            {/* Resources Attachment Section */}
            <div className="space-y-3 bg-muted/5 border border-border/30 rounded-xl p-4">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-accent" />
                Attach Resources (e.g. GitHub Pull Request, Design Link, Demo URL)
              </Label>

              {/* Added Resources checklist */}
              {resources.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {resources.map((res, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-background border-accent/30 text-accent font-medium text-xs px-2.5 py-1 flex items-center gap-2"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span className="max-w-[150px] truncate">{res.title}</span>
                      <button type="button" onClick={() => removeResource(index)} className="hover:text-red-500 ml-1">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Resource Entry Form Fields */}
              <div className="flex flex-col md:flex-row gap-2">
                <Input
                  placeholder="Resource Title (e.g. GitHub PR)"
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  className="bg-background border-border/50 text-xs flex-1"
                />
                <Input
                  placeholder="URL (https://...)"
                  value={resourceUrl}
                  onChange={(e) => setResourceUrl(e.target.value)}
                  className="bg-background border-border/50 text-xs flex-[2]"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addResource())}
                />
                <Button type="button" variant="outline" size="sm" onClick={addResource} className="shrink-0">
                  <Plus className="w-4 h-4 mr-1.5" /> Add
                </Button>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="submit" disabled={sending || !message.trim()} className="bg-accent hover:bg-accent/90">
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Submit Comment & Resources
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
