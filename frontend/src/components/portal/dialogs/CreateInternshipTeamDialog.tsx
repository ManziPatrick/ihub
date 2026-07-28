import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from "@apollo/client/react";
import { CREATE_INTERNSHIP_TEAM_NEW, ADD_INTERN_TO_TEAM_NEW } from '@/lib/graphql/mutations';
import { 
  GET_INTERNSHIP_TEAMS, 
  GET_INTERNSHIP_PROGRAMS, 
  GET_INTERNSHIP_PROJECTS_NEW, 
  GET_USERS,
  GET_INTERNSHIP_APPLICATIONS // Assuming this exists or we use GET_USERS filtered by approved applicants
} from '@/lib/graphql/queries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { User, Users, CheckCircle, Shield, Briefcase, Plus, X } from 'lucide-react';

interface CreateInternshipTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedProgramId?: string;
  preSelectedProjectId?: string;
}

export function CreateInternshipTeamDialog({ open, onOpenChange, preSelectedProgramId, preSelectedProjectId }: CreateInternshipTeamDialogProps) {
  const { user } = useAuth();
  const [assignmentMode, setAssignmentMode] = useState<'team' | 'individual'>('team');
  const [formData, setFormData] = useState({
    name: '',
    internshipProjectId: preSelectedProjectId || '',
    internshipProgramId: preSelectedProgramId || '',
    mentorId: user?.role === 'trainer' ? user.id : '',
    type: 'team'
  });
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Reset form when dialog opens or preSelected props change
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        internshipProjectId: preSelectedProjectId || '',
        internshipProgramId: preSelectedProgramId || '',
        mentorId: user?.role === 'trainer' ? user.id : '',
        type: 'team'
      });
      setSelectedStudentId('');
      setSelectedStudentIds([]);
      setAssignmentMode('team');
    }
  }, [open, preSelectedProgramId, preSelectedProjectId, user?.id, user?.role]);

  const { data: programsData } = useQuery(GET_INTERNSHIP_PROGRAMS);
  const { data: projectsData, loading: projectsLoading } = useQuery(GET_INTERNSHIP_PROJECTS_NEW, {
    variables: { programId: formData.internshipProgramId },
    skip: !formData.internshipProgramId,
    fetchPolicy: 'network-only'
  });
  const { data: usersData } = useQuery(GET_USERS);
  const { data: applicationsData, loading: appsLoading } = useQuery(GET_INTERNSHIP_APPLICATIONS, {
    variables: { programId: formData.internshipProgramId },
    skip: !formData.internshipProgramId,
    fetchPolicy: 'network-only'
  });

  const mentors = (usersData as any)?.users?.items?.filter((u: any) => ['trainer', 'admin', 'super_admin'].includes(u.role)) || [];
  
  const applications = (applicationsData as any)?.internshipApplications?.items || (applicationsData as any)?.internshipApplications || [];
  const uniqueStudentsMap = new Map();
  applications.forEach((app: any) => {
    if (app.user && !uniqueStudentsMap.has(app.user.id)) {
        uniqueStudentsMap.set(app.user.id, { ...app.user, applicationStatus: app.status });
    }
  });
  const students = Array.from(uniqueStudentsMap.values());

  const programs = (programsData as any)?.internshipPrograms?.items || [];
  const projects = (projectsData as any)?.internshipProjects?.items || (projectsData as any)?.internshipProjects || [];

  const [addInternToTeam] = useMutation(ADD_INTERN_TO_TEAM_NEW);

  const [createTeam, { loading }] = useMutation(CREATE_INTERNSHIP_TEAM_NEW, {
    onCompleted: (data) => {
      const teamId = (data as any).createInternshipTeam?.id;
      if (teamId) {
        if (assignmentMode === 'individual' && selectedStudentId) {
          addInternToTeam({ variables: { teamId, userId: selectedStudentId, role: 'member' } }).catch(console.error);
        } else if (assignmentMode === 'team' && selectedStudentIds.length > 0) {
          selectedStudentIds.forEach(id => {
            addInternToTeam({ variables: { teamId, userId: id, role: 'member' } }).catch(console.error);
          });
        }
      }

      toast.success(`${assignmentMode === 'individual' ? 'Individual track' : 'Internship team'} created successfully`);
      onOpenChange(false);
      setFormData({
        name: '',
        internshipProjectId: '',
        internshipProgramId: '',
        mentorId: user?.role === 'trainer' ? user.id : '',
        type: 'team'
      });
      setSelectedStudentId('');
      setSelectedStudentIds([]);
      setAssignmentMode('team');
    },
    refetchQueries: [{ query: GET_INTERNSHIP_TEAMS }],
    onError: (err) => toast.error(err.message)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalName = formData.name;
    if (assignmentMode === 'individual') {
      const student = students.find((s: any) => s.id === selectedStudentId);
      if (!student) {
        toast.error('Please select a student for individual assignment');
        return;
      }
      finalName = `Individual: ${student.fullName || student.username}`;
    }

    if (!finalName || !formData.internshipProjectId || !formData.internshipProgramId) {
      toast.error('Please fill in all required fields');
      return;
    }

    createTeam({
      variables: {
        ...formData,
        name: finalName,
        type: assignmentMode
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[32px] border-border/50 shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-br from-accent/20 via-background to-background p-8 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
               <div className="w-10 h-10 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center shadow-premium">
                  <Plus className="w-5 h-5" />
               </div>
               <div>
                  <DialogTitle className="text-xl font-black tracking-tight leading-none">New Internship Track</DialogTitle>
                  <DialogDescription className="text-xs font-medium mt-1">Assign a project to a team or an individual.</DialogDescription>
               </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6 overflow-y-auto flex-1">
          {/* Mode Selector */}
          <div className="space-y-3">
             <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Assignment Mode</Label>
             <Tabs 
               value={assignmentMode} 
               onValueChange={(val: any) => setAssignmentMode(val)}
               className="w-full"
             >
                <TabsList className="grid grid-cols-2 bg-muted/30 h-12 p-1 rounded-xl">
                   <TabsTrigger value="team" className="rounded-lg font-bold text-xs gap-2">
                      <Users className="w-3.5 h-3.5" /> Team Track
                   </TabsTrigger>
                   <TabsTrigger value="individual" className="rounded-lg font-bold text-xs gap-2">
                      <User className="w-3.5 h-3.5" /> Individual Track
                   </TabsTrigger>
                </TabsList>
             </Tabs>
          </div>

          {assignmentMode === 'team' ? (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Team Identity Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Phoenix Squad"
                className="h-12 bg-muted/30 border-border/50 rounded-xl px-4"
              />
              <div className="pt-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1 mb-2 block">Assign Approved Interns</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedStudentIds.map(id => {
                    const s = students.find((st: any) => st.id === id);
                    return s ? (
                      <Badge key={id} variant="secondary" className="gap-1 bg-accent/20 text-accent font-medium py-1 px-3 rounded-lg border-0 shadow-sm">
                        {s.fullName || s.username}
                        <button type="button" onClick={() => setSelectedStudentIds(prev => prev.filter(p => p !== id))} className="ml-1 hover:text-destructive transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
                <Select
                  value=""
                  disabled={students.length === 0 || appsLoading}
                  onValueChange={(val) => {
                    if (val && !selectedStudentIds.includes(val)) {
                        setSelectedStudentIds([...selectedStudentIds, val]);
                    }
                  }}
                >
                  <SelectTrigger className="h-10 bg-muted/20 border-border/50 rounded-xl px-4 text-xs">
                    <SelectValue placeholder={
                      appsLoading 
                        ? "Loading applicants..." 
                        : students.length > 0 
                          ? "Add a team member..." 
                          : "No approved applicants found."
                    } />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50">
                    {students.filter((s:any) => !selectedStudentIds.includes(s.id)).map((s: any) => (
                      <SelectItem key={s.id} value={s.id} className="rounded-lg text-xs">
                        {s.fullName || s.username} — [{String(s.applicationStatus || 'unknown').toUpperCase()}]
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Target Intern</Label>
              <Select
                value={selectedStudentId}
                onValueChange={setSelectedStudentId}
              >
                <SelectTrigger className="h-12 bg-muted/30 border-border/50 rounded-xl px-4">
                  <SelectValue placeholder={students.length > 0 ? "Select student..." : "No approved applicants found"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  {students.map((s: any) => (
                    <SelectItem key={s.id} value={s.id} className="rounded-lg">
                      {s.fullName || s.username} — [{String(s.applicationStatus || 'unknown').toUpperCase()}]
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Program</Label>
            <Select
              value={formData.internshipProgramId}
              disabled={!!preSelectedProgramId}
              onValueChange={(val) => setFormData({ ...formData, internshipProgramId: val, internshipProjectId: '' })}
            >
              <SelectTrigger className="h-12 bg-muted/30 border-border/50 rounded-xl px-4">
                <SelectValue placeholder="Select a program track" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50">
                {programs.map((p: any) => (
                  <SelectItem key={p.id} value={p.id} className="rounded-lg">{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Initial Project Assignment</Label>
            <Select
              value={formData.internshipProjectId}
              disabled={!!preSelectedProjectId || !formData.internshipProgramId || projectsLoading}
              onValueChange={(val) => setFormData({ ...formData, internshipProjectId: val })}
            >
              <SelectTrigger className="h-12 bg-muted/30 border-border/50 rounded-xl px-4">
                <SelectValue placeholder={
                  !formData.internshipProgramId
                    ? "First select a program"
                    : projectsLoading
                      ? "Loading available projects..."
                      : projects.length === 0
                        ? "No projects found for this track"
                        : "Select a base project"
                } />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50">
                {projects.map((p: any) => (
                  <SelectItem key={p.id} value={p.id} className="rounded-lg">{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Assigned Mentor</Label>
            <Select
              value={formData.mentorId}
              onValueChange={(val) => setFormData({ ...formData, mentorId: val })}
            >
              <SelectTrigger className="h-12 bg-muted/30 border-border/50 rounded-xl px-4">
                <SelectValue placeholder="Select a technical guide" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50">
                {mentors.map((m: any) => (
                  <SelectItem key={m.id} value={m.id} className="rounded-lg">
                    {m.fullName || m.username} ({m.role.replace('_', ' ')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4 flex gap-3">
             <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl font-bold border-border/50" onClick={() => onOpenChange(false)}>Cancel</Button>
             <Button type="submit" disabled={loading} className="flex-1 h-12 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 shadow-premium font-bold gap-2">
               {loading ? (
                  <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
               ) : <><CheckCircle className="w-4 h-4" /> Create Track</>}
             </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
