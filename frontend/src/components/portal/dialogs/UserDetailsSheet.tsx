import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    Mail, 
    Calendar, 
    BookOpen, 
    Shield, 
    GraduationCap, 
    UserCog, 
    MapPin, 
    Briefcase, 
    Linkedin, 
    Github, 
    Globe, 
    Sparkles,
    User,
    CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserDetailsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: any | null;
}

export function UserDetailsSheet({ open, onOpenChange, user }: UserDetailsSheetProps) {
    if (!user) return null;

    const profile = user.studentProfile || {};
    const getInitials = (name: string) => (name || "").split(" ").map(n => n[0]).join("").toUpperCase();

    const InfoCard = ({ icon: Icon, label, value, className }: any) => (
        <div className={cn("p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-1.5", className)}>
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-sm font-bold truncate">{value || "N/A"}</p>
        </div>
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-[500px] p-0 bg-background border-l border-accent/10">
                <ScrollArea className="h-full">
                    {/* Header/Banner Area */}
                    <div className="relative h-32 bg-gradient-to-br from-accent to-purple-600">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                        <div className="absolute -bottom-12 left-8 flex items-end gap-4">
                            <Avatar className="w-24 h-24 border-4 border-background rounded-[2rem] shadow-xl">
                                <AvatarFallback className="bg-background text-accent text-2xl font-black">
                                    {getInitials(user.username)}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>

                    <div className="pt-16 px-8 pb-8 space-y-8">
                        {/* Basic Info */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black tracking-tight">{user.username}</h2>
                                {profile.isComplete && (
                                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20 gap-1 rounded-lg">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Verified
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                                <Mail className="w-4 h-4" />
                                {user.email}
                            </div>
                        </div>

                        {/* Role & Status */}
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 px-3 py-1 rounded-xl font-bold uppercase tracking-widest text-[10px]">
                                {user.role === 'student' ? <GraduationCap className="w-3 h-3 mr-1" /> : <UserCog className="w-3 h-3 mr-1" />}
                                {user.role}
                            </Badge>
                            <Badge variant="outline" className={cn(
                                "px-3 py-1 rounded-xl font-bold uppercase tracking-widest text-[10px]",
                                user.isFirst ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-green-500/10 text-green-500 border-green-500/20"
                            )}>
                                {user.isFirst ? "New Account" : "Onboarded"}
                            </Badge>
                            <Badge variant="outline" className="bg-secondary text-muted-foreground border-border px-3 py-1 rounded-xl font-bold uppercase tracking-widest text-[10px]">
                                <Calendar className="w-3 h-3 mr-1" />
                                Joined {new Date(parseInt(user.createdAt) || user.createdAt).toLocaleDateString()}
                            </Badge>
                        </div>

                        {/* Academic Section */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Academic Profile
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <InfoCard icon={GraduationCap} label="School" value={profile.school} />
                                <InfoCard icon={BookOpen} label="Level" value={profile.educationLevel} />
                                <InfoCard icon={Calendar} label="Year" value={profile.academicYear} />
                                <InfoCard icon={Briefcase} label="Field" value={profile.fieldOfStudy} />
                            </div>
                        </div>

                        {/* Location & Personal */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Personal & Location
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <InfoCard icon={Globe} label="City" value={profile.city} />
                                <InfoCard icon={MapPin} label="Sector" value={profile.sector} />
                                <InfoCard icon={User} label="Skills" value={profile.skills?.join(", ")} className="col-span-2" />
                            </div>
                            {profile.bio && (
                                <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10 italic text-sm text-muted-foreground leading-relaxed">
                                    "{profile.bio}"
                                </div>
                            )}
                        </div>

                        {/* Social Links */}
                        {(profile.linkedinUrl || profile.githubUrl || profile.portfolioUrl) && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-accent">Social Presence</h3>
                                <div className="flex gap-3">
                                    {profile.linkedinUrl && (
                                        <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-blue-500/10">
                                            <Linkedin className="w-5 h-5" />
                                        </a>
                                    )}
                                    {profile.githubUrl && (
                                        <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-slate-500/10 flex items-center justify-center text-slate-500 hover:bg-slate-900 hover:text-white transition-all shadow-lg shadow-slate-500/10">
                                            <Github className="w-5 h-5" />
                                        </a>
                                    )}
                                    {profile.portfolioUrl && (
                                        <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent hover:bg-accent hover:text-white transition-all shadow-lg shadow-accent/10">
                                            <Globe className="w-5 h-5" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Activity Log (Optional for Sheet) */}
                        <div className="pt-8 border-t border-border">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Recent Activity</h3>
                            <div className="space-y-3">
                                {(user.activityLog || []).slice().reverse().slice(0, 3).map((log: any, i: number) => (
                                    <div key={i} className="flex gap-4 p-3 rounded-xl bg-secondary/20 border border-border/30">
                                        <div className="w-1 bg-accent rounded-full" />
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                {new Date(parseInt(log.timestamp) || log.timestamp).toLocaleDateString()}
                                            </p>
                                            <p className="text-xs font-bold capitalize">{log.action.replace('_', ' ')}</p>
                                            {log.details && <p className="text-[10px] text-muted-foreground">{log.details}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
