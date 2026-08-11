import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GET_ALL_INTERNSHIPS } from '@/lib/graphql/queries';
import {
  UPDATE_INTERNSHIP_STAGE,
  DELETE_INTERNSHIP,
} from '@/lib/graphql/mutations';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2, ArrowRight, Plus, Search, Trash2, GraduationCap, Star, UserPlus, GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { ViewInternshipDialog } from '@/components/portal/dialogs/ViewInternshipDialog';
import { AddInternDialog } from './AddInternDialog';
import { GradeInternDialog } from './GradeInternDialog';
import { StudentPool } from './StudentPool';

const STAGES = [
  { id: 1, title: 'Stage 1: Orientation & Onboarding', theme: 'sky' },
  { id: 2, title: 'Stage 2: Foundation Skills Training', theme: 'cyan' },
  { id: 3, title: 'Stage 3: Guided Practical Projects', theme: 'purple' },
  { id: 4, title: 'Stage 4: Industry Internship / Work Simulation', theme: 'amber' },
  { id: 5, title: 'Stage 5: Evaluation & Certification', theme: 'emerald' },
  { id: 6, title: 'Stage 6: Career Transition & Placement Support', theme: 'gold' }
];

const THEMES: Record<string, { bg: string, border: string, text: string, shadow: string, indicator: string, soft: string }> = {
  sky: { bg: 'bg-sky-500/5', border: 'border-sky-500/20', text: 'text-sky-500', shadow: 'shadow-sky-500/5', indicator: 'bg-sky-500', soft: 'bg-sky-500/10 text-sky-500' },
  cyan: { bg: 'bg-cyan-500/5', border: 'border-cyan-500/20', text: 'text-cyan-500', shadow: 'shadow-cyan-500/5', indicator: 'bg-cyan-500', soft: 'bg-cyan-500/10 text-cyan-500' },
  purple: { bg: 'bg-purple-500/5', border: 'border-purple-500/20', text: 'text-purple-500', shadow: 'shadow-purple-500/5', indicator: 'bg-purple-500', soft: 'bg-purple-500/10 text-purple-500' },
  amber: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-500', shadow: 'shadow-amber-500/5', indicator: 'bg-amber-500', soft: 'bg-amber-500/10 text-amber-500' },
  emerald: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-500', shadow: 'shadow-emerald-500/5', indicator: 'bg-emerald-500', soft: 'bg-emerald-500/10 text-emerald-500' },
  gold: { bg: 'bg-gold/5', border: 'border-gold/20', text: 'text-gold', shadow: 'shadow-gold/5', indicator: 'bg-gold', soft: 'bg-gold/10 text-gold' },
};

const stageForIntern = (intern: any) =>
  intern?.currentStage ||
  STAGES.find((s) => s.title === intern?.stage)?.id ||
  1;

