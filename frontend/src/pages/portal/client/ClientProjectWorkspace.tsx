import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Rocket, Users, CheckCircle2, Clock,
  FileText, Download, MessageSquare, Star, TrendingUp,
  ChevronRight, Loader2, Package, GitBranch, ShieldCheck,
  Circle, BarChart3, Eye, CalendarDays, Layers
} from "lucide-react";

const GET_MY_APPLICATIONS = gql`
  query GetMyClientProjects {
    myProjectApplications {
      id
      title
      description
      status
      ndaSigned
      createdAt
    }
  }
`;

const GET_CLIENT_PROJECT = gql`
  query GetClientProject($applicationId: ID!) {
    projectByApplicationId(applicationId: $applicationId) {
      id
      title
      description
      status
      progress
      deadline
      course
      type
      team {
        userId
        name
        role
      }
      mentors {
        id
        username
        fullName
      }
      tasks {
        id
        title
        completed
        approved
        feedback
        category
      }
      milestones {
        title
        description
        dueDate
        completed
        submissions {
          url
          submittedAt
          message
          feedback
          status
          version
          fileName
          submittedBy
        }
        feedback
      }
      evaluation {
        clientFeedback {
          rating
          comment
          submittedAt
        }
        developerEvaluations {
          developerId
          rating
          notes
        }
        reviewerNotes
      }
      createdAt
    }
  }
`;





const lifecycleStages = [
  { key: "draft", label: "Draft", icon: FileText },
  { key: "nda_pending", label: "NDA Signing", icon: ShieldCheck },
  { key: "in_progress", label: "Development", icon: GitBranch },
  { key: "review", label: "Review", icon: Eye },
  { key: "completed", label: "Delivered", icon: CheckCircle2 },
];

function getStageIndex(status: string) {
  const map: Record<string, number> = {
    draft: 0, nda_pending: 1, in_progress: 2, review: 3, completed: 4, archived: 4,
  };
  return map[status] ?? 0;
}



function getMilestoneStatusColor(completed: boolean) {
  return completed ? "text-green-500" : "text-muted-foreground";
}

