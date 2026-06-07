import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Users, Search, UserPlus, CheckCircle2, Circle, Loader2,
  FolderOpen, ChevronDown, ChevronUp, Briefcase, Star,
  UserCheck, ListChecks, Plus, Trash2, RefreshCw, ShieldCheck
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";

// ─── GraphQL ─────────────────────────────────────────────────────────────────

const GET_PROJECTS_WITH_ONBOARDING = gql`
  query GetProjectsForOnboarding {
    projects {
      items {
        id
        title
        status
        category
        deadline
        team {
          userId
          name
          role
        }
      }
    }
  }
`;

const GET_PROJECT_ONBOARDING = gql`
  query GetProjectOnboarding($projectId: ID!) {
    projectOnboarding(projectId: $projectId) {
      id
      developerId
      role
      status
      createdAt
      developer {
        id
        fullName
        email
        avatar
      }
      checklist {
        task
        completed
        completedAt
      }
    }
  }
`;

const GET_STUDENTS = gql`
  query GetStudentsForAssignment {
    getAllStudents {
      id
      fullName
      email
      avatar
    }
  }
`;

const ASSIGN_DEVELOPER = gql`
  mutation AssignDeveloperToProject(
    $projectId: ID!
    $developerId: ID!
    $role: String!
    $checklistTasks: [String!]!
  ) {
    assignDeveloperToProject(
      projectId: $projectId
      developerId: $developerId
      role: $role
      checklistTasks: $checklistTasks
    ) {
      id
      status
      developer {
        fullName
      }
    }
  }
`;

const UPDATE_CHECKLIST = gql`
  mutation UpdateOnboardingChecklist($onboardingId: ID!, $taskIndex: Int!, $completed: Boolean!) {
    updateOnboardingChecklist(onboardingId: $onboardingId, taskIndex: $taskIndex, completed: $completed) {
      id
      status
      checklist {
        task
        completed
        completedAt
      }
    }
  }
`;

// ─── Default Onboarding Checklist ────────────────────────────────────────────

const DEFAULT_CHECKLIST = [
  "Sign the Non-Disclosure Agreement (NDA)",
  "Complete developer profile and skill assessment",
  "Join the project communication channel",
  "Review project specifications and requirements",
  "Set up local development environment",
  "Attend project kickoff meeting",
  "Review and understand the development roadmap",
  "Submit first milestone plan for review",
];

const DEVELOPER_ROLES = [
  "Lead Developer",
  "Frontend Developer",
  "Backend Developer",
  "Full-Stack Developer",
  "Mobile Developer",
  "DevOps Engineer",
  "QA Engineer",
  "UI/UX Developer",
];

function getStatusColor(status: string) {
  switch (status) {
    case "active": return "bg-green-500/10 text-green-500 border-green-500/20";
    case "completed": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "pending": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    default: return "bg-muted text-muted-foreground";
  }
}

function getProjectStatusColor(status: string) {
  switch (status) {
    case "in_progress": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "completed": return "bg-green-500/10 text-green-500 border-green-500/20";
    case "review": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    default: return "bg-muted text-muted-foreground";
  }
}

