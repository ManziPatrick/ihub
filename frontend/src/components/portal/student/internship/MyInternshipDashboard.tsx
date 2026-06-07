import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Users,
  Target,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  TrendingUp,
  Shield,
  Brain,
  User,
  Star,
  Zap,
  Layout,
  LayoutGrid,
  Video,
  ExternalLink,
  ArrowRight,
  Expand,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format, addDays, isBefore, isSameDay, getDay, isToday, startOfToday, isSameWeek, isSameMonth } from "date-fns";
import { useQuery } from "@apollo/client/react";
import { GET_MY_INTERNSHIP_MEETINGS, GET_INTERNSHIP_SUBMISSIONS } from "@/lib/graphql/queries";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { LogTimeDialog } from "../../dialogs/LogTimeDialog";
import { SubmitWorkDialog } from "../../dialogs/SubmitWorkDialog";
import { TeamChatDialog } from "../../dialogs/TeamChatDialog";
import { ExplainTaskDialog } from "../../dialogs/ExplainTaskDialog";
import { ProjectBoard } from '@/components/portal/admin/internship/ProjectBoard';
import { InternshipProjectDetailsDialog } from '@/components/portal/dialogs';
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface MyInternshipDashboardProps {
  team: any;
  loading: boolean;
  enrolledCount?: number;
  onBrowseClick?: () => void;
}

