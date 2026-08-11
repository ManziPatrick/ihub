import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_ALL_STUDENTS } from '@/lib/graphql/queries';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, UserPlus, GraduationCap, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const STAGE_SHORT = [
  'Orientation',
  'Foundation',
  'Projects',
  'Internship',
  'Evaluation',
  'Career',
];

interface StudentPoolProps {
  /** Existing internships — to mark on-board status */
  interns: any[];
  onAdd: (student: any) => void;
  onGrade: (intern: any) => void;
}

export function StudentPool({ interns, onAdd, onGrade }: StudentPoolProps) {
  const [search, setSearch] = useState('');
  const { data, loading } = useQuery(GET_ALL_STUDENTS);

  const students: any[] = (data as any)?.getAllStudents || [];

  const boardMap = useMemo(() => {
    const map = new Map<string, any>();
    interns.forEach((i: any) => {
      const uid = i.user?.id || i.userId;
      if (uid && !map.has(uid)) map.set(uid, i);
    });
    return map;
  }, [interns]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = students.filter((s: any) =>
      !q ||
      (s.username || '').toLowerCase().includes(q) ||
      (s.fullName || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
    // On-board students first, then alphabetically
    return list.sort((a: any, b: any) => {
      const aOn = boardMap.has(a.id) ? 0 : 1;
      const bOn = boardMap.has(b.id) ? 0 : 1;
      if (aOn !== bOn) return aOn - bOn;
      return (a.fullName || a.username || '').localeCompare(b.fullName || b.username || '');
    });
  }, [students, search, boardMap]);

  const onBoardCount = students.filter((s) => boardMap.has(s.id)).length;

  return (
    <div className="flex-shrink-0 w-64 lg:w-72 bg-card border border-border/50 rounded-2xl flex flex-col overflow-hidden h-full">
      <div className="p-3 border-b border-border/50 bg-muted/10">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-accent" />
          <p className="text-xs font-black uppercase tracking-widest text-foreground">All Students</p>
          <Badge variant="secondary" className="ml-auto text-[10px]">
            {onBoardCount}/{students.length} on board
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 rounded-lg text-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">No students found</p>
        ) : (
          filtered.map((student: any) => {
            const intern = boardMap.get(student.id);
            const stageNum = intern?.currentStage || 1;
            return (
              <div
                key={student.id}
                className={cn(
                  'group p-2 rounded-xl border transition-all',
                  intern ? 'border-accent/20 bg-accent/5' : 'border-border/40 bg-background hover:border-accent/30'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8 shrink-0 border border-border/50">
                    {student.avatar && <AvatarImage src={student.avatar} />}
                    <AvatarFallback className="bg-accent/10 text-accent text-[10px] font-bold">
                      {(student.fullName || student.username || 'U').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{student.fullName || student.username}</p>
                    {intern ? (
                      <Badge
                        variant="outline"
                        className="mt-0.5 text-[9px] font-black uppercase tracking-wider bg-green-500/10 text-green-500 border-green-500/30"
                      >
                        <GraduationCap className="w-2.5 h-2.5 mr-1" /> {STAGE_SHORT[stageNum - 1] || `Stage ${stageNum}`}
                      </Badge>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-0.5">Not in program</p>
                    )}
                  </div>
                  {intern ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 rounded-lg text-[10px] font-bold shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      onClick={() => onGrade(intern)}
                    >
                      Grade
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="gold"
                      className="h-7 px-2 rounded-lg text-[10px] font-bold shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      onClick={() => onAdd(student)}
                    >
                      <UserPlus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
