import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getApiBaseUrl } from "@/lib/env";
import { useQuery } from "@apollo/client/react";
import { GET_COURSES_LITE_SUMMARY } from "@/lib/graphql/queries";
import {
  FileText,
  Download,
  Loader2,
  Users,
  BookOpen,
  GraduationCap,
  Briefcase,
  ChevronRight,
  Database,
  FileSpreadsheet,
  File as FileIcon,
  CheckCircle2,
  Sparkles,
  Search,
  ChevronDown,
} from "lucide-react";

interface ExportAction {
  id: string;
  label: string;
  description: string;
  icon: any;
  endpoint: string;
  filename: string;
  format: "pdf" | "csv";
}

interface ExportDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** User's role for permission-based filtering */
  userRole?: string;
  /** User's ID for scoped reports (trainer sees their own data) */
  userId?: string;
  /** Specific course ID for course-level exports */
  courseId?: string;
  /** Course title for display */
  courseTitle?: string;
  /** If true, show trainer-scoped options */
  isTrainer?: boolean;
}

export function ExportDataDialog({
  open,
  onOpenChange,
  userRole,
  userId,
  courseId,
  courseTitle,
  isTrainer,
}: ExportDataDialogProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courseId || "");
  const [courseSearch, setCourseSearch] = useState("");
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  // Load courses for the dropdown selector
  const { data: coursesData } = useQuery(GET_COURSES_LITE_SUMMARY, {
    variables: { page: 1, limit: 100 },
    skip: !open,
  });
  const allCourses = (coursesData as any)?.courses?.items || [];
  const filteredCourses = allCourses.filter((c: any) =>
    c.title?.toLowerCase().includes(courseSearch.toLowerCase())
  );
  const activeCourse = allCourses.find((c: any) => c.id === selectedCourseId);

  const token = localStorage.getItem("ihub_token");
  const baseUrl = getApiBaseUrl();

  // Resolve the course slug for the PDF endpoint
  const resolvedCourseId = selectedCourseId || courseId || "";
  const resolvedCourseTitle = activeCourse?.title || courseTitle || "";

  const adminActions: ExportAction[] = [
    {
      id: "users",
      label: "Export Users",
      description: "All users with roles, courses, and activity data",
      icon: Users,
      endpoint: `/api/export/users/csv${userId ? `?createdBy=${userId}` : ""}`,
      filename: `users_report_${Date.now()}.csv`,
      format: "csv",
    },
    {
      id: "courses",
      label: "Export Courses",
      description: "All courses with modules, lessons, enrollments, and pricing",
      icon: BookOpen,
      endpoint: `/api/export/courses/csv${userId ? `?createdBy=${userId}` : ""}`,
      filename: `courses_report_${Date.now()}.csv`,
      format: "csv",
    },
    {
      id: "programs",
      label: "Export Programs",
      description: "Internship programs with spots, dates, and pricing",
      icon: Briefcase,
      endpoint: `/api/export/programs/csv${userId ? `?createdBy=${userId}` : ""}`,
      filename: `programs_report_${Date.now()}.csv`,
      format: "csv",
    },
    {
      id: "interns",
      label: "Export Interns by Stage",
      description: "Intern participants with stages, progress, and mentors",
      icon: GraduationCap,
      endpoint: `/api/export/interns/csv${userId ? `?mentorId=${userId}` : ""}`,
      filename: `interns_report_${Date.now()}.csv`,
      format: "csv",
    },
    {
      id: "enrollments",
      label: "Export Enrollments",
      description: "Student enrollments with course, contact, and date info",
      icon: Database,
      endpoint: `/api/export/enrollments/csv${courseId ? `?courseId=${courseId}` : ""}${userId ? `&instructorId=${userId}` : ""}`,
      filename: `enrollments_report_${Date.now()}.csv`,
      format: "csv",
    },
  ];

  const trainerActions: ExportAction[] = [
    {
      id: "courses",
      label: "Export My Courses",
      description: "Your assigned courses with structure and enrollment data",
      icon: BookOpen,
      endpoint: `/api/export/courses/csv?createdBy=${userId || ""}`,
      filename: `my_courses_${Date.now()}.csv`,
      format: "csv",
    },
    {
      id: "students",
      label: "Export My Students",
      description: "Students enrolled in your courses with progress data",
      icon: Users,
      endpoint: `/api/export/users/csv?createdBy=${userId || ""}`,
      filename: `my_students_${Date.now()}.csv`,
      format: "csv",
    },
    {
      id: "enrollments",
      label: "Export Enrollments",
      description: "Course-by-course enrollment details",
      icon: Database,
      endpoint: `/api/export/enrollments/csv?instructorId=${userId || ""}`,
      filename: `enrollments_${Date.now()}.csv`,
      format: "csv",
    },
    {
      id: "interns",
      label: "Export My Interns",
      description: "Interns you mentor with stage and progress data",
      icon: GraduationCap,
      endpoint: `/api/export/interns/csv?mentorId=${userId || ""}`,
      filename: `my_interns_${Date.now()}.csv`,
      format: "csv",
    },
  ];

  const courseActions: ExportAction[] = resolvedCourseId
    ? [
        {
          id: "course-pdf",
          label: "Download Course as PDF",
          description: resolvedCourseTitle
            ? `Full export of "${resolvedCourseTitle}" with all modules and lessons`
            : "Full course content with modules, lessons, and descriptions",
          icon: FileText,
          endpoint: `/api/export/course/${resolvedCourseId}/pdf`,
          filename: `course_${resolvedCourseTitle?.replace(/[^a-zA-Z0-9]/g, "_") || "export"}.pdf`,
          format: "pdf",
        },
      ]
    : [];

  const actions = [
    ...courseActions,
    ...(isTrainer ? trainerActions : adminActions),
  ];

  const handleExport = async (action: ExportAction) => {
    setLoading(action.id);
    setSuccess(null);

    try {
      const response = await fetch(`${baseUrl}${action.endpoint}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Export failed");
      }

      // Handle blob download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = action.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(action.id);
      toast.success(`${action.label} downloaded successfully!`);
    } catch (error: any) {
      toast.error(error.message || `Failed to export ${action.label}`);
    } finally {
      setLoading(null);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card border-border/60">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-accent" />
            </div>
            Export Data & Reports
          </DialogTitle>
          <DialogDescription>
            Choose what data to export. Courses can be downloaded as PDF; reports are generated as CSV files
            compatible with Excel and Google Sheets.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Course Selector for PDF Export */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
              <BookOpen className="w-3.5 h-3.5" />
              Select Course for PDF Export
            </div>
            <div className="relative">
              <button
                onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/30 hover:border-accent/30 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-accent" />
                  <span className={activeCourse ? "text-sm font-bold" : "text-sm text-muted-foreground"}>
                    {activeCourse ? activeCourse.title : "Choose a course to export as PDF..."}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showCourseDropdown ? "rotate-180" : ""}`} />
              </button>

              {showCourseDropdown && (
                <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border/60 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2 border-b border-border/30">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search courses..."
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        className="pl-8 h-9 text-sm"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCourses.length > 0 ? (
                      filteredCourses.map((c: any) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCourseId(c.id);
                            setCourseSearch("");
                            setShowCourseDropdown(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-muted/30 transition-colors text-sm",
                            selectedCourseId === c.id ? "bg-accent/10 border-l-2 border-accent font-bold" : ""
                          )}
                        >
                          <BookOpen className="w-4 h-4 shrink-0 text-muted-foreground/60" />
                          <span className="truncate">{c.title}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "ml-auto text-[9px] font-black uppercase tracking-widest shrink-0",
                              c.status === 'published'
                                ? "bg-green-500/10 text-green-500 border-green-500/30"
                                : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                            )}
                          >
                            {c.status === 'published' ? 'Live' : c.status}
                          </Badge>
                        </button>
                      ))
                    ) : (
                      <p className="p-4 text-center text-xs text-muted-foreground">No courses found</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Course PDF Export Card */}
            {resolvedCourseId && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                  <FileText className="w-3.5 h-3.5" />
                  Course Document Export
                </div>
                {courseActions.map((action) => (
                  <ExportCard
                    key={action.id}
                    action={action}
                    loading={loading}
                    success={success}
                    onExport={handleExport}
                  />
                ))}
              </div>
            )}
          </div>

          {/* CSV Reports */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              {isTrainer ? "My Reports (CSV)" : "Platform Reports (CSV)"}
            </div>
            <div className="grid gap-3">
              {(isTrainer ? trainerActions : adminActions).map((action) => (
                <ExportCard
                  key={action.id}
                  action={action}
                  loading={loading}
                  success={success}
                  onExport={handleExport}
                />
              ))}
            </div>
          </div>

          {actions.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground rounded-2xl border border-border/40">
              No export options available.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ExportCard({
  action,
  loading,
  success,
  onExport,
}: {
  action: ExportAction;
  loading: string | null;
  success: string | null;
  onExport: (action: ExportAction) => void;
}) {
  const Icon = action.icon;
  const isLoading = loading === action.id;
  const isSuccess = success === action.id;

  return (
    <button
      onClick={() => onExport(action)}
      disabled={!!loading}
      className={cn(
        "w-full text-left p-4 rounded-2xl border border-border/40 flex items-center gap-4 transition-all",
        isLoading
          ? "bg-accent/10 border-accent/30 cursor-wait"
          : isSuccess
          ? "bg-green-500/10 border-green-500/30"
          : "hover:bg-muted/30 hover:border-accent/30 hover:shadow-sm cursor-pointer"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          action.format === "pdf"
            ? "bg-red-500/10 text-red-500"
            : "bg-green-500/10 text-green-500"
        )}
      >
        {action.format === "pdf" ? (
          <FileText className="w-5 h-5" />
        ) : (
          <FileSpreadsheet className="w-5 h-5" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold">{action.label}</p>
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] font-black uppercase tracking-widest",
              action.format === "pdf"
                ? "bg-red-500/10 text-red-500 border-red-500/30"
                : "bg-green-500/10 text-green-500 border-green-500/30"
            )}
          >
            {action.format}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {action.description}
        </p>
      </div>

      <div className="shrink-0">
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-accent" />
        ) : isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <Download className="w-5 h-5 text-muted-foreground/50 group-hover:text-accent transition-colors" />
        )}
      </div>
    </button>
  );
}