export default function ClientProjectWorkspace() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");


  const { data: appsData, loading: appsLoading } = useQuery(GET_MY_APPLICATIONS);
  const { data: projectData, loading: projectLoading, refetch: refetchProject } = useQuery(
    GET_CLIENT_PROJECT,
    { variables: { applicationId: selectedProjectId }, skip: !selectedProjectId }
  );



  const applications = (appsData as any)?.myProjectApplications || [];
  const activeApps = applications.filter((a: any) => a.ndaSigned && a.status === "approved");
  const project: any = (projectData as any)?.projectByApplicationId;

  

  if (appsLoading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </PortalLayout>
    );
  }

  if (activeApps.length === 0) {
    return (
      <PortalLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
          <div className="p-6 rounded-full bg-accent/10">
            <Rocket className="w-12 h-12 text-accent" />
          </div>
          <h2 className="font-heading text-2xl font-bold">No Active Projects Yet</h2>
          <p className="text-muted-foreground max-w-md">
            Once your project proposal is approved and the NDA is signed, your live project workspace will appear here.
          </p>
          <Button variant="gold" onClick={() => (window.location.href = "/portal/client/applications")}>
            Submit a Proposal <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-medium">Project Workspace</h1>
            <p className="text-muted-foreground mt-1">Monitor your project's live progress and deliverables.</p>
          </div>
          <select
            className="bg-card border border-border/50 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent max-w-xs"
            value={selectedProjectId || ""}
            onChange={(e) => setSelectedProjectId(e.target.value || null)}
          >
            <option value="">— Select a Project —</option>
            {activeApps.map((app: any) => (
              <option key={app.id} value={app.id}>{app.title}</option>
            ))}
          </select>
        </div>

        {!selectedProjectId && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeApps.map((app: any) => (
              <motion.div
                key={app.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedProjectId(app.id)}
                className="p-5 bg-card border border-border/50 rounded-2xl cursor-pointer hover:border-accent/40 transition-all group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Rocket className="w-5 h-5 text-accent" />
                  </div>
                  <Badge className="text-[10px] uppercase font-bold bg-green-500/10 text-green-500 border-green-500/20">
                    {app.status.replace("_", " ")}
                  </Badge>
                </div>
                <h3 className="font-bold text-sm line-clamp-2 mb-1 group-hover:text-accent transition-colors">{app.title}</h3>
                <div className="text-xs text-muted-foreground line-clamp-2 mb-4" dangerouslySetInnerHTML={{ __html: app.description }} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {format(new Date(parseInt(app.createdAt)), "MMM d, yyyy")}
                  </span>
                  <span className="text-accent font-semibold flex items-center gap-1">
                    Open <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {selectedProjectId && (
          <>
            {projectLoading ? (
              <div className="flex items-center justify-center min-h-[40vh]">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : project ? (
              <>
                {/* Lifecycle Progress Bar */}
                <Card className="border-border/50 bg-gradient-to-r from-card to-muted/10 overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between relative">
                      {/* Connector line */}
                      <div className="absolute left-0 right-0 top-5 h-px bg-border/50 z-0" />
                      <div
                        className="absolute left-0 top-5 h-px bg-accent/60 z-0 transition-all duration-700"
                        style={{ width: `${(getStageIndex(project.status) / (lifecycleStages.length - 1)) * 100}%` }}
                      />

                      {lifecycleStages.map((stage, i) => {
                        const current = getStageIndex(project.status);
                        const isDone = i < current;
                        const isActive = i === current;
                        return (
                          <div key={stage.key} className="flex flex-col items-center gap-2 relative z-10">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                              ${isDone ? "bg-accent border-accent text-accent-foreground" : isActive ? "bg-accent/20 border-accent text-accent animate-pulse" : "bg-card border-border/50 text-muted-foreground"}`}>
                              <stage.icon className="w-4 h-4" />
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider hidden sm:block
                              ${isActive ? "text-accent" : isDone ? "text-foreground" : "text-muted-foreground"}`}>
                              {stage.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Overall Progress", value: `${project.progress || 0}%`, icon: TrendingUp, color: "text-blue-500" },                    {label: "Milestones Done", value: `${project.milestones?.filter((m: any) => m.completed).length || 0}/${project.milestones?.length || 0}`, icon: Layers, color: "text-green-500" },                    {label: "Team Members", value: `${(project.team?.length || 0) + (project.mentors?.length || 0)}`, icon: Users, color: "text-purple-500" },                    {label: "Open Tasks", value: `${project.tasks?.filter((t: any) => !t.completed).length || 0}`, icon: Clock, color: "text-amber-500" },
                  ].map((stat) => (
                    <Card key={stat.label} className="border-border/50">
                      <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-muted/50 ${stat.color}`}>
                            <stat.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-2xl font-black">{stat.value}</p>
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                          </div>
                        </div>
                        {stat.label === "Overall Progress" && (
                          <Progress value={project.progress || 0} className="mt-3 h-1.5" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Main Content Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-card border border-border/50 rounded-xl p-1">
                    <TabsTrigger value="overview" className="rounded-lg text-xs font-semibold">Overview</TabsTrigger>
                    <TabsTrigger value="milestones" className="rounded-lg text-xs font-semibold">Milestones</TabsTrigger>
                    <TabsTrigger value="team" className="rounded-lg text-xs font-semibold">Team</TabsTrigger>
                    <TabsTrigger value="tasks" className="rounded-lg text-xs font-semibold">Tasks</TabsTrigger>
                    <TabsTrigger value="feedback" className="rounded-lg text-xs font-semibold">Feedback</TabsTrigger>
                  </TabsList>

                  {/* OVERVIEW TAB */}
                  <TabsContent value="overview" className="space-y-6 mt-4">
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Rocket className="w-5 h-5 text-accent" />
                          {project.title}
                        </CardTitle>
                        <CardDescription>
                          <div dangerouslySetInnerHTML={{ __html: project.description }} />
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div className="p-3 bg-muted/20 rounded-xl">
                            <p className="text-xs text-muted-foreground mb-1">Course Area</p>
                            <p className="font-bold">{project.course || "Software Development"}</p>
                          </div>
                          <div className="p-3 bg-muted/20 rounded-xl">
                            <p className="text-xs text-muted-foreground mb-1">Type</p>
                            <p className="font-bold">{project.type || "—"}</p>
                          </div>
                          <div className="p-3 bg-muted/20 rounded-xl">
                            <p className="text-xs text-muted-foreground mb-1">Target Deadline</p>
                            <p className="font-bold">
                              {project.deadline ? format(new Date(parseInt(project.deadline)), "MMM d, yyyy") : "—"}
                            </p>
                          </div>
                        </div>

                        {/* Recent Deliverables */}
                        {project.milestones?.some((m: any) => m.submissions?.length > 0) && (
                          <div className="mt-4">
                            <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                              <Package className="w-4 h-4 text-accent" /> Recent Deliverables
                            </h4>
                            <div className="space-y-2">
                              {project.milestones?.flatMap((m: any, mi: number) =>
                                (m.submissions || []).slice(-2).map((s: any, si: number) => (
                                  <div key={`${mi}-${si}`} className="flex items-center justify-between p-3 bg-muted/10 border border-border/30 rounded-xl">
                                    <div className="flex items-center gap-3">
                                      <FileText className="w-4 h-4 text-accent shrink-0" />
                                      <div>
                                        <p className="text-xs font-bold">{s.fileName || 'Deliverable'}</p>
                                        <p className="text-[10px] text-muted-foreground">{m.title} · v{s.version || 1}</p>
                                      </div>
                                    </div>
                                    <a href={s.url} target="_blank" rel="noreferrer">
                                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                                        <Download className="w-3 h-3 mr-1" /> View
                                      </Button>
                                    </a>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* MILESTONES TAB */}
                  <TabsContent value="milestones" className="space-y-4 mt-4">                      {(project.milestones || []).length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                        <Layers className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No milestones defined yet.</p>
                      </div>
                    ) : (
                      project.milestones.map((milestone: any, idx: number) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <Card className="border-border/50 hover:border-accent/30 transition-colors">
                            <CardContent className="pt-5">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className={`mt-1 ${getMilestoneStatusColor(milestone.completed)}`}>
                                    {milestone.completed ? (
                                      <CheckCircle2 className="w-5 h-5" />
                                    ) : (
                                      <Circle className="w-5 h-5" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-bold text-sm">{milestone.title}</h4>
                                      <Badge variant="outline" className={`text-[10px] uppercase ${getMilestoneStatusColor(milestone.completed)} border-current/20 bg-current/5`}>
                                        {milestone.completed ? "Completed" : "Pending"}
                                      </Badge>
                                      {milestone.dueDate && (
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                          <CalendarDays className="w-3 h-3" />
                                          Due {format(new Date(parseInt(milestone.dueDate)), "MMM d")}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>

                                    {/* Submissions */}
                                    {milestone.submissions?.length > 0 && (
                                      <div className="mt-3 space-y-1.5">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Submitted Files</p>
                                        {milestone.submissions.map((s: any, si: number) => (
                                          <div key={si} className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg">
                                            <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
                                            <span className="text-xs font-medium flex-1">{s.fileName || 'Deliverable'}</span>
                                            <span className="text-[10px] text-muted-foreground">v{s.version || 1}</span>
                                            <a href={s.url} target="_blank" rel="noreferrer">
                                              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2">
                                                <Download className="w-2.5 h-2.5 mr-1" /> View
                                              </Button>
                                            </a>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))
                    )}
                  </TabsContent>

                  {/* TEAM TAB */}
                  <TabsContent value="team" className="mt-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Developers */}
                      <Card className="border-border/50">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Users className="w-4 h-4 text-accent" /> Developer Team
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {(project.team || []).length === 0 ? (
                            <p className="text-sm text-muted-foreground">No developers assigned yet.</p>
                          ) : (
                            project.team.map((member: any, i: number) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
                                <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-xs font-black text-accent">
                                  {(member.name || "D")[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-bold">{member.name}</p>
                                  <p className="text-xs text-muted-foreground">{member.role}</p>
                                </div>
                                <Badge className="ml-auto text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/20">Developer</Badge>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>

                      {/* Mentors */}
                      <Card className="border-border/50">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Star className="w-4 h-4 text-accent" /> Project Mentors
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {(project.mentors || []).length === 0 ? (
                            <p className="text-sm text-muted-foreground">No mentors assigned yet.</p>
                          ) : (
                            project.mentors.map((mentor: any) => (
                              <div key={mentor.id} className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
                                <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center text-xs font-black text-gold">
                                  {(mentor.fullName || "M")[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-bold">{mentor.fullName}</p>
                                  <p className="text-xs text-muted-foreground">Project Mentor</p>
                                </div>
                                <Badge className="ml-auto text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20">Mentor</Badge>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* TASKS TAB */}
                  <TabsContent value="tasks" className="mt-4">
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle className="text-base">Task Board</CardTitle>
                        <CardDescription>Read-only view of the development task progress.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {(project.tasks || []).length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No tasks created yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {project.tasks.map((task: any) => (
                              <div key={task.id} className="flex items-center gap-3 p-3 bg-muted/10 border border-border/30 rounded-xl hover:border-accent/30 transition-colors">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${task.completed ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                                  {task.category && <p className="text-[10px] text-muted-foreground">{task.category}</p>}
                                </div>
                                {task.approved && (
                                  <Badge className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20">Approved</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* FEEDBACK TAB */}
                  <TabsContent value="feedback" className="mt-4">
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-accent" /> Project Evaluations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(!project.evaluation || (!project.evaluation.clientFeedback && (!project.evaluation.developerEvaluations || project.evaluation.developerEvaluations.length === 0))) ? (
                          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No evaluations submitted yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {project.evaluation.clientFeedback && (
                              <div className="p-4 bg-muted/20 border border-border/40 rounded-xl space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-bold">Client Feedback</span>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, si) => (
                                      <Star key={si} className={`w-3.5 h-3.5 ${si < Math.round((project.evaluation.clientFeedback.rating || 0) / 2) ? "text-gold fill-gold" : "text-muted-foreground"}`} />
                                    ))}
                                    <span className="text-xs font-bold ml-1">{project.evaluation.clientFeedback.rating}/10</span>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">{project.evaluation.clientFeedback.comment}</p>
                                {project.evaluation.clientFeedback.submittedAt && (
                                  <p className="text-[10px] text-muted-foreground/60">
                                    {format(new Date(parseInt(project.evaluation.clientFeedback.submittedAt)), "MMM d, yyyy")}
                                  </p>
                                )}
                              </div>
                            )}
                            {project.evaluation.developerEvaluations?.map((ev: any, i: number) => (
                              <div key={i} className="p-4 bg-muted/20 border border-border/40 rounded-xl space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-bold">Developer Evaluation #{i + 1}</span>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, si) => (
                                      <Star key={si} className={`w-3.5 h-3.5 ${si < Math.round((ev.rating || 0) / 2) ? "text-gold fill-gold" : "text-muted-foreground"}`} />
                                    ))}
                                    <span className="text-xs font-bold ml-1">{ev.rating}/10</span>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">{ev.notes}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No project data found. The project may still be in setup.</p>
              </div>
            )}
          </>
        )}
      </div>
    </PortalLayout>
  );
}
