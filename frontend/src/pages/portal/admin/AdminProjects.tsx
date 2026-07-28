import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  FolderOpen,
  Plus,
  Search,
  Users,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  ExternalLink,
  ChevronRight,
  Filter,
  BarChart2,
  Calendar,
  Layers,
  FileText,
  Eye,
  Stars,
  User,
  ChevronLeft,
  GraduationCap,
  TrendingUp,
  Target,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useQuery, useMutation } from "@apollo/client/react";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { GET_ALL_PROJECTS, GET_COURSES_SUMMARY, GET_USERS, GET_ASSIGNMENT_SUBMISSIONS, GET_STUDENT_PROJECT_PROGRESS } from "@/lib/graphql/queries";
import { GET_PROJECT_TASKS } from "@/lib/graphql/project-tasks";
import { DELETE_PROJECT, UPDATE_PROJECT, GRADE_ASSIGNMENT, RESTORE_PROJECT } from "@/lib/graphql/mutations";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/portal/dialogs/ConfirmDialog";
import { format } from "date-fns";
import { TeamChatDialog, ManageProjectTasksDialog, ProjectDetailsDialog, CreateAgileProjectDialog, CreateProjectDialog, GradeProjectDialog, BookCallDialog, ViewSubmissionDialog, ProjectTaskDialog } from "@/components/portal/dialogs";
import { Textarea } from "@/components/ui/textarea";
import { TextEditor } from "@/components/ui/text-editor";
import { KanbanBoard } from "@/components/portal/KanbanBoard";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import DOMPurify from "dompurify";

interface AssignmentSubmission {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    fullName?: string;
    avatar?: string;
  };
  courseId: string;
  lessonId: string;
  course?: { id: string; title: string; };
  lesson?: {
    title: string;
    assignmentQuestions?: Array<{
      id: string;
      questionText: string;
      type: string;
      options?: string[];
      correctOptionIndex?: number;
      points?: number;
    }>;
  };
  content?: string;
  answers?: Array<{ questionId: string; answerText: string; score?: number; aiFeedback?: string; }>;
  totalScore?: number;
  timeTaken?: number;
  status: string;
  grade?: number;
  feedback?: string;
  createdAt: string;
}

