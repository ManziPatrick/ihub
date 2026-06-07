import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CREATE_PROJECT_TASK, UPDATE_PROJECT_TASK } from "@/lib/graphql/project-tasks";
import { GET_USERS } from "@/lib/graphql/queries";
import { GET_PROJECT_TASKS } from "@/lib/graphql/project-tasks";

interface ProjectTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  task?: any | null;
  refetch?: () => void;
}

const PRIORITIES = ["low", "medium", "high", "critical"] as const;
const STATUSES = ["backlog", "todo", "in_progress", "in_review", "done", "blocked"] as const;
const LABEL_COLORS: Record<string, string> = {
  frontend: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  backend: "bg-green-500/20 text-green-400 border-green-500/30",
  bug: "bg-red-500/20 text-red-400 border-red-500/30",
  feature: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  design: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  docs: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  testing: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

export function ProjectTaskDialog({ open, onOpenChange, projectId, task, refetch }: ProjectTaskDialogProps) {
  const isEditing = !!task;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("backlog");
  const [assigneeId, setAssigneeId] = useState("");
  const [storyPoints, setStoryPoints] = useState<number>(0);
  const [dueDate, setDueDate] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [labelInput, setLabelInput] = useState("");

  const { data: usersData } = useQuery(GET_USERS);
  const students = (usersData as any)?.users?.items?.filter((u: any) =>
    u.role === "student"
  ) || [];

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setPriority(task.priority || "medium");
      setStatus(task.status || "backlog");
      setAssigneeId(task.assigneeId || "");
      setStoryPoints(task.storyPoints || 0);
      setDueDate(task.dueDate?.split("T")[0] || "");
      setLabels(task.labels || []);
    } else {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setStatus("backlog");
      setAssigneeId("");
      setStoryPoints(0);
      setDueDate("");
      setLabels([]);
    }
  }, [task, open]);

  const [createTask, { loading: creating }] = useMutation(CREATE_PROJECT_TASK, {
    onCompleted: () => {
      toast.success("Task created successfully!");
      onOpenChange(false);
      refetch?.();
    },
    onError: (err) => toast.error(err.message),
    refetchQueries: [{ query: GET_PROJECT_TASKS, variables: { projectId } }],
  });

  const [updateTask, { loading: updating }] = useMutation(UPDATE_PROJECT_TASK, {
    onCompleted: () => {
      toast.success("Task updated successfully!");
      onOpenChange(false);
      refetch?.();
    },
    onError: (err) => toast.error(err.message),
  });

  const addLabel = () => {
    const trimmed = labelInput.trim().toLowerCase();
    if (trimmed && !labels.includes(trimmed)) {
      setLabels([...labels, trimmed]);
    }
    setLabelInput("");
  };

  const removeLabel = (label: string) => {
    setLabels(labels.filter((l) => l !== label));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    const variables: any = {
      projectId,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      assigneeId: assigneeId || undefined,
      storyPoints: storyPoints > 0 ? storyPoints : undefined,
      dueDate: dueDate || undefined,
      labels: labels.length > 0 ? labels : undefined,
    };

    if (isEditing) {
      variables.id = task.id;
      variables.status = status;
      await updateTask({ variables });
    } else {
      await createTask({ variables });
    }
  };

  const loading = creating || updating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {isEditing ? "Edit Task" : "Create New Task"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build user authentication flow"
              required
              className="bg-background border-border/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the task..."
              rows={3}
              className="bg-background border-border/50"
            />
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-background border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isEditing && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-background border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Assignee & Story Points */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="bg-background border-border/50">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {students.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.fullName || s.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="points">Story Points</Label>
              <Input
                id="points"
                type="number"
                min="0"
                max="100"
                value={storyPoints}
                onChange={(e) => setStoryPoints(parseInt(e.target.value) || 0)}
                className="bg-background border-border/50"
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-background border-border/50"
            />
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <Label>Labels</Label>
            <div className="flex gap-2">
              <Input
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                placeholder="Type a label and press Add..."
                className="bg-background border-border/50"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLabel())}
              />
              <Button type="button" variant="outline" size="icon" onClick={addLabel} className="shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {labels.map((label) => (
                  <Badge
                    key={label}
                    variant="outline"
                    className={`text-[10px] uppercase font-bold border gap-1 ${LABEL_COLORS[label] || "bg-muted/30 text-muted-foreground border-border/50"}`}
                  >
                    {label}
                    <button type="button" onClick={() => removeLabel(label)} className="hover:text-destructive">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()} className="bg-accent hover:bg-accent/90">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditing ? "Update Task" : "Create Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
