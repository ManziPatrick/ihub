import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  PlayCircle,
  Clock,
  Search,
  Filter,
  Grid,
  List,
  Award,
  Users,
  Star,
  ArrowRight,
  Eye,
  Briefcase,
  FolderOpen,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Upload,
  FileText,
  ExternalLink,
  Layers,
  Box,
  Link as LinkIcon,
  Sparkles,
  XCircle,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  EnrollCourseDialog, 
  FilterCoursesDialog,
  ViewCourseDetailDialog,
  ApplyInternshipDialog,
  ApplyCourseDialog,
  SubmitProjectDialog,
  TeamChatDialog,
  ViewGuidelinesDialog
} from "@/components/portal/dialogs";
import { ProjectMarketplace } from "@/components/portal/student/ProjectMarketplace";
import { AIHelper } from "@/components/portal/AIHelper";
import { Badge } from "@/components/ui/badge";
import type { CourseFilters } from "@/components/portal/dialogs/FilterCoursesDialog";
import { toast } from "sonner";

import { PaginationBar } from "@/components/ui/pagination-bar";

import { useQuery } from "@apollo/client/react";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { GET_ME, GET_COURSES_LITE_SUMMARY, GET_MY_PROJECTS, MY_COURSE_APPLICATIONS } from "@/lib/graphql/queries";

