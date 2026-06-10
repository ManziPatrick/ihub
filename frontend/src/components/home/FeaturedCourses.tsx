import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@apollo/client/react";
import { GET_COURSES } from "@/lib/graphql/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Sparkles,
    TrendingUp,
    ArrowRight,
    Clock,
    Tag,
    Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { ImageWithSkeleton } from "@/components/ui/image-skeleton";

export function FeaturedCourses() {
    const [activeTab, setActiveTab] = useState<"latest" | "sale">("latest");
    const { data, loading, error } = useQuery(GET_COURSES);

    if (loading) {
        return (
            <div className="py-20 flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    if (error) {
        console.error("Error fetching courses:", error);
        return null;
    }

    const allCourses = (data as any)?.courses?.items || [];

    // Filter courses based on active tab
    const filteredCourses = activeTab === "latest"
        ? [...allCourses].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3)
        : allCourses.filter((c: any) => c.discountPrice && c.discountPrice < c.price).slice(0, 3);

    return (
        <section className="py-20 bg-background relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -z-10" />

            <div className="container mx-auto px-4 lg:px-8">
                <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="max-w-2xl"
                    >
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider mb-4 border border-accent/20">
                            <Sparkles className="w-3 h-3" />
                            Special Selection
                        </span>
                        <h2 className="font-heading text-3xl lg:text-4xl font-medium text-foreground mb-4">
                            Unlock Your <span className="text-accent italic">Tech Future</span>
                        </h2>
                        <p className="text-muted-foreground">
                            Discover our newest programs and exclusive limited-time offers designed to take your career to the next level.
                        </p>
                    </motion.div>

                    <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50 backdrop-blur-sm">
                        <button
                            onClick={() => setActiveTab("latest")}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "latest"
                                ? "bg-accent text-white shadow-[0_0_15px_rgba(255,184,0,0.4)]"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Clock className="w-4 h-4" />
                            Latest Arrivals
                        </button>
                        <button
                            onClick={() => setActiveTab("sale")}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "sale"
                                ? "bg-accent text-white shadow-[0_0_15px_rgba(255,184,0,0.4)]"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Tag className="w-4 h-4" />
                            Hot Offers
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence mode="wait">
                        {filteredCourses.map((course: any, idx: number) => (
                            <motion.div
                                key={course.id + activeTab}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <Link to={`/courses/${course.id}`}>
                                    <Card className="group relative bg-card/40 border-border/50 backdrop-blur-md hover:border-accent/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,184,0,0.1)] overflow-hidden h-full flex flex-col">
                                        {/* Course Image Header */}
                                        <div className="relative h-48 overflow-hidden">
                                            <ImageWithSkeleton
                                                src={course.thumbnail || `https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800&q=tech,${encodeURIComponent(course.category || 'coding')}`}
                                                alt={course.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                containerClassName="w-full h-full"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent opacity-60" />

                                            {course.discountPrice && course.discountPrice < course.price && (
                                                <div className="absolute top-4 left-4">
                                                    <Badge className="bg-red-500 text-white border-none animate-pulse">
                                                        {Math.round((1 - course.discountPrice / course.price) * 100)}% OFF
                                                    </Badge>
                                                </div>
                                            )}

                                            <div className="absolute top-4 right-4">
                                                <Badge variant="outline" className="bg-black/50 backdrop-blur-md border-accent/30 text-accent uppercase font-bold text-[10px]">
                                                    {course.level}
                                                </Badge>
                                            </div>
                                        </div>

                                        <CardContent className="p-6 flex flex-col flex-1">
                                            <div className="mb-2">
                                                <span className="text-[10px] text-accent font-bold tracking-widest uppercase">
                                                    {course.category}
                                                </span>
                                            </div>

                                            <h3 className="font-heading text-xl font-medium text-foreground mb-3 group-hover:text-accent transition-colors">
                                                {course.title}
                                            </h3>

                                            <p className="text-sm text-muted-foreground mb-6 line-clamp-2 leading-relaxed">
                                                {course.description}
                                            </p>

                                            <div className="mt-auto pt-6 border-t border-border/30 flex items-center justify-between">
                                                <div>
                                                    {course.discountPrice ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-muted-foreground line-through decoration-red-500/50">
                                                                {course.price.toLocaleString()} RWF
                                                            </span>
                                                            <span className="text-xl font-bold text-accent">
                                                                {course.discountPrice.toLocaleString()} RWF
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xl font-bold text-foreground">
                                                            {course.price === 0 ? "FREE" : `${course.price.toLocaleString()} RWF`}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent transition-all duration-300">
                                                    <ArrowRight className="w-5 h-5 text-accent group-hover:text-white transition-colors" />
                                                </div>
                                            </div>
                                        </CardContent>

                                        {/* Holographic reflection effect */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-16 text-center"
                >
                    <Link to="/training">
                        <Button variant="outline" size="lg" className="px-12 rounded-full border-accent/20 hover:bg-accent/5 gap-2 group">
                            Explore All Courses
                            <TrendingUp className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
