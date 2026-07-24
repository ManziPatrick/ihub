import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  GET_INTERNSHIP_TASKS,
  GET_INTERNSHIP_SPRINTS,
  GET_INTERNSHIP_PROJECT_FULL,
  GET_USERS
} from '@/lib/graphql/queries';
import {
  CREATE_INTERNSHIP_TASK,
  MOVE_INTERNSHIP_TASK_STATUS,
  APPROVE_INTERNSHIP_TASK,
  REJECT_INTERNSHIP_TASK,
  DELETE_INTERNSHIP_TASK
} from '@/lib/graphql/mutations';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { usePusher } from '@/hooks/use-pusher';
import {
  Plus, X, ChevronRight, LayoutGrid, List, BookOpen,
  Zap, Target, Rocket, Eye, CheckCircle, Clock, Loader2,
  ArrowLeft, Settings, Users, Filter, User, AlertTriangle,
  FileText, Link2, Image, Trash2, Calendar, Flag,
  ChevronDown, ArrowUpCircle, MessageSquare, MoreHorizontal,
  Paperclip
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TaskDetailDialog } from './TaskDetailDialog';
import { SprintPlanningPanel } from './SprintPlanningPanel';
import { WorkflowSettingsDialog } from './WorkflowSettingsDialog';
import ReactMarkdown from 'react-markdown';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, normalizeContent } from '@/lib/utils';

