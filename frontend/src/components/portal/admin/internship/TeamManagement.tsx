import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@apollo/client/react";
import { 
  Plus, 
  Users, 
  Edit, 
  Trash2, 
  ClipboardList, 
  User, 
  MoreVertical, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Calendar,
  LayoutGrid,
  List,
  Search,
  Filter,
  ArrowRight,
  Shield,
  Briefcase,
  ExternalLink
} from 'lucide-react';
import { ProjectBoard } from './ProjectBoard';
import { toast } from 'sonner';
import { CreateInternshipTeamDialog, InternshipProjectDetailsDialog, CreateInternshipMeetingDialog, ManageTeamMembersDialog } from '@/components/portal/dialogs';
import { TextEditor } from '@/components/ui/text-editor';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  GET_INTERNSHIP_TEAMS,
  GET_INTERNSHIP_PROGRAMS,
  GET_INTERNSHIP_PROJECTS_NEW,
  GET_ADMIN_DASHBOARD_DATA
} from '@/lib/graphql/queries';
import {
  CREATE_PROJECT,
  UPDATE_INTERNSHIP_TEAM_NEW,
  DELETE_INTERNSHIP_TEAM_NEW,
  ASSIGN_PROJECT_TO_TEAM
} from '@/lib/graphql/mutations';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: 'Active', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: CheckCircle },
  on_hold: { label: 'On Hold', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Clock },
  disbanded: { label: 'Disbanded', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertCircle },
};