interface GetAssignmentSubmissionsData {
  getAssignmentSubmissions: {
    items: AssignmentSubmission[];
    pagination: {
      totalCount: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

export default function AdminProjects() {
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeChatProject, setActiveChatProject] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [manageTasksProject, setManageTasksProject] = useState<any>(null);
  const [manageTasksOpen, setManageTasksOpen] = useState(false);
  const [activeProjectForDetails, setActiveProjectForDetails] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [gradeProject, setGradeProject] = useState<any>(null);
  const [gradeOpen, setGradeOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [courseFilter, setCourseFilter] = useState("all");
  const [pageSize, setPageSize] = useState(10);

  // Assignment states
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [feedbackValue, setFeedbackValue] = useState("");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [viewSubmission, setViewSubmission] = useState<AssignmentSubmission | null>(null);
  // Re-grading states
  const [regradingSubmissionId, setRegradingSubmissionId] = useState<string | null>(null);
  const [regradeGradeValue, setRegradeGradeValue] = useState("");
  const [regradeFeedbackValue, setRegradeFeedbackValue] = useState("");

  const [assignPage, setAssignPage] = useState(1);
  const [assignPageSize, setAssignPageSize] = useState(10);
  const [gradedFilter, setGradedFilter] = useState<string>("all");

  // Kanban Board state
  const [boardProjectId, setBoardProjectId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  const { user } = useAuth();
  // Queries handling
  const { data: assignmentsData, refetch: refetchAssignments } = useQuery<GetAssignmentSubmissionsData>(GET_ASSIGNMENT_SUBMISSIONS, {
      variables: { page: assignPage, limit: assignPageSize }
  });
  const [gradeAssignmentMutation, { loading: grading }] = useMutation(GRADE_ASSIGNMENT);
  const [regradeAssignmentMutation, { loading: regrading }] = useMutation(GRADE_ASSIGNMENT);

  const submissions = assignmentsData?.getAssignmentSubmissions?.items || [];
  const assignPagination = assignmentsData?.getAssignmentSubmissions?.pagination;
  const pendingSubmissions = submissions.filter((s: AssignmentSubmission) => s.status === "pending");
  const gradedSubmissions = submissions.filter((s: AssignmentSubmission) => s.status === "reviewed" || s.status === "graded" || s.status === "revision_requested");
  const failedSubmissions = submissions.filter((s: AssignmentSubmission) => s.status === "failed");

  const handleGrade = async () => {
    if (!selectedSubmission || !gradeValue) {
      toast.error("Please enter a grade");
      return;
    }
    const grade = parseInt(gradeValue);
    if (isNaN(grade) || grade < 0 || grade > 100) {
      toast.error("Grade must be between 0 and 100");
      return;
    }
    try {
      await gradeAssignmentMutation({
        variables: { submissionId: selectedSubmission.id, grade, feedback: feedbackValue },
        refetchQueries: [{ query: GET_ASSIGNMENT_SUBMISSIONS }],
        awaitRefetchQueries: true
      });
      toast.success("Assignment graded successfully!");
      await refetchAssignments();
      setSelectedSubmission(null);
      setGradeValue("");
      setFeedbackValue("");
    } catch (err: any) {
      toast.error(err.message || "Failed to grade assignment");
    }
  };

  const handleRegrade = async (submission: AssignmentSubmission) => {
    const grade = parseInt(regradeGradeValue);
    if (isNaN(grade) || grade < 0 || grade > 100) {
      toast.error("Grade must be between 0 and 100");
      return;
    }
    try {
      await regradeAssignmentMutation({
        variables: { submissionId: submission.id, grade, feedback: regradeFeedbackValue },
        refetchQueries: [{ query: GET_ASSIGNMENT_SUBMISSIONS }],
        awaitRefetchQueries: true
      });
      toast.success("Assignment re-graded successfully!");
      await refetchAssignments();
      setRegradingSubmissionId(null);
      setRegradeGradeValue("");
      setRegradeFeedbackValue("");
    } catch (err: any) {
      toast.error(err.message || "Failed to re-grade assignment");
    }
  };

  const handleDeleteProjectConfirm = async () => {
    if (!deleteProjectTarget) return;
    const deletedId = deleteProjectTarget.id;
    const deletedTitle = deleteProjectTarget.title;
    try {
      setDeleteProjectTarget(null);
      await deleteProject({ variables: { id: deletedId } });
      window.dispatchEvent(new CustomEvent('bell-ring'));
      toast.success(`"${deletedTitle}" deleted`, {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await restoreProjectMutation({ variables: { id: deletedId } });
              toast.success("Project restored");
              refetch();
            } catch (err: any) {
              toast.error("Failed to restore project: " + err.message);
            }
          }
        },
        duration: 10000,
      });
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    }
  };


  const { data: coursesData } = useQuery(GET_COURSES_SUMMARY, {
    fetchPolicy: "cache-first",
  });

  const { data, loading, refetch } = usePaginatedQuery(GET_ALL_PROJECTS, {
    variables: { page: currentPage, limit: pageSize, course: courseFilter !== "all" ? courseFilter : undefined }
  });
  const projects = (data as any)?.projects?.items || [];
  const pagination = (data as any)?.projects?.pagination || { totalPages: 0, totalCount: 0, hasPreviousPage: false, hasNextPage: false };

  const { data: studentProgressData, loading: studentsLoading } = useQuery<{ studentProjectProgress: any[] }>(GET_STUDENT_PROJECT_PROGRESS, {
    skip: !['admin', 'super_admin'].includes(user?.role || ''),
  });

  const { data: tasksData, refetch: refetchTasks } = useQuery(GET_PROJECT_TASKS, {
    variables: { projectId: boardProjectId },
    skip: !boardProjectId,
  });
  const boardTasks = (tasksData as any)?.projectTasks || [];

  const [deleteProject] = useMutation(DELETE_PROJECT, {
    onError: (err) => toast.error(err.message),
  });
  const [restoreProjectMutation] = useMutation(RESTORE_PROJECT);
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<any>(null);
  const filteredProjects = projects.filter((project: any) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: "Total Projects", value: projects.length, icon: FolderOpen, color: "text-blue-500" },
    { label: "Active", value: projects.filter((p: any) => p.status === "in_progress").length, icon: Clock, color: "text-amber-500" },
    { label: "Onboarding", value: projects.filter((p: any) => p.status === "onboarding").length, icon: Stars, color: "text-purple-500" },
    { label: "Completed", value: projects.filter((p: any) => p.status === "completed").length, icon: CheckCircle2, color: "text-green-500" },
    { label: "Pending Review", value: projects.filter((p: any) => p.status === "pending_review").length, icon: AlertCircle, color: "text-rose-500" },
  ];

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Tabs defaultValue="projects" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
                Project & Assignment Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Oversee all academy projects and review student module assignments
              </p>
            </div>
            <TabsList className="bg-muted/20 p-1 rounded-xl h-12 border border-border/30">
              <TabsTrigger value="projects" className="rounded-lg px-6">Project Management</TabsTrigger>
              <TabsTrigger value="students" className="rounded-lg px-6">Student Progress</TabsTrigger>
              <TabsTrigger value="assignments" className="rounded-lg px-6">Assignment Reviews</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="projects" className="space-y-6">
            {boardProjectId ? (
              <>
                {/* Board View Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBoardProjectId(null);
                        setEditingTask(null);
                      }}
                      className="h-9"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to List
                    </Button>
                    <div>
                      <h2 className="font-heading text-xl font-bold">
                        {projects.find((p: any) => p.id === boardProjectId)?.title || 'Project'} Board
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Drag & drop tasks between columns to update status
                      </p>
                    </div>
                  </div>
                </div>

                <KanbanBoard
                  tasks={boardTasks}
                  projectId={boardProjectId}
                  userRole={user?.role}
                  onAddTask={() => {
                    setEditingTask(null);
                    setTaskDialogOpen(true);
                  }}
                  onEditTask={(task) => {
                    setEditingTask(task);
                    setTaskDialogOpen(true);
                  }}
                />
              </>
            ) : (
              <>
            <div className="flex justify-end gap-2">
              <Button className="bg-accent hover:bg-accent/90 text-white gap-2" onClick={() => setCreateOpen(true)} variant="outline">
                <Plus className="w-4 h-4" /> Project Template
              </Button>
              <Button className="bg-gold hover:bg-gold/90 text-white gap-2" onClick={() => setAssignOpen(true)}>
                <Users className="w-4 h-4" /> Assign Project
              </Button>
            </div>

            <CreateAgileProjectDialog
              open={createOpen}
              onOpenChange={setCreateOpen}
              refetch={refetch}
            />

            <CreateProjectDialog
              open={assignOpen}
              onOpenChange={setAssignOpen}
              refetch={refetch}
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="border-border/50 bg-muted/5">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`p-2 rounded-lg bg-background border border-border/50 ${stat.color}`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">{stat.label}</p>
                        <p className="text-xl font-bold">{stat.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects by title..."
                  className="pl-10 bg-muted/20 border-border/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select
                  className="px-4 py-2 bg-muted/20 border border-border/50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent/20"
                  value={courseFilter}
                  onChange={(e) => {
                    setCourseFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Courses</option>
                  {(coursesData as any)?.courses?.items?.map((course: any) => (
                    <option key={course.id} value={course.title}>{course.title}</option>
                  ))}
                </select>
                <select
                  className="px-4 py-2 bg-muted/20 border border-border/50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent/20"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="in_progress">In Progress</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="completed">Completed</option>
                </select>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  More Filters
                </Button>
              </div>
            </div>

            {/* Projects List */}
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 bg-muted/20 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <Card className="border-border/50 py-20 text-center">
                <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                <h3 className="text-lg font-medium">No projects found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project: any, i: number) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="h-full border-border/50 bg-card hover:border-accent/30 transition-all group">
                      <CardHeader className="p-5 pb-0">
                        <div className="flex items-start justify-between mb-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase font-bold ${project.type === 'Team Project' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                              }`}
                          >
                            {project.type}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer"
                                onClick={() => {
                                  setActiveProjectForDetails(project);
                                  setDetailsOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer"
                                onClick={() => {
                                  setManageTasksProject(project);
                                  setManageTasksOpen(true);
                                }}
                              >
                                <CheckCircle2 className="w-4 h-4" /> Manage Tasks
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-accent focus:text-accent"
                                onClick={() => setBoardProjectId(project.id)}
                              >
                                <BarChart2 className="w-4 h-4" /> Kanban Board
                              </DropdownMenuItem>
                              {(project.status === 'pending_review' || project.status === 'in_progress') && (
                                <DropdownMenuItem
                                  className="gap-2 cursor-pointer text-accent focus:text-accent font-bold"
                                  onClick={() => {
                                    setGradeProject(project);
                                    setGradeOpen(true);
                                  }}
                                >
                                  <Stars className="w-4 h-4" /> Grade Project
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                                onClick={() => setDeleteProjectTarget(project)}
                              >
                                <AlertCircle className="w-4 h-4" /> Delete Project
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <CardTitle className="text-lg font-heading line-clamp-1">{project.title}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Layers className="w-3 h-3" /> {project.course}
                        </p>
                      </CardHeader>

                      <CardContent className="p-5 space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                          {project.description}
                        </p>

                        <div>
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-bold text-accent">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-1.5" />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {project.team?.slice(0, 4).map((member: any, i: number) => (
                              <Avatar key={i} className="w-8 h-8 ring-2 ring-background border-0">
                                <AvatarFallback className="bg-accent/20 text-accent text-[10px] font-bold">
                                  {member.name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {project.team?.length > 4 && (
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold ring-2 ring-background">
                                +{project.team.length - 4}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 border-border/50 hover:bg-accent/10 hover:text-accent"
                              onClick={() => {
                                setActiveChatProject(project);
                                setChatOpen(true);
                              }}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 border-border/50 hover:bg-accent/10 hover:text-accent"
                              asChild
                            >
                              <a href={project.submissionUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-border/50 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 text-muted-foreground uppercase font-bold tracking-wider">
                            <Calendar className="w-3 h-3" />
                            Deadline: {project.deadline && !isNaN(new Date(project.deadline).getTime()) ? format(new Date(project.deadline), "MMM d, yyyy") : "N/A"}
                          </div>
                          <Badge
                            className={`text-[9px] uppercase font-black ${project.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                              project.status === 'pending_review' ? 'bg-rose-500/20 text-rose-500' :
                              project.status === 'onboarding' ? 'bg-purple-500/20 text-purple-500' :
                                'bg-amber-500/20 text-amber-500'
                              }`}
                          >
                            {project.status === 'onboarding' ? 'Ready for Onboarding' : project.status?.replace('_', ' ')}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2 font-bold text-xs"
                          onClick={() => {
                            setManageTasksProject(project);
                            setManageTasksOpen(true);
                          }}
                        >
                          Manage Tasks & Marking
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            <PaginationBar
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              onPageChange={setCurrentPage}
              hasPreviousPage={pagination.hasPreviousPage}
              hasNextPage={pagination.hasNextPage}
              pageSize={pageSize}
              onPageSizeChange={(v) => { setPageSize(v); setCurrentPage(1); }}
              pageSizeOptions={[10, 25, 50, 100]}
            />
            </>
            )}
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            {studentsLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-48 bg-muted/20 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : studentProgressData?.studentProjectProgress?.length === 0 ? (
              <Card className="border-border/50 py-20 text-center">
                <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                <h3 className="text-lg font-medium">No student projects found</h3>
                <p className="text-muted-foreground">Students appear here once they have projects assigned.</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <Card className="border-border/50 bg-muted/5">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-background border border-border/50 text-blue-500">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">Students w/ Projects</p>
                        <p className="text-xl font-bold">{studentProgressData?.studentProjectProgress?.length || 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50 bg-muted/5">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-background border border-border/50 text-emerald-500">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">Total Projects</p>
                        <p className="text-xl font-bold">{studentProgressData?.studentProjectProgress?.reduce((sum: number, s: any) => sum + s.totalProjects, 0) || 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50 bg-muted/5">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-background border border-border/50 text-green-500">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">Completed</p>
                        <p className="text-xl font-bold">{studentProgressData?.studentProjectProgress?.reduce((sum: number, s: any) => sum + s.completedProjects, 0) || 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50 bg-muted/5">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-background border border-border/50 text-amber-500">
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">Avg Progress</p>
                        <p className="text-xl font-bold">
                          {studentProgressData?.studentProjectProgress?.length > 0
                            ? Math.round(studentProgressData.studentProjectProgress.reduce((sum: number, s: any) => sum + s.averageProgress, 0) / studentProgressData.studentProjectProgress.length)
                            : 0}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50 bg-muted/5">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-background border border-border/50 text-purple-500">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">Total Tasks</p>
                        <p className="text-xl font-bold">{studentProgressData?.studentProjectProgress?.reduce((sum: number, s: any) => sum + s.totalTasks, 0) || 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Student Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {studentProgressData?.studentProjectProgress?.map((summary: any) => {
                    const student = summary.student;
                    const initials = (student.fullName || student.username || "?").charAt(0).toUpperCase();
                    return (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className="border-border/50 bg-card hover:border-accent/30 transition-all">
                          <CardHeader className="p-5 pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10 ring-2 ring-accent/20">
                                  <AvatarFallback className="bg-accent/15 text-accent text-sm font-bold">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <CardTitle className="text-base font-heading">{student.fullName || student.username}</CardTitle>
                                  <p className="text-xs text-muted-foreground">{student.email}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className={`text-[10px] font-bold ${
                                summary.averageProgress >= 80 ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                summary.averageProgress >= 50 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                "bg-muted/30 text-muted-foreground"
                              }`}>
                                {summary.averageProgress}%
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-5 pt-0 space-y-3">
                            {/* Project Stats */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="text-center p-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                <p className="text-lg font-bold text-blue-400">{summary.totalProjects}</p>
                                <p className="text-[9px] text-muted-foreground uppercase">Projects</p>
                              </div>
                              <div className="text-center p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                                <p className="text-lg font-bold text-green-400">{summary.completedProjects}</p>
                                <p className="text-[9px] text-muted-foreground uppercase">Done</p>
                              </div>
                              <div className="text-center p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                                <p className="text-lg font-bold text-amber-400">{summary.inProgressProjects}</p>
                                <p className="text-[9px] text-muted-foreground uppercase">Active</p>
                              </div>
                            </div>

                            {/* Project Progress Bar */}
                            <div>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Project Progress</span>
                                <span className="font-bold">{summary.averageProgress}%</span>
                              </div>
                              <Progress value={summary.averageProgress} className="h-2" />
                            </div>

                            {/* Task Stats */}
                            <div className="border-t border-border/20 pt-3">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tasks</p>
                                {summary.totalTasks > 0 && (
                                  <Badge variant="outline" className={`text-[9px] font-bold ${
                                    summary.taskCompletionPercentage >= 80 ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                    summary.taskCompletionPercentage >= 50 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                    "bg-muted/30 text-muted-foreground"
                                  }`}>
                                    {summary.completedTasks}/{summary.totalTasks} done
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-4 gap-1.5 mb-2">
                                <div className="text-center">
                                  <p className="text-sm font-bold text-purple-400">{summary.totalTasks}</p>
                                  <p className="text-[8px] text-muted-foreground">Total</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm font-bold text-green-400">{summary.completedTasks}</p>
                                  <p className="text-[8px] text-muted-foreground">Done</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm font-bold text-amber-400">{summary.inProgressTasks}</p>
                                  <p className="text-[8px] text-muted-foreground">Active</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm font-bold text-rose-400">{summary.inReviewTasks}</p>
                                  <p className="text-[8px] text-muted-foreground">Review</p>
                                </div>
                              </div>
                              {summary.totalTasks > 0 && (
                                <div>
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-muted-foreground">Task Completion</span>
                                    <span className="font-bold">{summary.taskCompletionPercentage}%</span>
                                  </div>
                                  <Progress value={summary.taskCompletionPercentage} className="h-2" />
                                </div>
                              )}
                            </div>

                            {/* Individual Projects */}
                            <div className="space-y-1.5">
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Projects</p>
                              {summary.projects.slice(0, 3).map((project: any) => (
                                <div key={project.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/30">
                                  <div className="min-w-0 flex-1 mr-2">
                                    <p className="text-xs font-medium truncate">{project.title}</p>
                                    <p className="text-[9px] text-muted-foreground">{project.course}</p>
                                  </div>
                                  <Badge className={`text-[8px] uppercase font-bold shrink-0 ${
                                    project.status === 'completed' ? 'bg-green-500/15 text-green-500' :
                                    project.status === 'pending_review' ? 'bg-rose-500/15 text-rose-500' :
                                    'bg-amber-500/15 text-amber-500'
                                  }`}>
                                    {project.status?.replace('_', ' ')}
                                  </Badge>
                                </div>
                              ))}
                              {summary.projects.length > 3 && (
                                <p className="text-[10px] text-muted-foreground text-center pt-1">
                                  +{summary.projects.length - 3} more project{(summary.projects.length - 3) !== 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-heading text-xl font-bold">Assignment Review</h2>
                <p className="text-muted-foreground text-sm mt-1">Select an assignment submission to review and grade.</p>
              </div>
              <Badge variant="outline" className="text-sm px-3 py-1">
                {pendingSubmissions.length} Pending
              </Badge>
            </div>

            <Tabs defaultValue="pending" className="space-y-6">
              <TabsList className="bg-muted/20 p-1 rounded-xl h-10 border border-border/30 w-fit">
                <TabsTrigger value="pending" className="rounded-lg text-sm">Pending ({pendingSubmissions.length})</TabsTrigger>
                <TabsTrigger value="failed" className="rounded-lg text-sm">Failed ({failedSubmissions.length})</TabsTrigger>
                <TabsTrigger value="graded" className="rounded-lg text-sm">Graded ({gradedSubmissions.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4">
                {pendingSubmissions.length === 0 ? (
                  <Card className="border-border/50">
                    <CardContent className="p-12 text-center">
                      <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
                      <p className="text-muted-foreground">All caught up! No pending submissions.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid lg:grid-cols-2 gap-6">
                    <ScrollArea className="h-[calc(100vh-400px)]">
                      <div className="space-y-4 pr-4">
                        {pendingSubmissions.map((submission: AssignmentSubmission) => (
                          <Card
                            key={submission.id}
                            className={`cursor-pointer transition-all hover:border-accent/50 ${selectedSubmission?.id === submission.id ? "border-accent bg-accent/5" : "border-border/50"}`}
                            onClick={() => setSelectedSubmission(submission)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                                    <User className="w-5 h-5 text-accent" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-base">{submission.user?.fullName || submission.user?.username}</CardTitle>
                                    <p className="text-[10px] font-bold text-accent uppercase tracking-wider">{submission.course?.title || 'Unknown Course'}</p>
                                    <p className="text-xs text-muted-foreground">Lesson: {submission.lesson?.title || submission.lessonId}</p>
                                  </div>
                                </div>
                                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {new Date(parseInt(submission.createdAt)).toLocaleDateString()}
                              </div>
                              {submission.answers && submission.answers.length > 0 ? (
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold">
                                    {submission.answers.filter(a => a.answerText?.trim()).length}/{submission.lesson?.assignmentQuestions?.length || submission.answers.length} answered
                                  </span>
                                  {submission.totalScore != null && (
                                    <span className="text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                                      AI Score: {submission.totalScore} pts
                                    </span>
                                  )}
                                  {submission.timeTaken != null && (
                                    <span className="text-xs text-muted-foreground">
                                      ⏱ {Math.floor(submission.timeTaken / 60)}m {submission.timeTaken % 60}s
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm line-clamp-2 text-muted-foreground">
                                  {submission.content?.replace(/<[^>]*>/g, '') || 'No content'}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>

                    <Card className="border-border/50 sticky top-6 h-fit">
                      <CardHeader className="border-b border-border/30">
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-accent" />
                          Grade Submission
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        {selectedSubmission ? (
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <label className="text-sm font-bold">Student</label>
                              <p className="text-lg">{selectedSubmission.user?.fullName || selectedSubmission.user?.username}</p>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-bold">Submission Content</label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setViewSubmission(selectedSubmission)}
                                  className="h-7 text-xs"
                                >
                                  <Eye className="w-3 h-3 mr-1" /> View Full Details
                                </Button>
                              </div>
                              <div className="p-4 bg-muted/20 rounded-lg border border-border/30 max-h-[200px] overflow-y-auto">
                                {(selectedSubmission.answers && selectedSubmission.answers.length > 0) ? (
                                  <div className="space-y-3">
                                    {selectedSubmission.answers.map((answer, idx) => {
                                      const question = selectedSubmission.lesson?.assignmentQuestions?.find(q => q.id === answer.questionId);
                                      return (
                                        <div key={idx} className="text-sm">
                                          <p className="font-semibold text-foreground mb-1">
                                            Q{idx + 1}: {question?.questionText || `Question ${idx + 1}`}
                                          </p>
                                          {question?.type === 'mcq' && question.options ? (
                                            <p className="text-muted-foreground bg-background/50 p-2 rounded-lg">
                                              {question.options[parseInt(answer.answerText)] || answer.answerText}
                                            </p>
                                          ) : answer.answerText?.trim() ? (
                                            <div className="text-muted-foreground bg-background/50 p-2 rounded-lg prose prose-sm dark:prose-invert max-w-none" 
                                                 dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(answer.answerText) }} 
                                            />
                                          ) : (
                                            <p className="text-muted-foreground bg-background/50 p-2 rounded-lg italic">No answer</p>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-sm font-mono whitespace-pre-wrap break-all">
                                    {selectedSubmission.content || 'No content submitted'}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-bold">Grade (0-100)</label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="Enter grade..."
                                value={gradeValue}
                                onChange={(e) => setGradeValue(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-bold">Feedback (Optional)</label>
                              <div className="min-h-[120px]">
                                <TextEditor
                                  value={feedbackValue}
                                  onChange={(content) => setFeedbackValue(content)}
                                  placeholder="Provide constructive feedback..."
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="gold"
                                className="flex-1 shadow-lg shadow-gold/20"
                                onClick={handleGrade}
                                disabled={grading || !gradeValue}
                              >
                                {grading ? "Submitting..." : "Submit Grade"}
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 border-border/50 hover:bg-accent/10 hover:text-accent"
                                onClick={() => setBookingOpen(true)}
                              >
                                <Calendar className="w-4 h-4 mr-2" />
                                Book Call
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-muted-foreground">
                            <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p>Select a submission to grade</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="failed" className="space-y-4">
                {failedSubmissions.length === 0 ? (
                  <Card className="border-border/50">
                    <CardContent className="p-12 text-center">
                      <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
                      <p className="text-muted-foreground">No failed submissions.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {failedSubmissions.map((submission: AssignmentSubmission) => (
                      <Card key={submission.id} className="border-red-500/20 bg-red-500/5">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-red-500" />
                              </div>
                              <div>
                                <CardTitle className="text-base">{submission.user?.fullName || submission.user?.username}</CardTitle>
                                <p className="text-xs text-muted-foreground">Lesson: {submission.lessonId}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 cursor-pointer hover:bg-red-500/20 transition-colors" onClick={() => setViewSubmission(submission)}>
                                {submission.grade}/100
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 text-[10px] ${regradingSubmissionId === submission.id ? 'text-accent bg-accent/10' : 'text-red-500/50 hover:text-red-500'}`}
                                onClick={() => {
                                  if (regradingSubmissionId === submission.id) {
                                    setRegradingSubmissionId(null);
                                  } else {
                                    setRegradingSubmissionId(submission.id);
                                    setRegradeGradeValue(String(submission.grade || ''));
                                    setRegradeFeedbackValue(submission.feedback || '');
                                  }
                                }}
                              >
                                <Stars className="w-3 h-3 mr-1" />
                                Re-grade
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {submission.feedback && (
                            <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                              <p className="text-xs font-bold text-red-500 mb-1">Feedback</p>
                              <p className="text-sm italic text-muted-foreground">{`"${submission.feedback}"`}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(parseInt(submission.createdAt)).toLocaleDateString()}
                          </div>
                          {regradingSubmissionId === submission.id && (
                            <div className="pt-3 border-t border-red-500/20 space-y-3 mt-3">
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold">New Grade (0-100)</label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="Enter grade..."
                                  value={regradeGradeValue}
                                  onChange={(e) => setRegradeGradeValue(e.target.value)}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold">Feedback (Optional)</label>
                                <Textarea
                                  placeholder="Provide constructive feedback..."
                                  value={regradeFeedbackValue}
                                  onChange={(e) => setRegradeFeedbackValue(e.target.value)}
                                  rows={2}
                                  className="text-sm"
                                />
                              </div>
                              <div className="flex gap-2 pt-1">
                                <Button
                                  variant="gold"
                                  size="sm"
                                  className="flex-1 h-8 text-xs"
                                  onClick={() => handleRegrade(submission)}
                                  disabled={regrading || !regradeGradeValue}
                                >
                                  {regrading ? "Submitting..." : "Submit Re-grade"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() => setRegradingSubmissionId(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                {failedSubmissions.length === 0 && (
                  <div className="text-center py-20 border-2 border-dashed rounded-[32px] opacity-50">
                    <FileText className="w-12 h-12 mx-auto mb-4" />
                    <p className="font-bold">No submissions found</p>
                  </div>
                )}

                {/* Assignment Pagination UI */}
                {assignPagination && assignPagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 gap-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Show</span>
                            <select
                                value={assignPageSize}
                                onChange={(e) => {
                                    setAssignPageSize(Number(e.target.value));
                                    setAssignPage(1);
                                }}
                                className="bg-background border border-border/50 rounded-md px-2 py-1 text-sm"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <span>
                                Page <span className="font-bold text-foreground">{assignPagination.currentPage}</span> of {assignPagination.totalPages}
                                ({assignPagination.totalCount} total)
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAssignPage(prev => Math.max(1, prev - 1))}
                                disabled={!assignPagination.hasPreviousPage}
                                className="rounded-xl h-8 px-3"
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAssignPage(prev => Math.min(assignPagination.totalPages, prev + 1))}
                                disabled={!assignPagination.hasNextPage}
                                className="rounded-xl h-8 px-3"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
              </TabsContent>

              <TabsContent value="graded" className="space-y-4">
                {/* Pass/Fail Filter Toggle */}
                {gradedSubmissions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Filter:</span>
                    <div className="flex bg-muted/20 rounded-lg p-0.5 border border-border/30">
                      <button
                        onClick={() => setGradedFilter("all")}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${gradedFilter === "all" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        All ({gradedSubmissions.length})
                      </button>
                      <button
                        onClick={() => setGradedFilter("passed")}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${gradedFilter === "passed" ? "bg-background shadow-sm text-green-600" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        Passed ({gradedSubmissions.filter(s => (s.grade || 0) >= 70).length})
                      </button>
                      <button
                        onClick={() => setGradedFilter("failed")}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${gradedFilter === "failed" ? "bg-background shadow-sm text-red-600" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        Failed ({gradedSubmissions.filter(s => (s.grade || 0) < 70).length})
                      </button>
                    </div>
                  </div>
                )}

                {(() => {
                  const displayGraded = gradedFilter === "all" ? gradedSubmissions : gradedSubmissions.filter(s => gradedFilter === "passed" ? (s.grade || 0) >= 70 : (s.grade || 0) < 70);
                  return displayGraded.length === 0 ? (
                    <Card className="border-border/50">
                      <CardContent className="p-12 text-center">
                        <p className="text-muted-foreground">No graded submissions match this filter.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayGraded.map((submission: AssignmentSubmission) => (
                      <Card key={submission.id} className="border-border/50">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-accent" />
                              </div>
                              <div>
                                <CardTitle className="text-base">{submission.user?.fullName || submission.user?.username}</CardTitle>
                                <p className="text-xs text-muted-foreground">Lesson: {submission.lessonId}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`${(submission.grade || 0) >= 70 ? 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20'} cursor-pointer transition-colors`} onClick={() => setViewSubmission(submission)}>
                                {submission.grade}/100
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 text-[10px] ${regradingSubmissionId === submission.id ? 'text-accent bg-accent/10' : 'text-muted-foreground/50 hover:text-accent'}`}
                                onClick={() => {
                                  if (regradingSubmissionId === submission.id) {
                                    setRegradingSubmissionId(null);
                                  } else {
                                    setRegradingSubmissionId(submission.id);
                                    setRegradeGradeValue(String(submission.grade || ''));
                                    setRegradeFeedbackValue(submission.feedback || '');
                                  }
                                }}
                              >
                                <Stars className="w-3 h-3 mr-1" />
                                Re-grade
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {submission.feedback && (
                            <div className="p-3 bg-muted/20 rounded-lg border border-border/30">
                              <p className="text-xs font-bold text-accent mb-1">Feedback</p>
                              <div className="text-sm italic text-muted-foreground prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: submission.feedback }} />
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(parseInt(submission.createdAt)).toLocaleDateString()}
                          </div>
                          {regradingSubmissionId === submission.id && (
                            <div className="pt-3 border-t border-border/30 space-y-3 mt-3">
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold">New Grade (0-100)</label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="Enter grade..."
                                  value={regradeGradeValue}
                                  onChange={(e) => setRegradeGradeValue(e.target.value)}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold">Feedback (Optional)</label>
                                <div className="min-h-[120px]">
                                  <TextEditor
                                    value={regradeFeedbackValue}
                                    onChange={(content) => setRegradeFeedbackValue(content)}
                                    placeholder="Provide constructive feedback..."
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 pt-1">
                                <Button
                                  variant="gold"
                                  size="sm"
                                  className="flex-1 h-8 text-xs"
                                  onClick={() => handleRegrade(submission)}
                                  disabled={regrading || !regradeGradeValue}
                                >
                                  {regrading ? "Submitting..." : "Submit Re-grade"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() => setRegradingSubmissionId(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                );
                })()}

                {/* Assignment Pagination UI */}
                {assignPagination && assignPagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 gap-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Show</span>
                            <select
                                value={assignPageSize}
                                onChange={(e) => {
                                    setAssignPageSize(Number(e.target.value));
                                    setAssignPage(1);
                                }}
                                className="bg-background border border-border/50 rounded-md px-2 py-1 text-sm"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <span>
                                Page <span className="font-bold text-foreground">{assignPagination.currentPage}</span> of {assignPagination.totalPages}
                                ({assignPagination.totalCount} total)
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAssignPage(prev => Math.max(1, prev - 1))}
                                disabled={!assignPagination.hasPreviousPage}
                                className="rounded-xl h-8 px-3"
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAssignPage(prev => Math.min(assignPagination.totalPages, prev + 1))}
                                disabled={!assignPagination.hasNextPage}
                                className="rounded-xl h-8 px-3"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      {activeChatProject && (
        <TeamChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          projectId={activeChatProject.id}
          conversationId={activeChatProject.conversationId}
          projectTitle={activeChatProject.title}
          teamMembers={activeChatProject.team || []}
          mentors={activeChatProject.mentors || []}
        />
      )}

      <ManageProjectTasksDialog
        open={manageTasksOpen}
        onOpenChange={setManageTasksOpen}
        project={manageTasksProject}
        refetch={refetch}
      />

      <ProjectDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        project={activeProjectForDetails}
        refetch={refetch}
      />

      <GradeProjectDialog
        open={gradeOpen}
        onOpenChange={setGradeOpen}
        project={gradeProject}
        refetch={refetch}
      />

      <BookCallDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        mentorId={selectedSubmission?.user?.id || selectedSubmission?.userId}
        mentorName={selectedSubmission?.user?.fullName || selectedSubmission?.user?.username}
        purpose="assignment-review"
      />

      <ViewSubmissionDialog
        open={!!viewSubmission}
        onOpenChange={(open) => !open && setViewSubmission(null)}
        onScoresSaved={() => refetchAssignments()}
        submission={viewSubmission ? {
          id: viewSubmission.id,
          student: viewSubmission.user?.fullName || viewSubmission.user?.username || 'Unknown',
          assignment: viewSubmission.lesson?.title || viewSubmission.lessonId,
          course: (viewSubmission as any).course?.title || viewSubmission.courseId,
          submittedAt: new Date(parseInt(viewSubmission.createdAt || '0')).toLocaleString(),
          type: (viewSubmission.answers?.length || 0) > 0 ? 'exam' : 'assignment',
          content: viewSubmission.content,
          answers: viewSubmission.answers,
          totalScore: viewSubmission.totalScore,
          timeTaken: viewSubmission.timeTaken,
          lessonQuestions: viewSubmission.lesson?.assignmentQuestions,
        } : null}
      />

      <ProjectTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        projectId={boardProjectId || ''}
        task={editingTask}
        refetch={() => refetchTasks()}
      />

      <ConfirmDialog
        open={!!deleteProjectTarget}
        onOpenChange={(open: boolean) => !open && setDeleteProjectTarget(null)}
        onConfirm={handleDeleteProjectConfirm}
        title="Delete Project"
        description={`Are you sure you want to delete "${deleteProjectTarget?.title || ''}"? It can be restored later.`}
        confirmText="Delete"
        variant="destructive"
      />

    </PortalLayout>
  );
}
