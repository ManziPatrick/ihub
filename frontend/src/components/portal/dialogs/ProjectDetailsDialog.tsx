import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  ExternalLink,
  FileText,
  Video,
  Image as ImageIcon,
  MessageSquare,
  Clock,
  Circle,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  User,
  Github,
  Globe,
  Youtube,
  BrainCircuit,
  Plus,
  Link as LinkIcon, Sparkles
} from "lucide-react";
import { useMutation, useQuery } from "@apollo/client/react";
import { UPDATE_TASK_PROGRESS } from "@/lib/graphql/mutations";
import { GET_RESOURCES } from "@/lib/graphql/queries";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { AIHelper } from "../AIHelper";

import { AddResourceDialog } from "./AddResourceDialog";
import { useAuth } from "@/contexts/AuthContext";

interface ProjectDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
  refetch: () => void;
}

export function ProjectDetailsDialog({ open, onOpenChange, project, refetch }: ProjectDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "milestones" | "tasks" | "documentation">("overview");
  const [showAddResource, setShowAddResource] = useState(false);
  const { user } = useAuth();

  const { data: resourcesData, refetch: refetchResources } = useQuery(GET_RESOURCES, {
    variables: { linkedTo: project?.id, onModel: 'Project' },
    skip: !project?.id
  });

  const resources = (resourcesData as any)?.getResources || [];

  const [updateTask, { loading: updatingTask }] = useMutation(UPDATE_TASK_PROGRESS, {
    onCompleted: () => {
      toast.success("Task updated!");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  if (!project) return null;

  const handleToggleTask = (taskId: string, completed: boolean) => {
    updateTask({
      variables: {
        projectId: project.id,
        taskId,
        completed: !completed
      }
    });
  };

  const tasks = project?.tasks || [];
  const milestones = project?.milestones || [];
  const totalItems = tasks.length + milestones.length;
  const completedItems = tasks.filter((t: any) => t.completed).length + milestones.filter((m: any) => m.completed).length;

  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : (project?.progress || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-border/50 bg-card/95 backdrop-blur-xl">
        {/* Header Section */}
        <div className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] uppercase font-bold text-accent border-accent/30 bg-accent/5">
                  {project?.type}
                </Badge>
                {project?.deadline && (
                  <Badge variant="outline" className="text-[10px] uppercase font-bold">
                    <Clock className="w-3 h-3 mr-1" />
                    Due {project?.deadline ? new Date(project.deadline).toLocaleDateString() : 'TBD'}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-2xl font-heading font-bold text-foreground">
                {project?.title}
              </DialogTitle>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Project Health</p>
              <div className="flex items-center gap-2 justify-end">
                <p className={`text-2xl font-bold ${progress > 70 ? "text-green-500" : progress > 30 ? "text-accent" : "text-amber-500"}`}>
                  {progress}%
                </p>
                {progress === 100 && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              </div>
            </div>
          </div>
          <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden border border-border/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`absolute top-0 left-0 h-full rounded-full ${progress > 70 ? "bg-gradient-to-r from-green-600 to-green-400" :
                progress > 30 ? "bg-gradient-to-r from-gold to-accent" :
                  "bg-gradient-to-r from-amber-600 to-amber-400"
                }`}
            />
            {/* Glossy Effect */}
            <div className="absolute top-0 left-0 w-full h-[30%] bg-white/10 opacity-50" />
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-border/50 bg-muted/30">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 text-sm font-medium transition-all relative ${activeTab === "overview" ? "text-accent" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Overview
            {activeTab === "overview" && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
          </button>

          {project.milestones && project.milestones.length > 0 && (
            <button
              onClick={() => setActiveTab("milestones")}
              className={`px-6 py-3 text-sm font-medium transition-all relative ${activeTab === "milestones" ? "text-accent" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Milestones ({project.milestones.length})
              {activeTab === "milestones" && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
            </button>
          )}
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-6 py-3 text-sm font-medium transition-all relative ${activeTab === "tasks" ? "text-accent" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Tasks ({tasks.length})
            {activeTab === "tasks" && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
          </button>
          <button
            onClick={() => setActiveTab("documentation")}
            className={`px-6 py-3 text-sm font-medium transition-all relative ${activeTab === "documentation" ? "text-accent" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Full Documentation
            {activeTab === "documentation" && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-background/50">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Project Description</h3>
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-heading prose-headings:font-bold prose-p:leading-relaxed prose-a:text-accent hover:prose-a:underline"
                    dangerouslySetInnerHTML={{ __html: project.description }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl border border-border/50 bg-muted/10 space-y-3">
                    <h4 className="font-bold flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent" />
                      Team Members
                    </h4>
                    <div className="space-y-2">
                      {project.team?.map((member: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-background/50 border border-border/30">
                          <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                            {member.name?.charAt(0) || "U"}
                          </div>
                          <span className="font-medium">{member.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto uppercase border border-border/50 px-1.5 rounded">{member.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-border/50 bg-muted/10 space-y-3">
                    <h4 className="font-bold flex items-center gap-2">
                      <Circle className="w-4 h-4 text-accent fill-accent/10" />
                      Mentors Assigned
                    </h4>
                    <div className="space-y-2">
                      {project.mentors?.map((mentor: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-background/50 border border-border/30">
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-500">
                            {mentor.username?.charAt(0) || "M"}
                          </div>
                          <span className="font-medium">{mentor.username}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "milestones" && (
              <motion.div
                key="milestones"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Project Roadmap</h3>
                  <p className="text-xs text-muted-foreground">
                    {project.milestones.filter((m: any) => m.completed).length} of {project.milestones.length} completed
                  </p>
                </div>

                <div className="space-y-4">
                  {project.milestones.map((milestone: any, idx: number) => (
                    <div key={idx} className={`p-4 rounded-xl border transition-all ${milestone.completed ? "bg-green-500/5 border-green-500/20" : "bg-card border-border/50 hover:border-accent/30"
                      }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-bold ${milestone.completed ? "text-muted-foreground" : "text-foreground"}`}>
                              {milestone.title}
                            </h4>
                            {milestone.completed && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                          </div>
                          {milestone.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{milestone.description}</p>
                          )}
                          {milestone.dueDate && (
                            <p className={`text-xs font-medium flex items-center gap-1 ${new Date(milestone.dueDate) < new Date() && !milestone.completed ? "text-red-400" : "text-muted-foreground"
                              }`}>
                              <Clock className="w-3 h-3" /> Due {new Date(milestone.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {milestone.submissions && milestone.submissions.length > 0 && (
                            <Badge variant="secondary" className="bg-muted text-[10px]">
                              {milestone.submissions.length} Submission(s)
                            </Badge>
                          )}
                          {!milestone.completed && (
                            <Button size="sm" variant={milestone.submissions?.length ? "secondary" : "default"} className="h-8 text-xs">
                              {milestone.submissions?.length ? "Resubmit" : "Submit Work"}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Deliverables Checklist */}
                      {milestone.deliverables && milestone.deliverables.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <p className="text-xs font-bold text-muted-foreground create-uppercase mb-2">Deliverables:</p>
                          <ul className="space-y-1">
                            {milestone.deliverables.map((del: string, dIdx: number) => (
                              <li key={dIdx} className="text-xs flex items-start gap-2 text-muted-foreground">
                                <div className="w-1 h-1 rounded-full bg-accent/50 mt-1.5 shrink-0" />
                                {del}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Feedback Area */}
                      {milestone.feedback && (
                        <div className="mt-4 p-3 bg-accent/5 rounded-lg border border-accent/10">
                          <p className="text-xs italic text-muted-foreground flex gap-2">
                            <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                            {milestone.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "tasks" && (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {/* Milestone Videos */}
                {project.milestoneVideos?.length > 0 && (
                  <div className="p-4 rounded-xl border border-accent/20 bg-accent/5 space-y-3">
                    <h4 className="font-bold flex items-center gap-2 text-accent">
                      <Youtube className="w-5 h-5" />
                      Milestone Guidance Videos
                    </h4>
                    <div className="grid gap-3">
                      {project.milestoneVideos.map((vid: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50 group hover:border-accent transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center text-accent font-bold text-xs">
                              {idx + 1}
                            </div>
                            <span className="text-sm font-medium">{vid.title}</span>
                          </div>
                          <Button size="sm" variant="heroOutline" className="h-8" asChild>
                            <a href={vid.videoUrl} target="_blank" rel="noopener noreferrer">
                              Watch <ExternalLink className="w-3 h-3 ml-2" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-2">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Deliverables Checklist</h3>
                    {progress === 100 ? (
                      <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> All tasks completed! Ready for Final Submission.
                      </p>
                    ) : (
                      <p className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-1 animate-pulse">
                        <BrainCircuit className="w-3 h-3" /> {progress > 50 ? "Ahead of Schedule" : "On Track"} — Keep going!
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{tasks.filter((t: any) => t.completed).length} of {tasks.length} completed</span>
                </div>

                <div className="space-y-3">
                  {tasks.map((task: any) => (
                    <div
                      key={task.id}
                      className={`group flex items-start gap-4 p-4 rounded-xl border transition-all ${task.completed
                        ? "bg-green-500/5 border-green-500/20"
                        : "bg-muted/5 border-border/50 hover:border-accent/30"
                        }`}
                    >
                      <button
                        onClick={() => handleToggleTask(task.id, task.completed)}
                        disabled={updatingTask}
                        className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${task.completed
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-muted-foreground/30 hover:border-accent"
                          }`}
                      >
                        {task.completed && <CheckCircle2 className="w-4 h-4" />}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 justify-between">
                          <p className={`font-medium ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2">
                            {!task.completed && (
                              <AIHelper type="explain" taskTitle={task.title} description={`Task in project: ${project.title}`} />
                            )}
                            {task.approved ? (
                              <Badge className="bg-green-500/20 text-green-400 border-none text-[10px] font-bold px-2 py-0">
                                Approved
                              </Badge>
                            ) : task.completed ? (
                              <div className="flex items-center gap-2">
                                <AIHelper type="review" taskTitle={task.title} submissionContent="Student work is being prepared for review..." />
                                <Badge className="bg-amber-500/20 text-amber-500 border-none text-[10px] font-bold px-2 py-0">
                                  Pending Review
                                </Badge>
                              </div>
                            ) : null}
                          </div>
                        </div>
                        {task.feedback && (
                          <div className="mt-2 p-3 rounded-lg bg-accent/5 border border-accent/10 flex items-start gap-2">
                            <AlertCircle className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                            <p className="text-xs italic text-muted-foreground">{task.feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "documentation" && (
              <motion.div
                key="documentation"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-8 pb-10"
              >
                {/* Unified Resources Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-accent" />
                      Consolidated Learning Resources
                    </h3>
                    {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'mentor') && (
                      <Button
                        size="sm"
                        variant="heroOutline"
                        className="h-8 gap-2"
                        onClick={() => setShowAddResource(true)}
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Resource
                      </Button>
                    )}
                  </div>

                  {resources.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {resources.map((res: any) => (
                        <a
                          key={res.id}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/5 hover:bg-muted/10 group transition-all"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 rounded bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                              {res.type === 'video' ? <Video className="w-4 h-4" /> :
                                res.type === 'pdf' ? <FileText className="w-4 h-4" /> :
                                  <ExternalLink className="w-4 h-4" />}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-medium truncate">{res.title}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">{res.source.replace('_', ' ')}</p>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-accent/5 border border-dashed border-accent/20 rounded-xl italic text-muted-foreground text-sm">
                      No linked resources found. Click "Add Resource" to attach learning materials.
                    </div>
                  )}
                </div>

                {/* Visual Documentation */}
                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-accent" />
                    Reference Assets & Images
                  </h3>
                  {project.documentation?.images?.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {project.documentation.images.map((img: string, idx: number) => (
                        <div key={idx} className="aspect-video rounded-xl overflow-hidden border border-border/50 bg-muted/20 relative group">
                          <img src={img} alt={`Asset ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button size="icon" variant="ghost" asChild>
                              <a href={img} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-5 h-5 text-white" /></a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-muted/5 border border-dashed border-border/50 rounded-xl italic text-muted-foreground text-sm">
                      No images provided yet.
                    </div>
                  )}
                </div>

                {/* Video Resources */}
                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <Video className="w-4 h-4 text-accent" />
                    Walkthroughs & Loom Videos
                  </h3>
                  {project.documentation?.videos?.length > 0 ? (
                    <div className="space-y-3">
                      {project.documentation.videos.map((vid: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-muted/5 hover:bg-muted/10 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
                            <Youtube className="w-5 h-5" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{vid}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Video Resource</p>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <a href={vid} target="_blank" rel="noopener noreferrer">Watch <ExternalLink className="w-3 h-3 ml-2" /></a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-muted-foreground text-center py-4">No video resources available.</p>
                  )}
                </div>

                {/* Useful Links */}
                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <Globe className="w-4 h-4 text-accent" />
                    Technical Links & Documentation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {project.documentation?.links?.map((link: any, idx: number) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-muted/5 hover:border-accent/30 hover:bg-accent/5 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                          {link.url.includes("github") ? <Github className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold group-hover:text-accent transition-colors">{link.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{link.url}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-accent transition-colors" />
                      </a>
                    ))}
                    {project.submissionUrl && (
                      <a
                        href={project.submissionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <Github className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Base Repository</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{project.submissionUrl}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                      </a>
                    )}
                  </div>
                </div>

                {/* In Person Assistance */}
                {project.documentation?.inPersonNotes && (
                  <div className="space-y-4">
                    <h3 className="font-bold flex items-center gap-2 text-amber-500">
                      <AlertCircle className="w-4 h-4" />
                      In-Person Workspace & Support
                    </h3>
                    <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5">
                      <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                        {project.documentation.inPersonNotes}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-muted/30 flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Close Project View
          </Button>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-9 px-4">
              <FileCode className="w-4 h-4 mr-2" />
              Submit Milestone
            </Button>
          </div>
        </div>
        <AddResourceDialog
          open={showAddResource}
          onOpenChange={setShowAddResource}
          linkedTo={project?.id}
          onModel="Project"
          onSuccess={() => refetchResources()}
        />
      </DialogContent>
    </Dialog>
  );
}

function Users(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function FileCode(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m10 13-2 2 2 2" />
      <path d="m14 17 2-2-2-2" />
    </svg>
  );
}
