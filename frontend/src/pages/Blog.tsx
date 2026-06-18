import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, Clock, User, Tag, Search, Loader2 } from "lucide-react";
import { getApiBaseUrl } from "@/lib/env";
import heroImage from "@/assets/hero-training.webp";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";

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
  createdAt: string;
  tags: string[];
}

const API_BASE_URL = getApiBaseUrl();

const Blog = () => {
  const [blogs, setBlogs] = useState<IBlog[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 9, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, [category, currentPage]);

  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const catRes = await fetch(`${API_BASE_URL}/api/blog-categories`);
      const catData = await catRes.json();
      setCategories(catData);

      // Fetch blogs
      let url = `${API_BASE_URL}/api/blogs?page=${currentPage}&limit=9`;
      if (category !== "All") {
        url += `&category=${encodeURIComponent(category)}`;
      }
      const blogRes = await fetch(url);
      const data = await blogRes.json();
      setBlogs(data.blogs || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 9, pages: 1 });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBlogs = blogs.filter(blog =>
    (blog.title?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (blog.content?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const featuredPost = blogs[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Blog | Bootskills - Rwanda Tech & Skills Insights</title>
        <meta name="description" content="Stay updated with the latest in Rwanda Tech, Future Technologies, and Business strategies from the experts at Bootskills." />
      </Helmet>
      <Header />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-20 lg:py-32 bg-card relative overflow-hidden border-b border-border/30">
          <div className="absolute inset-0 opacity-5">
            <img src={heroImage} alt="" className="w-full h-full object-cover grayscale" />
          </div>
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto text-center"
            >
              <h1 className="font-heading text-4xl lg:text-7xl font-bold mb-8 leading-tight tracking-tighter">
                Architecture of the <span className="text-accent">African Digital Future</span>
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-sans font-medium">
                Professional insights into software engineering, emerging tech, and digital business transformation across the Rwandan ecosystem.
              </p>
            </motion.div>
          </div>
        </section>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && category === "All" && (
              <section className="py-12 bg-background">
                <div className="container mx-auto px-4 lg:px-8">
                  <Link to={`/blog/${featuredPost.slug}`}>
                    <motion.article
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="bg-card rounded-2xl overflow-hidden shadow-premium border border-accent/20 group hover:shadow-gold transition-all duration-700 cursor-pointer max-w-6xl mx-auto"
                    >
                      <div className="grid lg:grid-cols-2 gap-0 relative">
                        <div className="h-80 lg:h-[500px] overflow-hidden">
                          <img
                            src={featuredPost.image}
                            alt={featuredPost.title}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
                        </div>
                        <div className="p-8 lg:p-16 flex flex-col justify-center relative lg:bg-[#FDFCFB]">
                          <div className="flex items-center gap-3 mb-6">
                            <span className="px-4 py-1.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full uppercase tracking-widest shadow-sm">
                              Featured Analysis
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              {featuredPost.category?.name || "Uncategorized"}
                            </span>
                          </div>
                          <h2 className="font-heading text-3xl lg:text-5xl font-bold mb-6 group-hover:text-accent transition-colors leading-tight">
                            {featuredPost.title}
                          </h2>
                          <p className="text-muted-foreground lg:text-lg mb-10 line-clamp-3 leading-relaxed font-sans">
                            {stripHtml(featuredPost?.content || "").substring(0, 250)}...
                          </p>
                          <div className="flex items-center justify-between pt-8 border-t border-border/40">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30">
                                <User className="w-6 h-6 text-accent" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-foreground">{featuredPost.authorName}</p>
                                <p className="text-xs text-muted-foreground">{new Date(featuredPost.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="hidden sm:flex items-center gap-2 text-accent font-bold text-sm tracking-tight group-hover:gap-3 transition-all">
                              Read Analysis <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  </Link>
                </div>
              </section>
            )}

            {/* Blog Grid with Sidebar */}
            <section className="py-16 bg-background">
              <div className="container mx-auto px-4 lg:px-8">
                <div className="grid lg:grid-cols-4 gap-12">
                  {/* Sidebar */}
                  <aside className="lg:col-span-1 space-y-10 w-full overflow-hidden">
                    <div className="bg-card p-6 rounded-xl border border-border/50">
                      <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                        <Search className="w-4 h-4 text-accent" /> Search
                      </h3>
                      <input
                        type="text"
                        placeholder="Search posts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-accent outline-none"
                      />
                    </div>

                    <div className="bg-card p-6 rounded-xl border border-border/50">
                      <h3 className="font-heading font-bold text-lg mb-4">Categories</h3>
                      <ul className="space-y-2">
                        <li>
                          <button
                            onClick={() => {
                              setCategory("All");
                              setCurrentPage(1);
                            }}
                            className={`w-full flex items-center justify-between text-sm py-2 px-3 rounded-lg transition-all ${category === "All"
                              ? "bg-accent text-accent-foreground font-bold"
                              : "hover:bg-muted text-muted-foreground hover:text-foreground"
                              }`}
                          >
                            <span className="flex items-center gap-2">
                              <Tag className="w-3 h-3" /> All Posts
                            </span>
                          </button>
                        </li>
                        {categories.map((cat) => (
                          <li key={cat._id}>
                            <button
                              onClick={() => {
                                setCategory(cat._id);
                                setCurrentPage(1);
                              }}
                              className={`w-full flex items-center justify-between text-sm py-2 px-3 rounded-lg transition-all ${category === cat._id
                                ? "bg-accent text-accent-foreground font-bold"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                }`}
                            >
                              <span className="flex items-center gap-2">
                                <Tag className="w-3 h-3" /> {cat.name}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </aside>

                  {/* Posts Grid */}
                  <div className="lg:col-span-3 w-full min-w-0">
                    <div className="grid md:grid-cols-2 gap-4 lg:gap-8">
                      {filteredBlogs.map((post, index) => (
                        <Link to={`/blog/${post.slug}`} key={post._id} className="group">
                          <motion.article
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-card rounded-xl overflow-hidden border border-border/40 hover:border-accent/40 shadow-sm hover:shadow-premium transition-all duration-500 h-full flex flex-col"
                          >
                            <div className="aspect-[16/10] overflow-hidden">
                              <img
                                src={post.image}
                                alt={post.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                            </div>
                            <div className="p-6 lg:p-8 flex flex-col flex-grow">
                              <div className="flex items-center gap-3 mb-4">
                                <span className="text-[10px] font-bold text-accent bg-accent/10 px-3 py-1 rounded-full uppercase tracking-widest border border-accent/20">
                                  {post.category?.name || "Uncategorized"}
                                </span>
                                <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 group-hover:text-foreground transition-colors">
                                  <Clock className="w-3 h-3" /> {Math.ceil((post?.content?.length || 0) / 500)} min read
                                </span>
                              </div>
                              <h3 className="font-heading text-xl lg:text-2xl font-bold mb-4 group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                                {post.title}
                              </h3>
                              <p className="text-muted-foreground text-sm lg:text-base mb-6 line-clamp-3 leading-relaxed">
                                {stripHtml(post?.content || "").substring(0, 140)}...
                              </p>
                              <div className="mt-auto pt-6 flex items-center justify-between border-t border-border/20 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                <span className="flex items-center gap-1.5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                  <User className="w-3 h-3 text-accent" /> {post.authorName}
                                </span>
                                <span className="flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-all">
                                  <Calendar className="w-3 h-3 text-accent" /> {new Date(post.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </motion.article>
                        </Link>
                      ))}
                    </div>

                    {filteredBlogs.length === 0 && (
                      <div className="text-center py-20 text-muted-foreground">
                        <h3 className="text-xl">No articles found matching your criteria.</h3>
                        <p className="mt-2">Try searching for something else or changing categories.</p>
                      </div>
                    )}
                    {/* Pagination */}
                    {pagination.pages > 1 && (
                      <div className="mt-12 flex justify-center items-center gap-4">
                        <Button
                          variant="outline"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        >
                          Previous
                        </Button>
                        <div className="flex gap-2">
                          {[...Array(pagination.pages)].map((_, i) => (
                            <Button
                              key={i + 1}
                              variant={currentPage === i + 1 ? "gold" : "outline"}
                              className="w-10 h-10 p-0"
                              onClick={() => setCurrentPage(i + 1)}
                            >
                              {i + 1}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          disabled={currentPage === pagination.pages}
                          onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
