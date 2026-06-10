import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@apollo/client/react";
import {
    GET_ASSIGNMENT_SUBMISSIONS,
    GET_MY_PROJECTS,
    GET_COURSES,
    GET_ALL_STUDENTS
} from "@/lib/graphql/queries";
import {
    GRADE_ASSIGNMENT,
    CREATE_PROJECT,
    GRADE_PROJECT,
    PING_INSTRUCTOR
} from "@/lib/graphql/mutations";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { TextEditor } from "@/components/ui/text-editor";
import { BookCallDialog, ViewSubmissionDialog, ProjectTaskDialog } from "@/components/portal/dialogs";
import { KanbanBoard } from "@/components/portal/KanbanBoard";
import { GET_PROJECT_TASKS } from "@/lib/graphql/project-tasks";
import {
    Trash2,
    Link as LinkIcon,
    ListTodo,
    CheckCircle,
    User,
    Clock,
    Calendar,
    MessageSquare,
    ExternalLink,
    FolderOpen,
    Plus,
    Users,
    FileCode,
    Download,
    Eye,
    BarChart2,
    ArrowLeft,
} from "lucide-react";

interface AssignmentSubmission {
    id: string;
    userId: string;
    user: {
        id: string;
        username: string;
        fullName?: string;
        avatar?: string;
    };
    courseId: any;
    course?: {
        id: string;
        title: string;
        instructor?: {
            id: string;
            fullName: string;
            username: string;
        }
    };
    lessonId: string;
    lesson?: {
        title: string;
    };
    content: string;
    status: string;
    grade?: number;
    feedback?: string;
    totalScore?: number;
    timeTaken?: number;
    answers?: {
        questionId: string;
        answerText: string;
        score: number;
        aiFeedback?: string;
    }[];
    createdAt: string;
}

