import { useState } from "react";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  FolderOpen,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Upload,
  FileText,
  ExternalLink,
  BookOpen,
  Layers,
  Box,
  Link as LinkIcon,
} from "lucide-react";
import { SubmitProjectDialog, TeamChatDialog, ViewGuidelinesDialog } from "@/components/portal/dialogs";
import { toast } from "sonner";
import { useQuery } from "@apollo/client/react";
import { GET_MY_PROJECTS } from "@/lib/graphql/queries";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectMarketplace } from "@/components/portal/student/ProjectMarketplace";
import { AIHelper } from "@/components/portal/AIHelper";
import { Sparkles } from "lucide-react";

interface TeamMember {
  name: string;
  role: string;
  user?: {
    id: string;
    username: string;
    isOnline: boolean;
  };
}

interface Task {
  title: string;
  completed: boolean;
}

interface Project {
  id: string;
  title: string;
  course: string;
  type: string;
  status: string;
  progress: number;
  deadline?: string;
  daysLeft?: number;
  submittedAt?: string;
  grade?: string;
  feedback?: string;
  userId: string;
  user?: {
    id: string;
    username: string;
  };
  team?: TeamMember[];
  tasks?: Task[];
  description: string;
  documentation?: {
    links: { title: string; url: string }[];
  };
}

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