export function MyInternshipDashboard({ team, loading, enrolledCount = 0, onBrowseClick }: MyInternshipDashboardProps) {
  const [showLogTime, setShowLogTime] = useState(false);
  const [showSubmitWork, setShowSubmitWork] = useState(false);
  const [showTeamChat, setShowTeamChat] = useState(false);
  const [showExplainTask, setShowExplainTask] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<{ id: string; title: string, description: string } | null>(null);

  const { data: meetingsData } = useQuery(GET_MY_INTERNSHIP_MEETINGS);
  const [timeFilter, setTimeFilter] = useState<'3days' | 'week' | 'month' | 'all'>('3days');
  const [viewDate, setViewDate] = useState(startOfToday());

  const { data: submissionsData } = useQuery(GET_INTERNSHIP_SUBMISSIONS, {
     variables: { teamId: team?.id },
     skip: !team?.id,
     fetchPolicy: 'network-only' // ensure fresh data after submission
  });

  if (loading) {
    return <div className="flex items-center justify-center p-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
    </div>;
  }

  if (!team) {
    // Enrolled but waiting for team assignment
    if (enrolledCount > 0) {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Enrolled banner */}
          <div className="relative overflow-hidden rounded-[32px] border border-green-500/20 bg-green-500/5 p-8 lg:p-12 shadow-premium">
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl -mr-48 -mt-48" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
                  <span className="text-xs font-black uppercase tracking-widest text-green-600">Enrollment Verified</span>
                </div>
                <h2 className="text-4xl font-black text-foreground tracking-tight leading-tight">You're Officially In!<br/><span className="text-muted-foreground/60">Preparing your personalized track.</span></h2>
                <p className="text-base text-muted-foreground max-w-xl leading-relaxed font-medium">
                  Congratulations! Your enrollment is confirmed. Our academic team is currently assigning your 
                  <span className="text-foreground font-bold"> expert mentor</span> and <span className="text-foreground font-bold">production project</span>. 
                  Expect access to your dashboard within 24-48 business hours.
                </p>
              </div>
              <div className="flex flex-col gap-3 shrink-0">
                <div className="bg-background/80 backdrop-blur-md border border-border/50 rounded-3xl p-8 text-center shadow-xl">
                  <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Current Status</p>
                  <p className="text-xl font-black text-green-600">Enrolled Student</p>
                </div>
              </div>
            </div>
          </div>

          {/* What happens next timeline */}
          <Card className="border-border/50 rounded-[32px] shadow-large overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                    <Target className="w-5 h-5" />
                 </div>
                 <div>
                    <CardTitle className="text-xl font-black tracking-tight">Onboarding Roadmap</CardTitle>
                    <CardDescription className="font-medium">Your journey to becoming a professional developer starts here.</CardDescription>
                 </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { step: 1, title: 'Approved', done: true, desc: 'Application reviewed and accepted.' },
                  { step: 2, title: 'Verified', done: true, desc: 'Enrollment fee and documents verified.' },
                  { step: 3, title: 'Assignment', done: false, desc: 'Matching you with a team or individual track.', active: true },
                  { step: 4, title: 'Kickoff', done: false, desc: 'Meet your mentor and receive guidelines.' },
                  { step: 5, title: 'Execution', done: false, desc: 'Start building real-world features!' },
                ].map((item) => (
                  <div key={item.step} className={`p-6 rounded-3xl border transition-all ${
                    item.done ? 'bg-green-500/5 border-green-500/20' : item.active ? 'bg-accent/5 border-accent/20 ring-2 ring-accent/20' : 'bg-muted/30 border-border/50 opacity-60'
                  }`}>
                    <div className="flex items-center gap-4 mb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        item.done ? 'bg-green-500 text-white' : item.active ? 'bg-accent text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        {item.done ? <CheckCircle className="w-4 h-4" /> : item.step}
                      </div>
                      <p className={`font-black text-sm uppercase tracking-wider ${item.done ? 'text-green-600' : item.active ? 'text-accent' : 'text-foreground'}`}>{item.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Not enrolled — prompt to browse
    return (
      <Card className="border-border/50 rounded-3xl shadow-large p-12">
        <CardContent className="flex flex-col items-center justify-center p-0">
          <div className="w-20 h-20 rounded-3xl bg-muted/30 flex items-center justify-center mb-6">
            <Zap className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h3 className="text-2xl font-black mb-2 tracking-tight">Access Locked</h3>
          <p className="text-muted-foreground text-center max-w-md mb-8 font-medium">
            You don't have an active internship assignment yet. Choose from our world-class tracks to begin your professional journey.
          </p>
          {onBrowseClick ? (
            <Button variant="gold" size="lg" className="px-10 h-14 rounded-2xl shadow-premium font-black gap-2" onClick={onBrowseClick}>
              <Layout className="w-5 h-5" />
              Explore All Tracks
            </Button>
          ) : (
            <Link to="/internships">
              <Button variant="gold" size="lg" className="px-10 h-14 rounded-2xl shadow-premium font-black gap-2">
                <Layout className="w-5 h-5" />
                Explore All Tracks
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    );
  }

  const project = team.internshipProject;
  const isIndividual = team.type === 'individual';
  const milestones = project?.milestones || [];
  const completedMilestones = milestones.filter((m: any) => m.completed).length;
  const progressPercentage = team.status === 'completed'
    ? 100
    : (milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0);

   const meetings = (meetingsData as any)?.getMyInternshipMeetings || [];
   const submissions = (submissionsData as any)?.internshipSubmissions || [];

   const expandedMeetings = meetings.flatMap((m: any) => {
      const instances: any[] = [];
      const startTimestamp = Number(m.startTime);
      const isTimestamp = !isNaN(startTimestamp);
      const startDateObj = new Date(isTimestamp ? startTimestamp : m.startTime);
      if (isNaN(startDateObj.getTime())) return [];

      const now = new Date();
      const rangeStart = addDays(now, -30); 
      let rangeEnd = addDays(now, 90);

      const recurrenceEnd = m.recurrenceEndDate ? new Date(isNaN(Number(m.recurrenceEndDate)) ? m.recurrenceEndDate : Number(m.recurrenceEndDate)) : null;
      if (recurrenceEnd && !isNaN(recurrenceEnd.getTime())) {
        rangeEnd = recurrenceEnd;
      }

      const baseEvent = { ...m, host: m.host };

      if (m.type === 'DAILY') {
        let current = startDateObj;
        if (isBefore(current, rangeStart)) current = rangeStart;
        while (isBefore(current, rangeEnd) || isSameDay(current, rangeEnd)) {
          if (m.recurrenceDays?.length === 0 || m.recurrenceDays?.includes(getDay(current))) {
            instances.push({ ...baseEvent, id: `${m.id}-${format(current, "yyyy-MM-dd")}`, startTime: `${format(current, "yyyy-MM-dd")}T${format(startDateObj, "HH:mm")}:00` });
          }
          current = addDays(current, 1);
          if (instances.length > 200) break;
        }
      } else if (m.type === 'WEEKLY' && m.recurrenceDays?.length > 0) {
        let current = startDateObj;
        if (isBefore(current, rangeStart)) current = rangeStart;
        while (isBefore(current, rangeEnd) || isSameDay(current, rangeEnd)) {
          if (m.recurrenceDays.includes(getDay(current))) {
            instances.push({ ...baseEvent, id: `${m.id}-${format(current, "yyyy-MM-dd")}`, startTime: `${format(current, "yyyy-MM-dd")}T${format(startDateObj, "HH:mm")}:00` });
          }
          current = addDays(current, 1);
          if (instances.length > 200) break;
        }
      } else {
        instances.push(baseEvent);
      }
      return instances;
   }).sort((a: any, b: any) => new Date(!isNaN(Number(a.startTime)) ? Number(a.startTime) : a.startTime).getTime() - new Date(!isNaN(Number(b.startTime)) ? Number(b.startTime) : b.startTime).getTime())
   .filter((m: any) => {
      const eventDate = new Date(!isNaN(Number(m.startTime)) ? Number(m.startTime) : m.startTime);
      const today = startOfToday();
      
      if (isBefore(eventDate, today)) return false;

      if (timeFilter === 'all') return true;
      if (timeFilter === '3days') {
          const endDate = addDays(viewDate, 3);
          return (isSameDay(eventDate, viewDate) || isBefore(eventDate, endDate)) && (isSameDay(eventDate, viewDate) || !isBefore(eventDate, viewDate));
      }
      if (timeFilter === 'week') return isSameWeek(eventDate, viewDate);
      if (timeFilter === 'month') return isSameMonth(eventDate, viewDate);
      
      return true;
   });

   const handleNext = () => {
      if (timeFilter === '3days') setViewDate(addDays(viewDate, 3));
      else if (timeFilter === 'week') setViewDate(addDays(viewDate, 7));
      else if (timeFilter === 'month') setViewDate(addDays(viewDate, 30));
   };

   const handlePrev = () => {
      if (timeFilter === '3days') setViewDate(addDays(viewDate, -3));
      else if (timeFilter === 'week') setViewDate(addDays(viewDate, -7));
      else if (timeFilter === 'month') setViewDate(addDays(viewDate, -30));
   };

   return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Track Overview Card */}
      <Card className={`border-border/50 relative overflow-hidden rounded-[32px] shadow-large ${isIndividual ? 'bg-gradient-to-br from-purple-500/5 to-background' : 'bg-gradient-to-br from-accent/5 to-background'}`}>
        <div className={`absolute top-0 right-0 w-80 h-80 ${isIndividual ? 'bg-purple-500/10' : 'bg-accent/10'} rounded-full blur-3xl -mr-32 -mt-32`} />
        
        <CardHeader className="relative z-10 p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                 <Badge className={`font-black tracking-widest uppercase text-[10px] ${isIndividual ? 'bg-purple-500/10 text-purple-600' : 'bg-accent/10 text-accent'}`}>
                    {isIndividual ? 'Individual Assignment' : 'Collaborative Team'}
                 </Badge>
                 <Badge variant="outline" className="font-bold border-border/50 capitalize px-3">
                    {team.status}
                 </Badge>
              </div>
              <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight leading-none">{team.name}</h2>
                <p className="text-lg text-muted-foreground mt-2 font-semibold">
                  Track: {project?.title || 'Personal Track Initialization...'}
                </p>
              </div>
            </div>
            
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-4 bg-background/50 backdrop-blur-md p-4 rounded-[28px] border border-border/50 shadow-sm min-w-[200px]">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isIndividual ? 'bg-purple-500/10' : 'bg-accent/10'}`}>
                         <TrendingUp className={`w-6 h-6 ${isIndividual ? 'text-purple-500' : 'text-accent'}`} />
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Track Progress</p>
                         <p className="text-2xl font-black text-foreground leading-none">{Math.round(progressPercentage)}%</p>
                      </div>
                   </div>
                   <Button variant="outline" size="icon" className="w-12 h-12 rounded-2xl border-border/50 hover:bg-accent hover:text-accent-foreground group" onClick={() => setShowDocs(true)}>
                      <Expand className="w-5 h-5 group-hover:scale-110 transition-transform" />
                   </Button>
                </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 p-8 pt-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Mentor */}
            <div className="bg-background/80 backdrop-blur-md p-6 rounded-3xl border border-border/50 group hover:border-accent/40 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Shield className="w-6 h-6 text-accent" />
                </div>
                <div>
                   <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">Your Mentor</p>
                   <p className="text-base font-black text-foreground">{team.mentor?.fullName || team.mentor?.username || 'Guidance Pending'}</p>
                </div>
              </div>
            </div>

            {/* Capacity */}
            {!isIndividual && (
              <div className="bg-background/80 backdrop-blur-md p-6 rounded-3xl border border-border/50 group hover:border-accent/40 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                     <Users className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                     <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">Collaborators</p>
                     <p className="text-base font-black text-foreground">{team.members?.length || 0} Professional</p>
                  </div>
                </div>
              </div>
            )}
            
            {isIndividual && (
               <div className="bg-background/80 backdrop-blur-md p-6 rounded-3xl border border-border/50 group hover:border-purple-400/40 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                     <Star className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                     <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">Focus Mode</p>
                     <p className="text-base font-black text-foreground">Self-Paced Track</p>
                  </div>
                </div>
              </div>
            )}

            {/* Time Elapsed (Placeholder/Dynamic) */}
            <div className="bg-background/80 backdrop-blur-md p-6 rounded-3xl border border-border/50 group hover:border-accent/40 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Clock className="w-6 h-6 text-accent" />
                </div>
                <div>
                   <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">Track Duration</p>
                   <p className="text-base font-black text-foreground">{team.duration || '3 Months'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Project Section */}
        <div className="lg:col-span-2 space-y-8">
           {project ? (
             <Card className="border-border/50 rounded-[32px] shadow-large overflow-hidden">
                <CardHeader className="p-8 pb-4">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className="w-12 h-12 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center shadow-premium">
                            <Target className="w-6 h-6" />
                         </div>
                         <div>
                            <CardTitle className="text-xl font-black tracking-tight">Professional Milestones</CardTitle>
                            <CardDescription className="font-medium">{milestones.length} Strategic Objectives</CardDescription>
                         </div>
                      </div>
                   </div>
                </CardHeader>
                
                <CardContent className="p-8 space-y-6">
                   <div className="space-y-4">
                      {milestones.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-50 grayscale border-2 border-dashed border-border/50 rounded-3xl">
                           <Layout className="w-12 h-12 text-muted-foreground/30" />
                           <div>
                              <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Initializing Roadmap</p>
                              <p className="text-xs font-medium text-muted-foreground mt-1 max-w-[200px]">Your mentor is currently designing your project phases.</p>
                           </div>
                        </div>
                      ) : (
                        milestones.map((milestone: any, idx: number) => {
                           const isPast = milestone.deadline ? new Date(!isNaN(Number(milestone.deadline)) ? Number(milestone.deadline) : milestone.deadline) < new Date() : false;
                           const isCompleted = milestone.completed;
                           const milestoneSubmission = submissions.find((sub: any) => sub.milestoneId === milestone.id);
                           
                           return (
                             <div 
                               key={milestone.id}
                               className={`group p-6 rounded-3xl border transition-all duration-300 ${
                                 isCompleted 
                                 ? 'bg-green-500/5 border-green-500/20 shadow-sm' 
                                 : isPast 
                                   ? 'bg-destructive/5 border-destructive/20' 
                                   : 'bg-muted/10 border-border/50 hover:border-accent/40 hover:bg-muted/20'
                               }`}
                             >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                   <div className="flex items-start gap-4">
                                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition-transform group-hover:scale-110 shrink-0 ${
                                         isCompleted ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground border border-border/50'
                                      }`}>
                                         {isCompleted ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                                      </div>
                                      <div>
                                         <h4 className="font-black text-base text-foreground leading-tight">{milestone.title}</h4>
                                         <div className="flex items-center gap-3 mt-1.5">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                               <Calendar className="w-3.5 h-3.5 text-accent" />
                                               Target: {milestone.deadline ? new Date(!isNaN(Number(milestone.deadline)) ? Number(milestone.deadline) : milestone.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                                            </div>
                                            {isPast && !isCompleted && (
                                              <Badge variant="destructive" className="text-[9px] font-black tracking-widest uppercase">Overdue</Badge>
                                            )}
                                         </div>
                                      </div>
                                   </div>
                                   
                                   <div className="flex items-center gap-2">
                                      {!isCompleted && !milestoneSubmission && (
                                        <>
                                           <Button 
                                             size="sm" 
                                             variant="ghost" 
                                             className="h-10 rounded-xl px-4 gap-2 font-black text-[10px] uppercase tracking-widest bg-accent/5 hover:bg-accent/10 border border-accent/20 text-accent"
                                             onClick={() => {
                                               setSelectedMilestone({ 
                                                 id: milestone.id, 
                                                 title: milestone.title,
                                                 description: milestone.description || "Synthesizing professional context..."
                                               });
                                               setShowExplainTask(true);
                                             }}
                                           >
                                              <Brain className="w-4 h-4" /> AI Coach
                                           </Button>
                                           <Button 
                                             size="sm" 
                                             className="h-10 rounded-xl px-4 gap-2 font-black text-[10px] uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90 shadow-premium"
                                             onClick={() => {
                                               setSelectedMilestone({ 
                                                 id: milestone.id, 
                                                 title: milestone.title,
                                                 description: milestone.description || "Submitting production work..."
                                               });
                                               setShowSubmitWork(true);
                                             }}
                                           >
                                              <Upload className="w-4 h-4" /> Submit
                                           </Button>
                                        </>
                                      )}
                                      {!isCompleted && milestoneSubmission && (
                                         <Badge className={
                                           milestoneSubmission.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-black text-[10px] uppercase tracking-widest h-9 px-4 rounded-xl' :
                                           milestoneSubmission.status === 'revision_requested' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 font-black text-[10px] uppercase tracking-widest h-9 px-4 rounded-xl' :
                                           milestoneSubmission.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20 font-black text-[10px] uppercase tracking-widest h-9 px-4 rounded-xl' :
                                           'bg-muted/10 text-muted-foreground border-border/50 font-black text-[10px] uppercase tracking-widest h-9 px-4 rounded-xl'
                                         }>
                                           {milestoneSubmission.status === 'pending' ? 'Pending Review' : 
                                            milestoneSubmission.status === 'revision_requested' ? 'Revision Needed' : 
                                            milestoneSubmission.status === 'rejected' ? 'Rejected' : 'Submitted'}
                                         </Badge>
                                      )}
                                      {isCompleted && (
                                         <Badge className="bg-green-500/10 text-green-600 border-green-500/20 font-black text-[10px] uppercase tracking-widest h-9 px-4 rounded-xl">
                                            Verified Output
                                         </Badge>
                                      )}
                                   </div>
                                </div>
                             </div>
                           );
                        })
                      )}
                   </div>
                </CardContent>
             </Card>
           ) : (
             <Card className="border-border/50 rounded-[32px] p-20 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-muted/40 flex items-center justify-center">
                   <Target className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <div>
                   <h3 className="text-2xl font-black tracking-tight">Assignment Pending</h3>
                   <p className="text-muted-foreground mt-2 max-w-sm font-medium">Your personal roadmap is being prepared. Stand by for notification from your technical guide.</p>
                </div>
             </Card>
           )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
            {/* Participants */}
            <Card className="border-border/50 rounded-[32px] overflow-hidden shadow-large">
               <CardHeader className="p-8 pb-4">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{isIndividual ? 'Your Track' : 'Collaborators'}</p>
                  <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                     {isIndividual ? <User className="w-5 h-5 text-purple-500" /> : <Users className="w-5 h-5 text-accent" />}
                     {isIndividual ? 'Individual Growth' : 'Professional Team'}
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-8 pt-0 space-y-4">
                  {isIndividual ? (
                    <div className="p-6 rounded-3xl bg-purple-500/5 border border-purple-500/10 text-center">
                       <p className="text-xs font-bold text-purple-600 mb-2 leading-relaxed">You are on a personalized track focus on 1-on-1 mentorship.</p>
                       <User className="w-8 h-8 text-purple-500 mx-auto" />
                    </div>
                  ) : (
                    team.members?.map((member: any) => (
                     <div key={member.id} className="flex items-center gap-4 p-4 rounded-3xl bg-muted/20 border border-border/50 hover:bg-muted/30 transition-colors">
                        <Avatar className="w-10 h-10 rounded-2xl ring-2 ring-background shadow-md">
                           <AvatarImage src={member.user?.avatar} />
                           <AvatarFallback className="bg-accent/10 text-accent font-black text-xs">{member.user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                           <p className="font-black text-sm text-foreground truncate">{member.user?.fullName || member.user?.username}</p>
                           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{member.role}</p>
                        </div>
                     </div>
                    ))
                  )}
               </CardContent>
            </Card>

            {/* Upcoming Meetings */}
            <Card className="border-border/50 rounded-[32px] overflow-hidden shadow-large bg-gradient-to-br from-gold/5 to-background">
               <CardHeader className="p-8 pb-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Upcoming Syncs</p>
                       <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg" onClick={handlePrev}>
                             <ChevronLeft className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg" onClick={handleNext}>
                             <ChevronRight className="w-4 h-4" />
                          </Button>
                       </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/30 rounded-xl border border-border/40">
                       {['3days', 'week', 'month'].map((f) => (
                          <Button
                            key={f}
                            onClick={() => { setTimeFilter(f as any); setViewDate(startOfToday()); }}
                            variant={timeFilter === f ? 'gold' : 'ghost'}
                            className={`h-7 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${timeFilter === f ? 'shadow-lg shadow-gold/20' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            {f === '3days' ? '3 Days' : f === 'week' ? 'Weekly' : 'Monthly'}
                          </Button>
                       ))}
                    </div>
                  </div>
                  <CardTitle className="text-xl font-black tracking-tight mt-4">Meeting Schedule</CardTitle>
                  <p className="text-[10px] font-bold text-accent uppercase tracking-widest mt-1">
                     {timeFilter === '3days' ? `${format(viewDate, "MMM d")} - ${format(addDays(viewDate, 2), "MMM d")}` : 
                      timeFilter === 'week' ? `Week of ${format(viewDate, "MMM d")}` : 
                      format(viewDate, "MMMM yyyy")}
                  </p>
               </CardHeader>
               <CardContent className="p-8 pt-0 space-y-4">
                  {meetings.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-border/40 rounded-3xl opacity-60">
                       <p className="text-xs font-bold text-muted-foreground">No syncs scheduled yet.</p>
                    </div>
                  ) : (
                    expandedMeetings
                      .map((meeting: any) => {
                        const activeToday = isToday(new Date(!isNaN(Number(meeting.startTime)) ? Number(meeting.startTime) : meeting.startTime));
                        return (
                          <div key={meeting.id} className={`group p-5 rounded-3xl bg-background border transition-all duration-300 relative overflow-hidden ${
                            activeToday ? 'border-gold shadow-2xl shadow-gold/10' : 'border-border/50 hover:border-gold/30 hover:shadow-xl'
                          }`}>
                            {activeToday && (
                               <div className="absolute top-0 right-0 p-3">
                                  <Badge className="bg-gold text-black font-black text-[8px] uppercase tracking-tighter shadow-lg">Active Today</Badge>
                               </div>
                            )}
                            <div className={`absolute top-0 left-0 w-1 h-full ${activeToday ? 'bg-gold' : 'bg-gold/30'}`} />
                            <div className="flex justify-between items-start mb-2 pr-12">
                               <h4 className={`font-black text-sm leading-tight line-clamp-2 ${activeToday ? 'text-gold' : 'text-foreground'}`}>{meeting.title}</h4>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">
                               <Clock className={`w-3 h-3 ${activeToday ? 'text-gold' : 'text-gold/60'}`} />
                               {format(new Date(!isNaN(Number(meeting.startTime)) ? Number(meeting.startTime) : meeting.startTime), "MMM dd, HH:mm")}
                            </div>
                            <div className={`flex items-center justify-between mt-4 pt-4 border-t ${activeToday ? 'border-gold/20' : 'border-border/40'}`}>
                               <div className="flex items-center gap-2">
                                  <Avatar className={`w-6 h-6 rounded-lg ring-1 ${activeToday ? 'ring-gold/30' : 'ring-border/50'}`}>
                                     <AvatarImage src={meeting.host?.avatar} />
                                     <AvatarFallback className="bg-gold/10 text-gold text-[8px] font-black">{meeting.host?.username?.[0]?.toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <span className={`text-[10px] font-bold truncate max-w-[80px] ${activeToday ? 'text-gold' : 'text-foreground'}`}>{meeting.host?.fullName || 'Mentor'}</span>
                               </div>
                               {meeting.meetLink && (
                                  <Button variant="ghost" size="sm" className={`h-8 rounded-xl font-black text-[9px] uppercase tracking-wider px-3 ${
                                    activeToday ? 'bg-gold text-black hover:bg-gold/90' : 'bg-gold/20 text-gold hover:bg-gold/30'
                                  }`} onClick={() => window.open(meeting.meetLink, '_blank')}>
                                     Join Now <ArrowRight className="w-3 h-3 ml-1" />
                                  </Button>
                               )}
                            </div>
                          </div>
                        );
                      })
                  )}
               </CardContent>
            </Card>

           {/* Quick Actions */}
           <Card className="border-border/50 rounded-[32px] overflow-hidden shadow-large">
              <CardHeader className="p-8 pb-4">
                 <CardTitle className="text-xl font-black tracking-tight">Direct Sync</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-3">
                 {team.internshipProjectId && (
                    <>
                       <Button className="w-full h-14 rounded-2xl justify-start gap-4 px-6 bg-accent text-accent-foreground hover:bg-accent/90 font-bold shadow-premium transition-all group" onClick={() => setShowBoard(true)}>
                          <LayoutGrid className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          Open Task Board
                       </Button>
                       <Button variant="outline" className="w-full h-14 rounded-2xl justify-start gap-4 px-6 border-border/50 font-bold hover:bg-muted/40 transition-all group" onClick={() => setShowDocs(true)}>
                          <Layout className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
                          Read Project Specs
                       </Button>
                    </>
                 )}
                 <Button variant="outline" className="w-full h-14 rounded-2xl justify-start gap-4 px-6 border-border/50 font-bold hover:bg-muted/40 transition-all group" onClick={() => setShowLogTime(true)}>
                    <Clock className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
                    Focus Log
                 </Button>
                 <Button variant="outline" className="w-full h-14 rounded-2xl justify-start gap-4 px-6 border-border/50 font-bold hover:bg-muted/40 transition-all group" onClick={() => setShowTeamChat(true)}>
                    <Users className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
                    {isIndividual ? 'Mentor Sync' : 'Team Sync'}
                 </Button>
              </CardContent>
           </Card>
        </div>
      </div>

      <LogTimeDialog open={showLogTime} onOpenChange={setShowLogTime} teamId={team?.id} />
      <SubmitWorkDialog 
        open={showSubmitWork} 
        onOpenChange={setShowSubmitWork} 
        teamId={team?.id} 
        milestoneId={selectedMilestone?.id} 
        milestoneTitle={selectedMilestone?.title} 
        status={submissions.find((s: any) => s.milestoneId === selectedMilestone?.id)?.status}
      />
      <ExplainTaskDialog open={showExplainTask} onOpenChange={(open) => { setShowExplainTask(open); if (!open) setSelectedMilestone(null); }} taskTitle={selectedMilestone?.title || ""} description={selectedMilestone?.description || ""} />
      
      {team.internshipProjectId && (
        <InternshipProjectDetailsDialog
          open={showDocs}
          onOpenChange={setShowDocs}
          project={team.internshipProject}
        />
      )}

      {team && (
        <TeamChatDialog 
          open={showTeamChat} 
          onOpenChange={setShowTeamChat} 
          projectId={team.internshipProjectId} 
          projectTitle={team.internshipProject?.title} 
          teamMembers={team.members.map((m: any) => ({ name: m.user.fullName || m.user.username, role: m.role }))} 
          mentors={team.mentor ? [team.mentor] : []} 
        />
      )}

      {team.internshipProjectId && (
        <Dialog open={showBoard} onOpenChange={setShowBoard}>
          <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden border-border/50 bg-black/40 backdrop-blur-xl">
            <ProjectBoard 
              teamId={team.id}
              projectId={team.internshipProjectId}
              onBack={() => setShowBoard(false)}
              teamName={team.name}
              projectTitle={team.internshipProject?.title}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
