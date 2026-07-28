import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_PROJECT_TEMPLATES } from "@/lib/graphql/queries";
import { REQUEST_PROJECT_START } from "@/lib/graphql/mutations";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
    Search,
    BookOpen,
    Clock,
    Briefcase,
    Users,
    ArrowRight,
    FileText,
    CheckCircle,
    Layout,
    Globe,
    Lock,
    FileEdit
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { StartProjectDialog } from "@/components/portal/dialogs";
import { normalizeContent } from "@/lib/utils";

interface ProjectTemplate {
    id: string;
    title: string;
    description: string;
    course: string;
    type: string; // 'Individual' | 'Team Project'
    category: string;
    visibility: string;
    isTemplate: boolean;
    deadline?: string;
    tasks?: { id: string; title: string }[];
    milestones?: { title: string }[];
    documentation?: { links: { title: string; url: string }[] };
    createdAt: string;
}

export function ProjectMarketplace() {
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);

    const { data, loading, error } = useQuery(GET_PROJECT_TEMPLATES, {
        variables: {
            category: activeTab !== "all" ? activeTab : undefined,
        },
        fetchPolicy: "network-only",
    });

    const templates: ProjectTemplate[] = (data as any)?.projectTemplates || [];

    const filteredTemplates = templates.filter(template =>
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.course.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const categories = [
        { id: "all", label: "All Projects" },
        { id: "Program", label: "Program" },
        { id: "Training", label: "Training" },
        { id: "Capstone", label: "Capstone" },
        { id: "Other", label: "Other" },
    ];

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading marketplace...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-destructive">Error loading templates: {error.message}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search templates..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                    <TabsList>
                        {categories.map((cat) => (
                            <TabsTrigger key={cat.id} value={cat.id}>
                                {cat.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template, index) => (
                    <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card className="h-full flex flex-col hover:shadow-lg transition-all border-border/50 bg-card/50 backdrop-blur-sm group">
                            <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                        {template.category}
                                    </Badge>
                                    {template.visibility === 'public' ? (
                                        <div title="Public Template">
                                            <Globe className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    ) : (
                                        <div title="Private/Draft">
                                            <Lock className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <CardTitle className="text-xl font-heading line-clamp-1 group-hover:text-primary transition-colors">
                                    {template.title}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" /> {template.course}
                                </p>
                            </CardHeader>
                            <CardContent className="flex-1 p-4 pt-2 space-y-4">
                                <div className="text-sm text-muted-foreground line-clamp-3 prose prose-sm dark:prose-invert">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeRaw]}
                                        components={{
                                            p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>
                                        }}
                                    >
                                        {normalizeContent(template.description)}
                                    </ReactMarkdown>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground/80">
                                    <div className="flex items-center gap-1.5 p-1.5 bg-accent/5 rounded-md">
                                        <Users className="w-3.5 h-3.5 text-accent" />
                                        <span>{template.type}</span>
                                    </div>
                                    {template.tasks && (
                                        <div className="flex items-center gap-1.5 p-1.5 bg-accent/5 rounded-md">
                                            <CheckCircle className="w-3.5 h-3.5 text-accent" />
                                            <span>{template.tasks.length} Tasks</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="p-4 pt-0">
                                <Button
                                    className="w-full group-hover:translate-x-1 transition-transform"
                                    onClick={() => setSelectedTemplate(template)}
                                >
                                    Request to Start <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {filteredTemplates.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">No templates found</h3>
                    <p className="text-muted-foreground">Try adjusting your search or category filter.</p>
                </div>
            )}

            <StartProjectDialog
                open={!!selectedTemplate}
                onOpenChange={(open) => !open && setSelectedTemplate(null)}
                template={selectedTemplate}
            />
        </div>
    );
}
