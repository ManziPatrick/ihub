import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@apollo/client/react";
import { GET_USER_FULL_REPORT } from "@/lib/graphql/queries";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  GraduationCap,
  BookOpen,
  Briefcase,
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  FileText,
  BarChart3,
  Star,
  Medal,
  Zap,
  Flame,
  MapPin,
  Phone,
  User,
  CalendarDays,
  Activity,
  Loader2,
  Printer,
} from "lucide-react";

/* ─── Helper ─── */
function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  } catch { return "—"; }
}

function timeAgo(d: string | null | undefined): string {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getInitials(name: string) {
  return (name || "U").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

/* ─── Report Section Components ─── */

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color || "bg-accent/10"}`}>
          <Icon className={`w-5 h-5 ${color ? "text-white" : "text-accent"}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-black text-foreground">{value}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold truncate">
            {label}
          </p>
          {sub && <p className="text-[10px] text-muted-foreground/60">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function CourseCard({ course }: { course: any }) {
  const progressColor = course.overallProgress >= 80 ? "bg-green-500" :
    course.overallProgress >= 40 ? "bg-accent" : "bg-orange-500";
  const statusBadge = course.status === "completed"
    ? "bg-green-500/20 text-green-500 border-green-500/30"
    : course.status === "in_progress"
    ? "bg-blue-500/20 text-blue-500 border-blue-500/30"
    : "bg-muted text-muted-foreground";

  return (
    <Card className="border-border/50 overflow-hidden hover:border-accent/30 transition-all">
      <CardContent className="p-0">
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-foreground truncate">{course.courseTitle}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className={`text-[9px] font-black uppercase ${statusBadge}`}>
                    {course.status === "completed" ? "Completed" : course.status === "in_progress" ? "Active" : course.status}
                  </Badge>
                  {course.courseLevel && (
                    <span className="text-[10px] text-muted-foreground">{course.courseLevel}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Progress value={course.overallProgress} className="h-2" />

          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-black text-foreground">{course.completedLessons}/{course.totalLessons}</p>
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Lessons</p>
            </div>
            <div>
              <p className="text-lg font-black text-foreground">{course.averageGrade ?? "—"}</p>
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Avg Grade</p>
            </div>
            <div>
              <p className="text-lg font-black text-foreground">{course.submissionsCount}</p>
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Submissions</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InternshipCard({ internship }: { internship: any }) {
  const statusColor = internship.status === "completed" ? "bg-green-500/20 text-green-500" :
    internship.status === "active" || internship.status === "in_progress" ? "bg-blue-500/20 text-blue-500" :
    "bg-muted text-muted-foreground";

  const avgSprintGrade = internship.sprintReviews?.length > 0
    ? Math.round(internship.sprintReviews.reduce((s: number, r: any) => s + (r.grade || 0), 0) / internship.sprintReviews.length)
    : null;

  return (
    <Card className="border-border/50 overflow-hidden hover:border-accent/30 transition-all">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5 text-purple-500" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-foreground truncate">{internship.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {internship.organization}{internship.cohort ? ` · Cohort ${internship.cohort}` : ""}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={`text-[9px] font-black uppercase ${statusColor}`}>
            {internship.status?.replace("_", " ")}
          </Badge>
        </div>

        {internship.progress > 0 && (
          <Progress value={internship.progress} className="h-2" />
        )}

        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-black text-foreground">{internship.currentStage || "—"}</p>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Stage</p>
          </div>
          <div>
            <p className="text-lg font-black text-foreground">{avgSprintGrade ?? "—"}</p>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Sprint Avg</p>
          </div>
          <div>
            <p className="text-lg font-black text-foreground">{internship.sprintReviews?.length || 0}</p>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Reviews</p>
          </div>
        </div>

        {internship.mentor && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border/30">
            <User className="w-3 h-3" />
            Mentor: {internship.mentor.fullName || internship.mentor.username}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProjectCard({ project }: { project: any }) {
  const statusColor = project.status === "completed" ? "bg-green-500/20 text-green-500" :
    project.status === "in_progress" || project.status === "active" ? "bg-blue-500/20 text-blue-500" :
    "bg-amber-500/20 text-amber-500";

  return (
    <Card className="border-border/50 overflow-hidden hover:border-accent/30 transition-all">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-foreground truncate">{project.title}</p>
              <p className="text-xs text-muted-foreground truncate">{project.course}</p>
            </div>
          </div>
          <Badge variant="outline" className={`text-[9px] font-black uppercase ${statusColor}`}>
            {project.status?.replace("_", " ")}
          </Badge>
        </div>

        <Progress value={project.progress} className="h-2" />

        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-black text-foreground">{project.grade || "—"}</p>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Grade</p>
          </div>
          <div>
            <p className="text-lg font-black text-foreground">{project.tasks?.filter((t: any) => t.completed).length || 0}/{project.tasks?.length || 0}</p>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Tasks</p>
          </div>
          <div>
            <p className="text-lg font-black text-foreground">{formatDate(project.deadline)}</p>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Deadline</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Page ─── */

export default function UserReportPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(GET_USER_FULL_REPORT, {
    variables: { userId },
    skip: !userId,
    fetchPolicy: "network-only",
  });

  const report = useMemo(() => (data as any)?.getUserFullReport, [data]);

  /* ── Export / Print ── */
  const handlePrintReport = () => {
    window.print();
  };

  const handleExportJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user_report_${report.user.username}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground animate-pulse">Loading comprehensive user report...</p>
          </div>
        </div>
      </PortalLayout>
    );
  }

  /* ── Error ── */
  if (error || !report) {
    const isAuthError = error?.message?.toLowerCase().includes("authorized") || error?.message?.toLowerCase().includes("authentication");
    const isNotFound = error?.message?.toLowerCase().includes("not found");
    const errAny = error as any;
    const isNetworkError = errAny?.message?.toLowerCase().includes("network") || !errAny?.graphQLErrors?.length;
    const errorTitle = isAuthError ? "Access Denied" : isNotFound ? "User Not Found" : isNetworkError ? "Network Error" : "Failed to Load Report";
    const errorDesc = isAuthError
      ? "You don't have permission to view this report. Only admin and super admin roles can access it."
      : isNotFound
      ? error?.message || "The requested user could not be found."
      : isNetworkError
      ? "Unable to reach the server. Check your connection and try again."
      : error?.message || "An unexpected error occurred.";

    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4 text-center max-w-md">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              isAuthError ? "bg-red-500/10" : isNotFound ? "bg-amber-500/10" : "bg-muted"
            }`}>
              <AlertCircle className={`w-10 h-10 ${
                isAuthError ? "text-red-500" : isNotFound ? "text-amber-500" : "text-destructive"
              }`} />
            </div>
            <p className="text-lg font-semibold text-foreground">{errorTitle}</p>
            <p className="text-sm text-muted-foreground max-w-sm">{errorDesc}</p>
            <div className="flex items-center gap-3 mt-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
              </Button>
            </div>
          </div>
        </div>
      </PortalLayout>
    );
  }

  const { user, stats, courses, submissions, grades, projects, internships } = report;

  return (
    <PortalLayout>
      <div className="space-y-5 print:space-y-4">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-start gap-4 print:flex-row"
        >
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="print:hidden shrink-0">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          <div className="flex-1">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-accent/30">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-accent/20 text-accent text-lg font-bold">
                  {getInitials(user.fullName || user.username)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">
                    {user.fullName || user.username}
                  </h1>
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-accent/10 text-accent border-accent/30">
                    {user.role?.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                  {user.title && <span className="flex items-center gap-1"><Star className="w-3 h-3" />{user.title}</span>}
                  {user.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{user.location}</span>}
                  {user.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{user.phone}</span>}
                  <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />Joined {formatDate(user.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <Download className="w-4 h-4 mr-2" /> Export JSON
            </Button>
            <Button variant="gold" size="sm" onClick={handlePrintReport}>
              <Printer className="w-4 h-4 mr-2" /> Print Report
            </Button>
          </div>
        </motion.div>

        {/* ── Stats Grid ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          <StatCard icon={GraduationCap} label="Courses" value={stats.totalCourses} sub={`${stats.totalCoursesCompleted} completed`} color="bg-accent/10" />
          <StatCard icon={Star} label="Avg Grade" value={stats.averageGrade ?? "—"} sub={`${stats.totalGrades} graded`} color="bg-amber-500/10" />
          <StatCard icon={BookOpen} label="Lessons Done" value={stats.totalLessonsCompleted} sub={`${stats.courseCompletionRate}% rate`} color="bg-blue-500/10" />
          <StatCard icon={Briefcase} label="Internships" value={stats.totalInternships} sub={`${stats.activeInternships} active`} color="bg-purple-500/10" />
          <StatCard icon={FileText} label="Projects" value={stats.totalProjects} sub={`${stats.completedProjects} done`} color="bg-green-500/10" />
          <StatCard icon={Activity} label="Submissions" value={stats.totalSubmissions} sub={`${stats.passedSubmissions} passed`} color="bg-rose-500/10" />
        </motion.div>

        {/* ── XP / Level / Streak ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="flex flex-wrap gap-3"
        >
          {user.level != null && (
            <Card className="border-border/50 bg-gradient-to-br from-accent/10 to-transparent">
              <CardContent className="p-3 flex items-center gap-2">
                <Medal className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm font-bold text-foreground">Level {user.level}</p>
                  <p className="text-[9px] text-muted-foreground">Experience Level</p>
                </div>
              </CardContent>
            </Card>
          )}
          {user.xp != null && (
            <Card className="border-border/50 bg-gradient-to-br from-amber-500/10 to-transparent">
              <CardContent className="p-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-sm font-bold text-foreground">{user.xp.toLocaleString()} XP</p>
                  <p className="text-[9px] text-muted-foreground">Experience Points</p>
                </div>
              </CardContent>
            </Card>
          )}
          {user.streak != null && user.streak > 0 && (
            <Card className="border-border/50 bg-gradient-to-br from-orange-500/10 to-transparent">
              <CardContent className="p-3 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm font-bold text-foreground">{user.streak} day streak</p>
                  <p className="text-[9px] text-muted-foreground">Current Streak</p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* ── Tabs ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="courses" className="w-full">
            <TabsList className="mb-4 border-border/50 bg-card flex-wrap h-auto">
              <TabsTrigger value="courses" className="text-xs data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <BookOpen className="w-4 h-4 mr-2" /> Courses ({courses.length})
              </TabsTrigger>
              <TabsTrigger value="internships" className="text-xs data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <Briefcase className="w-4 h-4 mr-2" /> Internships ({internships.length})
              </TabsTrigger>
              <TabsTrigger value="projects" className="text-xs data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <FileText className="w-4 h-4 mr-2" /> Projects ({projects.length})
              </TabsTrigger>
              <TabsTrigger value="grades" className="text-xs data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <BarChart3 className="w-4 h-4 mr-2" /> Grades ({grades.length})
              </TabsTrigger>
              <TabsTrigger value="submissions" className="text-xs data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <Activity className="w-4 h-4 mr-2" /> Submissions ({submissions.length})
              </TabsTrigger>
              <TabsTrigger value="certificates" className="text-xs data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <Award className="w-4 h-4 mr-2" /> Certificates ({report.certificates?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* ── Courses Tab ── */}
            <TabsContent value="courses" className="mt-0">
              {courses.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="p-12 text-center">
                    <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No courses enrolled</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((course: any) => (
                    <CourseCard key={course.courseId} course={course} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Internships Tab ── */}
            <TabsContent value="internships" className="mt-0">
              {internships.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="p-12 text-center">
                    <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No internships</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {internships.map((internship: any) => (
                    <InternshipCard key={internship.id} internship={internship} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Projects Tab ── */}
            <TabsContent value="projects" className="mt-0">
              {projects.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="p-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No projects</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {projects.map((project: any) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Grades Tab ── */}
            <TabsContent value="grades" className="mt-0">
              {grades.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="p-12 text-center">
                    <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No grades recorded yet</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/50 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/50 bg-muted/20">
                          <th className="text-left p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lesson</th>
                          <th className="text-center p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Score</th>
                          <th className="text-center p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                          <th className="text-right p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grades.map((g: any, idx: number) => (
                          <tr key={idx} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                            <td className="p-3">
                              <p className="text-sm font-medium text-foreground">{g.lessonTitle || "Assessment"}</p>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`text-lg font-black ${g.score >= 70 ? "text-green-500" : g.score >= 50 ? "text-amber-500" : "text-red-500"}`}>
                                {g.score}
                              </span>
                              <span className="text-xs text-muted-foreground">/100</span>
                            </td>
                            <td className="p-3 text-center">
                              {g.score >= 70 ? (
                                <Badge className="bg-green-500/20 text-green-500 text-[9px] font-black">PASSED</Badge>
                              ) : (
                                <Badge className="bg-amber-500/20 text-amber-500 text-[9px] font-black">REVISION</Badge>
                              )}
                            </td>
                            <td className="p-3 text-right text-xs text-muted-foreground">
                              {formatDate(g.gradedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* ── Certificates Tab ── */}
            <TabsContent value="certificates" className="mt-0">
              {!report.certificates || report.certificates.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="p-12 text-center">
                    <Award className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No certificates yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {report.certificates.map((cert: any) => {
                    const isIssued = cert.status === "issued";
                    return (
                      <Card key={cert.id} className={`border-border/50 overflow-hidden hover:border-accent/30 transition-all ${isIssued ? "ring-1 ring-accent/20" : ""}`}>
                        <div className={`h-20 ${isIssued ? "bg-gradient-to-r from-accent/20 to-accent/5" : "bg-muted/30"} flex items-center justify-center relative`}>
                          <Award className={`w-10 h-10 ${isIssued ? "text-accent" : "text-muted-foreground/30"}`} />
                          {isIssued && (
                            <Badge className="absolute top-2 right-2 bg-green-500/20 text-green-500 border-green-500/30 text-[9px] font-black">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Issued
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-4 space-y-3">
                          <h3 className="font-bold text-sm text-foreground">{cert.courseTitle}</h3>

                          {!isIssued && cert.progress != null && (
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-bold">{cert.progress}%</span>
                              </div>
                              <Progress value={cert.progress} className="h-2" />
                            </div>
                          )}

                          {cert.requirements?.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Requirements</p>
                              {cert.requirements.map((req: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2">
                                  {req.completed ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                                  )}
                                  <span className="text-xs text-muted-foreground">{req.title}</span>
                                  {req.current != null && (
                                    <span className="text-[10px] text-muted-foreground/50 ml-auto">
                                      {req.current}/{req.total}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {cert.issueDate && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border/30">
                              <CalendarDays className="w-3.5 h-3.5" />
                              Issued: {formatDate(cert.issueDate)}
                            </div>
                          )}

                          {cert.credentialId && (
                            <p className="text-[10px] text-muted-foreground/50">
                              Credential ID: {cert.credentialId}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* ── Submissions Tab ── */}
            <TabsContent value="submissions" className="mt-0">
              {submissions.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="p-12 text-center">
                    <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No submissions yet</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/50 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/50 bg-muted/20">
                          <th className="text-left p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Course</th>
                          <th className="text-center p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                          <th className="text-center p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Grade</th>
                          <th className="text-right p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.map((s: any, idx: number) => (
                          <tr key={idx} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                            <td className="p-3">
                              <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{s.courseTitle}</p>
                              <p className="text-[10px] text-muted-foreground">Lesson: {s.lessonId}</p>
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant="outline" className={`text-[9px] font-black uppercase ${
                                s.status === "approved" ? "bg-green-500/20 text-green-500 border-green-500/30" :
                                s.status === "reviewed" ? "bg-blue-500/20 text-blue-500 border-blue-500/30" :
                                s.status === "pending" ? "bg-amber-500/20 text-amber-500 border-amber-500/30" :
                                "bg-muted text-muted-foreground"
                              }`}>
                                {s.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-center">
                              <span className="font-bold text-foreground">{s.grade ?? s.totalScore ?? "—"}</span>
                            </td>
                            <td className="p-3 text-right text-xs text-muted-foreground">
                              {formatDate(s.submittedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </PortalLayout>
  );
}
