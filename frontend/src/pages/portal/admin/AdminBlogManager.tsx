import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, Edit2, Trash2, Eye, Loader2, Tag, Calendar, User, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { FileUpload } from "@/components/FileUpload";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { getApiBaseUrl } from "@/lib/env";

interface ICategory {
    _id: string;
    id?: string; // Some APIs return id instead of _id
    name: string;
}

interface IBlog {
    _id: string;
    title: string;
    slug: string;
    content: string;
    authorName: string;
    category: ICategory | string;
    image: string;
    tags: string[];
    createdAt: string;
}

const API_BASE_URL = getApiBaseUrl();

const AdminBlogManager = () => {
    const { user } = useAuth();
    const [blogs, setBlogs] = useState<IBlog[]>([]);
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentBlog, setCurrentBlog] = useState<Partial<IBlog> | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });

    useEffect(() => {
        fetchBlogs();
        fetchCategories();
    }, [page]);

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/blog-categories`);
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchBlogs = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/blogs?page=${page}&limit=10`);
            const data = await response.json();
            setBlogs(data.blogs || []);
            setPagination(data.pagination || { total: 0, pages: 1 });
        } catch (error) {
            console.error("Error fetching blogs:", error);
            toast.error("Failed to load blogs");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const method = currentBlog?._id ? 'PUT' : 'POST';
            const url = currentBlog?._id
                ? `${API_BASE_URL}/api/blogs/${currentBlog._id}`
                : `${API_BASE_URL}/api/blogs`;

            // Resolve Category ID
            let categoryId = currentBlog?.category;
            console.log("Current Category Value:", categoryId);
            console.log("Available Categories:", categories);

            if (typeof categoryId === 'object' && categoryId !== null) {
                categoryId = (categoryId as any)._id;
            } else if (typeof categoryId === 'string') {
                // If it's a string, acts as ID or Name
                // Check if it matches any category Name, if so, use that category's ID
                const matchedCategory = categories.find(c => c.name === categoryId || c._id === categoryId || c.id === categoryId);
                if (matchedCategory) {
                    categoryId = matchedCategory._id || matchedCategory.id;
                }
            }

            console.log("Resolved Category ID:", categoryId);

            const payload = {
                ...currentBlog,
                category: categoryId,
                authorId: user?.id || (user as any)?._id,
                authorName: user?.username || (user as any)?.name || "Admin",
                tags: typeof currentBlog?.tags === 'string'
                    ? (currentBlog.tags as string).split(',').map(t => t.trim())
                    : currentBlog?.tags
            };

            // Debug Validation
            if (!payload.category) {
                toast.error("Invalid Category. Please select a valid category from the list.");
                setSubmitting(false);
                return;
            }
            // Check if looks like ObjectId (24 hex chars)
            if (typeof payload.category === 'string' && !payload.category.match(/^[0-9a-fA-F]{24}$/)) {
                // Try to recover one last time if the user submitted a name that exists
                const recoveryMatch = categories.find(c => c.name === payload.category);
                if (recoveryMatch) {
                    payload.category = recoveryMatch._id || recoveryMatch.id;
                } else {
                    toast.error(`Invalid Category ID format: ${payload.category}. Please re-select the category.`);
                    setSubmitting(false);
                    return;
                }
            }

            if (!payload.title || !payload.content) {
                toast.error("Title and content are required");
                setSubmitting(false);
                return;
            }

            console.log("Submitting Blog Payload:", payload);

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('ihub_token')}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Failed to save blog");
            }

            toast.success(currentBlog?._id ? "Blog updated" : "Blog created");
            setIsDialogOpen(false);
            setCurrentBlog(null);
            fetchBlogs();
        } catch (error) {
            console.error("Error saving blog:", error);
            toast.error("Error saving blog");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this blog post?")) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/blogs/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('ihub_token')}`
                }
            });

            if (!response.ok) throw new Error("Failed to delete");

            toast.success("Blog deleted successfully");
            fetchBlogs();
        } catch (error) {
            console.error("Error deleting blog:", error);
            toast.error("Error deleting blog");
        }
    };

    const filteredBlogs = blogs.filter(b =>
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        (typeof b.category === 'object' ? b.category.name.toLowerCase() : b.category.toLowerCase()).includes(search.toLowerCase())
    );

    return (
        <PortalLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold font-heading">Blog Management</h2>
                        <p className="text-muted-foreground text-sm">Create, edit, and manage your blog posts here.</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="gold" onClick={() => setCurrentBlog({ category: '', tags: [] })}>
                                <Plus className="w-4 h-4 mr-2" /> New Blog Post
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{currentBlog?._id ? "Edit Blog Post" : "Create New Blog Post"}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateOrUpdate} className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-sm font-medium">Title</label>
                                        <Input
                                            value={currentBlog?.title || ""}
                                            onChange={e => setCurrentBlog({ ...currentBlog, title: e.target.value })}
                                            placeholder="Enter blog title"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Category</label>
                                        <select
                                            className="w-full px-3 py-2 rounded-md bg-background border border-input text-sm"
                                            value={typeof currentBlog?.category === 'object' ? currentBlog.category._id : currentBlog?.category || ""}
                                            onChange={e => setCurrentBlog({ ...currentBlog, category: e.target.value })}
                                            required
                                        >
                                            <option value="" disabled>Select a category</option>
                                            {categories.map(cat => (
                                                <option key={cat._id || cat.id} value={cat._id || cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Tags (comma separated)</label>
                                        <Input
                                            value={Array.isArray(currentBlog?.tags) ? currentBlog?.tags.join(", ") : currentBlog?.tags || ""}
                                            onChange={e => setCurrentBlog({ ...currentBlog, tags: e.target.value as any })}
                                            placeholder="AI, Tech, Future"
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-sm font-medium">Featured Image</label>
                                        {currentBlog?.image ? (
                                            <div className="relative aspect-video rounded-lg overflow-hidden border">
                                                <img src={currentBlog.image} alt="Blog featured image" className="w-full h-full object-cover" />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-8 w-8"
                                                    onClick={() => setCurrentBlog({ ...currentBlog, image: "" })}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <FileUpload
                                                onUploadComplete={(url) => setCurrentBlog({ ...currentBlog, image: url })}
                                                folder="blogs"
                                                label="Upload Featured Image"
                                                accept="image/*"
                                            />
                                        )}
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-sm font-medium">Content</label>
                                        <div className="bg-white dark:bg-slate-900 rounded-md overflow-hidden min-h-[400px]">
                                            <ReactQuill
                                                theme="snow"
                                                value={currentBlog?.content || ""}
                                                onChange={content => setCurrentBlog({ ...currentBlog, content })}
                                                className="h-[350px]"
                                                modules={{
                                                    toolbar: [
                                                        [{ 'header': [1, 2, 3, false] }],
                                                        ['bold', 'italic', 'underline', 'strike'],
                                                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                        ['link', 'image', 'video', 'code-block'],
                                                        ['clean']
                                                    ],
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                    <Button type="submit" variant="gold" disabled={submitting}>
                                        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        {currentBlog?._id ? "Update Post" : "Publish Post"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                    <div className="p-4 border-b border-border/50 flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by title or category..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-accent" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Blog Post</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Author</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredBlogs.map((blog) => (
                                    <TableRow key={blog._id}>
                                        <TableCell className="max-w-[300px]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded bg-muted flex-shrink-0 overflow-hidden">
                                                    {blog.image ? (
                                                        <img src={blog.image} alt={blog.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="w-full h-full p-2 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="truncate">
                                                    <p className="font-medium truncate">{blog.title}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{blog.slug}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                                                {typeof blog.category === 'object' ? blog.category.name : blog.category}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {blog.authorName}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(blog.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link to={`/blog/${blog.slug}`} target="_blank">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                                    onClick={() => {
                                                        setCurrentBlog(blog);
                                                        setIsDialogOpen(true);
                                                    }}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDelete(blog._id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredBlogs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                            No blog posts found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}

                    {pagination.pages > 1 && (
                        <div className="p-4 border-t border-border/50 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                Showing page {page} of {pagination.pages}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === pagination.pages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PortalLayout>
    );
};

export default AdminBlogManager;
