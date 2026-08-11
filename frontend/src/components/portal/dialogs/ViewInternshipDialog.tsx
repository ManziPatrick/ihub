import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, User, Calendar, CheckCircle, Clock, Layers, FileText, Video } from "lucide-react";
import SprintReview from "@/components/portal/trainer/SprintReview";
import MeetingScheduler from "@/components/portal/trainer/MeetingScheduler";

interface Internship {
  id: string;
  user: {
    username: string;
    email: string;
  };
  title: string;
  organization: string;
  duration: string;
  stage: string;
  mentor?: {
    username: string;
  };
  progress: number;
}

interface ViewInternshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  internship: Internship | null;
  showTrainerActions?: boolean;
}

export function ViewInternshipDialog({ open, onOpenChange, internship, showTrainerActions = false }: ViewInternshipDialogProps) {
  if (!internship) return null;

  const getInitials = (name: string) => name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 border-border/50">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent" />
            Opportunity Details
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-4 pb-4 sm:px-6 sm:pb-6">
          <Tabs defaultValue="overview" className="mt-4">
            {showTrainerActions && (
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="sprint">Sprint Reviews</TabsTrigger>
                <TabsTrigger value="meetings">Meetings</TabsTrigger>
              </TabsList>
            )}
            
            <TabsContent value="overview" className="m-0">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-xl border border-border/50">
                  <Avatar className="w-14 h-14 ring-4 ring-accent/5">
                    <AvatarFallback className="bg-accent/20 text-accent text-lg font-bold">
                      {getInitials(internship.user?.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{internship.user?.username}</h3>
                    <p className="text-sm text-muted-foreground">{internship.title}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/10 rounded-xl border border-border/30">
                    <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase font-bold tracking-widest mb-1.5">
                      <Building2 className="w-3.5 h-3.5 text-accent" />
                      Organization
                    </div>
                    <p className="font-semibold text-foreground text-sm">{internship.organization}</p>
                  </div>
                  <div className="p-4 bg-muted/10 rounded-xl border border-border/30">
                    <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase font-bold tracking-widest mb-1.5">
                      <User className="w-3.5 h-3.5 text-accent" />
                      Mentor
                    </div>
                    <p className="font-semibold text-foreground text-sm">{internship.mentor?.username || "Not assigned"}</p>
                  </div>
                </div>

                <div className="p-5 bg-muted/10 rounded-xl border border-border/30">
                  <div className="flex items-center justify-between mb-3 text-sm">
                    <span className="text-muted-foreground font-medium">Stage Progression</span>
                    <span className="font-bold text-accent">{internship.progress}%</span>
                  </div>
                  <Progress value={internship.progress} className="h-2 mb-4" />
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase text-muted-foreground tracking-tighter">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-accent" />
                      {internship.duration} Track
                    </span>
                    <Badge variant="outline" className="border-accent/20 text-accent bg-accent/5 px-2">
                      {internship.stage}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Program Requirements</h4>
                  <div className="space-y-2">
                    {[
                      "Complete stage-specific projects",
                      "Pass periodic review sessions",
                      "Demonstrate professional conduct"
                    ].map((req, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-muted/5 rounded-lg border border-border/20">
                        <CheckCircle className="w-4 h-4 text-accent" />
                        <span className="text-sm text-foreground/80">{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {showTrainerActions && (
              <>
                <TabsContent value="sprint" className="m-0">
                  <SprintReview internshipId={internship.id} />
                </TabsContent>
                <TabsContent value="meetings" className="m-0">
                  <MeetingScheduler internshipId={internship.id} />
                </TabsContent>
              </>
            )}
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