export default function StudentProjects() {
  // Dialog states
  const [submitProject, setSubmitProject] = useState<Project | null>(null);
  const [chatProject, setChatProject] = useState<Project | null>(null);
  const [guidelinesProject, setGuidelinesProject] = useState<Project | null>(null);

  // Current user
  const { user } = useAuth();

  // Fetch projects from GraphQL
  const { data, loading, error } = useQuery(GET_MY_PROJECTS);
  const projects: Project[] = (data as any)?.myProjects || [];

  const currentUserId = user?.id;

  const isProjectOwner = (project: Project) =>
    project.userId === currentUserId || project.user?.id === currentUserId;

  const handleViewSubmission = (projectTitle: string) => {
    toast.info(`Opening submission for ${projectTitle}...`);
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-muted rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (error) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">Error loading projects: {error.message}</p>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
              Projects
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your current projects or browse new opportunities
            </p>
          </div>
        </motion.div>

        <Tabs defaultValue="my-projects" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 max-w-[400px]">
            <TabsTrigger value="my-projects">My Projects</TabsTrigger>
            <TabsTrigger value="browse">Browse Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="my-projects" className="space-y-6">
            <div className="flex items-center gap-4 text-sm mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/20 rounded-full">
                <FolderOpen className="w-4 h-4 text-accent" />
                <span className="text-foreground">{projects.length} Projects</span>
              </div>
            </div>

            {/* Projects Grid/Empty State */}
            <div className="space-y-6">
              {projects.length === 0 ? (
                <Card className="border-border/50 bg-gradient-to-br from-card to-accent/5 overflow-hidden">
                  <CardContent className="p-8 lg:p-12">
                    <div className="max-w-2xl mx-auto text-center mb-12">
                      <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FolderOpen className="w-8 h-8 text-accent" />
                      </div>
                      <h2 className="text-2xl font-heading font-bold mb-3">Your Portfolio Journey Starts Here</h2>
                      <p className="text-muted-foreground">
                        You haven't been assigned any projects yet. This is a normal part of the learning flow!
                        Projects are unlocked as you progress through your courses or when you're placed in an internship team.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                      {/* Journey Line (Desktop) */}
                      <div className="hidden md:block absolute top-8 left-[15%] right-[15%] h-0.5 bg-border -z-0" />

                      <div className="flex flex-col items-center text-center relative z-10 group">
                        <div className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center mb-4 shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform">
                          <BookOpen size={24} />
                        </div>
                        <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">1. Learning</h4>
                        <p className="text-xs text-muted-foreground px-4">Master the core concepts through yours specialized courses.</p>
                      </div>

                      <div className="flex flex-col items-center text-center relative z-10 group">
                        <div className="w-16 h-16 rounded-full bg-background border-2 border-accent text-accent flex items-center justify-center mb-4 group-hover:bg-accent/5 transition-all">
                          <Users size={24} className="animate-pulse" />
                        </div>
                        <h4 className="font-bold text-sm mb-1 uppercase tracking-tight text-accent">2. Matching</h4>
                        <p className="text-xs text-muted-foreground px-4">Our team is reviewing your profile to match you with the perfect project team.</p>
                      </div>

                      <div className="flex flex-col items-center text-center relative z-10 group opacity-50">
                        <div className="w-16 h-16 rounded-full bg-muted border-2 border-border text-muted-foreground flex items-center justify-center mb-4">
                          <Layers size={24} />
                        </div>
                        <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">3. Execution</h4>
                        <p className="text-xs text-muted-foreground px-4">Start building real-world software and filling your portfolio.</p>
                      </div>
                    </div>

                    <div className="mt-12 p-4 bg-background/50 rounded-xl border border-border/50 text-center">
                      <p className="text-xs text-muted-foreground">
                        <AlertCircle size={12} className="inline mr-1 text-accent" />
                        <strong>Note:</strong> Most students are assigned their first project within 3-5 days of beginning their internship track.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border-border/50">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                          {/* Main Info */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-3 mb-1 flex-wrap">
                                  <h3 className="font-heading text-lg font-semibold text-card-foreground">
                                    {project.title}
                                  </h3>
                                  {getStatusBadge(project.status)}
                                  {isProjectOwner(project) ? (
                                    <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20 shrink-0">
                                      Your Project
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shrink-0">
                                      Assigned
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-card-foreground/60">
                                  {project.course} • {project.type}
                                </p>
                              </div>
                            </div>

                            <div
                              className="text-card-foreground/70 text-sm mb-4 line-clamp-3 prose prose-sm dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ __html: project.description }}
                            />

                            {/* Progress */}
                            {project.status !== "completed" && (
                              <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-card-foreground/70">Progress</span>
                                  <span className="text-sm font-medium text-accent">{project.progress}%</span>
                                </div>
                                <Progress value={project.progress} className="h-2" />
                              </div>
                            )}

                            {/* Team Members */}
                            {project.team && (
                              <div className="mb-4">
                                <p className="text-sm font-medium text-card-foreground mb-2 flex items-center gap-2">
                                  <Users className="w-4 h-4 text-accent" />
                                  Team Members
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {project.team.map((member, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center gap-2 px-3 py-1.5 bg-background/50 rounded-full text-xs"
                                    >
                                      <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs">
                                        {member.name.charAt(0)}
                                      </div>
                                      <span className="text-card-foreground">{member.name}</span>
                                      <span className="text-card-foreground/50">({member.role})</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Project Resources (Toolbox) */}
                            {project.documentation?.links && project.documentation.links.length > 0 && (
                              <div className="mb-4 p-3 bg-accent/5 rounded-lg border border-accent/10">
                                <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2 flex items-center gap-2">
                                  <Box className="w-3.5 h-3.5" />
                                  Project Toolbox
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {project.documentation.links.map((link, i) => (
                                    <a
                                      key={i}
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 px-3 py-1 bg-background border border-border/50 rounded-md text-[10px] hover:border-accent/50 hover:text-accent transition-all"
                                    >
                                      <LinkIcon className="w-3 h-3" />
                                      {link.title}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Grade & Feedback */}
                            {project.status === "completed" && (
                              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <span className="text-lg font-bold text-green-400">{project.grade}</span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-card-foreground">Graded</p>
                                    <p className="text-xs text-card-foreground/60">Great job!</p>
                                  </div>
                                </div>
                                <p className="text-sm text-card-foreground/70">{project.feedback}</p>
                              </div>
                            )}

                            {/* Rejected Status */}
                            {project.status === "rejected" && (
                              <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                                <div className="flex items-center gap-3 mb-2">
                                  <AlertCircle className="w-5 h-5 text-red-400" />
                                  <div>
                                    <p className="font-medium text-card-foreground">Request Rejected</p>
                                    <p className="text-xs text-card-foreground/60">{project.feedback || "Please check with your trainer."}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Pending Review Status */}
                            {project.status === "pending_review" && (
                              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <div className="flex items-center gap-3">
                                  <AlertCircle className="w-5 h-5 text-blue-400" />
                                  <div>
                                    <p className="font-medium text-card-foreground">Submitted for Review</p>
                                    <p className="text-xs text-card-foreground/60">Submitted on {project.submittedAt ? new Date(!isNaN(Number(project.submittedAt)) ? Number(project.submittedAt) : project.submittedAt).toLocaleDateString() : 'N/A'}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Pending Approval Status */}
                            {project.status === "pending_approval" && (
                              <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                <div className="flex items-center gap-3">
                                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                                  <div>
                                    <p className="font-medium text-card-foreground">Pending Approval</p>
                                    <p className="text-xs text-card-foreground/60">Your request to start this project is awaiting trainer approval.</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Sidebar */}
                          <div className="lg:w-64 space-y-4">
                            {/* Deadline */}
                            {project.status === "in_progress" && project.deadline && (
                              <div className="p-4 bg-background/50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Calendar className="w-4 h-4 text-accent" />
                                  <span className="text-sm font-medium text-card-foreground">Deadline</span>
                                </div>
                                <p className="text-lg font-semibold text-card-foreground">
                                  {new Date(!isNaN(Number(project.deadline)) ? Number(project.deadline) : project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                                <p className="text-xs text-accent">{project.daysLeft} days remaining</p>
                              </div>
                            )}

                            {/* Tasks Checklist */}
                            {project.tasks && (
                              <div className="p-4 bg-background/50 rounded-lg">
                                <p className="text-sm font-medium text-card-foreground mb-3">Tasks</p>
                                <div className="space-y-2">
                                  {project.tasks.map((task, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <CheckCircle
                                        className={`w-4 h-4 ${task.completed ? "text-accent" : "text-card-foreground/30"
                                          }`}
                                      />
                                      <span
                                        className={`text-xs ${task.completed
                                          ? "text-card-foreground/70 line-through"
                                          : "text-card-foreground"
                                          }`}
                                      >
                                        {task.title}
                                      </span>
                                      <AIHelper
                                        type={task.completed ? "review" : "explain"}
                                        taskTitle={task.title}
                                        description={`Project: ${project.title}`}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="space-y-2">
                              {project.status === "in_progress" && (
                                <>
                                  <Button
                                    variant="gold"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => setSubmitProject(project)}
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Submit Project
                                  </Button>
                                  {project.team && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full"
                                      onClick={() => setChatProject(project)}
                                    >
                                      <MessageSquare className="w-4 h-4 mr-2" />
                                      Team Chat
                                    </Button>
                                  )}
                                </>
                              )}
                              {project.status === "completed" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => handleViewSubmission(project.title)}
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View Submission
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => setGuidelinesProject(project)}
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                View Details & Guidelines
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )))}
            </div>
          </TabsContent>

          <TabsContent value="browse">
            <ProjectMarketplace />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <SubmitProjectDialog
        open={!!submitProject}
        onOpenChange={(open) => !open && setSubmitProject(null)}
        projectTitle={submitProject?.title || ""}
        projectId={submitProject?.id || ""}
      />
      <TeamChatDialog
        open={!!chatProject}
        onOpenChange={(open) => !open && setChatProject(null)}
        projectTitle={chatProject?.title || ""}
        projectId={chatProject?.id || ""}
        teamMembers={chatProject?.team || []}
      />
      <ViewGuidelinesDialog
        open={!!guidelinesProject}
        onOpenChange={(open) => !open && setGuidelinesProject(null)}
        project={guidelinesProject}
      />
    </PortalLayout>
  );
}
