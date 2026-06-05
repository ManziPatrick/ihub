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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_ALL_PROJECTS, GET_USERS, GET_ASSIGNMENT_SUBMISSIONS } from "@/lib/graphql/queries";
import { DELETE_PROJECT, UPDATE_PROJECT, GRADE_ASSIGNMENT, RESTORE_PROJECT } from "@/lib/graphql/mutations";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/portal/dialogs/ConfirmDialog";
import { format } from "date-fns";
import { TeamChatDialog, ManageProjectTasksDialog, ProjectDetailsDialog, CreateAgileProjectDialog, CreateProjectDialog, GradeProjectDialog, BookCallDialog, ViewSubmissionDialog } from "@/components/portal/dialogs";
import { Textarea } from "@/components/ui/textarea";

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
  const pageSize = 10;

  // Assignment states
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [feedbackValue, setFeedbackValue] = useState("");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [viewSubmission, setViewSubmission] = useState<AssignmentSubmission | null>(null);

  const [assignPage, setAssignPage] = useState(1);
  const assignPageSize = 10;

  // Queries handling
  const { data: assignmentsData, refetch: refetchAssignments } = useQuery<GetAssignmentSubmissionsData>(GET_ASSIGNMENT_SUBMISSIONS, {
      variables: { page: assignPage, limit: assignPageSize }
  });
  const [gradeAssignmentMutation, { loading: grading }] = useMutation(GRADE_ASSIGNMENT);

  const submissions = assignmentsData?.getAssignmentSubmissions?.items || [];
  const assignPagination = assignmentsData?.getAssignmentSubmissions?.pagination;
  const pendingSubmissions = submissions.filter((s: AssignmentSubmission) => s.status === "pending");
  const gradedSubmissions = submissions.filter((s: AssignmentSubmission) => s.status === "reviewed" || s.status === "graded" || s.status === "revision_requested");

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


  const { data, loading, refetch } = useQuery(GET_ALL_PROJECTS, {
    variables: { page: currentPage, limit: pageSize }
  });
  const projects = (data as any)?.projects?.items || [];
  const pagination = (data as any)?.projects?.pagination;

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
              <TabsTrigger value="assignments" className="rounded-lg px-6">Assignment Reviews</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="projects" className="space-y-6">
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
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="in_progress">In Progress</option>
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
                                'bg-amber-500/20 text-amber-500'
                              }`}
                          >
                            {project.status?.replace('_', ' ')}
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

            {/* Pagination UI */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Showing page <span className="font-semibold">{pagination.currentPage}</span> of <span className="font-semibold">{pagination.totalPages}</span> ({pagination.totalCount} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={!pagination.hasPreviousPage}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" /> Previous
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
                              variant={currentPage === p ? "gold" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(p)}
                              className="w-8 h-8 p-0"
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
                  >
                    Next <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
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
                                          <p className="text-muted-foreground bg-background/50 p-2 rounded-lg">
                                            {question?.type === 'mcq' && question.options
                                              ? (question.options[parseInt(answer.answerText)] || answer.answerText)
                                              : (answer.answerText || <em>No answer</em>)
                                            }
                                          </p>
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
                              <Textarea
                                placeholder="Provide constructive feedback..."
                                value={feedbackValue}
                                onChange={(e) => setFeedbackValue(e.target.value)}
                                rows={4}
                              />
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

              <TabsContent value="graded" className="space-y-4">
                {gradedSubmissions.length === 0 ? (
                  <Card className="border-border/50">
                    <CardContent className="p-12 text-center">
                      <p className="text-muted-foreground">No graded submissions yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gradedSubmissions.map((submission: AssignmentSubmission) => (
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
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                              {submission.grade}/100
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {submission.feedback && (
                            <div className="p-3 bg-muted/20 rounded-lg border border-border/30">
                              <p className="text-xs font-bold text-accent mb-1">Feedback</p>
                              <p className="text-sm italic text-muted-foreground">{`"${submission.feedback}"`}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(parseInt(submission.createdAt)).toLocaleDateString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                {gradedSubmissions.length === 0 && (
                  <div className="text-center py-20 border-2 border-dashed rounded-[32px] opacity-50">
                    <FileText className="w-12 h-12 mx-auto mb-4" />
                    <p className="font-bold">No submissions found</p>
                  </div>
                )}

                {/* Assignment Pagination UI */}
                {assignPagination && assignPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-2 py-4">
                        <p className="text-sm text-muted-foreground">
                            Page <span className="font-bold text-foreground">{assignPagination.currentPage}</span> of {assignPagination.totalPages} ({assignPagination.totalCount} total)
                        </p>
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
