import { useState, useEffect } from 'react';
import { useQuery, useMutation } from "@apollo/client/react";
import { UPDATE_INTERNSHIP_PROJECT_NEW } from '@/lib/graphql/mutations';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { GET_INTERNSHIP_PROGRAMS } from '@/lib/graphql/queries';
import { TextEditor } from '@/components/ui/text-editor';
import { Link as LinkIcon, Plus, Trash2, Code, Users, ChevronRight, ChevronLeft, CheckCircle, ListTodo, FileText, Settings, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EditInternshipProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    refetch?: () => void;
    project: any;
}

export function EditInternshipProjectDialog({ open, onOpenChange, refetch, project }: EditInternshipProjectDialogProps) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        document: '',
        internshipProgramId: '',
        requiredSkills: '',
        minTeamSize: 1,
        maxTeamSize: 5,
        defaultTickets: [] as { title: string; description: string }[]
    });
    const [links, setLinks] = useState<{ title: string; url: string }[]>([]);

    useEffect(() => {
        if (open && project) {
            setFormData({
                title: project.title || '',
                description: project.description || '',
                document: project.document || '',
                internshipProgramId: project.internshipProgram?.id || project.internshipProgramId || '',
                requiredSkills: project.requiredSkills?.join(', ') || '',
                minTeamSize: project.teamSizeRange?.min || 1,
                maxTeamSize: project.teamSizeRange?.max || 5,
                defaultTickets: project.defaultTickets || []
            });
            setLinks(project.documentation?.links || []);
            setStep(1);
        }
    }, [open, project]);

    const { data: programsData } = useQuery(GET_INTERNSHIP_PROGRAMS);
    const programs = (programsData as any)?.internshipPrograms?.items || [];

    const [updateProject, { loading }] = useMutation(UPDATE_INTERNSHIP_PROJECT_NEW, {
        onCompleted: () => {
            toast.success('Internship project updated successfully');
            onOpenChange(false);
            refetch?.();
        },
        onError: (err) => toast.error(err.message)
    });

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!formData.title || !formData.internshipProgramId) {
            toast.error('Title and Program are required');
            return;
        }

        updateProject({
            variables: {
                id: project.id,
                ...formData,
                requiredSkills: formData.requiredSkills.split(',').map(s => s.trim()).filter(s => s),
                minTeamSize: parseInt(formData.minTeamSize as any),
                maxTeamSize: parseInt(formData.maxTeamSize as any),
                documentation: {
                    links: links.filter(l => l.title && l.url)
                }
            }
        });
    };

    const handleAddLink = () => {
        setLinks([...links, { title: '', url: '' }]);
    };

    const handleRemoveLink = (index: number) => {
        setLinks(links.filter((_, i) => i !== index));
    };

    const handleLinkChange = (index: number, field: 'title' | 'url', value: string) => {
        const newLinks = [...links];
        newLinks[index][field] = value;
        setLinks(newLinks);
    };

    const handleAddTicket = () => {
        setFormData(prev => ({
            ...prev,
            defaultTickets: [...prev.defaultTickets, { title: '', description: '' }]
        }));
    };

    const handleRemoveTicket = (idx: number) => {
        setFormData(prev => ({
            ...prev,
            defaultTickets: prev.defaultTickets.filter((_, i) => i !== idx)
        }));
    };

    const handleTicketChange = (idx: number, field: 'title' | 'description', val: string) => {
        const newTickets = [...formData.defaultTickets];
        newTickets[idx][field] = val;
        setFormData(prev => ({ ...prev, defaultTickets: newTickets }));
    };

    const steps = [
        { id: 1, title: 'Identity', icon: Sparkles },
        { id: 2, title: 'Blueprint', icon: FileText },
        { id: 3, title: 'Specs', icon: Settings },
        { id: 4, title: 'Launchpad', icon: ListTodo }
    ];

    const nextStep = () => {
        if (step === 1 && (!formData.title || !formData.internshipProgramId)) {
            toast.error('Title and Program are required');
            return;
        }
        setStep(prev => Math.min(prev + 1, 4));
    };

    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    return (
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange(val);
            if (!val) setStep(1); // Reset step on close
        }}>
            <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden rounded-[32px] border-border/50 shadow-2xl">
                <div className="bg-gradient-to-br from-accent/10 via-background to-background border-b border-border/40 px-8 py-6">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center shadow-lg">
                                    <Code className="w-5 h-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-black tracking-tight">Edit Project Template</DialogTitle>
                                    <p className="text-xs text-muted-foreground font-medium">Step {step} of 4: {steps.find(s => s.id === step)?.title}</p>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Step Indicator */}
                    <div className="flex items-center gap-2 mt-6">
                        {steps.map((s) => (
                            <div key={s.id} className="flex-1 flex flex-col gap-2">
                                <div className={cn(
                                    "h-1.5 rounded-full transition-all duration-500",
                                    step >= s.id ? "bg-accent shadow-[0_0_10px_rgba(var(--accent),0.4)]" : "bg-muted/30"
                                )} />
                                <div className={cn(
                                    "flex items-center gap-1.5 px-1 transition-colors duration-300",
                                    step === s.id ? "text-accent" : "text-muted-foreground/50"
                                )}>
                                    <s.icon className="w-3 h-3" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{s.title}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-accent/20">
                    <div className="space-y-8">
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Program Track</Label>
                                    <Select
                                        value={formData.internshipProgramId}
                                        onValueChange={(val) => setFormData({ ...formData, internshipProgramId: val })}
                                    >
                                        <SelectTrigger className="h-12 bg-muted/20 border-border/40 rounded-xl px-4 text-base">
                                            <SelectValue placeholder="Select the internship field..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-border/50">
                                            {programs.map((p: any) => (
                                                <SelectItem key={p.id} value={p.id} className="rounded-lg">{p.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Project Identity Name</Label>
                                    <Input
                                        placeholder="e.g. Fintech Mobile App API"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="h-12 bg-muted/20 border-border/40 rounded-xl px-4 text-lg font-semibold"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">High-Level Summary</Label>
                                    <Textarea
                                        placeholder="Briefly describe the project goals and core problems it solves..."
                                        className="min-h-[120px] bg-muted/20 border-border/40 rounded-xl px-4 py-3 leading-relaxed"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Full Technical Document / Specifications</Label>
                                    <Badge variant="outline" className="text-[10px] font-bold bg-accent/5 border-accent/20 text-accent">Supports Markdown</Badge>
                                </div>
                                <div className="border border-border/40 rounded-[24px] overflow-hidden bg-background shadow-inner min-h-[400px]">
                                    <TextEditor
                                        value={formData.document}
                                        onChange={(val) => setFormData({ ...formData, document: val })}
                                        placeholder="Author the deep project blueprint here... Start with # Overview"
                                    />
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Required Skill Stack</Label>
                                    <Input
                                        placeholder="e.g. React, TypeScript, Tailwind, Node.js"
                                        value={formData.requiredSkills}
                                        onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                                        className="h-12 bg-muted/20 border-border/40 rounded-xl px-4"
                                    />
                                    <p className="text-[10px] text-muted-foreground pl-1">Separate skills with commas. These will appear as badges on the project card.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-8 pt-4">
                                    <div className="space-y-3 p-6 bg-muted/10 rounded-3xl border border-border/20">
                                        <div className="w-8 h-8 rounded-xl bg-background flex items-center justify-center shadow-sm">
                                            <Users className="w-4 h-4 text-accent" />
                                        </div>
                                        <div>
                                            <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Min Team Size</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={formData.minTeamSize}
                                                onChange={(e) => setFormData({ ...formData, minTeamSize: parseInt(e.target.value) })}
                                                className="mt-2 bg-background border-border/40 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3 p-6 bg-muted/10 rounded-3xl border border-border/20">
                                        <div className="w-8 h-8 rounded-xl bg-background flex items-center justify-center shadow-sm">
                                            <Users className="w-4 h-4 text-accent" />
                                        </div>
                                        <div>
                                            <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Max Team Size</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={formData.maxTeamSize}
                                                onChange={(e) => setFormData({ ...formData, maxTeamSize: parseInt(e.target.value) })}
                                                className="mt-2 bg-background border-border/40 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Default Tickets Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                                <ListTodo className="w-4 h-4 text-accent" />
                                                Blueprint Kanban Tickets
                                            </Label>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">These tickets will be automatically created for every team assigned this project.</p>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={handleAddTicket} className="rounded-xl border-accent/20 text-accent hover:bg-accent/5 font-bold h-9 gap-1.5 px-4 shadow-sm">
                                            <Plus className="w-3.5 h-3.5" /> Define Ticket
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {formData.defaultTickets.length === 0 ? (
                                            <div className="py-12 border-2 border-dashed border-border/40 rounded-[24px] text-center bg-muted/5">
                                                <ListTodo className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                                <p className="text-xs font-semibold text-muted-foreground/50">No blueprint tickets added yet.</p>
                                            </div>
                                        ) : (
                                            formData.defaultTickets.map((ticket, idx) => (
                                                <div key={idx} className="group p-5 bg-muted/5 border border-border/40 rounded-[20px] transition-all hover:border-accent/40 hover:bg-muted/10 relative shadow-sm">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleRemoveTicket(idx)}
                                                        className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <div className="grid gap-3">
                                                        <Input
                                                            placeholder="Ticket Title (e.g. Set up CI/CD Pipeline)"
                                                            value={ticket.title}
                                                            onChange={(e) => handleTicketChange(idx, 'title', e.target.value)}
                                                            className="h-10 bg-background/50 border-border/30 rounded-lg text-sm font-bold placeholder:font-medium"
                                                        />
                                                        <Textarea
                                                            placeholder="Brief task description or requirements..."
                                                            value={ticket.description}
                                                            onChange={(e) => handleTicketChange(idx, 'description', e.target.value)}
                                                            className="min-h-[60px] bg-background/50 border-border/30 rounded-lg text-xs py-2"
                                                        />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="h-px bg-border/40" />

                                {/* Links Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                                <LinkIcon className="w-4 h-4 text-accent" />
                                                External Resources
                                            </Label>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">Reference links like Figma, Notion, or Repository templates.</p>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={handleAddLink} className="rounded-xl border-border/40 font-bold h-9 gap-1.5 px-4 shadow-sm">
                                            <Plus className="w-3.5 h-3.5" /> Add Resource
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {links.map((link, index) => (
                                            <div key={index} className="flex gap-2 items-center bg-muted/5 p-2 rounded-xl border border-border/20">
                                                <div className="grid grid-cols-2 gap-2 flex-1">
                                                    <Input
                                                        placeholder="Label"
                                                        value={link.title}
                                                        onChange={(e) => handleLinkChange(index, 'title', e.target.value)}
                                                        className="h-9 bg-background border-border/30 rounded-lg"
                                                    />
                                                    <Input
                                                        placeholder="URL"
                                                        value={link.url}
                                                        onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                                                        className="h-9 bg-background border-border/30 rounded-lg"
                                                    />
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveLink(index)} className="h-8 w-8 text-destructive">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-8 py-6 bg-muted/20 border-t border-border/40 flex items-center justify-between">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={step === 1 ? () => onOpenChange(false) : prevStep}
                        className="h-12 px-6 rounded-2xl font-bold gap-2 text-muted-foreground hover:bg-muted/50"
                    >
                        {step === 1 ? 'Cancel' : <><ChevronLeft className="w-4 h-4" /> Back</>}
                    </Button>

                    <div className="flex gap-3">
                        {step < 4 ? (
                            <Button 
                                type="button" 
                                onClick={nextStep}
                                className="h-12 px-8 rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/20 font-black gap-2 hover:translate-x-1 transition-transform"
                            >
                                Next Step <ChevronRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button 
                                type="button" 
                                onClick={() => handleSubmit()}
                                disabled={loading}
                                className="h-12 px-8 rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/20 font-black gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                                ) : <><CheckCircle className="w-4 h-4" /> Update Blueprint</>}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
