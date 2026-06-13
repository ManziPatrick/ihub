import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@apollo/client/react";
import { GET_COURSE, GET_COURSES_LITE_SUMMARY } from "@/lib/graphql/queries";
import {
  BookOpen,
  CheckCircle2,
  FileQuestion,
  GraduationCap,
  PlayCircle,
  FileText,
  Layers,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  BarChart3,
  AlertCircle,
  Sparkles,
  Target,
  Lightbulb,
  Star,
  Clock,
  Users,
  Search,
  Eye,
} from "lucide-react";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600";

type LessonType = "video" | "article" | "quiz" | "assignment" | string;

function getLessonIcon(type: LessonType) {
  switch (type) {
    case "video": return PlayCircle;
    case "quiz": return FileQuestion;
    case "assignment": return GraduationCap;
    default: return FileText;
  }
}

function getLessonColor(type: LessonType): string {
  switch (type) {
    case "video": return "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400";
    case "quiz": return "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400";
    case "assignment": return "from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400";
    default: return "from-slate-500/20 to-slate-600/10 border-slate-500/30 text-slate-400";
  }
}

function getLessonBadgeColor(type: LessonType): string {
  switch (type) {
    case "video": return "bg-blue-500/15 text-blue-400 border-blue-500/25";
    case "quiz": return "bg-amber-500/15 text-amber-400 border-amber-500/25";
    case "assignment": return "bg-purple-500/15 text-purple-400 border-purple-500/25";
    default: return "bg-slate-500/15 text-slate-400 border-slate-500/25";
  }
}

function getLessonLabel(type: LessonType): string {
  switch (type) {
    case "video": return "Video Lesson";
    case "quiz": return "Module Quiz";
    case "assignment": return "Exam / Assessment";
    default: return "Reading";
  }
}

