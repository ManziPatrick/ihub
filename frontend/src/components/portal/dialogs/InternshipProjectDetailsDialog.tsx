import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ExternalLink,
    Code,
    Users,
    Globe,
    Github,
    ChevronRight,
    Link as LinkIcon
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface InternshipProjectDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: any;
}

export function InternshipProjectDetailsDialog({ open, onOpenChange, project }: InternshipProjectDetailsDialogProps) {
    if (!project) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-border/50 bg-card/95 backdrop-blur-xl">
                {/* Header Section */}
                <div className="p-6 pb-4 border-b border-border/50 bg-primary/5">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/30 bg-primary/5">
                                    Internship Project
                                </Badge>
                                <Badge variant="outline" className="text-[10px] uppercase font-bold">
                                    {project.internshipProgram?.title}
                                </Badge>
                            </div>
                            <DialogTitle className="text-2xl font-heading font-bold text-foreground">
                                {project.title}
                            </DialogTitle>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-background/50">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Project README</h3>
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-heading prose-headings:font-bold prose-p:leading-relaxed prose-a:text-primary hover:prose-a:underline border-l-2 border-primary/20 pl-4 py-1">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                                        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="font-bold text-primary" {...props} />,
                                        em: ({ node, ...props }) => <em className="italic" {...props} />,
                                        a: ({ node, ...props }) => <a className="text-primary underline hover:opacity-80 transition-opacity" {...props} />
                                    }}
                                >
                                    {project.description}
                                </ReactMarkdown>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 rounded-xl border border-border/50 bg-muted/10 space-y-3">
                                <h4 className="font-bold flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" />
                                    Team Requirements
                                </h4>
                                <div className="space-y-1 text-sm">
                                    <p><span className="text-muted-foreground">Team Size:</span> {project.teamSizeRange?.min} - {project.teamSizeRange?.max} members</p>
                                    <div className="pt-2">
                                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Required Skills:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {project.requiredSkills?.map((skill: string) => (
                                                <Badge key={skill} variant="secondary" className="text-[10px] uppercase font-bold">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl border border-border/50 bg-muted/10 space-y-3">
                                <h4 className="font-bold flex items-center gap-2 text-primary">
                                    <LinkIcon className="w-4 h-4" />
                                    Resources & Documentation
                                </h4>
                                <div className="space-y-2">
                                    {project.documentation?.links?.length > 0 ? (
                                        project.documentation.links.map((link: any, idx: number) => (
                                            <a
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-2 rounded-lg bg-background/50 border border-border/30 hover:border-primary/30 transition-all group"
                                            >
                                                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                                    {link.url.includes("github") ? <Github className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-xs font-bold group-hover:text-primary transition-colors truncate">{link.title}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate">{link.url}</p>
                                                </div>
                                                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                            </a>
                                        ))
                                    ) : (
                                        <p className="text-xs italic text-muted-foreground">No links provided.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Blueprint Tickets Section */}
                        {project.defaultTickets?.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/20">Initial Blueprint Tickets ({project.defaultTickets.length})</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {project.defaultTickets.map((ticket: any, idx: number) => (
                                        <div key={idx} className="p-4 rounded-2xl border border-border/40 bg-muted/10 flex flex-col gap-3 group hover:border-primary/40 transition-all">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="secondary" className="text-[9px] font-black uppercase px-2 py-0.5">{ticket.taskType || 'Task'}</Badge>
                                                <Badge className={cn(
                                                    "text-[9px] font-black uppercase px-2 py-0.5 border-0 shadow-sm",
                                                    ticket.priority === 'critical' ? 'bg-red-500 text-white' :
                                                    ticket.priority === 'high' ? 'bg-orange-500 text-white' :
                                                    ticket.priority === 'medium' ? 'bg-blue-500 text-white' : 'bg-slate-500 text-white'
                                                )}>
                                                    {ticket.priority}
                                                </Badge>
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors leading-tight mb-1">{ticket.title}</p>
                                                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{ticket.description || 'No description provided.'}</p>
                                            </div>
                                            {ticket.labels?.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {ticket.labels.map((l: string, i: number) => (
                                                        <span key={i} className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full bg-primary/5 text-primary/70 border border-primary/10">{l}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border/50 bg-muted/30 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