export default function StudentCourses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Queries
  const { data: meData, loading: meLoading, refetch: refetchMe } = useQuery(GET_ME);
  const [availPage, setAvailPage] = useState(1);
  const [availPerPage, setAvailPerPage] = useState(12);
  const { data: coursesData, loading: coursesLoading, refetch: refetchCourses } = usePaginatedQuery(GET_COURSES_LITE_SUMMARY, {
    variables: { page: availPage, limit: availPerPage },
  });
  const { data: projectsData, loading: projectsLoading } = useQuery(GET_MY_PROJECTS);
  const { data: appsData, loading: appsLoading } = useQuery(MY_COURSE_APPLICATIONS);

  // Enrolled courses pagination (client-side, data already loaded)
  const [enrolledPage, setEnrolledPage] = useState(1);
  const [enrolledPerPage, setEnrolledPerPage] = useState(12);

  const handleEnrolledPageChange = useCallback((newPage: number) => {
    if (newPage >= 1) setEnrolledPage(newPage);
  }, []);

  const handleEnrolledPerPageChange = useCallback((value: string) => {
    setEnrolledPerPage(parseInt(value));
    setEnrolledPage(1);
  }, []);

  // Available courses pagination callbacks (before early return - React Rules of Hooks)
  const coursesPagination = (coursesData as any)?.courses?.pagination || {};
  const handleAvailPageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= ((coursesData as any)?.courses?.pagination?.totalPages || 1)) {
      setAvailPage(newPage);
    }
  }, [coursesData]);

  const handleAvailPerPageChange = useCallback((value: string) => {
    setAvailPerPage(parseInt(value));
    setAvailPage(1);
  }, []);

  // Dialog states
  const [enrollCourse, setEnrollCourse] = useState<any | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewCourse, setViewCourse] = useState<any | null>(null);
  const [filters, setFilters] = useState<CourseFilters>({
    categories: [],
    level: "All Levels",
    duration: "Any Duration",
    rating: 0,
    priceRange: "Any Price",
  });
  const [applyInternshipOpen, setApplyInternshipOpen] = useState(false);
  const [applyCourse, setApplyCourse] = useState<any | null>(null);

  // Project dialog states
  const [submitProject, setSubmitProject] = useState<any | null>(null);
  const [chatProject, setChatProject] = useState<any | null>(null);
  const [guidelinesProject, setGuidelinesProject] = useState<any | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">In Progress</Badge>;
      case "pending_review":
        return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-400/30">Pending Review</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-400/30">Completed</Badge>;
      case "pending_approval":
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-400/30">Pending Approval</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-400/30">Rejected</Badge>;
      default:
        return null;
    }
  };

  const FALLBACK_IMG = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600";

  // Show skeleton only on initial load, not during background refreshes
  const isInitialLoad = (!meData && meLoading) || (!coursesData && coursesLoading) || (!projectsData && projectsLoading);
  if (isInitialLoad) {
    return (
      <PortalLayout>
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header skeleton */}
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted/60 rounded-xl animate-pulse" />
            <div className="h-4 w-72 bg-muted/40 rounded-lg animate-pulse" />
          </div>
          {/* Hero card skeleton */}
          <div className="h-44 w-full bg-muted/50 rounded-3xl animate-pulse" />
          {/* Search bar skeleton */}
          <div className="flex gap-3">
            <div className="h-10 flex-1 bg-muted/40 rounded-xl animate-pulse" />
            <div className="h-10 w-10 bg-muted/40 rounded-xl animate-pulse" />
            <div className="h-10 w-10 bg-muted/40 rounded-xl animate-pulse" />
          </div>
          {/* Tabs skeleton */}
          <div className="h-10 w-full bg-muted/30 rounded-xl animate-pulse" />
          {/* Course cards skeleton */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="rounded-2xl border border-border/40 overflow-hidden" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="h-36 bg-muted/60 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-5 w-3/4 bg-muted/60 rounded-lg animate-pulse" />
                  <div className="h-3 w-full bg-muted/40 rounded animate-pulse" />
                  <div className="h-3 w-5/6 bg-muted/40 rounded animate-pulse" />
                  <div className="flex justify-between pt-1">
                    <div className="h-3 w-20 bg-muted/30 rounded animate-pulse" />
                    <div className="h-8 w-20 bg-muted/50 rounded-xl animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PortalLayout>
    );
  }

  const me = (meData as any)?.me;
  const enrolledCoursesRaw = me?.enrolledCourses || [];
  // LIFO: Reverse the array to show latest first
  const enrolledCoursesAll = [...enrolledCoursesRaw].reverse();
  const totalEnrolled = enrolledCoursesAll.length;
  const totalEnrolledPages = Math.ceil(totalEnrolled / enrolledPerPage) || 1;
  const enrolledStart = (enrolledPage - 1) * enrolledPerPage;
  const enrolledEnd = Math.min(enrolledStart + enrolledPerPage, totalEnrolled);
  const enrolledCourses = enrolledCoursesAll.slice(enrolledStart, enrolledEnd);
  
  const completedLessons = me?.completedLessons || [];
  const myApplications = (appsData as any)?.myCourseApplications || [];
  
  const allCoursesData = (coursesData as any)?.courses;
  const allCourses = allCoursesData?.items || [];
  const availableCourses = allCourses.filter((c: any) => 
    !enrolledCoursesRaw.some((ec: any) => String(ec.id || ec._id) === String(c.id || c._id))
  );

  const getCourseProgress = (courseId: string, totalLessons: number) => {
    if (totalLessons === 0) return 0;
    const completed = completedLessons.filter((l: any) => String(l.courseId) === String(courseId)).length;
    return Math.round((completed / totalLessons) * 100);
  };

  const latestCourse = enrolledCoursesAll[0];
  const latestCourseId = latestCourse?.id || latestCourse?._id;
  const lastLessonId = latestCourseId ? localStorage.getItem(`last_lesson_${latestCourseId}`) : null;
  
  // Find the lesson title if it was saved
  let lastLessonTitle = "Continue where you left off";
  if (lastLessonId && latestCourse) {
    const foundLesson = latestCourse.modules?.flatMap((m: any) => m.lessons || [])
      .find((l: any) => (l.id || l._id) === lastLessonId);
    if (foundLesson) {
      lastLessonTitle = `Resume: ${foundLesson.title}`;
    }
  }

  const latestCourseTotalLessons = latestCourse?.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
  const latestProgress = latestCourse ? getCourseProgress(latestCourseId, latestCourseTotalLessons) : 0;

  const handleBrowseCourses = () => {
    const tabTrigger = document.querySelector('[value="available"]') as HTMLElement;
    tabTrigger?.click();
  };

  const handleApplyFilters = (newFilters: CourseFilters) => {
    setFilters(newFilters);
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
              My Courses
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your progress and explore new learning opportunities
            </p>
          </div>
          <Button variant="outline" onClick={async () => {
              setIsRefreshing(true);
              try {
                await Promise.all([refetchMe(), refetchCourses()]);
                toast.success('Courses refreshed!');
              } catch {
                toast.error('Failed to refresh courses');
              } finally {
                setIsRefreshing(false);
              }
            }} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

        </motion.div>

        {/* Latest Activity / Continue Learning Tracker */}
        {latestCourse && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/20 via-accent/5 to-transparent border border-accent/20 p-6 shadow-xl shadow-accent/5"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Sparkles className="w-32 h-32 text-accent" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden bg-muted/20 border border-border/50 shrink-0">
                <img
                  src={latestCourse.thumbnail || FALLBACK_IMG}
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                  className="w-full h-full object-cover"
                  alt={latestCourse.title}
                />
              </div>
              <div className="flex-1 w-full">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider">
                    Latest Activity
                  </span>
                  <span className="text-xs text-muted-foreground">{lastLessonTitle}</span>
                </div>
                <h2 className="text-xl font-bold text-foreground mb-4 line-clamp-1">
                  {latestCourse.title}
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-muted-foreground">Course Progress</span>
                    <span className="font-bold text-accent">{latestProgress}%</span>
                  </div>
                  <Progress value={latestProgress} className="h-3 bg-background/50" />
                </div>
              </div>
              <Link to={`/portal/student/courses/${latestCourse.id || latestCourse._id}`} className="w-full md:w-auto">
                <Button variant="gold" size="lg" className="w-full h-14 rounded-2xl px-8 shadow-lg shadow-gold/20 group">
                  <PlayCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Continue Learning
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setFilterOpen(true)}>
              <Filter className="w-5 h-5" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-5 h-5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="enrolled" className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto no-scrollbar bg-background/50 border border-border/50 p-1 rounded-xl h-auto snap-x snap-mandatory">
            <TabsTrigger value="enrolled" className="px-4 py-2 text-xs sm:text-sm whitespace-nowrap">Enrolled ({totalEnrolled})</TabsTrigger>
            <TabsTrigger value="available" className="px-4 py-2 text-xs sm:text-sm whitespace-nowrap">Available Courses</TabsTrigger>
            <TabsTrigger value="projects" className="px-4 py-2 text-xs sm:text-sm whitespace-nowrap">My Projects ({(projectsData as any)?.myProjects?.length || 0})</TabsTrigger>
            <TabsTrigger value="completed" className="px-4 py-2 text-xs sm:text-sm whitespace-nowrap">Completed</TabsTrigger>
          </TabsList>

          {/* Enrolled Courses */}
          <TabsContent value="enrolled" className="space-y-4">
            {enrolledCoursesAll.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-heading text-lg font-medium text-foreground mb-2">
                    No courses enrolled yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Start your learning journey by exploring our course catalog
                  </p>
                  <Button variant="gold" onClick={handleBrowseCourses}>
                    Browse Courses
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2" : "grid-cols-1"}`}>
                  {enrolledCourses.map((course: any, index: number) => {
                    const courseId = course.id || course._id;
                    const totalLessons = course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
                    const progress = getCourseProgress(courseId, totalLessons);
                    const completedCount = completedLessons.filter((l: any) => String(l.courseId) === String(courseId)).length;

                    return (
                      <motion.div
                        key={courseId || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="border-border/50 hover:shadow-card-hover transition-all overflow-hidden">
                          <div className={`flex ${viewMode === "list" ? "flex-row" : "flex-col"}`}>
                            {/* Image */}
                            <div className={`bg-gradient-to-br from-accent/20 to-primary/10 ${viewMode === "list" ? "w-48 h-auto" : "h-40"}`}>
                              <div className="w-full h-full flex items-center justify-center">
                                <img
                                  src={course.thumbnail || FALLBACK_IMG}
                                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                                  alt={course.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                            
                            {/* Content */}
                            <CardContent className="p-4 flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-heading font-semibold text-card-foreground">
                                  {course.title}
                                </h3>
                                {me?.completedCourses?.some((id: any) => id.toString() === courseId.toString()) ? (
                                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-400/30">
                                    Completed
                                  </Badge>
                                ) : (
                                  <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">
                                    {progress}%
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-card-foreground/60 mb-3 line-clamp-2" dangerouslySetInnerHTML={{ __html: course.description }} />
                              <Progress value={progress} className="h-2 mb-3" />
                              <div className="flex items-center justify-between text-xs text-card-foreground/60 mb-4">
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-3.5 h-3.5" />
                                  {completedCount}/{totalLessons} lessons
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {course.level}
                                </span>
                                {course.school && (
                                  <span className="flex items-center gap-1.5 font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
                                    <Building2 className="w-3 h-3" />
                                    {course.school}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-card-foreground/70">by {course.instructor?.username || 'Trainer'}</span>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setViewCourse(course)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Link to={`/portal/student/courses/${course.id || course._id}`}>
                                    <Button variant="gold" size="sm">
                                      <PlayCircle className="w-4 h-4 mr-1" />
                                      Continue
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </CardContent>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>                <PaginationBar
                  currentPage={enrolledPage}
                  totalPages={totalEnrolledPages}
                  totalCount={totalEnrolled}
                  onPageChange={handleEnrolledPageChange}
                  hasPreviousPage={enrolledPage > 1}
                  hasNextPage={enrolledPage < totalEnrolledPages}
                  pageSize={enrolledPerPage}
                  onPageSizeChange={(v) => { setEnrolledPerPage(v); setEnrolledPage(1); }}
                  pageSizeOptions={[6, 9, 12, 18]}
                  pageSizeLabel="Rows per page:"
                />
              </>
            )}
          </TabsContent>

          {/* Available Courses */}
          <TabsContent value="available" className="space-y-4">
            <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
              {availableCourses.map((course: any, index: number) => {
                const totalLessons = course.totalLessonsCount || 0;
                const isFree = course.price === 0;

                return (
                  <motion.div
                    key={course.id || course._id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border-border/50 hover:shadow-card-hover transition-all overflow-hidden h-full flex flex-col">
                      {/* Image */}
                      <div className="h-36 bg-gradient-to-br from-accent/20 to-primary/10 relative">
                        <div className="w-full h-full flex items-center justify-center">
                          <img
                            src={course.thumbnail || FALLBACK_IMG}
                            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {isFree && (
                          <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-xs font-medium px-2 py-1 rounded">
                            Free
                          </span>
                        )}
                        {!isFree && (
                          <span className="absolute top-3 left-3 bg-card text-card-foreground text-xs font-medium px-2 py-1 rounded">
                            Premium
                          </span>
                        )}
                      </div>
                      
                      {/* Content */}
                      <CardContent className="p-4 flex-1 flex flex-col">
                        <h3 className="font-heading font-semibold text-card-foreground mb-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-card-foreground/60 mb-3 line-clamp-2 flex-1" dangerouslySetInnerHTML={{ __html: course.description }} />
                        <div className="flex items-center gap-4 text-xs text-card-foreground/60 mb-3">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {totalLessons} lessons
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                            4.8
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {course.studentsEnrolledCount || 0}
                          </span>
                        </div>
                        {course.school && (
                          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-accent bg-accent/10 px-2 py-1 rounded-lg border border-accent/20 w-fit mb-3 shadow-sm">
                            <Building2 className="w-3 h-3" />
                            {course.school}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-accent">
                            {isFree ? 'Free' : (course.price.toLocaleString() + ' RWF')}
                          </span>
                          {(() => {
                            const application = myApplications.find((app: any) => app.courseId === (course.id || course._id));
                            const appStatus = application?.status;

                            if (appStatus === 'approved') {
                              return (
                                <Link to={`/portal/student/courses/${course.id || course._id}`}>
                                  <Button variant="gold" size="sm">
                                    Continue <ArrowRight className="w-4 h-4 ml-1" />
                                  </Button>
                                </Link>
                              );
                            }

                            if (appStatus === 'pending') {
                              return (
                                <Button variant="outline" size="sm" disabled className="border-amber-500 text-amber-500">
                                  Pending <Clock className="w-4 h-4 ml-1" />
                                </Button>
                              );
                            }

                            if (appStatus === 'rejected') {
                              return (
                                <Button variant="outline" size="sm" disabled className="border-red-500 text-red-500">
                                  Rejected <XCircle className="w-4 h-4 ml-1" />
                                </Button>
                              );
                            }

                            return (
                              <Button 
                                variant="gold" 
                                size="sm"
                                onClick={() => {
                                  if (course.enrollmentMode === 'application') {
                                    setApplyCourse(course);
                                  } else {
                                    setEnrollCourse(course);
                                  }
                                }}
                              >
                                {course.enrollmentMode === 'application' ? 'Apply' : 'Enroll'} <ArrowRight className="w-4 h-4 ml-1" />
                              </Button>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>            <PaginationBar
              currentPage={availPage}
              totalPages={coursesPagination.totalPages}
              totalCount={coursesPagination.totalCount}
              onPageChange={handleAvailPageChange}
              hasPreviousPage={coursesPagination.hasPreviousPage}
              hasNextPage={coursesPagination.hasNextPage}
              pageSize={availPerPage}
              onPageSizeChange={(v) => { setAvailPerPage(v); setAvailPage(1); }}
              pageSizeOptions={[6, 9, 12, 18]}
              pageSizeLabel="Rows per page:"
            />
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="flex items-center gap-4 text-sm mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/20 rounded-full">
                <FolderOpen className="w-4 h-4 text-accent" />
                <span className="text-foreground">{(projectsData as any)?.myProjects?.length || 0} Active Projects</span>
              </div>
            </div>

            <Tabs defaultValue="my-projects" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 max-w-[400px]">
                <TabsTrigger value="my-projects">My Projects</TabsTrigger>
                <TabsTrigger value="browse">Browse Projects</TabsTrigger>
              </TabsList>

              <TabsContent value="my-projects" className="space-y-6">
                {!(projectsData as any)?.myProjects?.length ? (
                  <Card className="border-border/50 bg-gradient-to-br from-card to-accent/5 overflow-hidden">
                    <CardContent className="p-8 lg:p-12">
                      <div className="max-w-2xl mx-auto text-center">
                        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                          <FolderOpen className="w-8 h-8 text-accent" />
                        </div>
                        <h2 className="text-2xl font-heading font-bold mb-3">Your Portfolio Journey Starts Here</h2>
                        <p className="text-muted-foreground mb-8">
                          Projects are unlocked as you progress through your courses or when you're placed in an internship team.
                        </p>
                        <Button variant="gold" onClick={() => {
                          const trigger = document.querySelector('[value="browse"]') as HTMLElement;
                          trigger?.click();
                        }}>
                          Browse Available Projects
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6">
                    {(projectsData as any).myProjects.map((project: any, index: number) => (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="border-border/50">
                          <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <div className="flex items-center gap-3 mb-1">
                                      <h3 className="font-heading text-lg font-semibold text-card-foreground">
                                        {project.title}
                                      </h3>
                                      {getStatusBadge(project.status)}
                                    </div>
                                    <p className="text-sm text-card-foreground/60">
                                      {project.course} • {project.type}
                                    </p>
                                  </div>
                                </div>
                                <div
                                  className="text-card-foreground/70 text-sm mb-4 line-clamp-3"
                                  dangerouslySetInnerHTML={{ __html: project.description }}
                                />
                                {project.status !== "completed" && (
                                  <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm text-card-foreground/70">Progress</span>
                                      <span className="text-sm font-medium text-accent">{project.progress}%</span>
                                    </div>
                                    <Progress value={project.progress} className="h-2" />
                                  </div>
                                )}
                              </div>
                              <div className="lg:w-64 space-y-4">
                                <div className="space-y-2">
                                  {project.status === "in_progress" && (
                                    <>
                                      <Button
                                        variant="gold"
                                        size="sm"
                                        className="w-full rounded-xl font-bold"
                                        onClick={() => setSubmitProject(project)}
                                      >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Submit
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full rounded-xl"
                                    onClick={() => setGuidelinesProject(project)}
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    View Details
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="browse">
                <ProjectMarketplace />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Completed Courses */}
          <TabsContent value="completed" className="space-y-4">
            {me?.completedCourses?.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center">
                  <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-heading text-lg font-medium text-foreground mb-2">
                    No completed courses yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Keep learning! Your completed courses will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2" : "grid-cols-1"}`}>
                {me?.completedCourses?.map((course: any, index: number) => {
                  const courseId = course.id || course._id;
                  const totalLessons = course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
                  
                  return (
                    <motion.div
                      key={courseId || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-green-500/5 hover:shadow-card-hover transition-all overflow-hidden border-green-500/20">
                        <div className={`flex ${viewMode === "list" ? "flex-row" : "flex-col"}`}>
                          <div className={`bg-green-500/10 ${viewMode === "list" ? "w-48 h-auto" : "h-40"}`}>
                            <div className="w-full h-full flex items-center justify-center">
                              <img
                                src={course.thumbnail || FALLBACK_IMG}
                                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                                alt={course.title}
                                className="w-full h-full object-cover opacity-80"
                              />
                            </div>
                          </div>
                          
                          <CardContent className="p-4 flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-heading font-semibold text-foreground">
                                {course.title}
                              </h3>
                              <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/30">
                                <CheckCircle className="w-3 h-3 mr-1" /> Completed
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              Congratulations on finishing this professional program!
                            </p>
                            <div className="flex items-center justify-between mt-auto">
                              <Link to={`/portal/student/certificates`}>
                                <Button variant="outline" size="sm" className="border-green-500/50 text-green-500 hover:bg-green-500/10">
                                  View Certificate
                                </Button>
                              </Link>
                              <Link to={`/portal/student/courses/${courseId}`}>
                                <Button variant="ghost" size="sm">
                                  Review Content
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <EnrollCourseDialog
        open={!!enrollCourse}
        onOpenChange={(open) => !open && setEnrollCourse(null)}
        course={enrollCourse}
      />
      <FilterCoursesDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onApplyFilters={handleApplyFilters}
      />
      <ViewCourseDetailDialog
        open={!!viewCourse}
        onOpenChange={(open) => !open && setViewCourse(null)}
        course={viewCourse}
      />
      <ApplyCourseDialog
        open={!!applyCourse}
        onOpenChange={(open) => !open && setApplyCourse(null)}
        course={applyCourse}
      />

      <SubmitProjectDialog
        open={!!submitProject}
        onOpenChange={(open) => !open && setSubmitProject(null)}
        projectTitle={submitProject?.title || ""}
        projectId={submitProject?.id || ""}
      />
      <TeamChatDialog
        open={!!chatProject}
        onOpenChange={(open) => !open && setChatProject(null)}
        projectTitle={chatProject?.title || ""}
        projectId={chatProject?.id || ""}
        teamMembers={chatProject?.team || []}
      />
      <ViewGuidelinesDialog
        open={!!guidelinesProject}
        onOpenChange={(open) => !open && setGuidelinesProject(null)}
        project={guidelinesProject}
      />
    </PortalLayout>
  );
}
