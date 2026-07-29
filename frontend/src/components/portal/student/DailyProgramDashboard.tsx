import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    CheckCircle2,
    Target,
    Zap,
    MessageSquare,
    Clock,
    ArrowRight,
    FileText,
    Link as LinkIcon,
    Video,
    Plus,
    ExternalLink
} from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { GET_DAILY_DASHBOARD } from "@/lib/graphql/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { AddResourceDialog } from "../dialogs/AddResourceDialog";
import { useAuth } from "@/contexts/AuthContext";

export function DailyProgramDashboard({ username }: { username: string }) {
    const { data, loading, refetch } = useQuery(GET_DAILY_DASHBOARD);
    const { user } = useAuth();
    const navigate = useNavigate();
    const [showAddResource, setShowAddResource] = useState(false);

    if (loading) return <DashboardSkeleton />;

    const dashboard = (data as any)?.dailyDashboard;

    if (!dashboard) return null;

    return (
        <div className="space-y-6 mb-8">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-white/10 p-6 sm:p-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                <div className="relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row gap-6 md:items-start justify-between"
                    >
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                                Good Morning, {username} <span className="inline-block animate-wave">👋</span>
                            </h2>
                            <p className="text-muted-foreground flex items-center gap-2 mb-4">
                                <Clock className="w-4 h-4" />
                                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>

                            <div className="bg-background/20 backdrop-blur-md rounded-lg p-4 max-w-xl border border-white/10">
                                <div className="flex items-start gap-3">
                                    <Zap className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-bold text-sm text-yellow-100 mb-1">AI Focus Suggestion</p>
                                        <p className="text-sm text-white/90 leading-relaxed">
                                            "{dashboard.aiSuggestion}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="hidden md:block text-right max-w-xs">
                            <p className="text-xs font-medium text-white/60 uppercase tracking-widest mb-2">Daily Inspiration</p>
                            <p className="text-sm italic text-white/80">
                                {dashboard.motivationalQuote}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today's Priorities */}
                <Card className="lg:col-span-2 border-border/50 h-full">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold flex items-center gap-2">
                                <Target className="w-5 h-5 text-accent" />
                                Priorities & Deadlines
                            </h3>
                            <Badge variant="outline" className="bg-accent/5 text-accent border-accent/20">
                                {dashboard.tasks?.length || 0} Pending
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            {dashboard.tasks?.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                    <p>All caught up! Great job.</p>
                                </div>
                            ) : (
                                dashboard.tasks.map((task: any) => (
                                        <div 
                                            key={task.id} 
                                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 group hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50 cursor-pointer"
                                            onClick={() => navigate('/portal/student/internships?tab=dashboard')}
                                        >
                                            <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${task.priority === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                                task.priority === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                                                }`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-medium text-sm truncate">{task.title}</p>
                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 opacity-70">
                                                        {task.type}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {task.deadline && (
                                                        <span className={`text-xs ${new Date(task.deadline) < new Date() ? 'text-red-400 font-bold' : 'text-muted-foreground'
                                                            }`}>
                                                            Due {new Date(task.deadline).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    {!task.deadline && <span className="text-xs text-muted-foreground">No deadline</span>}
                                                </div>
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Schedule & Comms */}
                <div className="space-y-6">
                    <Card className="border-border/50">
                        <CardContent className="p-6">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-purple-400" />
                                Today's Schedule
                            </h3>
                            <div className="space-y-3">
                                {dashboard.meetings?.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">No meetings scheduled.</p>
                                ) : (
                                    dashboard.meetings.map((meeting: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                                            <div className="flex flex-col items-center justify-center w-10 h-10 rounded bg-purple-500/10 text-purple-400 text-xs font-bold leading-none">
                                                <span>{new Date(meeting.time).getHours()}:00</span>
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-medium truncate">{meeting.title}</p>
                                                <p className="text-xs text-muted-foreground capitalize">{meeting.type}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-amber-500">Mentorship</p>
                                    <p className="text-xs text-muted-foreground">
                                        {dashboard.unreadMessages > 0
                                            ? `${dashboard.unreadMessages} unread messages`
                                            : "All caught up"
                                        }
                                    </p>
                                </div>
                            </div>
                            {dashboard.unreadMessages > 0 && (
                                <Button size="sm" variant="outline" className="border-amber-500/30 hover:bg-amber-500/10 text-amber-500 h-8">
                                    View
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Resources Section */}
                    <Card className="border-border/50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold flex items-center gap-2">
                                    <LinkIcon className="w-5 h-5 text-accent" />
                                    Learning Resources
                                </h3>
                                {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'mentor') && (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 hover:bg-accent/10"
                                        onClick={() => setShowAddResource(true)}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {dashboard.resources?.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4 italic">No specific resources for today.</p>
                                ) : (
                                    dashboard.resources.map((res: any) => (
                                        <a
                                            key={res.id}
                                            href={res.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 group transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                                                    {res.type === 'video' ? <Video className="w-3.5 h-3.5" /> :
                                                        res.type === 'pdf' ? <FileText className="w-3.5 h-3.5" /> :
                                                            <ExternalLink className="w-3.5 h-3.5" />}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-medium truncate">{res.title}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase">{res.source.replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                        </a>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AddResourceDialog
                open={showAddResource}
                onOpenChange={setShowAddResource}
                onSuccess={() => refetch()}
            />
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6 mb-8">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="h-64 lg:col-span-2 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
            </div>
        </div>
    )
}