// Safely parse date strings — handles ISO strings, numeric timestamps, and Date objects
function parseDate(value: string | number | null | undefined): Date {
  if (!value) return new Date();
  const num = Number(value);
  if (!isNaN(num) && String(value).length <= 13) return new Date(num); // unix ms
  return new Date(value); // ISO string
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminProjectOnboarding() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [expandedOnboarding, setExpandedOnboarding] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  // Assign form state
  const [selectedDeveloperId, setSelectedDeveloperId] = useState("");
  const [selectedRole, setSelectedRole] = useState("Full-Stack Developer");
  const [checklistTasks, setChecklistTasks] = useState<string[]>(DEFAULT_CHECKLIST);
  const [newTask, setNewTask] = useState("");
  const [developerSearchQuery, setDeveloperSearchQuery] = useState("");

  const { data: projectsData, loading: projectsLoading, refetch: refetchProjects } = useQuery(
    GET_PROJECTS_WITH_ONBOARDING
  );

  const { data: onboardingData, loading: onboardingLoading, refetch: refetchOnboarding } = useQuery(
    GET_PROJECT_ONBOARDING,
    { variables: { projectId: selectedProjectId }, skip: !selectedProjectId }
  );

  const { data: studentsData } = useQuery(GET_STUDENTS);

  const [assignDev, { loading: assigning }] = useMutation(ASSIGN_DEVELOPER);
  const [togglingTask, setTogglingTask] = useState<string | null>(null); // "onboardingId-taskIndex"
  const [updateChecklist] = useMutation(UPDATE_CHECKLIST, {
    refetchQueries: [{ query: GET_PROJECT_ONBOARDING, variables: { projectId: selectedProjectId } }],
    awaitRefetchQueries: true,
  });

  const projects = (projectsData as any)?.projects?.items || [];
  const onboardings = (onboardingData as any)?.projectOnboarding || [];
  const students = (studentsData as any)?.getAllStudents || [];
  const filteredStudents = students.filter((student: any) => {
    const q = developerSearchQuery.toLowerCase();
    return (
      student.fullName?.toLowerCase().includes(q) ||
      student.email?.toLowerCase().includes(q)
    );
  });

  const filteredProjects = projects.filter((p: any) => {
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
  });

  const activeProjects = filteredProjects.filter((p: any) =>
    ["in_progress", "review", "draft", "nda_pending"].includes(p.status)
  );

  const selectedProject = projects.find((p: any) => p.id === selectedProjectId);

  const handleAssign = async () => {
    if (!selectedProjectId || !selectedDeveloperId || !selectedRole) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (checklistTasks.length === 0) {
      toast.error("Please add at least one checklist task");
      return;
    }
    try {
      await assignDev({
        variables: {
          projectId: selectedProjectId,
          developerId: selectedDeveloperId,
          role: selectedRole,
          checklistTasks,
        },
      });
      toast.success("Developer assigned and onboarding checklist created!");
      setAssignDialogOpen(false);
      setSelectedDeveloperId("");
      setDeveloperSearchQuery("");
      setChecklistTasks(DEFAULT_CHECKLIST);
      refetchOnboarding();
      refetchProjects();
    } catch (err: any) {
      toast.error(err.message || "Assignment failed");
    }
  };

  const handleChecklistToggle = async (onboardingId: string, taskIndex: number, completed: boolean) => {
    const key = `${onboardingId}-${taskIndex}`;
    if (togglingTask === key) return; // prevent double-click
    setTogglingTask(key);
    try {
      await updateChecklist({ variables: { onboardingId, taskIndex, completed } });
      toast.success(completed ? "✅ Task marked complete!" : "Task unmarked");
    } catch (err: any) {
      toast.error(err.message || "Failed to update task");
    } finally {
      setTogglingTask(null);
    }
  };

  const addCustomTask = () => {
    if (!newTask.trim()) return;
    setChecklistTasks(prev => [...prev, newTask.trim()]);
    setNewTask("");
  };

  const removeTask = (idx: number) => {
    setChecklistTasks(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <PortalLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-medium">Developer Onboarding</h1>
            <p className="text-muted-foreground mt-1">
              Assign developers to projects and manage their onboarding checklists.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { refetchProjects(); refetchOnboarding(); }} className="gap-2 self-start">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Projects", value: activeProjects.length, icon: FolderOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Total Developers", value: projects.reduce((acc: number, p: any) => acc + (p.team?.length || 0), 0), icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
            { label: "Pending Onboarding", value: onboardings.filter((o: any) => o.status === "pending").length, icon: UserPlus, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Fully Onboarded", value: onboardings.filter((o: any) => o.status === "completed").length, icon: UserCheck, color: "text-green-500", bg: "bg-green-500/10" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="pt-4 pb-3">
                <div className={`inline-flex p-2 rounded-lg ${stat.bg} mb-2`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left — Project List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-card border-border/50"
              />
            </div>

            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
              {projectsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                </div>
              ) : activeProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                  <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No active projects found</p>
                </div>
              ) : (
                activeProjects.map((project: any) => {
                  const isSelected = project.id === selectedProjectId;
                  return (
                    <motion.div
                      key={project.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedProjectId(project.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-accent bg-accent/5 shadow-md shadow-accent/10"
                          : "border-border/50 bg-card hover:border-accent/30"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="font-bold text-sm line-clamp-1 flex-1">{project.title}</h3>
                        <Badge variant="outline" className={`text-[10px] uppercase shrink-0 ${getProjectStatusColor(project.status)}`}>
                          {project.status?.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{project.category || "General"}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {(project.team || []).slice(0, 4).map((member: any) => (
                            <div
                              key={member.userId}
                              className="w-6 h-6 rounded-full bg-accent/20 border-2 border-card flex items-center justify-center text-[9px] font-black text-accent"
                              title={member.name}
                            >
                              {member.name?.[0]}
                            </div>
                          ))}
                          {(project.team?.length || 0) > 4 && (
                            <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                              +{(project.team?.length || 0) - 4}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {project.team?.length || 0} devs
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right — Project Onboarding Detail */}
          <div className="lg:col-span-2">
            {!selectedProjectId ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[40vh] text-muted-foreground border-2 border-dashed rounded-2xl">
                <FolderOpen className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-medium">Select a project to manage onboarding</p>
                <p className="text-xs mt-1">All developer assignments and checklists appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Project Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-xl font-bold">{selectedProject?.title}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {onboardings.length} developer{onboardings.length !== 1 ? "s" : ""} assigned
                    </p>
                  </div>
                  <Button variant="gold" size="sm" onClick={() => setAssignDialogOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-1.5" /> Assign Developer
                  </Button>
                </div>

                {/* Onboarding List */}
                {onboardingLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-accent" />
                  </div>
                ) : onboardings.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No developers assigned yet.</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => setAssignDialogOpen(true)}>
                      <UserPlus className="w-4 h-4 mr-1.5" /> Assign First Developer
                    </Button>
                  </div>
                ) : (
                  onboardings.map((ob: any) => {
                    const isExpanded = expandedOnboarding === ob.id;
                    const completedTasks = ob.checklist?.filter((t: any) => t.completed).length || 0;
                    const totalTasks = ob.checklist?.length || 0;
                    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                    return (
                      <Card key={ob.id} className="border-border/50 overflow-hidden">
                        <CardContent className="pt-4 pb-4">
                          {/* Developer Header */}
                          <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => setExpandedOnboarding(isExpanded ? null : ob.id)}
                          >
                            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-sm font-black text-accent shrink-0">
                              {ob.developer?.fullName?.[0] || "D"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-sm">{ob.developer?.fullName}</p>
                                <Badge variant="outline" className={`text-[10px] ${getStatusColor(ob.status)}`}>
                                  {ob.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{ob.role}</p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <p className="text-xs font-bold">{completedTasks}/{totalTasks}</p>
                                <p className="text-[10px] text-muted-foreground">tasks done</p>
                              </div>
                              <div className="w-12 h-12 relative">
                                <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                                  <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-muted" strokeWidth="3" />
                                  <circle
                                    cx="18" cy="18" r="15.9" fill="none"
                                    stroke="hsl(var(--accent))" strokeWidth="3"
                                    strokeDasharray={`${progress} ${100 - progress}`}
                                    strokeDashoffset="0"
                                    strokeLinecap="round"
                                    className="transition-all duration-500"
                                  />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black">
                                  {progress}%
                                </span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>

                          {/* Expandable Checklist */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-4 pt-4 border-t border-border/30 space-y-2">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                      <ListChecks className="w-3.5 h-3.5" /> Onboarding Checklist
                                    </h4>
                                    <span className="text-xs text-muted-foreground">
                                      Assigned {format(parseDate(ob.createdAt), "MMM d, yyyy")}
                                    </span>
                                  </div>

                                  {ob.checklist?.map((task: any, tIdx: number) => {
                                    const taskKey = `${ob.id}-${tIdx}`;
                                    const isToggling = togglingTask === taskKey;
                                    return (
                                      <div
                                        key={tIdx}
                                        onClick={() => !isToggling && handleChecklistToggle(ob.id, tIdx, !task.completed)}
                                        className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors group
                                          ${isToggling ? "opacity-60 cursor-wait" : "hover:bg-muted/20 cursor-pointer"}`}
                                      >
                                        <div
                                          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                                            ${task.completed
                                              ? "bg-green-500 border-green-500"
                                              : "border-border group-hover:border-accent"
                                            }`}
                                        >
                                          {isToggling
                                            ? <Loader2 className="w-3 h-3 text-white animate-spin" />
                                            : task.completed
                                              ? <CheckCircle2 className="w-3 h-3 text-white" />
                                              : null
                                          }
                                        </div>
                                        <span className={`text-xs flex-1 leading-relaxed ${
                                          task.completed ? "line-through text-muted-foreground" : ""
                                        }`}>
                                          {task.task}
                                        </span>
                                        {task.completed && task.completedAt && (
                                          <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                                            {format(parseDate(task.completedAt), "MMM d")}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign Developer Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={(open) => { setAssignDialogOpen(open); if (!open) setDeveloperSearchQuery(""); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-accent" />
              Assign Developer to Project
            </DialogTitle>
            <DialogDescription>
              Select a developer, define their role, and customize the onboarding checklist.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Developer Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Developer</label>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={developerSearchQuery}
                  onChange={(e) => setDeveloperSearchQuery(e.target.value)}
                  className="pl-9 bg-card border-border/50 mb-2"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 border border-border/50 rounded-xl p-3 bg-muted/5">
                {filteredStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No students found</p>
                ) : (
                  filteredStudents.map((student: any) => {
                    const alreadyAssigned = onboardings.some((o: any) => o.developerId === student.id);
                    return (
                      <label
                        key={student.id}
                        className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border
                          ${selectedDeveloperId === student.id
                            ? "border-accent bg-accent/10"
                            : alreadyAssigned
                            ? "opacity-40 border-transparent cursor-not-allowed"
                            : "border-transparent hover:bg-muted/20"
                          }`}
                      >
                        <input
                          type="radio"
                          name="developer"
                          value={student.id}
                          checked={selectedDeveloperId === student.id}
                          onChange={() => !alreadyAssigned && setSelectedDeveloperId(student.id)}
                          disabled={alreadyAssigned}
                          className="accent-accent"
                        />
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-black text-accent">
                          {student.fullName?.[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold">{student.fullName}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                        {alreadyAssigned && (
                          <Badge className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20">
                            <ShieldCheck className="w-3 h-3 mr-1" /> Assigned
                          </Badge>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Developer Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEVELOPER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Onboarding Checklist Builder */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5" /> Onboarding Checklist ({checklistTasks.length} tasks)
              </label>

              <div className="max-h-56 overflow-y-auto space-y-1.5 border border-border/50 rounded-xl p-3">
                {checklistTasks.map((task, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-muted/10 rounded-lg group">
                    <Circle className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                    <span className="text-xs flex-1">{task}</span>
                    <button
                      onClick={() => removeTask(idx)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add a custom checklist task..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomTask()}
                  className="text-sm bg-card border-border/50"
                />
                <Button type="button" variant="outline" size="sm" onClick={addCustomTask} className="shrink-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button
              variant="gold"
              onClick={handleAssign}
              disabled={assigning || !selectedDeveloperId}
            >
              {assigning ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-1.5" />
              )}
              Assign &amp; Start Onboarding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
