import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Briefcase,
  Clock,
  CheckCircle,
  ArrowRight,
  Target,
  FileCode,
  FileText,
  Users,
  MessageSquare,
  Activity,
  Layers,
  Lock,
  Star,
  Stars,
  CreditCard,
  Award,
  Rocket
} from "lucide-react";
import { 
  BookCallDialog, 
  TeamChatDialog, 
  ProjectDetailsDialog, 
  SubmitProofDialog,
  GraduationDialog
} from "@/components/portal/dialogs";
import { useQuery } from "@apollo/client/react";
import { GET_MY_INTERNSHIP } from "@/lib/graphql/queries";
import { toast } from "sonner";
import DailyStandup from "@/components/portal/student/DailyStandup";
import { AIHelper } from "@/components/portal/AIHelper";
import { DailyProgramDashboard } from "@/components/portal/student/DailyProgramDashboard";

export default function StudentProgram() {
  const [activeProject, setActiveProject] = useState<any>(null);
  const [bookCallOpen, setBookCallOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [graduationOpen, setGraduationOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_MY_INTERNSHIP);

  const internship = (data as any)?.myProgram;

  const safeFormatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch (e) {
      return "TBD";
    }
  };

  if (loading) return (
    <PortalLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-8 w-64 bg-muted rounded animate-pulse"></div>
            <div className="h-8 w-24 bg-muted rounded-full animate-pulse"></div>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-40 bg-muted rounded-xl animate-pulse"></div>
              <div className="h-64 bg-muted rounded-xl animate-pulse"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-muted rounded-xl animate-pulse"></div>
              <div className="h-48 bg-muted rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>
    </PortalLayout>
  );

  if (error) return (
    <PortalLayout>
      <div className="p-8 text-destructive bg-destructive/5 rounded-lg border border-destructive/20">
        Error: {error.message}
      </div>
    </PortalLayout>
  );

  const stages = [
    "Stage 1: Foundation",
    "Stage 2: Intermediate",
    "Stage 3: Advanced",
    "Stage 4: Professional",
    "Graduated"
  ];
  const currentStageIndex = stages.indexOf(internship?.stage || "");

  return (
    <PortalLayout>
      <div className="space-y-6 pb-12">
        {internship && <DailyProgramDashboard username={internship.user?.username || "Scholar"} />}
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
              Your Program Journey
            </h1>
            <p className="text-muted-foreground mt-1">
              Master professional skills through real-world academy projects
            </p>
          </div>
          {internship && (
            <Badge variant="outline" className="bg-accent/5 text-accent border-accent/20 px-3 py-1">
              <Layers className="w-3.5 h-3.5 mr-2" />
              {internship.stage}
            </Badge>
          )}
        </div>

        {!internship ? (
          <Card className="border-border/50 bg-accent/5 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <CardContent className="py-20 text-center relative z-10">
              <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-10 h-10 text-accent" />
              </div>
              <h2 className="font-heading text-3xl font-bold mb-4">Initialize Your Journey</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                You don't have an active internship track yet. Browse our professional tracks and apply to start gaining hands-on experience.
              </p>
              <Link to="/portal/student/internships">
                <Button variant="gold" size="lg" className="h-14 px-10 rounded-2xl shadow-premium hover:-translate-y-1 transition-all">
                  Browse Program Tracks <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-muted/50 p-1 border border-border/50">
              <TabsTrigger value="overview">
                <Layers className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Activity className="w-4 h-4 mr-2" />
                My Activity
              </TabsTrigger>
              <TabsTrigger value="standup">
                <FileText className="w-4 h-4 mr-2" />
                Daily Standups
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Payment Alert */}
                  {(internship.status === 'eligible' || internship.payment?.status === 'pending') && (
                    <Card className="border-accent/40 bg-accent/5 overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                            <CreditCard className="w-8 h-8 text-accent" />
                          </div>
                          <div className="flex-1 text-center md:text-left">
                            <h3 className="text-lg font-bold mb-1">Activation Required</h3>
                            <p className="text-sm text-muted-foreground">
                              Your application is registered! Please upload proof of payment for the one-time application fee of 20,000 RWF to activate your Stage 1.
                            </p>
                          </div>
                          <Button
                            variant="gold"
                            size="lg"
                            className="shrink-0"
                            onClick={() => setProofDialogOpen(true)}
                          >
                            Upload Payment Proof <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Stages Visualizer */}
                  <Card className="border-border/50">
                    <CardContent className="p-6">
                      <h3 className="font-bold mb-6 flex items-center gap-2">
                        <Target className="w-4 h-4 text-accent" />
                        Progression Roadmap
                      </h3>
                      <div className="relative pt-2">
                        <div className="flex justify-between items-start">
                          {stages.map((st, idx) => (
                            <div key={st} className="flex flex-col items-center gap-3 relative z-10 flex-1">
                              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${idx <= currentStageIndex
                                ? "bg-accent border-accent text-accent-foreground shadow-lg shadow-accent/20"
                                : "bg-muted border-border text-muted-foreground"
                                }`}>
                                {idx < currentStageIndex ? <CheckCircle className="w-5 h-5" /> : idx === currentStageIndex ? <Star className="w-5 h-5 animate-pulse" /> : <Lock className="w-4 h-4" />}
                              </div>
                              <span className={`text-[10px] text-center font-bold uppercase ${idx === currentStageIndex ? "text-accent" : "text-muted-foreground"}`}>
                                {st.split(": ")[1] || st}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="absolute top-7 left-[10%] right-[10%] h-0.5 bg-muted -z-0" />
                        <div
                          className="absolute top-7 left-[10%] h-0.5 bg-accent transition-all duration-1000 -z-0"
                          style={{ width: `${(currentStageIndex / (stages.length - 1)) * 80}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Projects */}
                  <div className="space-y-4">
                    <h3 className="font-bold flex items-center gap-2 px-2">
                      <FileCode className="w-4 h-4 text-accent" />
                      Assigned Stage Projects
                    </h3>
                    {((internship.projects?.length > 0) || internship.assignedProject) ? (
                      <>
                        {internship.assignedProject && (
                          <Card className="border-border/50 hover:border-accent/40 transition-colors group mb-4">
                            <CardContent className="p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                                  <Rocket className="w-6 h-6 text-accent" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-lg">{internship.assignedProject.title}</h4>
                                  <div className="flex gap-2">
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter bg-accent/5">
                                      Team Project
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter">
                                      {internship.assignedProject.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Link to="/portal/student/internships?tab=dashboard">
                                  <Button variant="gold" size="sm">
                                    Open Board
                                  </Button>
                                </Link>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                        {internship.projects?.map((proj: any) => (
                          <Card key={proj.id} className="border-border/50 hover:border-accent/40 transition-colors group">
                            <CardContent className="p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                                  <FileText className="w-6 h-6 text-accent" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-lg">{proj.title}</h4>
                                  <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter">
                                    {proj.status}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => { setActiveProject(proj); setChatOpen(true); }}
                                >
                                  Team Chat
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => { setActiveProject(proj); setProjectDetailsOpen(true); }}
                                >
                                  Full Info
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </>
                    ) : (
                      <Card className="border-border/50 border-dashed bg-muted/5 p-10 text-center">
                        <Layers size={32} className="text-accent/30 mx-auto mb-4" />
                        <h4 className="font-bold mb-2">Awaiting Project Assignment</h4>
                        <p className="text-sm text-muted-foreground">We are matching you with a professional academy project.</p>
                      </Card>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Mentor Card */}
                  <Card className="border-border/50 overflow-hidden">
                    <div className="h-2 bg-accent" />
                    <CardContent className="p-6">
                      <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-accent" />
                        Your Mentor
                      </h3>
                      {internship.mentor ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent text-lg">
                              {internship.mentor.username?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold">{internship.mentor.username}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">Industry Expert</p>
                            </div>
                          </div>
                          <Button variant="gold" className="w-full" onClick={() => setChatOpen(true)}>
                            Community Chat
                          </Button>
                          <Button variant="outline" className="w-full" onClick={() => setBookCallOpen(true)}>
                            Book 1:1 Review
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Mentor Assignment Pending</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Tasks Card */}
                  <Card className="border-border/50 p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-accent" />
                      My Tasks
                    </h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {internship.tasks?.map((task: any) => (
                        <div key={task.id} className="flex items-center gap-3 p-2 bg-muted/20 rounded border border-border/50">
                          <div className={`w-4 h-4 rounded border ${task.status === "completed" ? "bg-green-500 border-green-500" : "border-muted-foreground/30"}`}>
                            {task.status === "completed" && <CheckCircle className="w-3 h-3 text-white mx-auto" />}
                          </div>
                          <span className={`text-sm flex-1 ${task.status === "completed" ? "line-through text-muted-foreground" : "font-medium"}`}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Program Details */}
                  <Card className="border-border/50 p-6 space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Organization</p>
                      <p className="text-sm font-medium">{internship.organization}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Duration</p>
                      <p className="text-sm font-medium">{internship.duration}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Type</p>
                      <p className="text-sm font-medium">{internship.type}</p>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <Card className="border-border/50 p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-accent" />
                  Program Activity
                </h3>
                <div className="space-y-4">
                  {internship.activityLog?.map((log: any, idx: number) => (
                    <div key={idx} className="flex gap-4 items-start p-3 rounded-lg border border-border/40">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <Activity className="w-4 h-4 text-accent" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{log.action}</p>
                        <p className="text-xs text-muted-foreground">{log.details}</p>
                        <p className="text-[10px] text-muted-foreground/60">{safeFormatDate(log.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="standup">
              <DailyStandup internshipId={internship.id} />
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Dialogs */}
      {internship?.mentor && (
        <BookCallDialog
          open={bookCallOpen}
          onOpenChange={setBookCallOpen}
          mentorName={internship.mentor.username}
          purpose="internship_review"
        />
      )}
      <TeamChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        projectId={activeProject?.id || ""}
        conversationId={activeProject?.conversationId}
        projectTitle={activeProject?.title || "Project Discussion"}
        teamMembers={activeProject?.team || []}
      />
      <ProjectDetailsDialog
        open={projectDetailsOpen}
        onOpenChange={setProjectDetailsOpen}
        project={activeProject}
        refetch={refetch}
      />
      <GraduationDialog
        open={graduationOpen}
        onOpenChange={setGraduationOpen}
        internship={internship}
      />
      {internship?.payment && (
        <SubmitProofDialog
          open={proofDialogOpen}
          onOpenChange={setProofDialogOpen}
          payment={{
            id: internship.payment.id || internship.id,
            itemTitle: "Program Application Fee",
            amount: internship.payment.amount || 20000,
            currency: internship.payment.currency || "RWF"
          }}
        />
      )}
    </PortalLayout>
  );
}