export default function WorkflowBoard() {
  const { data, loading, refetch } = useQuery(GET_ALL_INTERNSHIPS, {
    variables: { page: 1, limit: 200 },
  });

  const [updateStage] = useMutation(UPDATE_INTERNSHIP_STAGE, {
    onCompleted: () => refetch(),
    onError: (err) => toast.error('Failed to update stage: ' + err.message),
  });
  const [deleteInternship] = useMutation(DELETE_INTERNSHIP, {
    onCompleted: () => {
      toast.success('Intern removed from the program');
      refetch();
    },
    onError: (err) => toast.error('Failed to remove intern: ' + err.message),
  });

  const internships = useMemo(() => (data as any)?.internships?.items || [], [data]);

  // Local column state, synced from the query (enables optimistic drag & drop)
  const [columns, setColumns] = useState<Record<number, any[]>>({});
  useEffect(() => {
    const next: Record<number, any[]> = {};
    STAGES.forEach((s) => { next[s.id] = []; });
    internships.forEach((i: any) => {
      const stageId = stageForIntern(i);
      (next[stageId] = next[stageId] || []).push(i);
    });
    setColumns(next);
  }, [internships]);

  const [search, setSearch] = useState('');
  const [selectedInternship, setSelectedInternship] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Add intern dialog state (can be pre-targeted to a stage or a student)
  const [addState, setAddState] = useState<{ open: boolean; defaultStageId: number; preselectedStudentId?: string }>({
    open: false, defaultStageId: 1,
  });
  // Grade dialog state
  const [gradeState, setGradeState] = useState<{ open: boolean; internship: any }>({ open: false, internship: null });

  const visibleColumns = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return columns;
    const out: Record<number, any[]> = {};
    Object.entries(columns).forEach(([k, list]) => {
      out[Number(k)] = list.filter((i: any) =>
        (i.user?.username || '').toLowerCase().includes(q) ||
        (i.user?.fullName || '').toLowerCase().includes(q) ||
        (i.title || '').toLowerCase().includes(q)
      );
    });
    return out;
  }, [columns, search]);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    // While searching, rendered indices are filtered — dragging would move the wrong card.
    // Search is cleared by the user before dragging resumes.
    if (search.trim()) return;
    const fromId = Number(source.droppableId);
    const toId = Number(destination.droppableId);
    if (fromId === toId && source.index === destination.index) return;

    const targetStage = STAGES.find((s) => s.id === toId);
    if (!targetStage) return;

    // Optimistic local reorder
    setColumns((prev) => {
      const next: Record<number, any[]> = {};
      STAGES.forEach((s) => { next[s.id] = [...(prev[s.id] || [])]; });
      const [moved] = next[fromId].splice(source.index, 1);
      if (!moved) return prev;
      const updated = {
        ...moved,
        currentStage: toId,
        stage: targetStage.title,
        progress: Math.min(100, Math.round(((toId - 1) / STAGES.length) * 100)),
      };
      next[toId].splice(destination.index, 0, updated);
      return next;
    });

    updateStage({
      variables: { id: draggableId, currentStage: toId, stage: targetStage.title },
    });
  };

  const handleRemove = async (intern: any) => {
    const name = intern.user?.fullName || intern.user?.username || 'this intern';
    if (!window.confirm(`Remove ${name} from the program board? This deletes their internship record.`)) return;
    try {
      await deleteInternship({ variables: { id: intern.id } });
    } catch (e) {
      // error surfaced by onError
    }
  };

  if (loading && internships.length === 0) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search interns by name or program..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} className="h-10 rounded-xl">
            <Loader2 className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="gold"
            className="h-10 rounded-xl"
            onClick={() => setAddState({ open: true, defaultStageId: 1 })}
          >
            <UserPlus className="w-4 h-4 mr-2" /> Add Intern
          </Button>
        </div>
      </div>

      {/* Workflow Summary Report */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGES.map((stage) => {
          const count = (columns[stage.id] || []).length;
          const theme = THEMES[stage.theme];
          return (
            <Card key={stage.id} className={`border-border/50 ${theme.bg} overflow-hidden group hover:border-accent/30 transition-all duration-300`}>
              <div className={`h-1 w-full ${theme.indicator}`} />
              <CardContent className="p-3">
                <div className="flex flex-col items-center">
                  <span className={`text-lg font-black ${theme.text}`}>{count}</span>
                  <p className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter text-center line-clamp-1">
                    {stage.title.split(': ')[1]}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-4 items-start">
        {/* All Students pool */}
        <StudentPool
          interns={internships}
          onAdd={(student) => setAddState({ open: true, defaultStageId: 1, preselectedStudentId: student.id })}
          onGrade={(intern) => setGradeState({ open: true, internship: intern })}
        />

        {/* Board */}
        <div className="flex-1 min-w-0">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar h-[calc(100vh-360px)]">
              {STAGES.map((stage) => {
                const theme = THEMES[stage.theme];
                const stageInterns = visibleColumns[stage.id] || [];
                const totalInStage = (columns[stage.id] || []).length;

                return (
                  <Droppable key={stage.id} droppableId={String(stage.id)}>
                    {(droppableProvided, snapshot) => (
                      <div
                        ref={droppableProvided.innerRef}
                        {...droppableProvided.droppableProps}
                        className={`flex-shrink-0 w-80 ${theme.bg} border-t-4 ${theme.border} rounded-xl flex flex-col h-full transition-colors ${
                          snapshot.isDraggingOver ? 'ring-2 ring-accent/40' : ''
                        }`}
                      >
                        <div className="p-3 border-b border-border/50 bg-muted/10 rounded-t-xl flex justify-between items-center gap-2">
                          <h3 className={`font-bold text-xs tracking-tight ${theme.text} line-clamp-1`}>{stage.title}</h3>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge variant="secondary" className={`${theme.soft} text-[10px] font-black`}>
                              {totalInStage}
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10"
                              title={`Add intern to ${stage.title}`}
                              onClick={() => setAddState({ open: true, defaultStageId: stage.id })}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[120px]">
                          {stageInterns.map((intern: any, idx: number) => {
                            const grades: any[] = intern.sprintReviews || [];
                            const latest = grades.length ? grades[grades.length - 1] : null;
                            return (
                              <Draggable key={intern.id} draggableId={intern.id} index={idx} isDragDisabled={!!search.trim()}>
                                {(draggableProvided, dragSnapshot) => (
                                  <div
                                    ref={draggableProvided.innerRef}
                                    {...draggableProvided.draggableProps}
                                    {...draggableProvided.dragHandleProps}
                                    onClick={() => { setSelectedInternship(intern); setDialogOpen(true); }}
                                    className={`cursor-grab active:cursor-grabbing transition-all duration-300 shadow-sm relative overflow-hidden group border-l-4 ${theme.border} hover:shadow-lg ${theme.shadow} ${
                                      dragSnapshot.isDragging ? 'shadow-2xl rotate-1 scale-[1.02] opacity-95' : ''
                                    }`}
                                  >
                                    <div className={`absolute top-0 left-0 w-1 h-full ${theme.indicator}`} />
                                    <CardContent className="p-3.5 flex flex-col gap-2.5">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="w-9 h-9 ring-2 ring-accent/10 shrink-0">
                                          {intern.user?.avatar && <AvatarImage src={intern.user.avatar} />}
                                          <AvatarFallback className="text-[10px] uppercase bg-accent/20 text-accent font-bold">
                                            {(intern.user?.fullName || intern.user?.username || 'U').substring(0, 2)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-bold text-sm truncate">{intern.user?.fullName || intern.user?.username}</p>
                                          <p className="text-[11px] text-muted-foreground truncate">{intern.title}</p>
                                        </div>
                                        <GripVertical className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                                      </div>

                                      <div className="flex justify-between items-center text-xs">
                                        <Badge variant="outline" className="text-[9px] uppercase">
                                          {intern.type}
                                        </Badge>
                                        {latest ? (
                                          <span className={`font-black text-[11px] ${Number(latest.grade) >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                                            <Star className="w-3 h-3 inline mr-0.5 -mt-0.5" /> {latest.grade}/100
                                          </span>
                                        ) : (
                                          <span className="text-accent font-bold">{intern.progress || 0}%</span>
                                        )}
                                      </div>

                                      {intern.tasks && intern.tasks.length > 0 && (
                                        <div className="text-[10px] text-muted-foreground">
                                          Tasks: {intern.tasks.filter((t: any) => t.status === 'completed').length}/{intern.tasks.length}
                                        </div>
                                      )}

                                      {/* Hover actions */}
                                      <div className="flex gap-1.5 pt-0.5">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 flex-1 rounded-lg text-[10px] font-bold sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                          onClick={(e) => { e.stopPropagation(); setGradeState({ open: true, internship: intern }); }}
                                        >
                                          <GraduationCap className="w-3 h-3 mr-1" /> Grade
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 w-9 rounded-lg text-destructive sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                                          title="Remove from program"
                                          onClick={(e) => { e.stopPropagation(); handleRemove(intern); }}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}

                          {stageInterns.length === 0 && (
                            <div className="h-24 flex items-center justify-center text-muted-foreground text-xs border-2 border-dashed border-border/40 rounded-lg">
                              Drop here
                            </div>
                          )}
                          {droppableProvided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </DragDropContext>
        </div>
      </div>

      <ViewInternshipDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        internship={selectedInternship}
        showTrainerActions={true}
      />

      <AddInternDialog
        open={addState.open}
        onOpenChange={(open) => setAddState((s) => ({ ...s, open }))}
        defaultStageId={addState.defaultStageId}
        preselectedStudentId={addState.preselectedStudentId}
        interns={internships}
        onAdded={() => refetch()}
      />

      <GradeInternDialog
        open={gradeState.open}
        onOpenChange={(open) => setGradeState((s) => ({ ...s, open }))}
        internship={gradeState.internship}
        onGraded={() => refetch()}
      />
    </div>
  );
}
