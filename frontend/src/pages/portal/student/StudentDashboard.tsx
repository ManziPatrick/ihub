import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  PlayCircle,
  Award,
  Briefcase,
  Calendar,
  Clock,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Target,
  Flame,
  ExternalLink,
  MessageSquare,
  CreditCard,
  Star,
  Trophy,
  Info,
  XCircle,
  FolderOpen,
  RefreshCw,
} from "lucide-react";
import { useQuery } from "@apollo/client/react";import { GET_ME, GET_MY_BOOKINGS, GET_CONVERSATIONS, GET_MY_PAYMENTS, GET_MY_PROJECTS, MY_COURSE_APPLICATIONS, GET_MY_INTERNSHIP_APPLICATIONS, GET_COURSES_LITE_SUMMARY, GET_INTERNSHIP_PROGRAMS } from "@/lib/graphql/queries";
import { toast } from "sonner";
import { GET_MY_PROJECT_TASKS } from "@/lib/graphql/project-tasks";
import { ApplyCourseDialog, ApplyInternshipDialog } from "@/components/portal/dialogs";
import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// No static achievements needed

export default function StudentDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: meData, loading: meLoading, refetch: refetchMe } = useQuery(GET_ME);
  const { data: bookingsData, loading: bookingsLoading, refetch: refetchBookings } = useQuery(GET_MY_BOOKINGS);
  const { data: conversationsData, refetch: refetchConversations } = useQuery(GET_CONVERSATIONS);
  const { data: paymentsData, refetch: refetchPayments } = useQuery(GET_MY_PAYMENTS);
  const { data: projectsData, loading: projectsLoading, refetch: refetchProjects } = useQuery(GET_MY_PROJECTS);
  const { data: myTasksData, refetch: refetchTasks } = useQuery(GET_MY_PROJECT_TASKS);
  const { data: appData, refetch: refetchApps } = useQuery(MY_COURSE_APPLICATIONS);
  const { data: internAppData, refetch: refetchInternApps } = useQuery(GET_MY_INTERNSHIP_APPLICATIONS);
  const [coursePage, setCoursePage] = useState(1);
  const [coursePerPage, setCoursePerPage] = useState(12);
  const { data: allCoursesData, loading: allCoursesLoading, refetch: refetchCourses } = useQuery(GET_COURSES_LITE_SUMMARY, {
    variables: { page: coursePage, limit: coursePerPage },
  });
  const [internshipPage, setInternshipPage] = useState(1);
  const [internshipPerPage, setInternshipPerPage] = useState(6);
  const { data: allInternshipsData, loading: allInternshipsLoading, refetch: refetchInternships } = useQuery(GET_INTERNSHIP_PROGRAMS, {
    variables: { page: internshipPage, limit: internshipPerPage },
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedInternshipId, setSelectedInternshipId] = useState<string | null>(null);

  // Must define hooks before any early return (React Rules of Hooks)
  const allCoursesPagination = (allCoursesData as any)?.courses?.pagination || {}
  const allInternshipsPagination = (allInternshipsData as any)?.internshipPrograms?.pagination || {}
  const handleCoursePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= ((allCoursesData as any)?.courses?.pagination?.totalPages || 1)) {
      setCoursePage(newPage);
    }
  }, [allCoursesData]);

  const handleCoursePerPageChange = useCallback((value: string) => {
    setCoursePerPage(parseInt(value));
    setCoursePage(1);
  }, []);

  const handleInternshipPageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= ((allInternshipsData as any)?.internshipPrograms?.pagination?.totalPages || 1)) {
      setInternshipPage(newPage);
    }
  }, [allInternshipsData]);

  const handleInternshipPerPageChange = useCallback((value: string) => {
    setInternshipPerPage(parseInt(value));
    setInternshipPage(1);
  }, []);

  if (meLoading || bookingsLoading || projectsLoading) {
    return (
      <PortalLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-muted rounded-xl"></div>
              <div className="h-4 w-40 bg-muted/50 rounded-lg"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-32 bg-muted rounded-xl"></div>
              <div className="h-10 w-10 bg-muted rounded-full"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded-2xl"></div>
            ))}
          </div>
          
          <div className="grid lg:grid-cols-3 gap-6 animate-pulse">
            <div className="lg:col-span-2 h-64 bg-muted rounded-3xl"></div>
            <div className="h-64 bg-muted rounded-3xl"></div>
          </div>
        </div>
      </PortalLayout>
    );
  }

  const me = (meData as any)?.me;
  const enrolledCourses = me?.enrolledCourses || [];
  const completedLessons = me?.completedLessons || [];
  const bookings = (bookingsData as any)?.myBookings || [];
  const payments = (paymentsData as any)?.myPayments || [];
  const projects = (projectsData as any)?.myProjects || [];

  const getCourseProgress = (course: any) => {
    const totalLessons = course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
    if (totalLessons === 0) return 0;
    const completed = completedLessons.filter((l: any) => l.courseId === (course.id || course._id)).length;
    return Math.round((completed / totalLessons) * 100);
  };

  const totalCompleted = completedLessons.length;
  const myApplications = (appData as any)?.myCourseApplications || [];
  const myInternApplications = (internAppData as any)?.myInternshipApplications || [];
  const allCourses = (allCoursesData as any)?.courses?.items || [];
  const allInternships = (allInternshipsData as any)?.internshipPrograms?.items || [];

  // Find latest interacted course (for now just take the first enrolled)
  const latestCourse = enrolledCourses[0];
  const latestApp = myApplications.find((app: any) => app.status === 'pending' || app.status === 'rejected');

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
              Welcome back, {user?.fullName}!
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("portal.dashboardDesc") || "Continue your learning journey. You're making great progress!"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={async () => {
                setIsRefreshing(true);
                try {
                  await Promise.all([
                    refetchMe(), refetchBookings(), refetchConversations(),
                    refetchPayments(), refetchProjects(), refetchTasks(),
                    refetchApps(), refetchInternApps(), refetchCourses(), refetchInternships()
                  ]);
                  toast.success('Dashboard refreshed!');
                } catch {
                  toast.error('Failed to refresh dashboard');
                } finally {
                  setIsRefreshing(false);
                }
              }} disabled={isRefreshing} className="h-9">
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium text-accent uppercase tracking-wider">{me?.academicStatus || 'Student'}</span>
              <span className="text-sm font-bold">Level {me?.level || 1}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full ml-2">
              <Flame className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium text-foreground">{me?.streak || 0} Day Streak!</span>
            </div>
          </div>
        </motion.div>

        {/* Level Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-5 bg-gradient-to-r from-gold/10 to-accent/10 border border-gold/20 rounded-2xl shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-tight text-foreground">Level {me?.level || 1} Journey</h4>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Master more lessons to reach Level {(me?.level || 1) + 1}!</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-gold">{(me?.xp || 0) % 100}</span>
              <span className="text-sm font-bold text-muted-foreground ml-1">/ 100 XP</span>
            </div>
          </div>
          <Progress value={(me?.xp || 0) % 100} className="h-3 bg-muted/20 shadow-inner" />
        </motion.div>

        {/* Latest Activity / Application Status */}
        <div className="grid lg:grid-cols-2 gap-6">
          {latestCourse ? (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-accent/30 bg-gradient-to-br from-card to-accent/5 overflow-hidden group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row h-full">
                    <div className="w-full sm:w-1/3 bg-accent/10 flex items-center justify-center p-6 border-b sm:border-b-0 sm:border-r border-accent/20">
                      <div className="w-20 h-20 rounded-2xl bg-background shadow-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                        <BookOpen className="w-10 h-10 text-accent" />
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 text-[10px] uppercase font-bold tracking-widest">Active Course</Badge>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase">{getCourseProgress(latestCourse)}% Complete</span>
                        </div>
                        <h3 className="text-xl font-black text-foreground mb-2 line-clamp-1 group-hover:text-accent transition-colors">{latestCourse.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{latestCourse.description}</p>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                            <span>Overall Progress</span>
                            <span className="text-accent">{getCourseProgress(latestCourse)}%</span>
                          </div>

                        </div>
                        <Link to={`/portal/student/courses/${latestCourse.id || latestCourse._id}`}>
                          <Button variant="gold" className="w-full rounded-xl font-bold h-11 group shadow-lg shadow-gold/20">
                            Continue Learning
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : latestApp ? (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className={`border-2 overflow-hidden ${latestApp.status === 'pending' ? 'border-amber-500/30 bg-amber-500/5' : 'border-red-500/30 bg-red-500/5'
                }`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${latestApp.status === 'pending' ? 'bg-amber-500/20' : 'bg-red-500/20'
                      }`}>
                      {latestApp.status === 'pending' ? <Clock className="w-6 h-6 text-amber-500" /> : <XCircle className="w-6 h-6 text-red-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold">Application Status</h3>
                        <Badge variant="outline" className={`text-[10px] uppercase font-black ${latestApp.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                          {latestApp.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">{latestApp.courseTitle}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {latestApp.status === 'pending'
                          ? "We've received your application and it's currently under review. Check back soon for updates!"
                          : `Unfortunately, your application was not accepted. Reason: ${latestApp.rejectionReason || 'No reason provided.'}`}
                      </p>
                      {latestApp.status === 'rejected' && (
                        <Link to="/explore">
                          <Button variant="outline" size="sm" className="mt-4 rounded-lg font-bold">Explore Other Courses</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/5 flex flex-col items-center justify-center p-8 text-center h-full">
                <div className="w-16 h-16 rounded-full bg-muted/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Ready to start?</h3>
                <p className="text-sm text-muted-foreground max-w-[250px] mx-auto mt-1 mb-6">Enroll in a course to start your learning journey and earn certificates.</p>
                <Link to="/explore">
                  <Button variant="gold" className="rounded-xl px-8 font-bold h-11">Explore Catalog</Button>
                </Link>
              </Card>
            </motion.div>
          )}

          {/* Quick Stats / Recent Achievement */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-border/50 bg-card h-full overflow-hidden">
              <CardHeader className="pb-2 border-b border-border/50 bg-muted/5">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-gold" />
                  Recent Milestone
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center p-2 shrink-0">
                      <Star className="w-full h-full text-gold fill-current" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gold uppercase tracking-wider mb-0.5">Knowledge Hunter</p>
                      <h4 className="text-sm font-bold text-foreground leading-snug">Completed {totalCompleted} lessons this month</h4>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-xl space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted-foreground">
                      <span>Monthly Goal</span>
                      <span>{Math.min(100, (totalCompleted / 20) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={(totalCompleted / 20) * 100} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground italic text-center">Master 20 lessons to unlock the "Scholar" badge</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">{enrolledCourses.length}</p>
                  <p className="text-xs text-card-foreground/60">Enrolled Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">{totalCompleted}</p>
                  <p className="text-xs text-card-foreground/60">Lessons Complete</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">{totalCompleted * 15}m</p>
                  <p className="text-xs text-card-foreground/60">Est. Learning Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-gold/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-gold fill-current" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">{me?.xp || 0}</p>
                  <p className="text-xs text-card-foreground/60">Total XP Points</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Award className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">{me?.badges?.length || 0}</p>
                  <p className="text-xs text-card-foreground/60">Achievements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Available Courses (All Admins) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent" />
                Available Courses
              </CardTitle>
              <Link to="/explore">
                <Button variant="ghost" size="sm" className="text-accent hover:bg-accent/5">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {allCoursesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-muted rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : allCourses.length === 0 ? (
                <div className="text-center py-6 border border-dashed rounded-lg">
                  <p className="text-xs text-muted-foreground">No courses available yet</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {allCourses.map((course: any) => {
                      const isEnrolled = enrolledCourses.some(
                        (e: any) => (e.id || e._id) === (course.id || course._id)
                      );
                      return (
                        <Link
                          key={course.id || course._id}
                          to={
                            isEnrolled
                              ? `/portal/student/courses/${course.id || course._id}`
                              : course.enrollmentMode === 'application'
                                ? '#'
                                : `/courses/${course.id || course._id}`
                          }
                          onClick={(e) => {
                            if (course.enrollmentMode === 'application' && !isEnrolled) {
                              e.preventDefault();
                              setSelectedCourse(course);
                            }
                          }}
                          className="group block p-3 bg-background/50 rounded-xl border border-border/30 hover:border-accent/30 hover:bg-accent/5 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                              <BookOpen className="w-5 h-5 text-accent" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                                {course.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {course.price > 0 ? (
                                  <span className="text-[10px] font-bold text-accent">
                                    {course.price?.toLocaleString()} {course.currency || 'RWF'}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-green-500">Free</span>
                                )}
                                {isEnrolled && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 font-bold">
                                    Enrolled
                                  </span>
                                )}
                                <span className="text-[10px] text-muted-foreground capitalize">{course.level}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Pagination Controls */}
                  {allCoursesPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Rows per page:</span>
                        <Select value={String(coursePerPage)} onValueChange={handleCoursePerPageChange}>
                          <SelectTrigger className="w-16 h-8 text-xs rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[6, 9, 12, 18].map(n => (
                              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="ml-2">
                          {((coursePage - 1) * coursePerPage) + 1}–{Math.min(coursePage * coursePerPage, allCoursesPagination.totalCount)} of {allCoursesPagination.totalCount}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCoursePageChange(1)}
                          disabled={!allCoursesPagination.hasPreviousPage}
                          className="p-1.5 rounded-lg hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <ChevronsLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCoursePageChange(coursePage - 1)}
                          disabled={!allCoursesPagination.hasPreviousPage}
                          className="p-1.5 rounded-lg hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1 mx-2">
                          {(() => {
                            const current = coursePage;
                            const total = allCoursesPagination.totalPages;
                            const pages: (number | string)[] = [];
                            if (total <= 7) {
                              for (let i = 1; i <= total; i++) pages.push(i);
                            } else {
                              pages.push(1);
                              if (current > 3) pages.push('...');
                              for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
                              if (current < total - 2) pages.push('...');
                              pages.push(total);
                            }
                            return pages.map((p, i) =>
                              p === '...' ? (
                                <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">...</span>
                              ) : (
                                <button
                                  key={p}
                                  onClick={() => handleCoursePageChange(p as number)}
                                  className={`min-w-[28px] h-7 text-xs font-semibold rounded-lg transition ${
                                    p === current
                                      ? 'bg-accent text-accent-foreground shadow-sm'
                                      : 'hover:bg-accent/10 text-muted-foreground'
                                  }`}
                                >
                                  {p}
                                </button>
                              )
                            );
                          })()}
                        </div>
                        <button
                          onClick={() => handleCoursePageChange(coursePage + 1)}
                          disabled={!allCoursesPagination.hasNextPage}
                          className="p-1.5 rounded-lg hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCoursePageChange(allCoursesPagination.totalPages)}
                          disabled={!allCoursesPagination.hasNextPage}
                          className="p-1.5 rounded-lg hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <ChevronsRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Available Internships (All Admins) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-accent" />
                Available Internships
              </CardTitle>
              <Link to="/internships">
                <Button variant="ghost" size="sm" className="text-accent hover:bg-accent/5">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {allInternshipsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-muted rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : allInternships.length === 0 ? (
                <div className="text-center py-6 border border-dashed rounded-lg">
                  <p className="text-xs text-muted-foreground">No internships available yet</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {allInternships.map((intern: any) => {
                      const alreadyApplied = myInternApplications.some(
                        (app: any) => app.internshipProgram?.id === (intern.id || intern._id)
                      );
                      return (
                        <div
                          key={intern.id || intern._id}
                          className="group block p-3 bg-background/50 rounded-xl border border-border/30 hover:border-accent/30 hover:bg-accent/5 transition-all cursor-pointer"
                          onClick={() =>
                            alreadyApplied
                              ? null
                              : setSelectedInternshipId(intern.id || intern._id)
                          }
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                              <Briefcase className="w-5 h-5 text-accent" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                                {intern.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-muted-foreground">{intern.duration}</span>
                                {intern.price > 0 ? (
                                  <span className="text-[10px] font-bold text-accent">
                                    {intern.price?.toLocaleString()} {intern.currency || 'RWF'}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-green-500">Free</span>
                                )}
                                {alreadyApplied && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold">
                                    Applied
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination Controls */}
                  {allInternshipsPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Rows per page:</span>
                        <Select value={String(internshipPerPage)} onValueChange={handleInternshipPerPageChange}>
                          <SelectTrigger className="w-16 h-8 text-xs rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[6, 9, 12, 18].map(n => (
                              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="ml-2">
                          {((internshipPage - 1) * internshipPerPage) + 1}–{Math.min(internshipPage * internshipPerPage, allInternshipsPagination.totalCount)} of {allInternshipsPagination.totalCount}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleInternshipPageChange(1)}
                          disabled={!allInternshipsPagination.hasPreviousPage}
                          className="p-1.5 rounded-lg hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <ChevronsLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleInternshipPageChange(internshipPage - 1)}
                          disabled={!allInternshipsPagination.hasPreviousPage}
                          className="p-1.5 rounded-lg hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1 mx-2">
                          {(() => {
                            const current = internshipPage;
                            const total = allInternshipsPagination.totalPages;
                            const pages: (number | string)[] = [];
                            if (total <= 7) {
                              for (let i = 1; i <= total; i++) pages.push(i);
                            } else {
                              pages.push(1);
                              if (current > 3) pages.push('...');
                              for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
                              if (current < total - 2) pages.push('...');
                              pages.push(total);
                            }
                            return pages.map((p, i) =>
                              p === '...' ? (
                                <span key={`iellipsis-${i}`} className="px-1 text-xs text-muted-foreground">...</span>
                              ) : (
                                <button
                                  key={p}
                                  onClick={() => handleInternshipPageChange(p as number)}
                                  className={`min-w-[28px] h-7 text-xs font-semibold rounded-lg transition ${
                                    p === current
                                      ? 'bg-accent text-accent-foreground shadow-sm'
                                      : 'hover:bg-accent/10 text-muted-foreground'
                                  }`}
                                >
                                  {p}
                                </button>
                              )
                            );
                          })()}
                        </div>
                        <button
                          onClick={() => handleInternshipPageChange(internshipPage + 1)}
                          disabled={!allInternshipsPagination.hasNextPage}
                          className="p-1.5 rounded-lg hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleInternshipPageChange(allInternshipsPagination.totalPages)}
                          disabled={!allInternshipsPagination.hasNextPage}
                          className="p-1.5 rounded-lg hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <ChevronsRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Enrolled Courses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-heading">Continue Learning</CardTitle>
                <Link to="/portal/student/courses">
                  <Button variant="ghost" size="sm" className="text-accent hover:bg-accent/5">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                {enrolledCourses.length === 0 && myApplications.length === 0 && (
                  <div className="text-center py-6 sm:py-8">
                    <p className="text-muted-foreground mb-4 text-sm sm:text-base">You haven't enrolled in any courses or applied yet.</p>
                    <Link to="/explore">
                      <Button variant="gold" size="sm">Browse Courses</Button>
                    </Link>
                  </div>
                )}

                {/* Enrolled Courses */}
                {enrolledCourses.map((course: any, index: number) => {
                  const courseId = course.id || course._id;
                  const totalLessons = course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
                  const progress = getCourseProgress(course);
                  const lastCompletedLesson = completedLessons.filter((l: any) => l.courseId === courseId).pop();

                  return (
                    <div
                      key={courseId || index}
                      className="p-4 bg-background/50 rounded-lg border border-border/30 hover:border-accent/30 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-heading font-semibold text-card-foreground">
                            {course.title}
                          </h3>
                          <p className="text-sm text-card-foreground/60 mt-0.5">
                            {lastCompletedLesson ? "Continue where you left off" : "Start your first lesson"}
                          </p>
                        </div>
                        <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full font-bold">
                          {progress}% COMPLETE
                        </span>
                      </div>
                      <Progress value={progress} className="h-2 mb-3" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-card-foreground/60">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {totalLessons} lessons
                          </span>
                        </div>
                        <Link to={`/portal/student/courses/${course.id || course._id}`}>
                          <Button variant="gold" size="sm" className="rounded-xl h-8 px-4 font-bold">
                            <PlayCircle className="w-4 h-4 mr-1" />
                            Continue
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {/* Applications (Pending/Rejected) */}
                {myApplications.filter((app: any) => app.status !== 'approved').map((app: any) => (
                  <div
                    key={app.id}
                    onClick={() => setSelectedCourse({ id: app.courseId, title: app.course?.title || "Course" })}
                    className="p-4 bg-background/50 rounded-lg border border-dashed border-border/50 hover:border-accent/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className={`w-3.5 h-3.5 ${app.status === 'pending' ? 'text-amber-500' : 'text-red-500'}`} />
                          <h3 className="font-heading font-semibold text-card-foreground text-sm line-clamp-1">
                            {app.course?.title || "Course Application"}
                          </h3>
                        </div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold">
                          Application Status: <span className={`ml-1 ${app.status === 'pending' ? 'text-amber-500' : 'text-red-500'
                            }`}>{app.status}</span>
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full group-hover:bg-accent/10">
                        <Info className="w-4 h-4 text-accent" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* In-Progress Projects */}
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-heading">Active Projects</CardTitle>
                <Link to="/portal/student/projects">
                  <Button variant="ghost" size="sm" className="text-accent">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                {projects.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground italic">No projects assigned yet.</p>
                  </div>
                )}
                {projects.filter((p: any) => p.status !== 'completed').map((project: any) => (
                  <div
                    key={project.id}
                    className="p-4 bg-background/50 rounded-lg border border-border/30 hover:border-accent/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-heading font-semibold text-card-foreground text-sm">
                        {project.title}
                      </h3>
                      <Badge variant="outline" className="text-[10px] uppercase bg-accent/10 border-accent/20 text-accent">
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{project.course}</p>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground">Progress</span>
                      <span className="text-[10px] font-bold text-accent">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Assigned Project Tasks from ProjectTask collection */}
            {(myTasksData as any)?.myProjectTasks?.length > 0 && (() => {
              const myTasks = (myTasksData as any).myProjectTasks || [];

              return (
                <Card className="border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-lg font-heading">Assigned Project Tasks</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tasks assigned to you across your projects
                      </p>
                    </div>
                    <Link to="/portal/student/my-tasks">
                      <Button variant="ghost" size="sm" className="text-accent">
                        Open Board <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {myTasks.slice(0, 5).map((task: any) => (
                        <div key={task.id} className="flex items-center justify-between gap-2 p-3 bg-background/50 rounded-lg border border-border/50">
                          <div className="flex items-center gap-2">
                            <CheckCircle className={`w-4 h-4 ${task.status === 'done' ? 'text-accent' : 'text-card-foreground/30'}`} />
                            <div>
                              <p className={`text-sm ${task.status === 'done' ? 'text-muted-foreground line-through' : 'text-card-foreground'}`}>
                                {task.title}
                              </p>
                              {task.project && (
                                <p className="text-[10px] text-muted-foreground">{task.project.title}</p>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${
                            task.status === 'done' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                            task.status === 'in_progress' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            task.status === 'in_review' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                            'bg-accent/10 text-accent border-accent/20'
                          }`}>
                            {task.status === 'done' ? 'Done' :
                             task.status === 'in_progress' ? 'In Progress' :
                             task.status === 'in_review' ? 'In Review' :
                             task.status === 'blocked' ? 'Blocked' :
                             'To Do'}
                          </Badge>
                        </div>
                      ))}
                      {myTasks.length > 5 && (
                        <p className="text-[10px] text-muted-foreground">Showing first 5 tasks. Visit My Tasks for the full list.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </motion.div>

          {/* Sidebar Content */}
          <div className="space-y-6">
            {/* Upcoming Sessions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-heading flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-accent" />
                    My Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {bookings.length === 0 ? (
                    <div className="text-center py-6 border border-dashed rounded-lg">
                      <p className="text-xs text-muted-foreground">No upcoming sessions</p>
                    </div>
                  ) : (
                    bookings.map((booking: any) => (
                      <div
                        key={booking.id}
                        className="p-3 bg-background/50 rounded-lg border border-border/30"
                      >
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-sm text-card-foreground capitalize">{booking.type.replace('-', ' ')}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                            booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-xs text-card-foreground/60 mt-1 truncate">{booking.topic || "No topic specified"}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-accent">{booking.date} at {booking.time}</span>
                          {booking.meetingLink && (
                            <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer">
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-accent">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Conversations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="border-border/50">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-heading flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-accent" />
                    Recent Chats
                  </CardTitle>
                  <Link to="/chat">
                    <Button variant="ghost" size="sm" className="text-accent h-7 px-2">
                      View All
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!(conversationsData as any)?.conversations?.length ? (
                    <div className="text-center py-6 border border-dashed rounded-lg">
                      <p className="text-xs text-muted-foreground">No recent messages</p>
                    </div>
                  ) : (
                    ((conversationsData as any).conversations as any[]).slice(0, 3).map((conv: any) => {
                      const otherParticipant = conv.participants.find((p: any) => p.id !== user?.id);
                      return (
                        <Link to="/chat" key={conv.id}>
                          <div className="p-2 transition-colors hover:bg-accent/5 rounded-lg border border-transparent hover:border-accent/10">
                            <div className="flex justify-between items-start">
                              <p className="font-medium text-xs text-card-foreground">{otherParticipant?.username || 'Chat'}</p>
                              <span className="text-[10px] text-muted-foreground">
                                {conv.lastMessage ? new Date(parseInt(conv.lastMessage.createdAt)).toLocaleDateString() : ''}
                              </span>
                            </div>
                            <p className="text-[10px] text-card-foreground/60 mt-0.5 line-clamp-1">
                              {conv.lastMessage?.content || 'No messages yet'}
                            </p>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* My Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-heading flex items-center gap-2">
                    <Award className="w-5 h-5 text-accent" />
                    My Badges
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {me?.badges?.length === 0 ? (
                    <div className="text-center py-6 border border-dashed rounded-lg">
                      <p className="text-xs text-muted-foreground">Keep learning to earn badges!</p>
                    </div>
                  ) : (
                    me?.badges?.filter((ub: any) => ub && ub.badge).map((ub: any, index: number) => (
                      <div
                        key={ub.badge.id}
                        className="flex items-center gap-3 p-2 bg-background/30 rounded-lg"
                      >
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                          <Award className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-card-foreground">{ub.badge.title}</p>
                          <p className="text-[10px] text-card-foreground/60">{new Date(parseInt(ub.awardedAt)).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Billing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Card className="border-border/50">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-heading flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-accent" />
                    Billing
                  </CardTitle>
                  <Link to="/portal/student/billing">
                    <Button variant="ghost" size="sm" className="text-accent h-7 px-2">
                      History
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-3">
                  {payments.length === 0 ? (
                    <div className="text-center py-6 border border-dashed rounded-lg">
                      <p className="text-xs text-muted-foreground">No recent transactions</p>
                    </div>
                  ) : (
                    payments.slice(0, 2).map((p: any) => (
                      <div key={p.id} className="flex justify-between items-center p-2 bg-accent/5 rounded-lg border border-accent/10">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold truncate">{p.itemTitle}</p>
                          <p className="text-[8px] text-muted-foreground">{new Date(p.date).toLocaleDateString()}</p>
                        </div>
                        <p className="text-[10px] font-black">{p.amount.toLocaleString()} {p.currency}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Internship Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-border/50 bg-gradient-to-br from-card to-accent/5 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading font-semibold text-card-foreground text-sm truncate">
                        {myInternApplications.length > 0 ? "Internship Application" : "Internship Ready"}
                      </p>
                      <p className="text-[10px] text-card-foreground/60">
                        {myInternApplications.length > 0 ? "Track your placement status" : "Complete 80% to unlock"}
                      </p>
                    </div>
                  </div>

                  {myInternApplications.length > 0 ? (
                    <div className="space-y-3">
                      {myInternApplications.slice(0, 1).map((app: any) => (
                        <div key={app.id} className="p-2.5 bg-background/40 rounded-lg border border-accent/10">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-card-foreground/70 truncate">
                              {app.internshipProgram?.title || "Internship"}
                            </span>
                            <Badge variant="outline" className={`text-[9px] h-4 px-1.5 uppercase ${app.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                              app.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                'bg-red-500/10 text-red-500 border-red-500/20'
                              }`}>
                              {app.status}
                            </Badge>
                          </div>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-[10px] text-accent font-bold"
                            onClick={() => setSelectedInternshipId(app.internshipProgram?.id)}
                          >
                            View Details <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <Progress value={Math.min(totalCompleted * 5, 100)} className="h-2 mb-2" />
                      <p className="text-[10px] text-card-foreground/70">
                        {Math.max(0, 80 - totalCompleted * 5)}% more to qualify for internship placement
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      <ApplyCourseDialog
        open={!!selectedCourse}
        onOpenChange={(open) => !open && setSelectedCourse(null)}
        course={selectedCourse}
        onSuccess={() => refetchApps()}
      />

      {selectedInternshipId && (
        <ApplyInternshipDialog
          open={!!selectedInternshipId}
          onOpenChange={(open) => !open && setSelectedInternshipId(null)}
          internshipProgramId={selectedInternshipId}
          onSuccess={() => refetchInternApps()}
        />
      )}
    </PortalLayout>
  );
}
