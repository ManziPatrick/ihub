import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    ArrowLeft,
    FolderOpen,
    Users,
    Calendar,
    CheckCircle,
    AlertCircle,
    MessageSquare,
    Upload,
    FileText,
    ExternalLink,
    Box,
    Link as LinkIcon,
    Target,
    Star,
    Clock,
} from "lucide-react";
import { GET_PROJECT } from "@/lib/graphql/queries";
import { SubmitProjectDialog, TeamChatDialog, ViewGuidelinesDialog } from "@/components/portal/dialogs";
import { PPTViewer } from "@/components/portal/PPTViewer";
import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Onboarding GraphQL operations
const GET_PROJECT_ONBOARDING = gql`
  query GetProjectOnboarding($projectId: ID!) {
    projectOnboarding(projectId: $projectId) {
      id
      developerId
      role
      status
      createdAt
      checklist {
        task
        completed
        completedAt
      }
    }
  }
`;

const UPDATE_CHECKLIST = gql`
  mutation UpdateOnboardingChecklist($onboardingId: ID!, $taskIndex: Int!, $completed: Boolean!) {
    updateOnboardingChecklist(onboardingId: $onboardingId, taskIndex: $taskIndex, completed: $completed) {
      id
      checklist {
        task
        completed
        completedAt
      }
    }
  }
`;

const getStatusBadge = (status: string) => {
    switch (status) {
        case "in_progress":
            return <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">In Progress</Badge>;
        case "pending_review":
            return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-400/30">Pending Review</Badge>;
        case "completed":
            return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-400/30">Completed</Badge>;
        case "pending_approval":
            return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-400/30">Pending Approval</Badge>;
        case "rejected":
            return <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-400/30">Rejected</Badge>;
        default:
            return null;
    }
};