interface Project {
    id: string;
    title: string;
    course: string;
    type: string;
    status: string;
    progress: number;
    deadline?: string;
    team: {
        userId: string;
        name: string;
        role: string;
        user?: {
            avatar?: string;
            username: string;
        }
    }[];
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

interface GetMyProjectsData {
    myProjects: Project[];
}

export default function TrainerProjects() {
    const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
    const [gradeValue, setGradeValue] = useState("");
    const [feedbackValue, setFeedbackValue] = useState("");
    const [bookingOpen, setBookingOpen] = useState(false);
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    // Projects State
    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
    const [newProject, setNewProject] = useState({
        title: "",
        description: "",
        type: "Individual",
        course: "",
        deadline: "",
        links: [{ title: "", url: "" }] as { title: string; url: string }[],
        tasks: [{ title: "", completed: false }] as { title: string; completed: boolean }[]
    });
    const [viewSubmission, setViewSubmission] = useState<AssignmentSubmission | null>(null);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

    // Kanban Board state
    const [boardProjectId, setBoardProjectId] = useState<string | null>(null);
    const [taskDialogOpen, setTaskDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any | null>(null);

    const [assignPage, setAssignPage] = useState(1);
    const assignPageSize = 10;

    const { data: assignmentsData, loading: assignmentsLoading, refetch: refetchAssignments } = useQuery<GetAssignmentSubmissionsData>(GET_ASSIGNMENT_SUBMISSIONS, {
        variables: { page: assignPage, limit: assignPageSize }
    });
    const { data: projectsData, loading: projectsLoading } = useQuery<GetMyProjectsData>(GET_MY_PROJECTS);
    const { data: coursesData } = useQuery(GET_COURSES);
    const { data: studentsData } = useQuery(GET_ALL_STUDENTS);

    const { data: tasksData, refetch: refetchTasks } = useQuery(GET_PROJECT_TASKS, {
        variables: { projectId: boardProjectId },
        skip: !boardProjectId,
    });
    const boardTasks = (tasksData as any)?.projectTasks || [];

    const [gradeAssignmentMutation, { loading: grading }] = useMutation(GRADE_ASSIGNMENT);
    const [createProject, { loading: creatingProject }] = useMutation(CREATE_PROJECT);
    const [pingInstructor] = useMutation(PING_INSTRUCTOR);

    const handlePingInstructor = async () => {
        if (!selectedSubmission) return;
        try {
            await pingInstructor({
                variables: {
                    submissionId: selectedSubmission.id,
                    message: "I am reviewing this submission."
                }
            });
            toast.success("Instructor has been notified");
        } catch (err: any) {
            toast.error(err.message || "Failed to notify instructor");
        }
    };

    const submissions = assignmentsData?.getAssignmentSubmissions?.items || [];
    const assignPagination = assignmentsData?.getAssignmentSubmissions?.pagination;
    const pendingSubmissions = submissions.filter((s: AssignmentSubmission) => s.status === "pending");
    const gradedSubmissions = submissions.filter((s: AssignmentSubmission) => s.status === "reviewed" || s.status === "graded" || s.status === "revision_requested");

    const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all");
    
    // Extract unique course titles
    const availableCourses = Array.from(new Set(submissions.map((s: any) => s.course?.title || (s.courseId && typeof s.courseId === 'object' ? s.courseId.title : null)))).filter(Boolean) as string[];

    const filteredPending = pendingSubmissions.filter((s: any) => {
        if (selectedCourseFilter === "all") return true;
        const cTitle = s.course?.title || (s.courseId && typeof s.courseId === 'object' ? s.courseId.title : null);
        return cTitle === selectedCourseFilter;
    });

    const filteredGraded = gradedSubmissions.filter((s: any) => {
        if (selectedCourseFilter === "all") return true;
        const cTitle = s.course?.title || (s.courseId && typeof s.courseId === 'object' ? s.courseId.title : null);
        return cTitle === selectedCourseFilter;
    });

    const projects = projectsData?.myProjects || [];

    const handleQuickApprove = async () => {
        if (!selectedSubmission) return;

        try {
            await gradeAssignmentMutation({
                variables: {
                    submissionId: selectedSubmission.id,
                    grade: 100,
                    feedback: "Quickly approved by " + (isAdmin ? "Admin" : "Trainer")
                },
                refetchQueries: [{ query: GET_ASSIGNMENT_SUBMISSIONS }],
                awaitRefetchQueries: true
            });

            toast.success("Assignment approved successfully!");
            await refetchAssignments();
            setSelectedSubmission(null);
            setGradeValue("");
            setFeedbackValue("");
        } catch (err: any) {
            toast.error(err.message || "Failed to approve assignment");
        }
    };

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
                variables: {
                    submissionId: selectedSubmission.id,
                    grade,
                    feedback: feedbackValue
                },
                refetchQueries: [{ query: GET_ASSIGNMENT_SUBMISSIONS }],
                awaitRefetchQueries: true
            });

