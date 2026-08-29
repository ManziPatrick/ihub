import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Users,
  DollarSign,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  TrendingUp,
  HelpCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Star,
  ArrowUpDown,
  Lock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ViewCourseDialog, EditCourseDialog, DeleteConfirmDialog } from "@/components/portal/dialogs";
import { QuestionManagerDialog } from "@/components/portal/QuestionManagerDialog";
import { ExportDataDialog } from "@/components/portal/ExportDataDialog";
import { toast } from "sonner";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useQuery, useMutation, useLazyQuery } from "@apollo/client/react";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { GET_COURSES_LITE_SUMMARY, GET_STATS, GET_USERS, GET_COURSE, GET_ADMIN_DASHBOARD_DATA } from "@/lib/graphql/queries";
import { UPDATE_COURSE, DELETE_COURSE, RESTORE_COURSE, TOGGLE_SEQUENTIAL_LOCK } from "@/lib/graphql/mutations";
import { Switch } from "@/components/ui/switch";

export default function AdminCourses() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"course" | "instructor" | "students">("course");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialog states
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [viewCourse, setViewCourse] = useState<any | null>(null);
  const [editCourse, setEditCourse] = useState<any | null>(null);
  const [deleteCourse, setDeleteCourse] = useState<any | null>(null);
  const [editPricingCourse, setEditPricingCourse] = useState<any | null>(null);
  const [manageQuestionsCourse, setManageQuestionsCourse] = useState<any | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Queries & Mutations
  const { data, loading, refetch } = usePaginatedQuery(GET_COURSES_LITE_SUMMARY, {
    variables: { page: currentPage, limit: pageSize },
  });
  const [loadCourse, { data: fullCourseData, loading: courseLoading }] = useLazyQuery(GET_COURSE);
  const [updateCourseMutation, { loading: updateLoading }] = useMutation(UPDATE_COURSE, {
    refetchQueries: [{ query: GET_COURSES_LITE_SUMMARY }, { query: GET_STATS }, { query: GET_ADMIN_DASHBOARD_DATA }]
  });
  const [deleteCourseMutation] = useMutation(DELETE_COURSE, {
    refetchQueries: [{ query: GET_COURSES_LITE_SUMMARY }, { query: GET_STATS }, { query: GET_ADMIN_DASHBOARD_DATA }]
  });
  const [restoreCourseMutation] = useMutation(RESTORE_COURSE);
  const [toggleSequentialLockMutation] = useMutation(TOGGLE_SEQUENTIAL_LOCK, {
    refetchQueries: [{ query: GET_COURSES_LITE_SUMMARY }]
  });

  useEffect(() => {
    const fullData = fullCourseData as any;
    if (fullData?.course && editCourse?.id === fullData.course.id) {
      setEditCourse(fullData.course);
    }
  }, [fullCourseData, editCourse?.id]);

  const courses = (data as any)?.courses?.items || [];
  const pagination = (data as any)?.courses?.pagination || { totalPages: 0, totalCount: 0, hasPreviousPage: false, hasNextPage: false };

  const { data: usersData } = useQuery(GET_USERS);
  const trainers = (usersData as any)?.users?.items?.filter((u: any) =>
    u.role === 'trainer' || u.role === 'admin' || u.role === 'super_admin'
  ) || [];

  const { data: statsData, refetch: refetchStats } = useQuery(GET_STATS);
  const liveStats = (statsData as any)?.stats || { totalUsers: 0, totalCourses: 0, totalStudents: 0, totalRevenue: 0 };

  const handleDeleteCourse = async () => {
    if (!deleteCourse) return;
    const deletedId = deleteCourse.id;
    const deletedTitle = deleteCourse.title;
    try {
      await deleteCourseMutation({ variables: { id: deletedId } });
      window.dispatchEvent(new CustomEvent('bell-ring'));
      toast.success(`"${deletedTitle}" deleted`, {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await restoreCourseMutation({ variables: { id: deletedId } });
              toast.success("Course restored");
              refetch();
            } catch (err: any) {
              toast.error("Failed to restore course: " + err.message);
            }
          }
        },
        duration: 10000,
      });
      refetch();
      setDeleteCourse(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveCourse = async (updatedCourse: any) => {
    try {
      await updateCourseMutation({
        variables: {
          id: updatedCourse.id,
          title: updatedCourse.title,
          description: updatedCourse.description,
          price: Number(updatedCourse.price),
          discountPrice: Number(updatedCourse.discountPrice),
          level: updatedCourse.level,
          category: updatedCourse.category,
          instructorId: updatedCourse.instructorId,
          thumbnail: updatedCourse.thumbnail,
          status: updatedCourse.status,
          enrollmentMode: updatedCourse.enrollmentMode || 'direct',
          submissionRequired: updatedCourse.submissionRequired,
          sequentialLock: updatedCourse.sequentialLock,
          signerName: updatedCourse.signerName,
          signerSignature: updatedCourse.signerSignature,
          modules: updatedCourse.modules
        }
      });
      toast.success("Course updated successfully!");
      refetch();
      setEditCourse(null);
      setEditPricingCourse(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleQuizSaveOnly = async (updatedCourse: any) => {
    try {
      console.log("[AdminCourses] handleQuizSaveOnly triggered. Modules count:", updatedCourse.modules?.length);
      // Log quiz questions count for each lesson to verify they exist in the payload
      updatedCourse.modules?.forEach((m: any, mIdx: number) => {
        m.lessons?.forEach((l: any, lIdx: number) => {
          if (l.quizQuestions?.length > 0) {
            console.log(`[AdminCourses] Lesson "${l.title}" (M:${mIdx}, L:${lIdx}) has ${l.quizQuestions.length} quiz questions.`);
          }
        });
      });

      await updateCourseMutation({
        variables: {
          id: updatedCourse.id,
          title: updatedCourse.title,
          description: updatedCourse.description,
          price: Number(updatedCourse.price),
          discountPrice: Number(updatedCourse.discountPrice),
          level: updatedCourse.level,
          category: updatedCourse.category,
          instructorId: updatedCourse.instructorId,
          thumbnail: updatedCourse.thumbnail,
          status: updatedCourse.status,
          enrollmentMode: updatedCourse.enrollmentMode || 'direct',          submissionRequired: updatedCourse.submissionRequired,
          sequentialLock: updatedCourse.sequentialLock,
          signerName: updatedCourse.signerName,
          signerSignature: updatedCourse.signerSignature,
          modules: updatedCourse.modules
        }

        });
      toast.success("Quiz synced to course draft!");
      refetch();
    } catch (err: any) {
      console.error("[AdminCourses] Sync failed:", err);
      toast.error("Sync failed: " + err.message);
    }
  };

  const handleUpdateStatus = async (courseId: string, newStatus: string) => {
    try {
      await updateCourseMutation({ variables: { id: courseId, status: newStatus } });
      toast.success(`Course status updated to ${newStatus}`);
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEditClick = (course: any) => {
    setEditCourse(course);
    const toastId = toast.loading("Fetching latest curriculum...");
    loadCourse({ variables: { id: course.id } })
      .then(() => toast.dismiss(toastId))
      .catch((err) => {
        toast.error("Curriculum sync failed: " + err.message);
        toast.dismiss(toastId);
      });
  };

  const filteredCourses = (courses || [])
    .filter((course: any) =>
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a: any, b: any) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "instructor") {
        const nameA = (a.instructor?.username || "").toLowerCase();
        const nameB = (b.instructor?.username || "").toLowerCase();
        if (!nameA && !nameB) return 0;
        if (!nameA) return 1;
        if (!nameB) return -1;
        return nameA.localeCompare(nameB) * dir;
      }
      if (sortField === "students") {
        return ((b.studentsEnrolledCount || 0) - (a.studentsEnrolledCount || 0)) * dir;
      }
      return a.title.localeCompare(b.title) * dir;
    });

  const handleSortToggle = (field: "course" | "instructor" | "students") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "course" ? "asc" : "desc");
    }
    setCurrentPage(1);
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
              Course Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Create, manage, and configure courses — students enroll directly
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={async () => {
                setIsRefreshing(true);
                try {
                  await Promise.all([refetch(), refetchStats()]);
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
            <Button variant="outline" onClick={() => setShowExportDialog(true)}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="gold" onClick={() => navigate("/portal/admin/courses/create")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { icon: BookOpen, label: "Total Courses", value: liveStats.totalCourses },
            { icon: Users, label: "Total Students", value: liveStats.totalStudents },
            { icon: DollarSign, label: "Revenue (RWF)", value: (liveStats.totalRevenue || 0).toLocaleString() },
            { icon: TrendingUp, label: "Avg. Completion", value: "0%" },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-card-foreground">{value}</p>
                    <p className="text-xs text-card-foreground/60">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative max-w-md"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-10"
          />
        </motion.div>

        {/* Courses Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th
                          className="text-left p-4 text-sm font-medium text-card-foreground/70 cursor-pointer select-none hover:text-accent transition-colors"
                          onClick={() => handleSortToggle("course")}
                        >
                          <span className="inline-flex items-center gap-1">
                            Course {sortField === "course" && <ArrowUpDown className="w-3 h-3" />}
                          </span>
                        </th>
                        <th
                          className="text-left p-4 text-sm font-medium text-card-foreground/70 cursor-pointer select-none hover:text-accent transition-colors"
                          onClick={() => handleSortToggle("instructor")}
                        >
                          <span className="inline-flex items-center gap-1">
                            Created By {sortField === "instructor" && <ArrowUpDown className="w-3 h-3" />}
                          </span>
                        </th>
                        <th
                          className="text-center p-4 text-sm font-medium text-card-foreground/70 cursor-pointer select-none hover:text-accent transition-colors"
                          onClick={() => handleSortToggle("students")}
                        >
                          <span className="inline-flex items-center gap-1">
                            Students {sortField === "students" && <ArrowUpDown className="w-3 h-3" />}
                          </span>
                        </th>
                        <th className="text-center p-4 text-sm font-medium text-card-foreground/70">Price</th>
                        <th className="text-center p-4 text-sm font-medium text-card-foreground/70">Mode</th>
                        <th className="text-center p-4 text-sm font-medium text-card-foreground/70">Status</th>
                        <th className="text-center p-4 text-sm font-medium text-card-foreground/70">Featured</th>
                        <th className="text-center p-4 text-sm font-medium text-card-foreground/70">
                          <span className="flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3" /> Lock
                          </span>
                        </th>
                        <th className="text-right p-4 text-sm font-medium text-card-foreground/70">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCourses.length > 0 ? (
                        filteredCourses.map((course: any) => (
                          <tr key={course.id} className="border-b border-border/10 transition-colors group">
                            <td className="p-4">
                              <div>
                                <p className="font-bold group-hover:text-foreground dark:group-hover:text-white transition-colors">
                                  {course.title}
                                </p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">
                                  {course.totalLessonsCount || 0} units
                                </p>
                                {course.descriptionSnippet && (
                                  <p className="text-[10px] text-muted-foreground/60 leading-tight mt-1 line-clamp-2 border-l-2 border-accent/30 pl-2 italic" dangerouslySetInnerHTML={{ __html: course.descriptionSnippet }} />
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-sm text-card-foreground/70 group-hover:text-foreground dark:group-hover:text-white transition-colors">
                              {course.instructor?.username || <span className="text-destructive/60 italic">TBD</span>}
                            </td>
                            <td className="p-4 text-center">
                              <span className="text-sm font-bold">{course.studentsEnrolledCount || 0}</span>
                            </td>
                            <td className="p-4 text-center">
                              {course.price === 0 ? (
                                <Badge className="bg-green-500/10 text-green-500 border-green-500/20 font-black">Free</Badge>
                              ) : (
                                <div className="flex flex-col items-center">
                                  {course.discountPrice > 0 ? (
                                    <>
                                      <span className="text-[10px] text-card-foreground/40 line-through">{course.price.toLocaleString()}</span>
                                      <span className="text-sm text-accent font-black">{course.discountPrice.toLocaleString()} RWF</span>
                                    </>
                                  ) : (
                                    <span className="text-sm text-accent font-black">{course.price.toLocaleString()} RWF</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <Badge
                                className={cn(
                                  "text-[10px] font-black uppercase tracking-widest",
                                  course.enrollmentMode === 'application'
                                    ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                    : "bg-green-500/10 text-green-500 border-green-500/20"
                                )}
                              >
                                {course.enrollmentMode === 'application' ? 'Application' : 'Direct'}
                              </Badge>
                            </td>
                            <td className="p-4 text-center">
                              <Badge
                                className={cn(
                                  "text-[10px] font-black uppercase tracking-widest",
                                  course.status === 'draft' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                  course.status === 'archived' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                  "bg-green-500/10 text-green-500 border-green-500/20"
                                )}
                              >
                                {course.status === 'published' ? 'Live' : course.status === 'draft' ? 'Draft' : 'Archived'}
                              </Badge>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center">
                                <Switch
                                  checked={!!course.isFeatured}
                                  onCheckedChange={async (checked) => {
                                    try {
                                      await updateCourseMutation({
                                        variables: {
                                          id: course.id,
                                          isFeatured: checked,
                                        },
                                      });
                                      toast.success(checked ? '⭐ Featured!' : 'Unfeatured');
                                      refetch();
                                    } catch (err: any) {
                                      toast.error(err.message);
                                    }
                                  }}
                                  className={course.isFeatured ? 'bg-amber-500' : ''}
                                />
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center">
                                <Switch
                                  checked={!!course.sequentialLock}
                                  onCheckedChange={async (checked) => {
                                    try {
                                      await toggleSequentialLockMutation({
                                        variables: {
                                          courseId: course.id,
                                          enabled: checked,
                                        },
                                      });
                                      toast.success(checked ? '🔒 Sequential lock enabled' : '🔓 Sequential lock disabled');
                                      refetch();
                                    } catch (err: any) {
                                      toast.error(err.message);
                                    }
                                  }}
                                  className={course.sequentialLock ? 'bg-orange-500' : ''}
                                />
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-border/50">
                                  <DropdownMenuItem onClick={() => setViewCourse(course)}>
                                    <Eye className="w-4 h-4 mr-2" /> Quick View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => window.open(`/courses/${course.id}`, '_blank')}>
                                    <ExternalLink className="w-4 h-4 mr-2" /> Public Preview
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => navigate(`/portal/admin/student-view/${course.id}`)}>
                                    <Eye className="w-4 h-4 mr-2" /> Student View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditClick(course)}>
                                    <Edit className="w-4 h-4 mr-2" /> Edit Course
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setManageQuestionsCourse(course)}>
                                    <HelpCircle className="w-4 h-4 mr-2" /> Manage Quizzes
                                  </DropdownMenuItem>
                                  <div className="h-px bg-border/50 my-1" />
                                  <div className="px-2 py-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Set Status</div>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(course.id, 'published')} disabled={course.status === 'published'}>
                                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2" /> Go Live
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(course.id, 'draft')} disabled={course.status === 'draft'}>
                                    <div className="w-2 h-2 rounded-full bg-amber-500 mr-2" /> Back to Draft
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(course.id, 'archived')} disabled={course.status === 'archived'}>
                                    <div className="w-2 h-2 rounded-full bg-red-500 mr-2" /> Archive
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={async () => {
                                    try {
                                      await updateCourseMutation({
                                        variables: {
                                          id: course.id,
                                          isFeatured: !course.isFeatured,
                                        },
                                      });
                                      toast.success(course.isFeatured ? 'Unfeatured' : '⭐ Featured!');
                                      refetch();
                                    } catch (err: any) {
                                      toast.error(err.message);
                                    }
                                  }}>
                                    <Star className={`w-4 h-4 mr-2 ${course.isFeatured ? 'text-amber-500 fill-amber-500' : ''}`} />
                                    {course.isFeatured ? 'Unfeature' : 'Feature'}
                                  </DropdownMenuItem>
                                  <div className="h-px bg-border/50 my-1" />
                                  <DropdownMenuItem
                                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                    onClick={() => setDeleteCourse(course)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="p-12 text-center">
                            <div className="flex flex-col items-center justify-center space-y-3">
                              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                                <BookOpen className="w-8 h-8 text-accent/40" />
                              </div>
                              <p className="text-sm font-semibold text-muted-foreground">No courses found</p>
                              <p className="text-xs text-muted-foreground/60">Create your first course to get started.</p>
                              <Button variant="gold" size="sm" onClick={() => navigate("/portal/admin/courses/create")}>
                                <Plus className="w-4 h-4 mr-2" /> Create Course
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <PaginationBar
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            totalCount={pagination.totalCount}
            onPageChange={setCurrentPage}
            hasPreviousPage={pagination.hasPreviousPage}
            hasNextPage={pagination.hasNextPage}
            pageSize={pageSize}
            onPageSizeChange={(v) => { setPageSize(v); setCurrentPage(1); }}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </motion.div>
      </div>

      {/* Dialogs */}
      <ViewCourseDialog
        open={!!viewCourse}
        onOpenChange={(open) => !open && setViewCourse(null)}
        course={viewCourse}
      />
      <EditCourseDialog
        open={!!editCourse || !!editPricingCourse}
        onOpenChange={(open) => {
          if (!open) { setEditCourse(null); setEditPricingCourse(null); }
        }}
        course={editCourse || editPricingCourse}
        trainers={trainers}
        onSave={handleSaveCourse}
        onQuizSave={handleQuizSaveOnly}
        isLoading={updateLoading || courseLoading}
      />
      <DeleteConfirmDialog
        open={!!deleteCourse}
        onOpenChange={(open) => !open && setDeleteCourse(null)}
        title="Delete Course"
        description={`Are you sure you want to delete "${deleteCourse?.title}"? This cannot be undone.`}
        onConfirm={handleDeleteCourse}
      />
      <QuestionManagerDialog
        isOpen={!!manageQuestionsCourse}
        onClose={() => setManageQuestionsCourse(null)}
        course={manageQuestionsCourse}
      />

      <ExportDataDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
      />
    </PortalLayout>
  );
}