const DEFAULT_WORKFLOW = [
  { id: 'todo', label: 'To Do', color: 'bg-slate-500/10 border-slate-500/20 text-slate-500', icon: 'todo', type: 'todo' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500/10 border-blue-500/20 text-blue-500', icon: 'progress', type: 'progress' },
  { id: 'in_testing', label: 'In Testing', color: 'bg-orange-500/10 border-orange-500/20 text-orange-500', icon: 'testing', type: 'testing' },
  { id: 'in_review', label: 'In Review', color: 'bg-purple-500/10 border-purple-500/20 text-purple-500', icon: 'review', type: 'review' },
  { id: 'done', label: 'Done ⏳', color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600', icon: 'done', type: 'done' },
  { id: 'staged', label: 'Staged', color: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600', icon: 'staged', type: 'staged' },
  { id: 'completed', label: 'Completed ✅', color: 'bg-green-500/10 border-green-500/20 text-green-600', icon: 'completed', type: 'completed' }
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  low: { label: 'Low', color: 'text-slate-400', bg: 'bg-slate-400/10', icon: ChevronDown },
  medium: { label: 'Medium', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Clock },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-400/10', icon: ArrowUpCircle },
  critical: { label: 'Critical', color: 'text-red-500', bg: 'bg-red-500/10', icon: AlertTriangle },
};

const TYPE_ICONS: Record<string, any> = {
  task: CheckCircle,
  bug: AlertTriangle,
  feature: Zap,
  improvement: Target,
};

interface ProjectBoardProps {
  projectId: string;
  teamId: string;
  teamName?: string;
  projectTitle?: string;
  teamMembers?: any[];
  onBack?: () => void;
}

export function ProjectBoard({ projectId, teamId, teamName, projectTitle: propTitle, teamMembers: propMembers, onBack }: ProjectBoardProps) {
  const { user } = useAuth();
  const pusher = usePusher();
  const isAdminOrTrainer = ['admin', 'super_admin', 'trainer'].includes(user?.role || '');

  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showSprintPanel, setShowSprintPanel] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showWorkflowSettings, setShowWorkflowSettings] = useState(false);
  const [showAddTask, setShowAddTask] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [filterByMe, setFilterByMe] = useState(user?.role === 'student');

  const { data: projectData } = useQuery(GET_INTERNSHIP_PROJECT_FULL, {
    variables: { id: projectId }, skip: !projectId
  });
  const project = (projectData as any)?.internshipProject;

  const columns = project?.workflow?.length ? project.workflow : DEFAULT_WORKFLOW;

  const { data: sprintsRaw, refetch: refetchSprints } = useQuery(GET_INTERNSHIP_SPRINTS, {
    variables: { projectId, teamId }, skip: !projectId
  });
  const sprints = (sprintsRaw as any)?.internshipSprints || [];

  const { data: tasksRaw, refetch: refetchTasks } = useQuery(GET_INTERNSHIP_TASKS, {
    variables: {
      projectId,
      teamId,
      ...(selectedSprintId ? { sprintId: selectedSprintId } : {})
    },
    skip: !projectId, fetchPolicy: 'cache-and-network'
  });
  const allTasks: any[] = (tasksRaw as any)?.internshipTasks || [];

  const { data: usersData } = useQuery(GET_USERS, { skip: !isAdminOrTrainer || !!propMembers });
  const members = propMembers || ((usersData as any)?.users?.filter((u: any) => u.role === 'student' || u.role === 'intern') || []);

  useEffect(() => {
    if (pusher && teamId) {
      const channel = pusher.subscribe(`team-${teamId}`);
      const handleUpdate = () => { refetchTasks(); refetchSprints(); };
      channel.bind('task_created', handleUpdate);
      channel.bind('task_updated', handleUpdate);
      channel.bind('task_moved', handleUpdate);
      channel.bind('comment_added', handleUpdate);
      return () => { pusher.unsubscribe(`team-${teamId}`); };
    }
  }, [pusher, teamId, refetchTasks, refetchSprints]);

  const [createTask, { loading: creatingTask }] = useMutation(CREATE_INTERNSHIP_TASK, {
    onCompleted: () => { refetchTasks(); setShowAddTask(null); setNewTaskTitle(''); toast.success('Task created'); },
    onError: e => toast.error(e.message)
  });

  const [moveStatus] = useMutation(MOVE_INTERNSHIP_TASK_STATUS, {
    onCompleted: () => refetchTasks(),
    onError: e => toast.error(e.message)
  });

  const [approveTask] = useMutation(APPROVE_INTERNSHIP_TASK, {
    onCompleted: () => { refetchTasks(); toast.success('Task approved! Moved to Staged.'); },
    onError: e => toast.error(e.message)
  });

  const [rejectTask] = useMutation(REJECT_INTERNSHIP_TASK, {
    onCompleted: () => { refetchTasks(); setShowRejectDialog(null); setRejectReason(''); toast.success('Task sent back for revision.'); },
    onError: e => toast.error(e.message)
  });

  const [deleteTask] = useMutation(DELETE_INTERNSHIP_TASK, {
    onCompleted: () => { refetchTasks(); toast.success('Task deleted.'); },
    onError: e => toast.error(e.message)
  });

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const task = allTasks.find(t => t.id === draggableId);
    if (!task) return;

    const targetStage = columns.find((c: any) => c.id === destination.droppableId);
    if (!targetStage) return;

    // Students can move tasks forward through the workflow, but final approval stages remain restricted to trainers/admins.
    const isFinalStage = ['staged', 'completed'].includes(targetStage.type || targetStage.id);

    if (isFinalStage && !isAdminOrTrainer) {
      toast.error(`Only trainers or admins can move tasks to ${targetStage.label}.`);
      return;
    }

    // Enforce "Move to Next" (Forward Only) for students
    if (!isAdminOrTrainer) {
        const sourceStage = columns.find((c: any) => c.id === source.droppableId);
        if (sourceStage && targetStage.order <= sourceStage.order) {
            toast.error("Students can only move tasks forward to the next stage.");
            return;
        }
    }

    moveStatus({ variables: { id: draggableId, status: destination.droppableId } });
  };

  const handleQuickAddTask = (colId: string) => {
    if (!newTaskTitle.trim()) return;
    createTask({
      variables: {
        projectId,
        teamId,
        title: newTaskTitle.trim(),
        sprintId: selectedSprintId || null,
        status: colId,
        priority: 'medium'
      }
    });
  };

  const tasksByColumn = columns.reduce((acc: any, col: any) => {
    acc[col.id] = allTasks.filter(t => {
        const matchesCol = t.status === col.id;
        if (!matchesCol) return false;
        if (filterByMe) return t.assigneeId === user?.id;
        return true;
    });
    return acc;
  }, {} as Record<string, any[]>);

  const activeSprint = sprints.find((s: any) => s.id === selectedSprintId);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-8 py-5 border-b border-border/50 bg-background/80 backdrop-blur-md shrink-0">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl h-10 w-10 hover:bg-muted/50">
            <ArrowLeft className="w-5 h-5 font-black" />
          </Button>
        )}
        <div className="flex items-center gap-4 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-accent/10 shrink-0 flex items-center justify-center border border-accent/20 shadow-inner">
            <LayoutGrid className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-xl text-foreground tracking-tight leading-none truncate max-w-[200px] sm:max-w-[300px] lg:max-w-[400px] xl:max-w-[600px]">{project?.title || propTitle || 'Project Board'}</h1>
            {teamName && <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1.5 flex items-center gap-2 truncate">
                <Users className="w-3 h-3 text-accent/60 shrink-0" /> <span className="truncate">{teamName}</span>
            </p>}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="hidden xl:flex flex-col gap-2 w-64 mr-8">
            <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Team Performance</span>
                <span className="text-[10px] font-black uppercase text-accent tracking-widest">
                    {allTasks.length > 0 ? Math.round((allTasks.filter(t => t.status === 'completed').length / allTasks.length) * 100) : 0}%
                </span>
            </div>
            <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden border border-border/10 shadow-inner">
                <div 
                    className="h-full bg-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)] transition-all duration-1000 ease-out rounded-full"
                    style={{ width: `${allTasks.length > 0 ? (allTasks.filter(t => t.status === 'completed').length / allTasks.length) * 100 : 0}%` }}
                />
            </div>
        </div>

        {/* Sprint Selector */}
        <div className="flex items-center gap-3">
          <Select value={selectedSprintId || 'all'} onValueChange={v => setSelectedSprintId(v === 'all' ? null : v)}>
            <SelectTrigger className="h-10 bg-muted/20 border-border/40 rounded-xl text-xs font-black w-52 shadow-sm focus:ring-0">
              <SelectValue>{activeSprint ? activeSprint.title : 'All Active Sprints'}</SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border/50 shadow-2xl">
              <SelectItem value="all" className="font-black">All Active Sprints</SelectItem>
              {sprints.map((s: any) => (
                <SelectItem key={s.id} value={s.id} className="font-bold">
                  {s.title} <span className="text-muted-foreground/60 ml-2 font-medium">({s.status})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-xl border border-border/40">
            <Button
              variant={filterByMe ? "gold" : "ghost"}
              size="icon"
              className={cn("h-8 w-8 rounded-lg transition-all", filterByMe ? "shadow-lg bg-accent text-accent-foreground" : "text-muted-foreground")}
              onClick={() => setFilterByMe(!filterByMe)}
              title={filterByMe ? "Showing My Tasks" : "Showing All Tasks"}
            >
              <User className={cn("w-4 h-4", filterByMe ? "animate-pulse" : "")} />
            </Button>
            
            {isAdminOrTrainer && (
              <>
                <div className="w-px h-4 bg-border/40 mx-1" />
                <Button variant="ghost" size="sm" onClick={() => setShowSprintPanel(true)} className="h-8 rounded-lg gap-1.5 font-black uppercase text-[10px] px-3">
                  <Rocket className="w-3.5 h-3.5" /> Sprints
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowWorkflowSettings(true)} className="h-8 rounded-lg gap-1.5 font-black uppercase text-[10px] px-3">
                  <Settings className="w-3.5 h-3.5" /> Workflow
                </Button>
              </>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={() => setShowDocs(!showDocs)} className={cn("h-10 rounded-xl gap-2 font-black uppercase text-[10px] border-border/40 px-4 shadow-sm transition-all", showDocs ? 'bg-accent text-accent-foreground border-accent shadow-accent/20' : 'bg-background')}>
            <BookOpen className="w-4 h-4" /> Blueprint
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
            <div className="flex gap-6 h-full p-8 min-w-max">
              {columns.map((col: any) => (
                <div key={col.id} className="w-80 flex flex-col group/col">
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-5 px-1 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest shadow-sm", col.color || 'bg-muted/30 border-border/30 text-muted-foreground')}>
                            {col.label}
                        </div>
                        <Badge variant="secondary" className="text-[10px] font-black h-5 min-w-5 flex items-center justify-center rounded-full bg-muted/50 border-border/20">
                            {tasksByColumn[col.id]?.length || 0}
                        </Badge>
                    </div>
                    {isAdminOrTrainer && (
                        <button className="opacity-0 group-hover/col:opacity-100 transition-opacity p-1.5 hover:bg-muted/50 rounded-lg text-muted-foreground">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    )}
                  </div>

                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={cn(
                          "flex-1 overflow-y-auto px-1 space-y-3 pb-8 custom-scrollbar rounded-3xl transition-all duration-300",
                          snapshot.isDraggingOver ? "bg-accent/[0.03] ring-2 ring-accent/10 ring-inset" : "bg-transparent"
                        )}
                      >
                        {tasksByColumn[col.id]?.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                    "transition-all",
                                    snapshot.isDragging ? "shadow-2xl scale-105 z-50" : ""
                                )}
                              >
                                <TaskCard
                                  task={task}
                                  isAdminOrTrainer={isAdminOrTrainer}
                                  onClick={() => setSelectedTask(task)}
                                  onApprove={() => approveTask({ variables: { id: task.id } })}
                                  onReject={() => { setShowRejectDialog(task); setRejectReason(''); }}
                                  onDelete={() => confirm('Delete this task?') && deleteTask({ variables: { id: task.id } })}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {/* Quick add */}
                        {showAddTask === col.id ? (
                          <div className="p-4 rounded-3xl border-2 border-accent/40 bg-accent/5 space-y-3 animate-in zoom-in-95 duration-200">
                            <Textarea
                              autoFocus
                              placeholder="What needs to be done?"
                              value={newTaskTitle}
                              onChange={e => setNewTaskTitle(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuickAddTask(col.id); } if (e.key === 'Escape') { setShowAddTask(null); setNewTaskTitle(''); } }}
                              className="h-20 text-xs bg-background border-border/50 rounded-2xl p-3 resize-none focus-visible:ring-accent/20"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" className="flex-1 h-9 rounded-xl bg-accent text-accent-foreground font-black text-[10px] uppercase tracking-wider" onClick={() => handleQuickAddTask(col.id)} disabled={creatingTask}>
                                {creatingTask ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create Ticket'}
                              </Button>
                              <Button size="sm" variant="ghost" className="h-9 w-9 rounded-xl" onClick={() => { setShowAddTask(null); setNewTaskTitle(''); }}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          isAdminOrTrainer && (
                            <button
                              className="w-full flex items-center gap-2 p-4 rounded-3xl border-2 border-dashed border-border/20 text-muted-foreground hover:text-accent hover:border-accent/40 hover:bg-accent/5 transition-all text-[11px] font-black uppercase tracking-widest group"
                              onClick={() => { setShowAddTask(col.id); setNewTaskTitle(''); }}
                            >
                              <Plus className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent transition-colors" />
                              New Ticket
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </div>
        </DragDropContext>

        {/* Docs Sidebar */}
        {showDocs && (
          <div className="w-[450px] border-l border-border/40 flex flex-col bg-background/50 backdrop-blur-xl shrink-0 animate-in slide-in-from-right-full duration-500">
            <div className="p-8 border-b border-border/40 flex items-center justify-between bg-muted/10">
              <div>
                  <h3 className="font-black text-lg tracking-tight flex items-center gap-3">
                    <FileText className="w-5 h-5 text-accent" /> Project Blueprint
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Foundational Specifications</p>
              </div>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => setShowDocs(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <ScrollArea className="flex-1 p-8">
              <div className="prose prose-sm dark:prose-invert max-w-none prose-h1:text-2xl prose-h1:font-black prose-p:leading-relaxed prose-li:my-1">
                {project?.document ? (
                  <ReactMarkdown>{normalizeContent(project.document)}</ReactMarkdown>
                ) : (
                  <div className="text-center py-20 text-muted-foreground opacity-40">
                    <FileText className="w-16 h-16 mx-auto mb-4" />
                    <p className="font-black uppercase tracking-widest text-xs">No blueprint authored yet.</p>
                  </div>
                )}
              </div>

              {project?.documentation?.links?.length > 0 && (
                <div className="mt-12 space-y-4">
                  <p className="text-[10px] font-black uppercase text-accent tracking-widest bg-accent/5 py-1.5 px-4 rounded-full border border-accent/10 inline-block">External Resources</p>
                  <div className="grid gap-3">
                      {project.documentation.links.map((l: any, i: number) => (
                        <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 rounded-2xl border border-border/40 bg-background/50 hover:border-accent/40 hover:bg-muted/20 transition-all group shadow-sm">
                          <div className="w-10 h-10 rounded-xl bg-accent/5 flex items-center justify-center border border-accent/10 group-hover:bg-accent group-hover:text-accent-foreground transition-all">
                              <Link2 className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                              <p className="text-sm font-black truncate">{l.title || 'Untitled Resource'}</p>
                              <p className="text-[10px] text-muted-foreground truncate opacity-60">{l.url}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:translate-x-1 transition-all" />
                        </a>
                      ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Task Detail Dialog */}
      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          projectId={projectId}
          teamId={teamId}
          isAdminOrTrainer={isAdminOrTrainer}
          members={members}
          sprints={sprints}
          workflow={columns}
          onClose={() => setSelectedTask(null)}
          onUpdated={refetchTasks}
          onApprove={() => { approveTask({ variables: { id: selectedTask.id } }); setSelectedTask(null); }}
          onReject={() => { setShowRejectDialog(selectedTask); setSelectedTask(null); }}
        />
      )}

      {/* Sprint Panel */}
      {showSprintPanel && (
        <SprintPlanningPanel
          projectId={projectId}
          teamId={teamId}
          sprints={sprints}
          onClose={() => setShowSprintPanel(false)}
          onUpdated={refetchSprints}
        />
      )}

      {/* Workflow Settings */}
      {showWorkflowSettings && (
        <WorkflowSettingsDialog
          open={showWorkflowSettings}
          onOpenChange={setShowWorkflowSettings}
          projectId={projectId}
          currentWorkflow={columns}
          onUpdated={() => { refetchTasks(); }}
        />
      )}

      {/* Reject Dialog */}
      <Dialog open={!!showRejectDialog} onOpenChange={() => setShowRejectDialog(null)}>
        <DialogContent className="rounded-3xl border-border/50 max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-black tracking-tight flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-500" /> Send Back for Revision
            </DialogTitle>
            <DialogDescription className="text-xs font-medium">The task will return to the active pool. The team will be notified of required changes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 my-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Reason for rejection</Label>
            <Textarea
              placeholder="What specifically needs to be improved?"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="rounded-2xl border-border/50 bg-muted/20 min-h-[120px] text-sm focus-visible:ring-orange-500/20"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowRejectDialog(null)} className="rounded-xl font-bold">Cancel</Button>
            <Button className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-[10px] tracking-widest h-10 px-6 gap-2" onClick={() => {
              rejectTask({ variables: { id: showRejectDialog.id, reason: rejectReason } });
            }}>
              <AlertTriangle className="w-4 h-4" /> Request Revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Task Card ───────────────────────────────────────────────────────────────

function TaskCard({ task, isAdminOrTrainer, onClick, onApprove, onReject, onDelete }: any) {
  const stage = (task.project?.workflow || DEFAULT_WORKFLOW).find((c: any) => c.id === task.status);
  const isDone = stage?.type === 'done';
  const isCompleted = stage?.type === 'completed';
  const priorityInfo = PRIORITY_CONFIG[task.priority || 'medium'];
  const typeIcon = TYPE_ICONS[task.taskType || 'task'] || CheckCircle;

  return (
    <div
      onClick={onClick}
      className={cn(
          "group relative p-5 rounded-3xl border cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-accent/40 active:scale-[0.98] bg-background/60 backdrop-blur-sm border-border/40",
          isDone ? 'ring-2 ring-yellow-500/20 bg-yellow-500/[0.02]' : isCompleted ? 'ring-2 ring-emerald-500/20 bg-emerald-500/[0.02]' : ''
      )}
    >
      <div className="space-y-4">
        {/* Top Info */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-lg bg-muted/30", priorityInfo.color)}>
                    {(() => { const Icon = typeIcon; return <Icon className="w-3.5 h-3.5" />; })()}
                </div>
                <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">TICKET-{task.id?.slice(-4).toUpperCase()}</span>
            </div>
            <div className={cn("flex items-center gap-1 font-black text-[9px] uppercase tracking-tighter px-2 py-0.5 rounded-lg", priorityInfo.bg, priorityInfo.color)}>
                {(() => { const Icon = priorityInfo.icon; return <Icon className="w-3 h-3" />; })()}
                {priorityInfo.label}
            </div>
        </div>

        {/* Title */}
        <p className="text-sm font-black text-foreground/90 leading-tight line-clamp-2 min-h-[2.5rem]">{task.title}</p>

        {/* Labels */}
        {task.labels?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {task.labels.slice(0, 3).map((l: string, i: number) => (
              <span key={i} className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-accent/5 text-accent/80 border border-accent/10">{l}</span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 flex items-center justify-between border-t border-border/10">
          <div className="flex items-center gap-3">
             {task.storyPoints && (
                <div className="flex items-center gap-1 text-[10px] font-black text-muted-foreground/60">
                    <Zap className="w-3 h-3" /> {task.storyPoints}
                </div>
             )}
             {task.comments?.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-black text-muted-foreground/60">
                    <MessageSquare className="w-3 h-3" /> {task.comments.length}
                </div>
             )}
             {task.attachments?.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-black text-muted-foreground/60">
                    <Paperclip className="w-3 h-3" /> {task.attachments.length}
                </div>
             )}
          </div>

          {/* Assignee */}
          {task.assignee ? (
            <Avatar className="w-6 h-6 rounded-xl ring-2 ring-background border border-border/10 shadow-sm">
              <AvatarImage src={task.assignee.avatar} />
              <AvatarFallback className="text-[9px] font-black bg-accent/10 text-accent uppercase">
                {task.assignee.username?.[0]}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-6 h-6 rounded-xl border-2 border-dashed border-border/20 flex items-center justify-center">
              <User className="w-3 h-3 text-muted-foreground/20" />
            </div>
          )}
        </div>

        {/* Admin Quick Actions for "Done" tasks */}
        {isDone && isAdminOrTrainer && (
          <div className="pt-2 flex gap-2" onClick={e => e.stopPropagation()}>
            <Button size="sm" className="flex-1 h-8 rounded-xl bg-green-500 hover:bg-green-600 text-white font-black text-[9px] uppercase tracking-widest shadow-lg shadow-green-500/20" onClick={onApprove}>
              Approve
            </Button>
            <Button size="sm" variant="outline" className="flex-1 h-8 rounded-xl border-orange-500/20 text-orange-600 hover:bg-orange-500/5 font-black text-[9px] uppercase tracking-widest" onClick={onReject}>
              Revise
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