export default function TeamManagement() {
  const [createOpen, setCreateOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [manageMembersOpen, setManageMembersOpen] = useState(false);
  const [selectedTeamForManage, setSelectedTeamForManage] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [boardTeam, setBoardTeam] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  
  const { data: teamsData, loading: teamsLoading, refetch } = useQuery(GET_INTERNSHIP_TEAMS, {
    variables: { page: currentPage, limit: pageSize }
  });
  const { data: coursesData } = useQuery(GET_INTERNSHIP_PROGRAMS);
  const { data: templatesData } = useQuery(GET_INTERNSHIP_PROJECTS_NEW);

  const [newAssignment, setNewAssignment] = useState({
    title: "",
    course: "", // Project Program ID
    description: "",
    deadline: "",
    tasks: [{ title: "", completed: false }],
    links: [{ title: "", url: "" }]
  });

  const [createProject, { loading: creatingProject }] = useMutation(CREATE_PROJECT, {
    refetchQueries: [{ query: GET_INTERNSHIP_TEAMS }, { query: GET_ADMIN_DASHBOARD_DATA }]
  });
  const [assignProject, { loading: assigningProject }] = useMutation(ASSIGN_PROJECT_TO_TEAM, {
    refetchQueries: [{ query: GET_INTERNSHIP_TEAMS }, { query: GET_ADMIN_DASHBOARD_DATA }],
    onCompleted: () => {
      toast.success('Project assigned and tickets cloned successfully');
      setAssignmentOpen(false);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to assign project');
    }
  });

  const [updateTeam, { loading: updatingTeam }] = useMutation(UPDATE_INTERNSHIP_TEAM_NEW, {
    refetchQueries: [{ query: GET_INTERNSHIP_TEAMS }, { query: GET_ADMIN_DASHBOARD_DATA }],
    onCompleted: () => {
      toast.success('Team updated');
      refetch();
    },
    onError: (err) => toast.error(err.message)
  });

  const [deleteTeam] = useMutation(DELETE_INTERNSHIP_TEAM_NEW, {
    refetchQueries: [{ query: GET_INTERNSHIP_TEAMS }, { query: GET_ADMIN_DASHBOARD_DATA }],
    onCompleted: () => {
      toast.success('Team deleted');
      refetch();
    },
    onError: (err) => toast.error(err.message)
  });

  // Open project board for a team
  if (boardTeam) {
    return (
      <ProjectBoard
        projectId={boardTeam.internshipProjectId}
        teamId={boardTeam.id}
        teamName={boardTeam.name}
        projectTitle={boardTeam.internshipProject?.title}
        teamMembers={boardTeam.members}
        onBack={() => setBoardTeam(null)}
      />
    );
  }

  if (teamsLoading) return (
    <div className="flex items-center justify-center p-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
    </div>
  );

  const allTeams = (teamsData as any)?.internshipTeams?.items || [];
  const pagination = (teamsData as any)?.internshipTeams?.pagination;
  const filteredTeams = allTeams.filter((t: any) => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.internshipProject?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusUpdate = (id: string, status: string) => {
    updateTeam({ variables: { id, status } });
  };

  const handleDeleteTeam = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteTeam({ variables: { id } });
    }
  };

  const handleGiveAssignment = async () => {
    if (!selectedTeam || !newAssignment.course) {
      toast.error("Please select a project to assign");
      return;
    }

    try {
      await assignProject({
        variables: {
          teamId: selectedTeam.id,
          projectId: newAssignment.course, // Using 'course' as the project template ID
        }
      });
      // Toast and close handled in onCompleted
    } catch (error: any) {
      // Error handled in onError
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-1 font-medium">Coordinate and track opportunity assignments.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
            <Input 
              placeholder="Search teams or projects..." 
              className="pl-9 w-64 bg-muted/30 border-border/50 rounded-xl focus:ring-accent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            variant="outline"
            className="border-accent/30 text-accent hover:bg-accent/5 shadow-premium rounded-xl font-bold gap-2"
            onClick={() => {
              setSelectedTeam(null);
              setNewAssignment({ title: '', course: '', description: '', deadline: '', tasks: [], links: [] });
              setAssignmentOpen(true);
            }}
          >
            <ClipboardList className="w-4 h-4" />
            Initialize Assignment
          </Button>
          <Button 
            variant="outline"
            className="border-gold/30 text-gold hover:bg-gold/5 shadow-premium rounded-xl font-bold gap-2"
            onClick={() => setMeetingOpen(true)}
          >
            <Calendar className="w-4 h-4" />
            Schedule Meeting
          </Button>
          <Button 
            className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-premium rounded-xl font-bold gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Create Track
          </Button>
        </div>
      </div>

      <CreateInternshipTeamDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <CreateInternshipMeetingDialog
        open={meetingOpen}
        onOpenChange={setMeetingOpen}
      />

      <ManageTeamMembersDialog
        open={manageMembersOpen}
        onOpenChange={setManageMembersOpen}
        team={selectedTeamForManage}
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tracks', value: allTeams.length, icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Team Tracks', value: allTeams.filter((t: any) => t.type === 'team').length, icon: Users, color: 'text-accent', bg: 'bg-accent/10' },
          { label: 'Individual Tracks', value: allTeams.filter((t: any) => t.type === 'individual').length, icon: User, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Active Projects', value: allTeams.filter((t: any) => t.status === 'active').length, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
        ].map((stat, i) => (
          <Card key={i} className="border-border/50 shadow-sm overflow-hidden relative group">
            <div className={`absolute top-0 right-0 w-16 h-16 ${stat.bg} rounded-bl-full translate-x-4 -translate-y-4 opacity-50 group-hover:scale-150 transition-transform duration-500`} />
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-black text-foreground">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Teams Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTeams.map((team: any) => {
          const StatusIcon = STATUS_CONFIG[team.status]?.icon || AlertCircle;
          const isIndividual = team.type === 'individual';
          
          return (
            <Card key={team.id} className="group border-border/50 bg-card/60 backdrop-blur-sm hover:border-accent/30 hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden flex flex-col">
              <div className={`h-1.5 w-full ${isIndividual ? 'bg-purple-500' : 'bg-accent'}`} />
              
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl ${isIndividual ? 'bg-purple-500/10' : 'bg-accent/10'} flex items-center justify-center transition-transform group-hover:scale-110`}>
                      {isIndividual ? <User className={`w-5 h-5 text-purple-500`} /> : <Users className="w-5 h-5 text-accent" />}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-black leading-tight line-clamp-1">{team.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-tighter h-5 ${isIndividual ? 'border-purple-500/20 text-purple-500' : 'border-accent/20 text-accent'}`}>
                          {isIndividual ? 'Individual' : 'Team'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-medium">•</span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{team.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/50 shadow-large">
                      <DropdownMenuItem className="text-[11px] font-bold uppercase gap-2" onClick={() => handleStatusUpdate(team.id, 'active')}>
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Mark Active
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-[11px] font-bold uppercase gap-2" onClick={() => handleStatusUpdate(team.id, 'completed')}>
                        <Trophy className="w-3.5 h-3.5 text-blue-500" /> Mark Completed
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-[11px] font-bold uppercase gap-2" onClick={() => handleStatusUpdate(team.id, 'on_hold')}>
                        <Clock className="w-3.5 h-3.5 text-yellow-500" /> Place On Hold
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-[11px] font-bold uppercase gap-2" onClick={() => { setSelectedTeamForManage(team); setManageMembersOpen(true); }}>
                        <Users className="w-3.5 h-3.5 text-accent" /> Manage Members
                      </DropdownMenuItem>
                      <div className="h-px bg-border/50 my-1" />
                      <DropdownMenuItem className="text-[11px] font-bold uppercase gap-2 text-destructive" onClick={() => handleDeleteTeam(team.id, team.name)}>
                        <Trash2 className="w-3.5 h-3.5" /> Delete track
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-4 flex-1 flex flex-col">
                {/* Project Info */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 group/project relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-0 group-hover/project:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4 text-accent" />
                  </div>
                  <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest mb-1">Current Assignment</p>
                  {team.internshipProject?.title ? (
                    <h4 className="font-bold text-sm text-foreground line-clamp-1">
                      {team.internshipProject.title}
                    </h4>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2 gap-2">
                       <p className="text-[11px] font-bold text-muted-foreground italic">No project assigned</p>
                       <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 rounded-xl border-dashed border-accent/40 text-accent font-black text-[10px] uppercase tracking-wider hover:bg-accent hover:text-accent-foreground transition-all duration-300 gap-2"
                        onClick={() => {
                          setSelectedTeam(team);
                          setAssignmentOpen(true);
                        }}
                       >
                         <Plus className="w-3 h-3" /> Assign Blueprint
                       </Button>
                    </div>
                  )}
                  {team.internshipProject && (
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex-1">
                         <div className="flex justify-between text-[10px] mb-1 font-bold">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="text-accent">0%</span>
                         </div>
                         <Progress value={0} className="h-1.5" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Mentor Info */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Mentor</p>
                    <Shield className="w-3 h-3 text-accent" />
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl border border-border/50 bg-background/40">
                    <Avatar className="w-8 h-8 rounded-xl ring-2 ring-background border border-border/50 shadow-sm">
                      <AvatarImage src={team.mentor?.avatar} />
                      <AvatarFallback className="bg-accent/10 text-accent font-black text-xs">
                        {team.mentor?.username?.[0]?.toUpperCase() || 'M'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{team.mentor?.fullName || team.mentor?.username || 'Unassigned'}</p>
                      <p className="text-[9px] text-muted-foreground">Technical Guide</p>
                    </div>
                  </div>
                </div>

                 {/* Interns List */}
                 <div className="space-y-3 flex-1">
                    <div className="flex justify-between items-center px-1">
                     <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                       {isIndividual ? 'Assigned Intern' : `Team Members (${team.members?.length || 0})`}
                     </p>
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-6 w-6 hover:bg-accent/10 rounded-full cursor-pointer" 
                       onClick={() => { setSelectedTeamForManage(team); setManageMembersOpen(true); }}
                     >
                       {isIndividual ? <Edit className="w-3 h-3 text-purple-500" /> : <Edit className="w-3 h-3 text-accent" />}
                     </Button>
                   </div>
                  <div className="grid grid-cols-1 gap-2">
                    {team.members?.slice(0, 3).map((member: any) => (
                      <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-2xl bg-muted/10 border border-border/20 hover:bg-muted/20 transition-colors">
                        <Avatar className="w-7 h-7 rounded-lg ring-1 ring-border/50">
                          <AvatarImage src={member.user?.avatar} />
                          <AvatarFallback className="bg-background text-[10px] font-black">
                            {member.user?.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                           <p className="text-[11px] font-bold truncate text-foreground/80">{member.user?.fullName || member.user?.username}</p>
                           <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{member.role}</p>
                        </div>
                      </div>
                    ))}
                    {team.members?.length > 3 && (
                      <div className="flex justify-center py-1">
                        <p className="text-[10px] font-black text-muted-foreground tracking-wider">+{team.members.length - 3} MORE INTERNS</p>
                      </div>
                    )}
                    {(!team.members || team.members.length === 0) && (
                      <div className="p-6 border-2 border-dashed border-border/50 rounded-2xl flex flex-col items-center justify-center text-center opacity-50 grayscale">
                         <User className="w-6 h-6 mb-2 text-muted-foreground" />
                         <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">No members</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-border/20 grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest"
                    onClick={() => {
                      if (team.internshipProjectId && team.internshipProject) {
                        setSelectedProject(team.internshipProject);
                      } else {
                        setSelectedTeam(team);
                        setAssignmentOpen(true);
                      }
                    }}
                  >
                    <ClipboardList className="w-3.5 h-3.5 mr-1.5" />
                    Project
                  </Button>
                  <Button 
                    variant={isIndividual ? "outline" : "default"} 
                    size="sm" 
                    className={`h-10 rounded-xl text-[10px] font-black uppercase tracking-widest ${!isIndividual ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'border-purple-500/30 text-purple-600 hover:bg-purple-500/5'}`}
                    onClick={() => {
                      if (!team.internshipProjectId) {
                        toast.info('Please assign a project blueprint first.');
                        setSelectedTeam(team);
                        setAssignmentOpen(true);
                        return;
                      }
                      setBoardTeam(team);
                    }}
                  >
                    {isIndividual ? <User className="w-3.5 h-3.5 mr-1.5" /> : <ExternalLink className="w-3.5 h-3.5 mr-1.5" />}
                    Open Board
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination UI */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-2">
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} tracks)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={!pagination.hasPreviousPage}
              className="h-9 w-9 p-0 rounded-xl"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, i, arr) => {
                  const showEllipsis = i > 0 && p - arr[i - 1] > 1;
                  return (
                    <div key={p} className="flex items-center">
                      {showEllipsis && <span className="px-1 text-muted-foreground">...</span>}
                      <Button
                        variant={currentPage === p ? 'gold' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(p)}
                        className={`h-9 w-9 p-0 rounded-xl ${currentPage === p ? 'pointer-events-none' : ''}`}
                      >
                        {p}
                      </Button>
                    </div>
                  );
                })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
              disabled={!pagination.hasNextPage}
              className="h-9 w-9 p-0 rounded-xl"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {filteredTeams.length === 0 && !teamsLoading && (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border/50 rounded-[40px] bg-muted/5">
          <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center mb-4">
             <Briefcase className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No Tracks Found</h3>
          <p className="text-muted-foreground mt-2 max-w-sm text-center font-medium">
             Wait for intern applications or create a new team track manually.
          </p>
        </div>
      )}

      {/* Assignment Dialog */}
      <Dialog open={assignmentOpen} onOpenChange={setAssignmentOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[32px] border-border/50 shadow-2xl p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-accent/20 via-background to-background p-8 pb-4">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center shadow-premium">
                    <ClipboardList className="w-5 h-5" />
                 </div>
                 <div>
                    <DialogTitle className="text-xl font-black tracking-tight leading-none">Initial Project Assignment</DialogTitle>
                    <DialogDescription className="text-xs font-medium mt-1">
                      {selectedTeam ? (
                        <>Assigning to: <span className="text-accent font-bold">{selectedTeam.name}</span></>
                      ) : (
                        "Select a team and its project blueprint"
                      )}
                    </DialogDescription>
                 </div>
              </div>
            </DialogHeader>
          </div>
          
          <div className="p-8 pt-4 space-y-6 max-h-[70vh] overflow-y-auto">
            {!selectedTeam && (
               <div className="grid gap-2 animate-in slide-in-from-top-2 duration-300">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Target Team Track *</Label>
                  <Select
                    onValueChange={(val) => {
                      const team = allTeams.find((t: any) => t.id === val);
                      setSelectedTeam(team);
                    }}
                  >
                    <SelectTrigger className="h-12 bg-muted/30 border-border/50 rounded-xl px-4">
                      <SelectValue placeholder="Choose a team track..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50">
                      {allTeams.filter((t: any) => !t.internshipProjectId).map((t: any) => (
                        <SelectItem key={t.id} value={t.id} className="rounded-lg">
                          <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${t.type === 'individual' ? 'bg-purple-500' : 'bg-accent'}`} />
                             <span className="font-bold">{t.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                      {allTeams.filter((t: any) => !t.internshipProjectId).length === 0 && (
                        <div className="p-4 text-center text-xs text-muted-foreground italic">All teams have assigned projects.</div>
                      )}
                    </SelectContent>
                  </Select>
               </div>
            )}

            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Available Project Blueprints *</Label>
              <Select
                value={newAssignment.course}
                onValueChange={(val) => {
                  const blueprint = (templatesData as any)?.internshipProjects?.items?.find((p: any) => p.id === val);
                  setNewAssignment({ 
                    ...newAssignment, 
                    course: val,
                    title: blueprint?.title || ''
                  });
                }}
              >
                <SelectTrigger className="h-12 bg-muted/30 border-border/50 rounded-xl px-4">
                  <SelectValue placeholder="Select a blueprint project from pool..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  {(templatesData as any)?.internshipProjects?.items?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id} className="rounded-lg">
                      <div className="flex flex-col">
                        <span className="font-bold">{p.title}</span>
                        <span className="text-[10px] text-muted-foreground">{p.type} • {p.category}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {(!(templatesData as any)?.internshipProjects?.items || (templatesData as any).internshipProjects.items.length === 0) && (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      No blueprint templates found. Create one in the Project Builder first.
                    </div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground pl-1 italic">
                The project title and documentation will be synchronized from the selected blueprint.
              </p>
            </div>

            {newAssignment.course && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-accent/5 border border-accent/20 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Blueprint Analysis</h4>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Team Ready</p>
                  </div>
                </div>
                {(templatesData as any)?.internshipProjects?.items?.find((p: any) => p.id === newAssignment.course)?.tasks?.length > 0 && (
                  <div className="pt-2 border-t border-accent/10">
                    <p className="text-[11px] font-medium flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {(templatesData as any).internshipProjects.items.find((p: any) => p.id === newAssignment.course).tasks.length} standard tickets will be generated.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
          
          <div className="p-8 pt-0 flex gap-3">
            <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold border-border/50" onClick={() => setAssignmentOpen(false)}>Cancel</Button>
            <Button className="flex-1 h-12 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 shadow-premium font-bold gap-2" onClick={handleGiveAssignment} disabled={assigningProject}>
              {assigningProject ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  Assigning...
                </div>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Finalize Assignment</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <InternshipProjectDetailsDialog
        open={!!selectedProject}
        onOpenChange={(val) => {
          if (!val) setSelectedProject(null);
        }}
        project={selectedProject}
      />
    </div>
  );
}

const Trophy = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-1.02 1.07-1.53.25-2.98.74-4.23 1.43V22h14.5v-2.5c-1.25-.69-2.7-1.18-4.23-1.43-.55-.09-1.02-.52-1.02-1.07v-2.34" />
    <path d="M12 5V2" />
    <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
  </svg>
);