export default function StudentProjectDetail() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();

    const [submitOpen, setSubmitOpen] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [guidelinesOpen, setGuidelinesOpen] = useState(false);

    const { user } = useAuth();

    const { data: onboardingData, refetch: refetchOnboarding } = useQuery(GET_PROJECT_ONBOARDING, {
        variables: { projectId },
        skip: !projectId || !user,
    });

    const [updateChecklist] = useMutation(UPDATE_CHECKLIST);

    const onboarding = (onboardingData as any)?.projectOnboarding?.find((o: any) => o.developerId === user?.id);

    const handleChecklistToggle = async (onboardingId: string, taskIndex: number, completed: boolean) => {
        try {
            await updateChecklist({
                variables: { onboardingId, taskIndex, completed }
            });
            refetchOnboarding();
            toast.success(completed ? "Task marked complete!" : "Task unmarked");
        } catch (err: any) {
            toast.error(err.message || "Failed to update task");
        }
    };

    const { data, loading, error } = useQuery(GET_PROJECT, {
        variables: { id: projectId },
        skip: !projectId,
    });

    const project = (data as any)?.project;

    if (loading) {
        return (
            <PortalLayout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Loading project...</p>
                </div>
            </PortalLayout>
        );
    }

    if (error || !project) {
        return (
            <PortalLayout>
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <AlertCircle className="w-12 h-12 text-destructive/50" />
                    <p className="text-destructive font-medium">
                        {error ? `Error: ${error.message}` : "Project not found"}
                    </p>
                    <Button variant="outline" onClick={() => navigate("/portal/student/projects")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Projects
                    </Button>
                </div>
            </PortalLayout>
        );
    }

    const completedTasks = project.tasks?.filter((t: any) => t.completed).length || 0;
    const totalTasks = project.tasks?.length || 0;
    const completedMilestones = project.milestones?.filter((m: any) => m.completed).length || 0;
    const totalMilestones = project.milestones?.length || 0;

    return (
        <PortalLayout>
            <div className="space-y-6 max-w-5xl mx-auto">
                {/* Back Button & Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => navigate("/portal/student/projects")}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Projects
                    </Button>

                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
                                    {project.title}
                                </h1>
                                {getStatusBadge(project.status)}
                            </div>
                            <p className="text-muted-foreground">
                                {project.course} • {project.type}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 flex-wrap">
                            {project.status === "in_progress" && (
                                <>
                                    <Button variant="gold" size="sm" onClick={() => setSubmitOpen(true)}>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Submit Project
                                    </Button>
                                    {project.team && (
                                        <Button variant="outline" size="sm" onClick={() => setChatOpen(true)}>
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Team Chat
                                        </Button>
                                    )}
                                </>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => setGuidelinesOpen(true)}>
                                <FileText className="w-4 h-4 mr-2" />
                                Guidelines
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Row */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                    <Card className="border-border/50">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-accent">{project.progress}%</div>
                            <div className="text-xs text-muted-foreground mt-1">Progress</div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-foreground">{completedTasks}/{totalTasks}</div>
                            <div className="text-xs text-muted-foreground mt-1">Tasks Done</div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-foreground">{completedMilestones}/{totalMilestones}</div>
                            <div className="text-xs text-muted-foreground mt-1">Milestones</div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-foreground">{project.team?.length || 0}</div>
                            <div className="text-xs text-muted-foreground mt-1">Team Members</div>
                        </CardContent>
                    </Card>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Onboarding Checklist */}
                        {onboarding && onboarding.status !== "completed" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <Card className="border-accent/40 bg-accent/5 overflow-hidden">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <CheckCircle className="w-5 h-5 text-accent animate-pulse" />
                                                Onboarding Checklist ({onboarding.role})
                                            </span>
                                            <span className="text-xs font-bold text-accent">
                                                {onboarding.checklist.filter((t: any) => t.completed).length} / {onboarding.checklist.length} Completed
                                            </span>
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Complete the tasks below to finalize onboarding and activate your project status.
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {onboarding.checklist.map((task: any, idx: number) => (
                                            <label
                                                key={idx}
                                                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent/10 cursor-pointer group transition-colors border border-transparent hover:border-accent/20"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={task.completed}
                                                    onChange={(e) => handleChecklistToggle(onboarding.id, idx, e.target.checked)}
                                                    className="mt-0.5 rounded text-accent focus:ring-accent border-border"
                                                />
                                                <span className={`text-sm flex-1 ${task.completed ? "line-through text-muted-foreground" : "text-card-foreground"}`}>
                                                    {task.task}
                                                </span>
                                                {task.completed && task.completedAt && (
                                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                                        {format(new Date(parseInt(task.completedAt) || task.completedAt), "MMM d")}
                                                    </span>
                                                )}
                                            </label>
                                        ))}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Primary PPT Viewer if exists */}
                        {project.documentation?.ppts && project.documentation.ppts.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                                <PPTViewer
                                    url={project.documentation.ppts[0]}
                                    title={`${project.title} - Main Presentation`}
                                />
                            </motion.div>
                        )}

                        {/* Description */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                            <Card className="border-border/50">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <FolderOpen className="w-4 h-4 text-accent" />
                                        Project Description
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div
                                        className="text-sm text-card-foreground/80 prose prose-sm dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{ __html: project.description }}
                                    />
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Progress */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <Card className="border-border/50">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Target className="w-4 h-4 text-accent" />
                                        Overall Progress
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-muted-foreground">Completion</span>
                                        <span className="text-sm font-semibold text-accent">{project.progress}%</span>
                                    </div>
                                    <Progress value={project.progress} className="h-3" />
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Tasks */}
                        {project.tasks && project.tasks.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                                <Card className="border-border/50">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-accent" />
                                            Tasks ({completedTasks}/{totalTasks})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {project.tasks.map((task: any, i: number) => (
                                                <div key={task.id || i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors">
                                                    <CheckCircle
                                                        className={`w-4 h-4 shrink-0 ${task.completed ? "text-accent" : "text-muted-foreground/30"}`}
                                                    />
                                                    <span className={`text-sm flex-1 ${task.completed ? "line-through text-muted-foreground" : "text-card-foreground"}`}>
                                                        {task.title}
                                                    </span>
                                                    {task.approved && (
                                                        <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-400 border-green-400/30">
                                                            Approved
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Milestones */}
                        {project.milestones && project.milestones.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                <Card className="border-border/50">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Star className="w-4 h-4 text-accent" />
                                            Milestones ({completedMilestones}/{totalMilestones})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {project.milestones.map((milestone: any, i: number) => (
                                                <div
                                                    key={i}
                                                    className={`p-3 rounded-lg border ${milestone.completed ? "border-green-500/20 bg-green-500/5" : "border-border/50 bg-background/30"}`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <CheckCircle className={`w-4 h-4 ${milestone.completed ? "text-green-400" : "text-muted-foreground/30"}`} />
                                                        <span className={`text-sm font-medium ${milestone.completed ? "text-green-400" : "text-card-foreground"}`}>
                                                            {milestone.title}
                                                        </span>
                                                        {milestone.dueDate && (
                                                            <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {milestone.dueDate}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {milestone.description && (
                                                        <p className="text-xs text-muted-foreground ml-6">{milestone.description}</p>
                                                    )}
                                                    {milestone.feedback && (
                                                        <div className="mt-2 ml-6 p-2 bg-accent/5 rounded text-xs text-accent">
                                                            Feedback: {milestone.feedback}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Grade & Feedback */}
                        {project.status === "completed" && project.grade && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                                <Card className="border-green-500/20 bg-green-500/5">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                                                <span className="text-2xl font-bold text-green-400">{project.grade}</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-card-foreground">Project Graded</p>
                                                {project.feedback && (
                                                    <p className="text-sm text-muted-foreground mt-1">{project.feedback}</p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Status Alerts */}
                        {project.status === "rejected" && (
                            <Card className="border-red-500/20 bg-red-500/5">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                                    <div>
                                        <p className="font-medium text-card-foreground">Request Rejected</p>
                                        <p className="text-xs text-muted-foreground">{project.feedback || "Please check with your trainer."}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {project.status === "pending_review" && (
                            <Card className="border-blue-500/20 bg-blue-500/5">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
                                    <div>
                                        <p className="font-medium text-card-foreground">Submitted for Review</p>
                                        <p className="text-xs text-muted-foreground">
                                            {project.submittedAt ? `Submitted on ${project.submittedAt}` : "Awaiting trainer review"}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Deadline */}
                        {project.deadline && (
                            <Card className="border-border/50">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4 text-accent" />
                                        <span className="text-sm font-medium">Deadline</span>
                                    </div>
                                    <p className="text-lg font-semibold text-card-foreground">{project.deadline}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Team */}
                        {project.team && project.team.length > 0 && (
                            <Card className="border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Users className="w-4 h-4 text-accent" />
                                        Team Members
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-2">
                                        {project.team.map((member: any, i: number) => (
                                            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                                                <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-card-foreground truncate">{member.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">{member.role}</p>
                                                </div>
                                                {member.user?.isOnline && (
                                                    <span className="w-2 h-2 rounded-full bg-green-400 ml-auto shrink-0" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Mentors */}
                        {project.mentors && project.mentors.length > 0 && (
                            <Card className="border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Star className="w-4 h-4 text-accent" />
                                        Mentors
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-2">
                                        {project.mentors.map((mentor: any, i: number) => (
                                            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                                                <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold">
                                                    {mentor.username.charAt(0).toUpperCase()}
                                                </div>
                                                <p className="text-xs font-medium text-card-foreground">@{mentor.username}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Project Toolbox */}
                        {(project.documentation?.links?.length > 0 || project.documentation?.ppts?.length > 0) && (
                            <Card className="border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Box className="w-4 h-4 text-accent" />
                                        Project Toolbox
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-1.5">
                                        {project.documentation?.ppts?.map((ppt: string, i: number) => (
                                            <a
                                                key={`ppt-${i}`}
                                                href={ppt}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-3 py-2 bg-background border border-border/50 rounded-md text-xs hover:border-accent/50 hover:text-accent transition-all"
                                            >
                                                <FileText className="w-3 h-3 shrink-0 text-red-400" />
                                                <span className="truncate">Presentation {i + 1}</span>
                                                <ExternalLink className="w-3 h-3 ml-auto shrink-0 opacity-50" />
                                            </a>
                                        ))}
                                        {project.documentation?.links?.map((link: any, i: number) => (
                                            <a
                                                key={`link-${i}`}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-3 py-2 bg-background border border-border/50 rounded-md text-xs hover:border-accent/50 hover:text-accent transition-all"
                                            >
                                                <LinkIcon className="w-3 h-3 shrink-0" />
                                                <span className="truncate">{link.title}</span>
                                                <ExternalLink className="w-3 h-3 ml-auto shrink-0 opacity-50" />
                                            </a>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <SubmitProjectDialog
                open={submitOpen}
                onOpenChange={setSubmitOpen}
                projectTitle={project.title}
                projectId={project.id}
            />
            <TeamChatDialog
                open={chatOpen}
                onOpenChange={setChatOpen}
                projectTitle={project.title}
                projectId={project.id}
                teamMembers={project.team || []}
            />
            <ViewGuidelinesDialog
                open={guidelinesOpen}
                onOpenChange={setGuidelinesOpen}
                project={project}
            />
        </PortalLayout>
    );
}
