import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_ALL_STUDENTS } from '@/lib/graphql/queries';
import { CREATE_INTERNSHIP } from '@/lib/graphql/mutations';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Search, UserPlus, Users, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STAGES = [
  { id: 1, title: 'Stage 1: Orientation & Onboarding' },
  { id: 2, title: 'Stage 2: Foundation Skills Training' },
  { id: 3, title: 'Stage 3: Guided Practical Projects' },
  { id: 4, title: 'Stage 4: Industry Placement / Work Simulation' },
  { id: 5, title: 'Stage 5: Evaluation & Certification' },
  { id: 6, title: 'Stage 6: Career Transition & Placement Support' },
];

interface AddInternDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Target stage when opened from a column "+" button */
  defaultStageId?: number;
  /** Pre-select a student when opened from the student pool */
  preselectedStudentId?: string;
  /** Existing internships — used to mark which students are already on the board */
  interns: any[];
  onAdded?: () => void;
}

export function AddInternDialog({
  open, onOpenChange, defaultStageId = 1, preselectedStudentId, interns, onAdded,
}: AddInternDialogProps) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>(preselectedStudentId || '');
  const [stageId, setStageId] = useState<number>(defaultStageId);
  const [adding, setAdding] = useState<string | null>(null);

  // Re-sync when the dialog reopens with a different target stage / pre-selected student
  useEffect(() => {
    if (open) {
      setStageId(defaultStageId);
      setSelectedId(preselectedStudentId || '');
      setSearch('');
    }
  }, [open, defaultStageId, preselectedStudentId]);

  const { data, loading } = useQuery(GET_ALL_STUDENTS, { skip: !open });

  const students: any[] = (data as any)?.getAllStudents || [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s: any) =>
      !q ||
      (s.username || '').toLowerCase().includes(q) ||
      (s.fullName || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
  }, [students, search]);

  // student id -> internship (if already on the board)
  const boardMap = useMemo(() => {
    const map = new Map<string, any>();
    interns.forEach((i: any) => {
      const uid = i.user?.id || i.userId;
      if (uid && !map.has(uid)) map.set(uid, i);
    });
    return map;
  }, [interns]);

  const selectedStudent = students.find((s: any) => s.id === selectedId);
  const selectedStage = STAGES.find((s) => s.id === stageId) || STAGES[0];

  const [createInternship] = useMutation(CREATE_INTERNSHIP, {
    onCompleted: () => {
      toast.success(`${selectedStudent?.fullName || selectedStudent?.username || 'Student'} added to ${selectedStage.title}`);
      setSelectedId('');
      onAdded?.();
    },
    onError: (err) => toast.error('Failed to add student: ' + err.message),
  });

  const handleAdd = async (student: any) => {
    setAdding(student.id);
    try {
      await createInternship({
        variables: {
          userId: student.id,
          title: `${student.fullName || student.username} — Opportunity Program`,
          organization: 'Ihub Academy',
          duration: '6 Months',
          type: 'Online',
          stage: selectedStage.title,
          payment: {
            amount: 0,
            currency: 'RWF',
            status: 'pending',
            isPaidProgram: false,
          },
        },
      });
      onOpenChange(false);
    } finally {
      setAdding(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl border-border/60 max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-accent" />
            </div>
            Add Student to Program
          </DialogTitle>
          <DialogDescription>
            See all students — add anyone to a stage of the academy program. Students already on the board are marked.
          </DialogDescription>
        </DialogHeader>

        {/* Stage picker */}
        <div className="px-6 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground shrink-0">Place into:</span>
            <Select value={String(stageId)} onValueChange={(v) => setStageId(Number(v))}>
              <SelectTrigger className="h-9 w-auto min-w-[280px] rounded-xl text-xs font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {STAGES.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)} className="text-xs">{s.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="px-6 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search all students by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No students found</div>
          ) : (
            filtered.map((student: any) => {
              const onBoard = boardMap.get(student.id);
              return (
                <div
                  key={student.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-all',
                    onBoard ? 'border-border/40 bg-muted/10 opacity-80' : 'border-border/50 bg-background hover:border-accent/40 hover:shadow-sm',
                    selectedId === student.id && 'border-accent/50 ring-1 ring-accent/20'
                  )}
                  onClick={() => !onBoard && setSelectedId(student.id)}
                >
                  <Avatar className="h-9 w-9 border border-border/50">
                    {student.avatar && <AvatarImage src={student.avatar} />}
                    <AvatarFallback className="bg-accent/10 text-accent text-xs font-bold">
                      {(student.fullName || student.username || 'U').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{student.fullName || student.username}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{student.email}</p>
                  </div>

                  {onBoard ? (
                    <Badge variant="outline" className="shrink-0 text-[10px] font-black uppercase bg-green-500/10 text-green-500 border-green-500/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Stage {onBoard.currentStage || 1}
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="gold"
                      className="h-8 rounded-lg text-xs font-bold shrink-0"
                      disabled={adding === student.id}
                      onClick={(e) => { e.stopPropagation(); handleAdd(student); }}
                    >
                      {adding === student.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                      <span className="ml-1">Add</span>
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {students.length === 0 && !loading && (
          <div className="px-6 pb-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Users className="w-4 h-4" /> No students found on the platform yet.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
