import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@apollo/client/react";
import { GET_COURSES, GET_INTERNSHIP_PROGRAMS } from "@/lib/graphql/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    BookOpen,
    Briefcase,
    ArrowRight,
    Clock,
    Users,
    Loader2,
    ExternalLink,
    GraduationCap
} from "lucide-react";
import { Link } from "react-router-dom";
import { ImageWithSkeleton } from "@/components/ui/image-skeleton";

export function FeaturedCourses() {
    const [activeTab, setActiveTab] = useState<"courses" | "internships">("courses");
    const { data: coursesData, loading: coursesLoading } = useQuery(GET_COURSES);
    const { data: internshipsData, loading: internshipsLoading } = useQuery(GET_INTERNSHIP_PROGRAMS);

    const allCourses = (coursesData as any)?.courses?.items || [];
    const allInternships = (internshipsData as any)?.internshipPrograms?.items || [];

    const loading = activeTab === "courses" ? coursesLoading : internshipsLoading;

    if (loading) {
        return (
            <div className="py-20 flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    const featuredCourses = [...allCourses]
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);

    const featuredInternships = allInternships.slice(0, 3);

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
                            <GraduationCap className="w-3 h-3" />
                            Featured Programs
                        </span>
                        <h2 className="font-heading text-3xl lg:text-4xl font-medium text-foreground mb-4">
                            Browse Courses & <span className="text-accent italic">Internships</span>
                        </h2>
                        <p className="text-muted-foreground">
                            Browse courses and internships — all in one place.
                        </p>
                    </motion.div>

                    <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50 backdrop-blur-sm">
                        <button
                            onClick={() => setActiveTab("courses")}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "courses"
                                ? "bg-accent text-white shadow-[0_0_15px_rgba(255,184,0,0.4)]"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <BookOpen className="w-4 h-4" />
                            Courses
                        </button>
                        <button
                            onClick={() => setActiveTab("internships")}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "internships"
                                ? "bg-accent text-white shadow-[0_0_15px_rgba(255,184,0,0.4)]"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Briefcase className="w-4 h-4" />
                            Internships
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence mode="wait">
                        {activeTab === "courses" ? (
                            featuredCourses.map((course: any, idx: number) => (
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
                                                    src={course.thumbnail || `https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800`}
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
                            ))
                        ) : (
                            featuredInternships.length > 0 ? (
                                featuredInternships.map((internship: any, idx: number) => (
                                    <motion.div
                                        key={internship.id + activeTab}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ delay: idx * 0.1 }}
                                        viewport={{ once: true }}
                                    >
                                        <Link to={`/internships`}>
                                            <Card className="group relative bg-card/40 border-border/50 backdrop-blur-md hover:border-accent/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,184,0,0.1)] overflow-hidden h-full flex flex-col">
                                                {/* Internship Image Header */}
                                                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-accent/10 via-card to-blue-500/10 flex items-center justify-center">
                                                    <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                                        <Briefcase className="w-10 h-10 text-accent" strokeWidth={1.5} />
                                                    </div>
                                                    <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent opacity-60" />

                                                    <div className="absolute top-4 left-4">
                                                        <Badge className="bg-accent text-white border-none">
                                                            {internship.duration || 'Flexible'}
                                                        </Badge>
                                                    </div>

                                                    <div className="absolute top-4 right-4">
                                                        <Badge variant="outline" className="bg-black/50 backdrop-blur-md border-green-400/30 text-green-400 uppercase font-bold text-[10px]">
                                                            {internship.status || 'Open'}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <CardContent className="p-6 flex flex-col flex-1">
                                                    <div className="mb-2">
                                                        <span className="inline-flex items-center gap-1 text-[10px] text-accent font-bold tracking-widest uppercase">
                                                            <GraduationCap className="w-3 h-3" />
                                                            Internship Program
                                                        </span>
                                                    </div>

                                                    <h3 className="font-heading text-xl font-medium text-foreground mb-3 group-hover:text-accent transition-colors">
                                                        {internship.title}
                                                    </h3>

                                                    <p className="text-sm text-muted-foreground mb-6 line-clamp-2 leading-relaxed">
                                                        {internship.description}
                                                    </p>

                                                    <div className="flex flex-wrap gap-3 mb-4">
                                                        {internship.duration && (
                                                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                {internship.duration}
                                                            </span>
                                                        )}
                                                        {internship.maxSpots && (
                                                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                <Users className="w-3.5 h-3.5" />
                                                                {internship.maxSpots} spots
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="mt-auto pt-6 border-t border-border/30 flex items-center justify-between">
                                                        <div>
                                                            {internship.price > 0 ? (
                                                                <div className="flex flex-col">
                                                                    {internship.discount ? (
                                                                        <>
                                                                            <span className="text-xs text-muted-foreground line-through decoration-red-500/50">
                                                                                {internship.price.toLocaleString()} RWF
                                                                            </span>
                                                                            <span className="text-xl font-bold text-accent">
                                                                                {(internship.price - internship.discount).toLocaleString()} RWF
                                                                            </span>
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-lg font-bold text-foreground">
                                                                            {internship.price.toLocaleString()} RWF
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-lg font-bold text-green-500">Free</span>
                                                            )}
                                                        </div>

                                                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent transition-all duration-300">
                                                            <ExternalLink className="w-5 h-5 text-accent group-hover:text-white transition-colors" />
                                                        </div>
                                                    </div>
                                                </CardContent>

                                                {/* Holographic reflection effect */}
                                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                                            </Card>
                                        </Link>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-16">
                                    <Briefcase className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                                    <h3 className="font-heading text-xl text-foreground mb-2">No Open Internships Yet</h3>
                                    <p className="text-muted-foreground mb-6">
                                        New internship programs are coming soon. Check back later or explore our courses.
                                    </p>
                                    <Link to="/internships">
                                        <Button variant="outline" className="rounded-full border-accent/20">
                                            View All Internships
                                        </Button>
                                    </Link>
                                </div>
                            )
                        )}
                    </AnimatePresence>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-16 text-center"
                >
                    <Link to={activeTab === "courses" ? "/training" : "/internships"}>
                        <Button variant="outline" size="lg" className="px-12 rounded-full border-accent/20 hover:bg-accent/5 gap-2 group">
                            Explore All {activeTab === "courses" ? "Courses" : "Internships"}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