            toast.success("Assignment graded successfully!");
            await refetchAssignments();
            setSelectedSubmission(null);
            setGradeValue("");
            setFeedbackValue("");
        } catch (err: any) {
            console.error("Grading error:", err);
            toast.error(err.message || "Failed to grade assignment");
        }
    };

    const handleCreateProject = async () => {
        if (!newProject.title || !newProject.course || !newProject.description) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            const variables: any = {
                title: newProject.title,
                description: newProject.description,
                type: newProject.type === 'team' ? 'Team Project' : 'Individual',
                course: newProject.course,
                deadline: newProject.deadline || null,
                tasks: newProject.tasks.filter(t => t.title.trim() !== ""),
                documentation: {
                    links: newProject.links.filter(l => l.title.trim() !== "" && l.url.trim() !== "")
                }
            };

            if (newProject.type === 'individual' && selectedStudentIds.length > 0) {
                variables.userId = selectedStudentIds[0];
            } else if (newProject.type === 'team' && selectedStudentIds.length > 0) {
                // For team projects, we map selected IDs to TeamMemberInput
                // We'll need usernames too. Let's find them from data.
                const selectedStudents = (studentsData as any)?.getAllStudents?.filter((s: any) => selectedStudentIds.includes(s.id));
                variables.team = selectedStudents?.map((s: any) => ({
                    userId: s.id,
                    name: s.fullName || s.username,
                    role: 'Member'
                }));
            }

            await createProject({
                variables,
                refetchQueries: [{ query: GET_MY_PROJECTS }]
            });
            toast.success("Project created successfully");
            setIsCreateProjectOpen(false);
            setNewProject({
                title: "",
                description: "",
                type: "individual",
                course: "",
                deadline: "",
                links: [{ title: "", url: "" }],
                tasks: [{ title: "", completed: false }]
            });
            setSelectedStudentIds([]);
        } catch (e: any) {
            toast.error(e.message || "Failed to create project");
        }
    };

    // Project Grading
    const [managingProject, setManagingProject] = useState<Project | null>(null);
    const [projectGrade, setProjectGrade] = useState("");
    const [projectFeedback, setProjectFeedback] = useState("");
    const [gradeProjectMutation, { loading: gradingProject }] = useMutation(GRADE_PROJECT);

    const handleGradeProject = async () => {
        if (!managingProject || !projectGrade) {
            toast.error("Please enter a grade");
            return;
        }

        const grade = parseInt(projectGrade);
        if (isNaN(grade) || grade < 0 || grade > 100) {
            toast.error("Grade must be between 0 and 100");
            return;
        }

        try {
            await gradeProjectMutation({
                variables: {
                    id: managingProject.id,
                    grade: projectGrade, // Backend expects String based on mutation def, but let's check
                    feedback: projectFeedback
                },
                refetchQueries: [{ query: GET_MY_PROJECTS }]
            });
            toast.success("Project graded successfully");
            setManagingProject(null);
            setProjectGrade("");
            setProjectFeedback("");
        } catch (e: any) {
            toast.error(e.message || "Failed to grade project");
        }
    };

    if (assignmentsLoading || projectsLoading) {
        return (
            <PortalLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
                </div>
            </PortalLayout>
        );
    }

    return (
        <PortalLayout>
            <div className="space-y-6">
                <Tabs defaultValue="assignments" className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <TabsList className="w-full justify-start overflow-x-auto no-scrollbar bg-muted/20 p-1 rounded-xl h-auto flex-nowrap border border-border/30">
                            <TabsTrigger value="assignments" className="rounded-lg px-6 whitespace-nowrap">Assignment Reviews</TabsTrigger>
                            <TabsTrigger value="projects" className="rounded-lg px-6 whitespace-nowrap">Project Management</TabsTrigger>
                        </TabsList>

                        <div className="flex gap-2">
                            {/* Global actions if any */}
                        </div>
                    </div>

                    {/* ASSIGNMENTS TAB */}
                    <TabsContent value="assignments">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="font-heading text-3xl font-bold">{isAdmin ? "Admin Assignment Review" : "Assignment Review"}</h1>
                                <p className="text-muted-foreground mt-1">{isAdmin ? "Review and manage all student lesson assignment submissions" : "Review and grade specific lesson assignments"}</p>
                            </div>
                            <Badge variant="outline" className="text-lg px-4 py-2">
                                {pendingSubmissions.length} Pending
                            </Badge>
                        </div>

                        <Tabs defaultValue="pending" className="space-y-6">
                            <TabsList className="bg-muted/20 p-1 rounded-xl h-10 border border-border/30 w-fit">
                                <TabsTrigger value="pending" className="rounded-lg text-sm">Pending ({filteredPending.length})</TabsTrigger>
                                <TabsTrigger value="graded" className="rounded-lg text-sm">Graded ({filteredGraded.length})</TabsTrigger>
                            </TabsList>

                            {availableCourses.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-muted-foreground">Filter by Course:</span>
                                    <Select value={selectedCourseFilter} onValueChange={setSelectedCourseFilter}>
                                        <SelectTrigger className="w-[250px] h-9 text-xs">
                                            <SelectValue placeholder="All Courses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Courses</SelectItem>
                                            {availableCourses.map((course: string) => (
                                                <SelectItem key={course} value={course}>{course}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <TabsContent value="pending" className="space-y-4">
                                {filteredPending.length === 0 ? (
                                    <Card className="border-border/50">
                                        <CardContent className="p-12 text-center">
                                            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                                            <p className="text-muted-foreground">All caught up! No pending submissions for this filter.</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="grid lg:grid-cols-2 gap-6">
                                        <ScrollArea className="h-[calc(100vh-350px)] rounded-md border border-border/50">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Student</TableHead>
                                                        <TableHead>Course</TableHead>
                                                        <TableHead>Lesson</TableHead>
                                                        <TableHead>Date</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredPending.map((submission: AssignmentSubmission) => (
                                                        <TableRow 
                                                            key={submission.id}
                                                            className={`cursor-pointer transition-colors hover:bg-accent/5 ${selectedSubmission?.id === submission.id ? "bg-accent/10" : ""}`}
                                                            onClick={() => setSelectedSubmission(submission)}
                                                        >
                                                            <TableCell className="font-medium text-sm">
                                                                {submission.user?.fullName || submission.user?.username}
                                                                {submission.course?.instructor?.id !== user?.id && submission.course?.instructor && (
                                                                    <Badge variant="outline" className="ml-2 text-[10px] py-0 h-4 border-blue-500/30 text-blue-500/70">
                                                                        By: {submission.course.instructor.fullName || submission.course.instructor.username}
                                                                    </Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-xs text-muted-foreground">{submission.course?.title || (typeof submission.courseId === 'string' ? submission.courseId : "Unknown")}</TableCell>
                                                            <TableCell className="text-xs">{submission.lesson?.title || submission.lessonId}</TableCell>
                                                            <TableCell className="text-xs">{new Date(parseInt(submission.createdAt)).toLocaleDateString()}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
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
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="space-y-1">
                                                                <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Course & Lesson</label>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge className="bg-accent/10 text-accent border-accent/20">{selectedSubmission.course?.title || "Course: " + selectedSubmission.courseId}</Badge>
                                                                    <Badge variant="outline" className="border-border/50">Lesson: {selectedSubmission.lesson?.title || selectedSubmission.lessonId}</Badge>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold block">Submitted At</label>
                                                                <p className="text-sm">{new Date(parseInt(selectedSubmission.createdAt)).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1 mb-4">
                                                            <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Student</label>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                                                                    <User className="w-3.5 h-3.5 text-accent" />
                                                                </div>
                                                                <p className="text-base font-semibold">{selectedSubmission.user?.fullName || selectedSubmission.user?.username}</p>
                                                            </div>
                                                        </div>
                                                        {selectedSubmission.courseId?.instructor?._id !== user?.id && selectedSubmission.courseId?.instructor && (
                                                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between">
                                                                <div className="flex items-center gap-2 text-xs text-blue-500">
                                                                    <User className="w-3 h-3" />
                                                                    <span>Managed by: <b>{selectedSubmission.courseId.instructor.fullName || selectedSubmission.courseId.instructor.username}</b></span>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 text-[10px] text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                                                                    onClick={handlePingInstructor}
                                                                >
                                                                    Notify Instructor
                                                                </Button>
                                                            </div>
                                                        )}
                                                                <div className="mb-4">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Submission Content</label>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-7 text-[10px] text-accent hover:bg-accent/10"
                                                                            onClick={() => setViewSubmission(selectedSubmission)}
                                                                        >
                                                                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Full Detail View
                                                                        </Button>
                                                                    </div>
                                                                    <p className="text-sm font-mono whitespace-pre-wrap break-all bg-background/50 p-3 rounded border border-border/20">
                                                                        {selectedSubmission.content}
                                                                    </p>
                                                                </div>
                                                                
                                                                {selectedSubmission.content.startsWith("http") && (
                                                                    <div className="flex flex-wrap gap-2 mt-4 border-t border-border/30 pt-4">
                                                                        <Button variant="gold" size="sm" asChild>
                                                                            <a href={selectedSubmission.content} target="_blank" rel="noopener noreferrer">
                                                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                                                View Submission
                                                                            </a>
                                                                        </Button>
                                                                        <Button variant="outline" size="sm" className="border-border/50" asChild>
                                                                            <a href={selectedSubmission.content} download target="_blank" rel="noopener noreferrer">
                                                                                <Download className="w-4 h-4 mr-2" />
                                                                                Download File
                                                                            </a>
                                                                        </Button>
                                                                    </div>
                                                                )}

                                                        {/* Exam Results Section */}
                                                        {selectedSubmission.answers && selectedSubmission.answers.length > 0 && (
                                                            <div className="space-y-4">
                                                                <div className="flex items-center justify-between border-b border-border/30 pb-2">
                                                                    <label className="text-sm font-bold flex items-center gap-2">
                                                                        <ListTodo className="w-4 h-4 text-accent" />
                                                                        Exam Performance
                                                                    </label>
                                                                    <div className="text-right">
                                                                        <Badge className="bg-accent/10 text-accent border-accent/20">
                                                                            Score: {selectedSubmission.totalScore} pts ({selectedSubmission.grade}%)
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                                <ScrollArea className="h-[300px] pr-4">
                                                                    <div className="space-y-4">
                                                                        {(selectedSubmission as any).lesson?.assignmentQuestions?.map((q: any, idx: number) => {
                                                                            const answer = selectedSubmission.answers?.find(a => a.questionId === q.id);
                                                                            const isCorrect = (answer?.score || 0) > 0;
                                                                            
                                                                            return (
                                                                                <div key={q.id} className={`p-3 rounded-lg border ${isCorrect ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                                                                    <div className="flex justify-between gap-2 mb-2">
                                                                                        <p className="text-xs font-bold text-muted-foreground">Question {idx + 1}</p>
                                                                                        <Badge variant="outline" className={isCorrect ? 'text-green-500 border-green-500/30' : 'text-red-500 border-red-500/30'}>
                                                                                            {answer?.score || 0} / {q.points} pts
                                                                                        </Badge>
                                                                                    </div>
                                                                                    <p className="text-sm font-medium mb-3">{q.questionText}</p>
                                                                                    
                                                                                    <div className="space-y-2">
                                                                                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Student Answer:</div>
                                                                                        <div className={`p-2 rounded text-xs ${isCorrect ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'}`}>
                                                                                            {q.type === 'mcq' ? (
                                                                                                q.options[parseInt(answer?.answerText || "-1")] || answer?.answerText || "No answer"
                                                                                            ) : (
                                                                                                answer?.answerText || "No answer"
                                                                                            )}
                                                                                        </div>
                                                                                        
                                                                                        {!isCorrect && q.type === 'mcq' && (
                                                                                            <>
                                                                                                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mt-2">Correct Answer:</div>
                                                                                                <div className="p-2 rounded bg-green-500/10 text-green-700 text-xs">
                                                                                                    {q.options[q.correctOptionIndex]}
                                                                                                </div>
                                                                                            </>
                                                                                        )}

                                                                                        {answer?.aiFeedback && (
                                                                                            <div className="mt-2 p-2 bg-accent/5 rounded border border-accent/10 text-[11px] italic">
                                                                                                <span className="font-bold not-italic">Feedback: </span>
                                                                                                {answer.aiFeedback}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </ScrollArea>
                                                            </div>
                                                        )}

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
                                                        <div className="flex gap-4 pt-2">
                                                            <Button
                                                                variant="outline"
                                                                className="flex-1 border-green-500/50 text-green-500 hover:bg-green-500/10"
                                                                onClick={handleQuickApprove}
                                                                disabled={grading}
                                                            >
                                                                {grading ? "..." : "Quick Approve"}
                                                            </Button>
                                                            <Button
                                                                variant="gold"
                                                                className="flex-[2] shadow-lg shadow-gold/20"
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
                                
                                {/* Pagination Controls for Pending */}
                                {assignPagination && assignPagination.totalPages > 1 && (
                                    <div className="flex items-center justify-between px-2 py-4 bg-muted/10 rounded-xl mt-4">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground pl-2">
                                            Page {assignPagination.currentPage} of {assignPagination.totalPages}
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setAssignPage(prev => Math.max(1, prev - 1))}
                                                disabled={!assignPagination.hasPreviousPage}
                                                className="h-8 rounded-lg"
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setAssignPage(prev => Math.min(assignPagination.totalPages, prev + 1))}
                                                disabled={!assignPagination.hasNextPage}
                                                className="h-8 rounded-lg"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                    <TabsContent value="graded" className="space-y-4">
                        {filteredGraded.length === 0 ? (
                            <Card className="border-border/50">
                                <CardContent className="p-12 text-center">
                                    <p className="text-muted-foreground">No graded submissions for this filter.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="rounded-md border border-border/50">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Course</TableHead>
                                            <TableHead>Lesson</TableHead>
                                            <TableHead>Grade</TableHead>
                                            <TableHead>Feedback</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredGraded.map((submission: AssignmentSubmission) => (
                                            <TableRow key={submission.id}>
                                                <TableCell className="font-medium text-sm">{submission.user?.fullName || submission.user?.username}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{submission.course?.title || (typeof submission.courseId === 'string' ? submission.courseId : "Unknown")}</TableCell>
                                                <TableCell className="text-xs">{submission.lesson?.title || submission.lessonId}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                                                        {submission.grade}/100
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-[200px]">
                                                    {submission.feedback ? (
                                                        <p className="text-xs text-muted-foreground truncate" title={submission.feedback}>
                                                            {submission.feedback}
                                                        </p>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground/50">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs">{new Date(parseInt(submission.createdAt)).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => setViewSubmission(submission)}
                                                    >
                                                        <Eye className="w-4 h-4 text-muted-foreground" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </TabsContent>

            {/* PROJECTS TAB */}
            <TabsContent value="projects">
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
                                    Back to Projects
                                </Button>
                                <div>
                                    <h2 className="font-heading text-xl font-bold">
                                        {projects.find((p: any) => p.id === boardProjectId)?.title || 'Project'} Board
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Review & manage project tasks
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
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="font-heading text-3xl font-bold">Project Management</h1>
                        <p className="text-muted-foreground mt-1">Manage student projects, teams, and progress</p>
                    </div>
                    <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
                        <DialogTrigger asChild>
                            <Button variant="gold" className="shadow-lg shadow-gold/20">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Project
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Create New Project</DialogTitle>
                                <DialogDescription>
                                    Define a new project for your students.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Project Title</Label>
                                    <Input
                                        id="title"
                                        value={newProject.title}
                                        onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                                        placeholder="e.g. E-commerce Platform"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="course">Course</Label>
                                    <Select
                                        value={newProject.course}
                                        onValueChange={(value) => setNewProject({ ...newProject, course: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a course" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(coursesData as any)?.courses?.items?.map((course: any) => (
                                                <SelectItem key={course.id} value={course.title}>
                                                    {course.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select
                                        value={newProject.type}
                                        onValueChange={(value) => setNewProject({ ...newProject, type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="individual">Individual</SelectItem>
                                            <SelectItem value="team">Team</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Assign To ({newProject.type === 'individual' ? 'Student' : 'Team Members'})</Label>
                                    {newProject.type === 'individual' ? (
                                        <Select
                                            value={selectedStudentIds[0] || ""}
                                            onValueChange={(value) => setSelectedStudentIds([value])}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a student" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(studentsData as any)?.getAllStudents?.map((student: any) => (
                                                    <SelectItem key={student.id} value={student.id}>
                                                        {student.fullName || student.username}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <ScrollArea className="h-[150px] w-full border rounded-md p-2">
                                            <div className="space-y-2">
                                                {(studentsData as any)?.getAllStudents?.map((student: any) => (
                                                    <div key={student.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`student-${student.id}`}
                                                            checked={selectedStudentIds.includes(student.id)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setSelectedStudentIds([...selectedStudentIds, student.id]);
                                                                } else {
                                                                    setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                                                                }
                                                            }}
                                                        />
                                                        <label
                                                            htmlFor={`student-${student.id}`}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                        >
                                                            {student.fullName || student.username}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="deadline">Deadline (Optional)</Label>
                                    <Input
                                        id="deadline"
                                        type="date"
                                        value={newProject.deadline}
                                        onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Project Deliverables / Tasks</Label>
                                    <div className="space-y-2">
                                        {newProject.tasks.map((task, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Input
                                                    placeholder="e.g. Design Database Schema"
                                                    value={task.title}
                                                    onChange={(e) => {
                                                        const updated = [...newProject.tasks];
                                                        updated[index].title = e.target.value;
                                                        setNewProject({ ...newProject, tasks: updated });
                                                    }}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        const updated = newProject.tasks.filter((_, i) => i !== index);
                                                        setNewProject({ ...newProject, tasks: updated.length ? updated : [{ title: "", completed: false }] });
                                                    }}
                                                    disabled={newProject.tasks.length === 1 && !task.title}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full border-dashed"
                                            onClick={() => setNewProject({ ...newProject, tasks: [...newProject.tasks, { title: "", completed: false }] })}
                                        >
                                            <Plus className="w-3 h-3 mr-2" />
                                            Add Task
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Resource Links (Toolbox)</Label>
                                    <div className="space-y-2">
                                        {newProject.links.map((link, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Input
                                                    placeholder="Title"
                                                    className="flex-1"
                                                    value={link.title}
                                                    onChange={(e) => {
                                                        const updated = [...newProject.links];
                                                        updated[index].title = e.target.value;
                                                        setNewProject({ ...newProject, links: updated });
                                                    }}
                                                />
                                                <Input
                                                    placeholder="URL"
                                                    className="flex-[2]"
                                                    value={link.url}
                                                    onChange={(e) => {
                                                        const updated = [...newProject.links];
                                                        updated[index].url = e.target.value;
                                                        setNewProject({ ...newProject, links: updated });
                                                    }}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        const updated = newProject.links.filter((_, i) => i !== index);
                                                        setNewProject({ ...newProject, links: updated.length ? updated : [{ title: "", url: "" }] });
                                                    }}
                                                    disabled={newProject.links.length === 1 && !link.title && !link.url}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full border-dashed"
                                            onClick={() => setNewProject({ ...newProject, links: [...newProject.links, { title: "", url: "" }] })}
                                        >
                                            <Plus className="w-3 h-3 mr-2" />
                                            Add Link
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">Detailed Instructions (README style)</Label>
                                    <TextEditor
                                        value={newProject.description}
                                        onChange={(content) => setNewProject({ ...newProject, description: content })}
                                        placeholder="Write detailed project instructions, expectations, and guidelines..."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateProject} disabled={creatingProject}>
                                    {creatingProject ? "Creating..." : "Create Project"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {projects.length === 0 ? (
                    <Card className="border-border/50">
                        <CardContent className="p-12 text-center">
                            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                            <h3 className="text-lg font-bold mb-2">No Projects Found</h3>
                            <p className="text-muted-foreground mb-4">Create your first project to get started.</p>
                            <Button variant="outline" onClick={() => setIsCreateProjectOpen(true)}>Create Project</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project: Project) => (
                            <Card key={project.id} className="border-border/50 hover:border-accent/50 transition-all group">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <Badge>{project.type}</Badge>
                                        {project.status === 'completed' && <Badge variant="secondary" className="bg-green-500/10 text-green-500">Completed</Badge>}
                                        {project.status === 'in_progress' && <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">In Progress</Badge>}
                                    </div>
                                    <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                                    <CardDescription className="line-clamp-1">{project.course}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span>{project.progress}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-accent transition-all duration-500"
                                                style={{ width: `${project.progress}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                <span>{project.team.length} Members</span>
                                            </div>
                                            {project.deadline && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{new Date(parseInt(project.deadline)).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0 flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1 group-hover:bg-accent group-hover:text-accent-foreground"
                                        onClick={() => setManagingProject(project)}
                                    >
                                        Manage Project
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1 border-accent/30 text-accent hover:bg-accent/10"
                                        onClick={() => setBoardProjectId(project.id)}
                                    >
                                        <BarChart2 className="w-4 h-4 mr-1.5" />
                                        Board
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
                </>
                )}
            </TabsContent>
        </Tabs>
            </div>

        {/* Project Task Dialog */}
        <ProjectTaskDialog
            open={taskDialogOpen}
            onOpenChange={setTaskDialogOpen}
            projectId={boardProjectId || ''}
            task={editingTask}
            refetch={() => refetchTasks()}
        />

        {/* Manage Project Dialog */}
        <Dialog
            open={!!managingProject}
            onOpenChange={(open) => !open && setManagingProject(null)}
        >
    <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
            <DialogTitle>Manage Project: {managingProject?.title}</DialogTitle>
            <DialogDescription>
                Review details and grade the project.
            </DialogDescription>
        </DialogHeader>

        {managingProject && (
            <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="font-semibold block">Status</span>
                        <Badge variant="outline">{managingProject.status}</Badge>
                    </div>
                    <div>
                        <span className="font-semibold block">Type</span>
                        <span className="capitalize">{managingProject.type}</span>
                    </div>
                    <div>
                        <span className="font-semibold block">Course</span>
                        <span className="line-clamp-1">{managingProject.course}</span>
                    </div>
                    <div>
                        <span className="font-semibold block">Team Size</span>
                        <span>{managingProject.team.length} Members</span>
                    </div>
                </div>

                <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-gold" />
                        Grading
                    </h4>
                    <div className="space-y-3">
                        <div className="grid gap-2">
                            <Label>Grade (0-100)</Label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="Enter grade..."
                                value={projectGrade}
                                onChange={(e) => setProjectGrade(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Feedback</Label>
                            <Textarea
                                placeholder="Provide detailed feedback..."
                                value={projectFeedback}
                                onChange={(e) => setProjectFeedback(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}

        <DialogFooter>
            <Button variant="outline" onClick={() => setManagingProject(null)}>Cancel</Button>
            <Button variant="gold" onClick={handleGradeProject} disabled={gradingProject}>
                {gradingProject ? "Grading..." : "Submit Grade"}
            </Button>
        </DialogFooter>
    </DialogContent>
        </Dialog>

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
                    course: viewSubmission.course?.title || "Unknown",
                    submittedAt: new Date(parseInt(viewSubmission.createdAt || '0')).toLocaleString(),
                    type: (viewSubmission.answers?.length || 0) > 0 ? 'exam' : 'assignment',
                    content: viewSubmission.content,
                    answers: viewSubmission.answers,
                    totalScore: viewSubmission.totalScore,
                    timeTaken: viewSubmission.timeTaken,
                    lessonQuestions: (viewSubmission as any).lesson?.assignmentQuestions,
                } : null}
            />
        </PortalLayout>
    );
}
