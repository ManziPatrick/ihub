import { useState } from 'react';
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_INTERNSHIP_PROJECTS_NEW, GET_INTERNSHIP_PROGRAMS, GET_ADMIN_DASHBOARD_DATA } from '@/lib/graphql/queries';
import { DELETE_INTERNSHIP_PROJECT } from '@/lib/graphql/mutations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Code, Trash2, Edit, ExternalLink, Users, Layers, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { CreateInternshipProjectDialog, InternshipProjectDetailsDialog, CreateInternshipTeamDialog, EditInternshipProjectDialog, AssignProjectDialog } from '@/components/portal/dialogs';
import ReactMarkdown from 'react-markdown';

export default function InternshipProjectList() {
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [projectToAssign, setProjectToAssign] = useState<any>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 9; // 3x3 grid usually looks best
    const { data: projectsData, loading: projectsLoading, refetch } = useQuery(GET_INTERNSHIP_PROJECTS_NEW, {
        variables: { page: currentPage, limit: pageSize }
    });

    const [deleteProject] = useMutation(DELETE_INTERNSHIP_PROJECT, {
        refetchQueries: [{ query: GET_INTERNSHIP_PROJECTS_NEW }, { query: GET_ADMIN_DASHBOARD_DATA }],
        onCompleted: () => {
            toast.success('Project deleted successfully');
            refetch();
        },
        onError: (err) => toast.error(err.message)
    });

    if (projectsLoading) return <div className="p-8 text-center">Loading projects...</div>;

    const projects = (projectsData as any)?.internshipProjects?.items || [];
    const pagination = (projectsData as any)?.internshipProjects?.pagination;

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this project?')) {
            deleteProject({ variables: { id } });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Code className="w-5 h-5 text-primary" />
                        Internship Project Pool
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Manage projects that can be assigned to internship teams.
                    </p>
                </div>
                <Button onClick={() => setCreateOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Project
                </Button>
            </div>

            <CreateInternshipProjectDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                refetch={refetch}
            />

            <EditInternshipProjectDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                project={selectedProject}
                refetch={refetch}
            />

            <InternshipProjectDetailsDialog
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
                project={selectedProject}
            />

            <AssignProjectDialog
                open={assignOpen}
                onOpenChange={(val) => {
                    setAssignOpen(val);
                    if (!val) setProjectToAssign(null);
                }}
                project={projectToAssign}
                refetch={refetch}
            />

            {projects.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center space-y-3">
                        <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                            <Code className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium text-lg">No projects yet</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto">
                            Start by creating a project that interns can work on during their program.
                        </p>
                        <Button variant="outline" onClick={() => setCreateOpen(true)}>
                            Create Your First Project
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project: any) => (
                        <Card key={project.id} className="flex flex-col h-full hover:border-primary/50 transition-colors">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                        {project.internshipProgram?.title || 'Program'}
                                    </Badge>
                                    <div className="flex gap-1">
                                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => {
                                            setProjectToAssign(project);
                                            setAssignOpen(true);
                                        }}>
                                            <Users className="w-3.5 h-3.5" />
                                            Assign
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                            setSelectedProject(project);
                                            setDetailsOpen(true);
                                        }}>
                                            <Eye className="w-4 h-4 text-primary" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                            setSelectedProject(project);
                                            setEditOpen(true);
                                        }}>
                                            <Edit className="w-4 h-4 text-primary" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(project.id)}>
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                                <CardTitle className="text-lg line-clamp-1">{project.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <div className="text-sm text-muted-foreground line-clamp-3 prose prose-sm dark:prose-invert">
                                    <ReactMarkdown>
                                        {project.description}
                                    </ReactMarkdown>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                    {project.requiredSkills?.map((skill: string) => (
                                        <Badge key={skill} variant="secondary" className="text-[10px] uppercase font-bold px-2 py-0">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>

                                <div className="pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5" />
                                        Team: {project.teamSizeRange?.min}-{project.teamSizeRange?.max}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Layers className="w-3.5 h-3.5" />
                                        {project.documentation?.links?.length || 0} Links
                                    </div>
                                </div>

                                {project.documentation?.links?.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Resources</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {project.documentation.links.map((link: any, idx: number) => (
                                                <a
                                                    key={idx}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    {link.title}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination UI */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground font-medium">
                        Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} projects)
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={!pagination.hasPreviousPage}
                            className="rounded-xl"
                        >
                            Previous
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - currentPage) <= 1)
                                .map((p, i, arr) => {
                                    const showEllipsis = i > 0 && p - arr[i-1] > 1;
                                    return (
                                        <div key={p} className="flex items-center">
                                            {showEllipsis && <span className="px-2 text-muted-foreground">...</span>}
                                            <Button
                                                variant={currentPage === p ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setCurrentPage(p)}
                                                className={`h-9 w-9 p-0 rounded-xl ${currentPage === p ? 'bg-primary text-primary-foreground pointer-events-none' : ''}`}
                                            >
                                                {p}
                                            </Button>
                                        </div>
                                    );
                                })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                            disabled={!pagination.hasNextPage}
                            className="rounded-xl"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
