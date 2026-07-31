import { useState } from 'react';
import { useQuery, useMutation } from "@apollo/client/react";
import { CREATE_PROJECT, ASSIGN_PROJECT_TO_USERS } from '@/lib/graphql/mutations';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { GET_ALL_PROJECTS, GET_USERS, GET_COURSES_SUMMARY } from '@/lib/graphql/queries';
import { Link as LinkIcon, Plus, Trash2, Book, Box, Layout, X, Check, Search, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/FileUpload';


interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    refetch?: () => void;
}

export function CreateProjectDialog({ open, onOpenChange, refetch }: CreateProjectDialogProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        course: '',
        type: 'Individual',
        userIds: [] as string[],
        deadline: '',
        templateId: '',
    });
    const [toolboxLinks, setToolboxLinks] = useState<{ title: string; url: string }[]>([]);
    const [toolboxPPTs, setToolboxPPTs] = useState<string[]>([]);

    const { data: usersData } = useQuery(GET_USERS);
    const { data: projectsData } = useQuery(GET_ALL_PROJECTS);
    const { data: coursesData } = useQuery(GET_COURSES_SUMMARY, {
      fetchPolicy: "cache-first",
    });

    const users = (usersData as any)?.users?.items || (usersData as any)?.users || [];
    const allProjects = (projectsData as any)?.projects?.items || (projectsData as any)?.projects || [];
    const courses = (coursesData as any)?.courses?.items || (coursesData as any)?.courses || [];

    const students = users.filter((u: any) => u.role === 'student' || u.role === 'user' || u.role === 'intern');
    const trainers = users.filter((u: any) => u.role === 'trainer' || u.role === 'admin' || u.role === 'super_admin');

    const courseTemplates = formData.course
        ? allProjects.filter((p: any) => p.course === formData.course)
            .filter((p: any, index: number, self: any[]) =>
                index === self.findIndex((t) => t.title === p.title) // Unique by title
            )
        : [];

    const [createProject, { loading }] = useMutation(CREATE_PROJECT, {
        onCompleted: () => {
            toast.success('Project(s) assigned successfully');
            onOpenChange(false);
            refetch?.();
            setFormData({
                title: '',
                description: '',
                course: '',
                type: 'Individual',
                userIds: [],
                deadline: '',
                templateId: '',
            });
            setToolboxLinks([]);
            setToolboxPPTs([]);
        },
        onError: (err) => toast.error(err.message)
    });

    const [assignProjectToUsers, { loading: batchLoading }] = useMutation(ASSIGN_PROJECT_TO_USERS, {
        onCompleted: () => {
            toast.success('Batch assignment successful');
            onOpenChange(false);
            refetch?.();
            setFormData({
                title: '',
                description: '',
                course: '',
                type: 'Individual',
                userIds: [],
                deadline: '',
                templateId: '',
            });
            setToolboxLinks([]);
            setToolboxPPTs([]);
        },
        onError: (err) => toast.error(err.message)
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || formData.userIds.length === 0 || !formData.course) {
            toast.error('Title, Student(s), and Course are required');
            return;
        }

        if (formData.templateId) {
            assignProjectToUsers({
                variables: {
                    projectId: formData.templateId,
                    userIds: formData.userIds,
                    type: formData.type,
                    deadline: formData.deadline || null
                }
            });
        } else {
            // If multiple users selected but no template, we might need a loop or the backend to handle it.
            // For now, let's assume if it's not a template, we only allow one user or use a loop.
            if (formData.userIds.length > 1) {
                toast.error('Batch assignment is currently supported only using project templates. Please select a template or assign individually.');
                return;
            }

            createProject({
                variables: {
                    title: formData.title,
                    description: formData.description,
                    course: formData.course,
                    type: formData.type,
                    userId: formData.userIds[0],
                    deadline: formData.deadline,
                    mentorIds: trainers.slice(0, 1).map(t => t.id),
                    documentation: {
                        links: toolboxLinks,
                        ppts: toolboxPPTs
                    }
                }
            });
        }
    };

    const handleAddLink = () => {
        setToolboxLinks([...toolboxLinks, { title: '', url: '' }]);
    };

    const handleRemoveLink = (index: number) => {
        setToolboxLinks(toolboxLinks.filter((_, i) => i !== index));
    };

    const handleLinkChange = (index: number, field: 'title' | 'url', value: string) => {
        const newLinks = [...toolboxLinks];
        newLinks[index][field] = value;
        setToolboxLinks(newLinks);
    };

    const handleSelectTemplate = (templateId: string) => {
        const template = allProjects.find((p: any) => p.id === templateId);
        if (template) {
            setFormData({
                ...formData,
                title: template.title,
                description: template.description,
                templateId: template.id
            });
        }
    };

    const handleAddUser = (id: string) => {
        if (!formData.userIds.includes(id)) {
            setFormData({
                ...formData,
                userIds: [...formData.userIds, id]
            });
        }
    };

    const handleRemoveUser = (id: string) => {
        setFormData({
            ...formData,
            userIds: formData.userIds.filter(userId => userId !== id)
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange} >
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Assign New Project</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-3">
                        <Label className="flex items-center justify-between">
                            Assign To Students
                            <span className="text-[10px] text-muted-foreground">{formData.userIds.length} selected</span>
                        </Label>

                        <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 rounded-lg border border-dashed border-border/50 bg-muted/5 mb-2">
                            {formData.userIds.length === 0 ? (
                                <p className="text-[10px] text-muted-foreground italic m-auto">No students selected</p>
                            ) : (
                                formData.userIds.map(id => {
                                    const student = students.find(s => s.id === id);
                                    return (
                                        <Badge key={id} variant="secondary" className="px-1.5 py-0.5 text-[10px] gap-1 bg-accent/10 border-accent/20 text-accent">
                                            {student?.username || student?.email || id}
                                            <X className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => handleRemoveUser(id)} />
                                        </Badge>
                                    );
                                })
                            )}
                        </div>

                        <Select onValueChange={handleAddUser}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Add students..." />
                            </SelectTrigger>
                            <SelectContent>
                                <div className="p-2 border-b border-border/50">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                        <Input
                                            placeholder="Search students..."
                                            className="h-8 pl-8 text-xs bg-muted/20"
                                        // Optional: Add local search state here
                                        />
                                    </div>
                                </div>
                                {students.filter(s => !formData.userIds.includes(s.id)).slice(0, 10).map((s: any) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{s.fullName || s.username}</span>
                                            <span className="text-[10px] text-muted-foreground">{s.email}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                                {students.filter(s => !formData.userIds.includes(s.id)).length > 10 && (
                                    <div className="p-2 text-[10px] text-center text-muted-foreground border-t border-border/50">
                                        And {students.filter(s => !formData.userIds.includes(s.id)).length - 10} more...
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Project Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Portfolio Website"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Course Name / Context</Label>
                        <Select
                            value={formData.course}
                            onValueChange={(val) => setFormData({ ...formData, course: val })}
                        >
                            <SelectTrigger className="bg-muted/10">
                                <SelectValue placeholder="Select a course context" />
                            </SelectTrigger>
                            <SelectContent>
                                {courses.map((c: any) => (
                                    <SelectItem key={c.id} value={c.title}>{c.title}</SelectItem>
                                ))}
                                <SelectItem value="Internship">Program</SelectItem>
                                <SelectItem value="Custom">Other / Custom Context</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {formData.course && courseTemplates.length > 0 && (
                        <div className="space-y-2 p-3 rounded-lg border border-accent/20 bg-accent/5">
                            <Label className="flex items-center gap-2 text-accent">
                                <Layout className="w-3.5 h-3.5" />
                                Project Templates for this Course
                            </Label>
                            <Select onValueChange={handleSelectTemplate}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Choose a project template..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {courseTemplates.map((t: any) => (
                                        <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="type">Project Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(val) => setFormData({ ...formData, type: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Individual">Individual</SelectItem>
                                <SelectItem value="Team Project">Team Project</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Project goals and requirements..."
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="deadline">Deadline</Label>
                        <Input
                            id="deadline"
                            type="date"
                            value={formData.deadline}
                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        />
                    </div>

                    {/* Toolbox Section */}
                    <div className="space-y-3 pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2">
                                <Box className="w-4 h-4 text-accent" />
                                Project Toolbox (Resources)
                            </Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[10px] font-bold uppercase gap-1"
                                    onClick={handleAddLink}
                                >
                                    <Plus className="w-3 h-3" /> Add Link
                                </Button>
                            </div>
                        </div>

                        {/* PPT Uploads */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                <FileText className="w-3 h-3" /> Presentation Files (PPT)
                            </Label>
                            <div className="grid gap-2">
                                {toolboxPPTs.map((ppt, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/20 rounded border border-border/30">
                                        <div className="flex items-center gap-2 truncate">
                                            <FileText className="w-3.5 h-3.5 text-red-500" />
                                            <span className="text-[10px] truncate">{ppt.split('/').pop()}</span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-destructive"
                                            onClick={() => setToolboxPPTs(toolboxPPTs.filter((_, i) => i !== idx))}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="h-24">
                                    <FileUpload
                                        folder="project_resources"
                                        label="Upload PPT Resource"
                                        onUploadComplete={(url) => setToolboxPPTs([...toolboxPPTs, url])}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {toolboxLinks.map((link, idx) => (
                                <div key={idx} className="flex gap-2 items-start animate-in slide-in-from-left-2 duration-200">
                                    <div className="flex-1 space-y-2">
                                        <Input
                                            placeholder="Resource Title (e.g. Figma File)"
                                            value={link.title}
                                            onChange={(e) => handleLinkChange(idx, 'title', e.target.value)}
                                            className="h-8 text-xs"
                                        />
                                        <Input
                                            placeholder="URL (https://...)"
                                            value={link.url}
                                            onChange={(e) => handleLinkChange(idx, 'url', e.target.value)}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                                        onClick={() => handleRemoveLink(idx)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            ))}
                            {toolboxLinks.length === 0 && toolboxPPTs.length === 0 && (
                                <p className="text-[10px] text-muted-foreground italic text-center py-2">
                                    No resources added to this project's toolbox.
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading || batchLoading} className="bg-accent hover:bg-accent/90">
                            {(loading || batchLoading) ? 'Assigning...' : 'Assign Project'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
}
