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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ViewCourseDialog, EditCourseDialog, DeleteConfirmDialog } from "@/components/portal/dialogs";
import { QuestionManagerDialog } from "@/components/portal/QuestionManagerDialog";
import { toast } from "sonner";
import { useQuery, useMutation, useLazyQuery } from "@apollo/client/react";
import { GET_COURSES, GET_STATS, GET_USERS, GET_COURSE, GET_ADMIN_DASHBOARD_DATA } from "@/lib/graphql/queries";
import { UPDATE_COURSE, DELETE_COURSE } from "@/lib/graphql/mutations";

export default function AdminCourses() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Dialog states
  const [viewCourse, setViewCourse] = useState<any | null>(null);
  const [editCourse, setEditCourse] = useState<any | null>(null);
  const [deleteCourse, setDeleteCourse] = useState<any | null>(null);
  const [editPricingCourse, setEditPricingCourse] = useState<any | null>(null);
  const [manageQuestionsCourse, setManageQuestionsCourse] = useState<any | null>(null);

  // Queries & Mutations
  const { data, loading, refetch } = useQuery(GET_COURSES, {
    variables: { page: currentPage, limit: pageSize },
    pollInterval: 30000
  });
  const [loadCourse, { data: fullCourseData, loading: courseLoading }] = useLazyQuery(GET_COURSE);
  const [updateCourseMutation, { loading: updateLoading }] = useMutation(UPDATE_COURSE, {
    refetchQueries: [{ query: GET_COURSES }, { query: GET_STATS }, { query: GET_ADMIN_DASHBOARD_DATA }]
  });
  const [deleteCourseMutation] = useMutation(DELETE_COURSE, {
    refetchQueries: [{ query: GET_COURSES }, { query: GET_STATS }, { query: GET_ADMIN_DASHBOARD_DATA }]
  });

  useEffect(() => {
    const fullData = fullCourseData as any;
    if (fullData?.course && editCourse?.id === fullData.course.id) {
      setEditCourse(fullData.course);
    }
  }, [fullCourseData, editCourse?.id]);

  const courses = (data as any)?.courses?.items || [];
  const pagination = (data as any)?.courses?.pagination;

  const { data: usersData } = useQuery(GET_USERS);
  const trainers = (usersData as any)?.users?.items?.filter((u: any) =>
    u.role === 'trainer' || u.role === 'admin' || u.role === 'super_admin'
  ) || [];

  const { data: statsData } = useQuery(GET_STATS, { pollInterval: 30000 });
  const liveStats = (statsData as any)?.stats || { totalUsers: 0, totalCourses: 0, totalStudents: 0, totalRevenue: 0 };

  const handleDeleteCourse = async () => {
    if (!deleteCourse) return;
    try {
      await deleteCourseMutation({ variables: { id: deleteCourse.id } });
      toast.success("Course deleted successfully!");
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
          enrollmentMode: updatedCourse.enrollmentMode || 'direct',
          submissionRequired: updatedCourse.submissionRequired,
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

  const filteredCourses = (courses || []).filter((course: any) =>
    course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.instructor?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <Button variant="gold" onClick={() => navigate("/portal/admin/courses/create")}>
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </Button>
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
            onChange={(e) => setSearchQuery(e.target.value)}
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
                        <th className="text-left p-4 text-sm font-medium text-card-foreground/70">Course</th>
                        <th className="text-left p-4 text-sm font-medium text-card-foreground/70">Instructor</th>
                        <th className="text-center p-4 text-sm font-medium text-card-foreground/70">Students</th>
                        <th className="text-center p-4 text-sm font-medium text-card-foreground/70">Price</th>
                        <th className="text-center p-4 text-sm font-medium text-card-foreground/70">Mode</th>
                        <th className="text-center p-4 text-sm font-medium text-card-foreground/70">Status</th>
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
                                  {course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0} units
                                </p>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-card-foreground/70 group-hover:text-foreground dark:group-hover:text-white transition-colors">
                              {course.instructor?.username || <span className="text-destructive/60 italic">TBD</span>}
                            </td>
                            <td className="p-4 text-center">
                              <span className="text-sm font-bold">{course.studentsEnrolled?.length || 0}</span>
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
                          <td colSpan={7} className="p-12 text-center">
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

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page <span className="font-semibold">{pagination.currentPage}</span> of{" "}
                <span className="font-semibold">{pagination.totalPages}</span> ({pagination.totalCount} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!pagination.hasPreviousPage}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, i, arr) => {
                      const showEllipsis = i > 0 && p - arr[i - 1] > 1;
                      return (
                        <div key={p} className="flex items-center">
                          {showEllipsis && <span className="px-1 text-muted-foreground">...</span>}
                          <Button
                            variant={currentPage === p ? "gold" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(p)}
                            className="w-8 h-8 p-0"
                          >
                            {p}
                          </Button>
                        </div>
                      );
                    })}
                </div>
                <Button
                  variant="outline" size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={!pagination.hasNextPage}
                >
                  Next <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
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
    </PortalLayout>
  );
}