// ─── Course Selector (when no courseId) ──────────────────────────────────────
function CourseSelector() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data, loading } = useQuery(GET_COURSES_LITE_SUMMARY, {
    fetchPolicy: "cache-first",
  });
  const courses = (data as any)?.courses?.items || [];

  const filtered = courses.filter((c: any) =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (id: string) => {
    navigate(`/portal/admin/course-preview/${id}`);
  };

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Eye className="w-6 h-6 text-accent" />
              Course Preview
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Select a course to preview its module structure
            </p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </motion.div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-muted/20 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No courses found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((course: any, idx: number) => {
              const totalMods = course.modulesCount || 0;
              const totalLessons = course.totalLessonsCount || 0;
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card
                    className="border-border/40 hover:border-accent/30 cursor-pointer transition-all hover:shadow-lg group overflow-hidden"
                    onClick={() => handleSelect(course.id)}
                  >
                    <CardContent className="p-0">
                      <div className="flex items-start gap-4 p-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-border/30">
                          <img
                            src={course.thumbnail || FALLBACK_IMG}
                            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground text-sm line-clamp-1 group-hover:text-accent transition-colors">
                            {course.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                            <Badge className="bg-accent/10 text-accent border-accent/20 text-[8px] px-1.5 py-0 h-4 font-black uppercase">
                              {course.category || "General"}
                            </Badge>
                            <span>{totalMods} modules</span>
                            <span>·</span>
                            <span>{totalLessons} lessons</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge
                              className={cn(
                                "text-[8px] px-1.5 py-0 h-4 font-black uppercase",
                                course.status === "published"
                                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                                  : course.status === "draft"
                                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                  : "bg-red-500/10 text-red-500 border-red-500/20"
                              )}
                            >
                              {course.status || "draft"}
                            </Badge>
                            <Button size="sm" variant="ghost" className="ml-auto h-7 px-2 text-[10px] font-bold text-accent">
                              Preview <Eye className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}

// ─── Course Structure Preview (when courseId is provided) ───────────────────
function CourseStructurePreview({ courseId }: { courseId: string }) {
  const navigate = useNavigate();
  const [expandedModule, setExpandedModule] = useState<number | null>(0);

  const { data, loading, error } = useQuery(GET_COURSE, {
    variables: { id: courseId },
  });

  const course = (data as any)?.course;

  const moduleStats = useMemo(() => {
    if (!course?.modules) return [];
    return course.modules.map((mod: any, idx: number) => {
      const lessons = mod.lessons || [];
      const contentLessons = lessons.filter((l: any) => l.type !== "quiz" && l.type !== "assignment");
      const quizLessons = lessons.filter((l: any) => l.type === "quiz" || l.type === "assignment");
      const isLastModule = idx === course.modules.length - 1;
      const hasExam = isLastModule && quizLessons.some((l: any) => l.type === "assignment");
      return {
        index: idx,
        title: mod.title,
        description: mod.description,
        lessons,
        contentLessons,
        quizLessons,
        isLastModule,
        hasExam,
        isWellFormed: contentLessons.length === 4 && quizLessons.length === 1,
        lessonsBreakdown: [
          { label: "Content Lessons", count: contentLessons.length, target: 4, ok: contentLessons.length === 4 },
          { label: hasExam ? "Final Exam" : "Module Quiz", count: quizLessons.length, target: 1, ok: quizLessons.length === 1 },
        ],
      };
    });
  }, [course]);

  const totalModules = course?.modules?.length || 0;
  const totalLessons = course?.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
  const perfectModules = moduleStats.filter((m: any) => m.isWellFormed).length;

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
        <div className="h-8 w-48 bg-muted/50 rounded animate-pulse" />
        <div className="h-40 w-full bg-muted/30 rounded-2xl animate-pulse" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 bg-muted/20 rounded-xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 max-w-5xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Course Not Found</h2>
        <p className="text-muted-foreground text-sm">{error?.message || "The course doesn't exist."}</p>
        <Button variant="outline" onClick={() => navigate("/portal/admin/course-preview")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Course List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/portal/admin/course-preview" className="hover:text-gold transition-colors">Course Preview</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-semibold truncate">{course.title}</span>
      </div>

      {/* Course Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card/95 to-card/80">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-gold blur-[100px]" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-accent blur-[120px]" />
        </div>
        <div className="relative p-6 md:p-10 flex flex-col md:flex-row gap-6 md:gap-10 items-start">
          <div className="w-full md:w-48 lg:w-56 shrink-0">
            <div className="aspect-video md:aspect-[4/3] rounded-xl overflow-hidden border border-border/30 shadow-lg">
              <img
                src={course.thumbnail || FALLBACK_IMG}
                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-accent/10 text-accent border-accent/20 text-[10px] uppercase font-black tracking-widest">
                {course.category || "General"}
              </Badge>
              <Badge variant="outline" className="text-[10px] uppercase font-black text-muted-foreground border-border/30">
                {course.level || "All Levels"}
              </Badge>
              <Badge className={cn(
                "text-[10px] uppercase font-black tracking-widest",
                course.status === "published"
                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                  : course.status === "draft"
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  : "bg-red-500/10 text-red-500 border-red-500/20"
              )}>
                {course.status || "draft"}
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
              {course.title}
            </h1>
            <div
              className="text-muted-foreground text-sm leading-relaxed line-clamp-2 prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: course.description || "" }}
            />
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-accent" />
                <strong className="text-foreground">{totalModules}</strong> Modules
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-accent" />
                <strong className="text-foreground">{totalLessons}</strong> Total Lessons
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-gold" />
                <strong className="text-foreground">{perfectModules}/{totalModules}</strong> Perfect Structure
              </span>
              {course.instructor && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-accent" />
                  <span className="text-foreground">{course.instructor.username}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Structure Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Layers, label: "Modules", value: totalModules, color: "from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400" },
          { icon: BookOpen, label: "Content Lessons", value: moduleStats.reduce((s: number, m: any) => s + m.contentLessons.length, 0), color: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400" },
          { icon: FileQuestion, label: "Quizzes", value: moduleStats.filter((m: any) => !m.isLastModule).reduce((s: number, m: any) => s + m.quizLessons.length, 0), color: "from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400" },
          { icon: GraduationCap, label: "Final Exams", value: moduleStats.filter((m: any) => m.hasExam).length, color: "from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400" },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="border-border/40 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} border flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{value}</p>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quality Badge */}
      <div className={`p-4 rounded-xl border flex items-center gap-3 ${
        perfectModules === totalModules
          ? "bg-green-500/5 border-green-500/20 text-green-500"
          : "bg-amber-500/5 border-amber-500/20 text-amber-500"
      }`}>
        {perfectModules === totalModules ? (
          <Sparkles className="w-5 h-5 shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 shrink-0" />
        )}
        <div className="text-sm">
          <p className="font-bold">
            {perfectModules === totalModules
              ? "Perfect 4+1 Structure — All modules follow the standardized pattern"
              : `${perfectModules}/${totalModules} modules follow the 4+1 pattern (4 content lessons + 1 quiz/exam)`}
          </p>
          <p className="text-muted-foreground text-xs mt-0.5">
            Standard: Each module should have <strong>4 content lessons</strong> followed by <strong>1 quiz</strong> (or <strong>exam</strong> for the last module)
          </p>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent" />
            Module Structure
          </h2>
          <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
            {moduleStats.length} modules
          </span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 p-3 rounded-xl bg-muted/10 border border-border/20 text-[10px]">
          <span className="flex items-center gap-1.5 font-bold text-muted-foreground uppercase tracking-wider">
            <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/30" /> Content Lessons
          </span>
          <span className="flex items-center gap-1.5 font-bold text-muted-foreground uppercase tracking-wider">
            <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30" /> Module Quiz
          </span>
          <span className="flex items-center gap-1.5 font-bold text-muted-foreground uppercase tracking-wider">
            <div className="w-3 h-3 rounded bg-purple-500/20 border border-purple-500/30" /> Final Exam
          </span>
        </div>

        {moduleStats.map((mod: any, idx: number) => {
          const isExpanded = expandedModule === idx;
          const isLast = idx === moduleStats.length - 1;
          const lessons = mod.lessons || [];

          return (
            <div key={idx}>
              <Card
                className={`border-border/40 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isExpanded ? "ring-1 ring-accent/20 shadow-lg" : ""
                }`}
                onClick={() => setExpandedModule(isExpanded ? null : idx)}
              >
                {/* Module Header */}
                <div className="p-4 md:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                      mod.isWellFormed
                        ? "bg-green-500/10 text-green-500 border border-green-500/20"
                        : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    }`}>
                      {mod.index + 1}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground text-sm truncate">{mod.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {mod.contentLessons.length} content + {mod.quizLessons.length} {mod.hasExam ? "exam" : "quiz"}
                        </span>
                        {mod.isWellFormed && (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[8px] px-1 py-0 h-4 font-black uppercase tracking-wider">
                            ✓ 4+1
                          </Badge>
                        )}
                        {isLast && (
                          <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-[8px] px-1 py-0 h-4 font-black uppercase tracking-wider">
                            Exam Module
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Mini lesson dots */}
                    <div className="hidden sm:flex items-center gap-1">
                      {lessons.map((lesson: any, li: number) => {
                        const type = lesson.type;
                        let dotColor = "bg-slate-500/30";
                        if (type === "quiz") dotColor = "bg-amber-500";
                        else if (type === "assignment") dotColor = "bg-purple-500";
                        else dotColor = "bg-blue-500";
                        return (
                          <div
                            key={li}
                            className={`w-2 h-2 rounded-full ${dotColor} ${li === lessons.length - 1 ? "ring-2 ring-offset-1 ring-offset-card ring-purple-500/30" : ""}`}
                            title={`${lesson.title} (${type})`}
                          />
                        );
                      })}
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Lesson List */}
                {isExpanded && (
                  <div className="border-t border-border/30">
                    <div className="p-4 md:p-5 space-y-2">
                      {lessons.map((lesson: any, li: number) => {
                        const isLastLesson = li === lessons.length - 1;
                        const type = lesson.type || "article";
                        const Icon = getLessonIcon(type);
                        const colorClass = getLessonColor(type);
                        const badgeClass = getLessonBadgeColor(type);
                        const label = getLessonLabel(type);

                        return (
                          <div
                            key={lesson.id || li}
                            className={`flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r ${colorClass} border transition-all hover:shadow-sm`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-background/50 border border-border/30 flex items-center justify-center shrink-0 mt-0.5">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-foreground">{lesson.title}</span>
                                <Badge className={`${badgeClass} text-[8px] px-1.5 py-0 h-4 font-black uppercase tracking-wider`}>
                                  {label}
                                </Badge>
                                {isLastLesson && isLast && type === "assignment" && (
                                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[8px] px-1.5 py-0 h-4 font-black uppercase tracking-wider flex items-center gap-1">
                                    <Target className="w-2.5 h-2.5" /> Final
                                  </Badge>
                                )}
                                {isLastLesson && type === "quiz" && !isLast && (
                                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[8px] px-1.5 py-0 h-4 font-black uppercase tracking-wider">
                                    Module Quiz
                                  </Badge>
                                )}
                              </div>
                              {lesson.duration && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {lesson.duration} min
                                </p>
                              )}
                            </div>
                            <div className="text-[9px] font-bold uppercase text-muted-foreground shrink-0 mt-1">
                              #{li + 1}
                            </div>
                          </div>
                        );
                      })}

                      {/* Module Summary Bar */}
                      <div className="mt-4 p-3 rounded-xl bg-muted/10 border border-border/20">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-foreground flex items-center gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5 text-accent" />
                            Module Structure Analysis
                          </span>
                          {mod.isWellFormed ? (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px] font-black">
                              ✓ 4 Content + 1 {mod.hasExam ? "Exam" : "Quiz"}
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[9px] font-black">
                              Needs Attention
                            </Badge>
                          )}
                        </div>
                        <div className="mt-3 space-y-1.5">
                          {mod.lessonsBreakdown.map((b: any) => (
                            <div key={b.label} className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${b.ok ? "bg-green-500" : "bg-amber-500"}`} />
                              <span className="text-[11px] text-muted-foreground flex-1">{b.label}</span>
                              <span className={`text-[11px] font-bold ${b.ok ? "text-green-500" : "text-amber-500"}`}>
                                {b.count} / {b.target}
                              </span>
                              {b.ok ? (
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                              ) : (
                                <AlertCircle className="w-3 h-3 text-amber-500" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
              {idx < moduleStats.length - 1 && (
                <div className="flex justify-center py-1">
                  <div className="w-px h-4 bg-gradient-to-b from-border/40 to-transparent" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend / Key */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-accent/[0.03] to-transparent border border-accent/10">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-gold" />
          <h3 className="font-bold text-foreground text-sm">Understanding the 4+1 Structure</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-card border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <BookOpen className="w-3 h-3 text-blue-400" />
              </div>
              <span className="font-bold text-foreground">4 Content Lessons</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Each module contains 4 content lessons (video, article, or mixed) that build knowledge progressively.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <FileQuestion className="w-3 h-3 text-amber-400" />
              </div>
              <span className="font-bold text-foreground">1 Module Quiz</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              The 5th lesson is always a quiz that tests understanding of all 4 content lessons in the module.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <GraduationCap className="w-3 h-3 text-purple-400" />
              </div>
              <span className="font-bold text-foreground">Final Module = Exam</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              The last module's quiz is replaced by a comprehensive exam covering the entire course.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button variant="outline" size="sm" onClick={() => navigate("/portal/admin/course-preview")}>
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> All Courses
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/courses/${course.id || course._id}`} target="_blank">
            <Eye className="w-3.5 h-3.5 mr-1.5" /> Public View
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/portal/student/courses/${course.id || course._id}`}>
            <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Student View
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export default function CoursePreview() {
  const { courseId } = useParams();

  if (!courseId) {
    return <CourseSelector />;
  }

  return (
    <PortalLayout>
      <CourseStructurePreview courseId={courseId} />
    </PortalLayout>
  );
}
