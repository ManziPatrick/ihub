import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { User, Calendar, Tag, ChevronLeft, Share2, Facebook, Twitter, Linkedin, Copy, Check, Loader2, ArrowLeft, Heart, MessageSquare, Send } from "lucide-react";
import { getApiBaseUrl } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SEOHead } from "@/components/SEOHead";
import { organizationLd, webPageLd, breadcrumbListLd } from "@/lib/jsonld";
import { useAuth } from "@/contexts/AuthContext";

interface IComment {
    user: string;
    userName: string;
    content: string;
    createdAt: string;
}

interface ICategory {
    _id: string;
    name: string;
}

interface IBlog {
    _id: string;
    title: string;
    slug: string;
    content: string;
    authorName: string;
    category: ICategory;
    image: string;
    tags: string[];
    likes: string[];
    comments: IComment[];
    createdAt: string;
}

const API_BASE_URL = getApiBaseUrl();

const BlogDetail = () => {
    const { slug } = useParams();
    const { user } = useAuth();
    const [blog, setBlog] = useState<IBlog | null>(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [liked, setLiked] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (window.scrollY / totalHeight) * 100;
            setScrollProgress(progress);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        fetchBlog();
    }, [slug]);

    useEffect(() => {
        if (blog && user && blog.likes) {
            setLiked(blog.likes.includes(user.id || (user as any)._id));
        }
    }, [blog, user]);

    const fetchBlog = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/blogs/${slug}`);
            if (!response.ok) throw new Error("Blog not found");
            const data = await response.json();
            setBlog(data || null);
        } catch (error) {
            console.error("Error fetching blog:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!blog) return;

        const userId = user?.id || (user as any)?._id;

        // Optimistic UI Update 
        if (userId) {
            const currentLikes = blog.likes || [];
            const isCurrentlyLiked = currentLikes.includes(userId);
            const newLikes = isCurrentlyLiked
                ? currentLikes.filter(id => id !== userId)
                : [...currentLikes, userId];

            setLiked(!isCurrentlyLiked);
            setBlog({ ...blog, likes: newLikes });
        } else {
            // For anonymous users, just toggle the local "liked" state
            setLiked(!liked);
        }

        try {
            await fetch(`${API_BASE_URL}/api/blogs/${blog._id}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(localStorage.getItem('ihub_token') ? { 'Authorization': `Bearer ${localStorage.getItem('ihub_token')}` } : {})
                },
                body: JSON.stringify({ userId })
            });
            // Refetch to stay in sync if logged in
            if (userId) fetchBlog();
        } catch (error) {
            console.error("Error liking blog:", error);
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim() || !blog) return;

        setSubmittingComment(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/blogs/${blog._id}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(localStorage.getItem('ihub_token') ? { 'Authorization': `Bearer ${localStorage.getItem('ihub_token')}` } : {})
                },
                body: JSON.stringify({
                    content: comment,
                    userName: user?.username || user?.fullName || "Guest User",
                    userId: user?.id || (user as any)?._id || null
                })
            });
            const updatedBlog = await response.json();
            setBlog(updatedBlog);
            setComment("");
        } catch (error) {
            console.error("Error adding comment:", error);
        } finally {
            setSubmittingComment(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-accent" />
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold mb-4">Blog Post Not Found</h2>
                <Link to="/blog">
                    <Button variant="gold">Back to Blog</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEOHead
                title={blog?.title || "Blog Post"}
                description={blog?.content?.substring(0, 160) || "Read the latest tech insights."}
                canonicalUrl={blog?.slug ? `https://bootskills.com/blog/${blog.slug}` : "https://bootskills.com/blog"}
                ogImage={blog?.image || undefined}
                ogImageAlt={blog?.title || "Bootskills Blog"}
                ogType="article"
                keywords={`${blog?.category?.name || 'blog'}, ${blog?.tags?.join(', ') || 'tech insights'}, Rwanda technology, digital skills`}
                author={blog?.authorName || "Bootskills"}
                publishedTime={blog?.createdAt}
                updatedTime={blog?.createdAt}
            >
                <script type="application/ld+json">
                  {JSON.stringify({
                    "@context": "https://schema.org",
                    "@graph": [
                      organizationLd,
                      {
                        "@type": "Article",
                        headline: blog?.title || "Blog Post",
                        description: blog?.content?.substring(0, 160),
                        image: blog?.image,
                        author: { "@type": "Person", name: blog?.authorName || "Bootskills" },
                        datePublished: blog?.createdAt,
                        publisher: { "@type": "Organization", name: "Bootskills" },
                        mainEntityOfPage: { "@type": "WebPage", "@id": `https://bootskills.com/blog/${blog?.slug}` },
                      },
                      breadcrumbListLd([
                        { name: "Home", item: "/" },
                        { name: "Blog", item: "/blog" },
                        { name: blog?.title || "Post", item: `/blog/${blog?.slug}` },
                      ]),
                    ]
                  })}
                </script>
            </SEOHead>
            <div className="fixed top-0 left-0 w-full h-1 z-50 pointer-events-none">
                <motion.div
                    className="h-full bg-accent origin-left"
                    style={{ scaleX: scrollProgress / 100 }}
                />
            </div>
            <Header />
            <main className="pt-28 pb-20">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="max-w-4xl mx-auto w-full min-w-0">
                        <Link to="/blog" className="inline-flex items-center gap-2 text-accent text-sm font-medium mb-6 lg:mb-8 hover:gap-3 transition-all">
                            <ArrowLeft className="w-4 h-4" /> Back to Articles
                        </Link>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-accent/20 text-accent text-xs font-bold rounded-full uppercase">
                                    {blog.category?.name || "Uncategorized"}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    {Math.ceil((blog?.content?.length || 0) / 500)} min read
                                </span>
                            </div>

                            <h1 className="font-heading text-3xl lg:text-5xl font-bold leading-tight">
                                {blog.title}
                            </h1>

                            <div className="flex items-center gap-6 py-4 border-y border-border/50 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                                        <User className="w-4 h-4 text-accent" />
                                    </div>
                                    <span className="font-medium text-foreground">{blog.authorName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(blog.createdAt).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-xl">
                                <img src={blog.image} alt={blog.title} className="w-full h-full object-cover" />
                            </div>

                            <div
                                className="prose prose-lg dark:prose-invert max-w-none pt-8 text-foreground/80 leading-relaxed font-sans text-base lg:text-xl ql-editor break-words"
                                dangerouslySetInnerHTML={{ __html: blog?.content || "No content available." }}
                            />

                            <div className="flex flex-wrap gap-2 pt-10">
                                {(blog.tags || []).map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-muted rounded-full text-xs hover:bg-accent/10 hover:text-accent transition-colors cursor-pointer">
                                        #{tag}
                                    </span>
                                ))}
                            </div>

                            {/* Interaction Section */}
                            <div className="flex items-center gap-6 py-10 border-t border-border/50">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleLike}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all duration-300 font-bold ${liked ? "bg-accent text-accent-foreground border-accent shadow-premium" : "border-border hover:border-accent hover:text-accent"
                                        }`}
                                >
                                    <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
                                    <span>{(blog.likes || []).length} Likes</span>
                                </motion.button>
                                <div className="flex items-center gap-2 text-muted-foreground px-4">
                                    <MessageSquare className="w-5 h-5" />
                                    <span className="font-bold">{(blog.comments || []).length} Comments</span>
                                </div>
                            </div>

                            <section className="space-y-10 pt-10">
                                <h3 className="font-heading text-2xl font-bold">Comments ({(blog.comments || []).length})</h3>

                                <form onSubmit={handleComment} className="space-y-4 bg-card p-6 rounded-xl border border-border/50">
                                    <p className="text-sm font-medium">
                                        Post as <span className="text-accent">{user?.username || user?.fullName || "Guest User"}</span>
                                    </p>
                                    <Textarea
                                        placeholder="Share your thoughts..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="min-h-[120px] bg-background border-border focus:ring-accent"
                                    />
                                    <Button
                                        type="submit"
                                        variant="gold"
                                        disabled={submittingComment || !comment.trim()}
                                        className="w-full sm:w-auto"
                                    >
                                        {submittingComment ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-2" /> Post Comment
                                            </>
                                        )}
                                    </Button>
                                </form>

                                <div className="space-y-6">
                                    {(blog.comments || []).map((comment, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            key={idx}
                                            className="flex gap-4 p-6 bg-card rounded-xl border border-border/30"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-accent/20 flex-shrink-0 flex items-center justify-center">
                                                <User className="w-6 h-6 text-accent" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-foreground">{comment.userName}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(comment.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-muted-foreground text-sm leading-relaxed">
                                                    {comment.content}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {(blog.comments || []).length === 0 && (
                                        <p className="text-center text-muted-foreground py-10">No comments yet. Be the first to share your thoughts!</p>
                                    )}
                                </div>
                            </section>
                        </motion.div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default BlogDetail;
