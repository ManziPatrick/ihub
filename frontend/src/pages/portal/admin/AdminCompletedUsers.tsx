import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  GraduationCap,
  Award,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  BookOpen,
  Users,
  Download,
} from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { GET_COMPLETED_USERS, GET_COURSES } from "@/lib/graphql/queries";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

export default function AdminCompletedUsers() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");

  // Debounce the search box and reset to page 1 — the search itself runs
  // server-side (completedUsers resolver supports `search`) so it stays
  // correct across all pages.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data: coursesData } = useQuery(GET_COURSES, {
    variables: { limit: 200 },
  });
  const courses = (coursesData as any)?.courses?.items || [];

  const { data, loading, refetch } = useQuery(GET_COMPLETED_USERS, {
    variables: {
      page: currentPage,
      limit: pageSize,
      createdBy: user?.role === "admin" ? user.id : undefined,
      courseId: courseFilter !== "all" ? courseFilter : undefined,
      search: debouncedSearch || undefined,
    },
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  const completedUsers = (data as any)?.completedUsers?.items || [];
  const pagination = (data as any)?.completedUsers?.pagination || { totalPages: 0, totalCount: 0, hasPreviousPage: false, hasNextPage: false };

  // The server already applies the search filter — no client-side pass needed.
  const filteredUsers = completedUsers;

  const stats = {
    total: pagination?.totalCount || 0,
    withCertificates: completedUsers.filter((u: any) => u.hasCertificate).length,
    uniqueCourses: new Set(completedUsers.flatMap((u: any) => u.completedCourseIds || [])).size,
  };

  const downloadCSV = () => {
    // Build CSV from all users on the current page
    const headers = [
      "Student Name",
      "Email",
      "Username",
      "Courses Completed",
      "Has Certificate",
      "Certificate ID",
      "Lessons Completed",
      "Completed At",
    ];

    const formatDate = (dateStr: string | null | undefined) => {
      if (!dateStr) return "N/A";
      const num = Number(dateStr);
      const d = isNaN(num) ? new Date(dateStr) : new Date(num);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
    };

    const rows = filteredUsers.map((u: any) => [
      u.user?.fullName || u.user?.username || "Unknown",
      u.user?.email || "",
      u.user?.username || "",
      (u.completedCourses || []).map((c: any) => c.title).join("; "),
      u.hasCertificate ? "Yes" : "No",
      u.certificate?.credentialId || "",
      u.completedLessonsCount || 0,
      formatDate(u.completedAt),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Add BOM for Excel compatibility with special/accented characters
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `completed-users-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
              Completed Users
            </h1>
            <p className="text-muted-foreground mt-1">
              View students who have completed courses or received certificates
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={downloadCSV}
              className="gap-2"
              disabled={filteredUsers.length === 0}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="gap-2"
            >
              <Loader2 className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Completed</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">With Certificates</p>
                <p className="text-xl font-bold">{stats.withCertificates}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Courses Completed</p>
                <p className="text-xl font-bold">{stats.uniqueCourses}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={courseFilter} onValueChange={(v) => { setCourseFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-12 h-12 animate-spin text-accent" />
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[250px]">Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Courses Completed</TableHead>
                    <TableHead>Certificate</TableHead>
                    <TableHead>Lessons</TableHead>
                    <TableHead>Completed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((entry: any) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 border border-border/50">
                            <AvatarImage src={entry.user?.avatar} />
                            <AvatarFallback className="text-xs bg-accent/10 text-accent">
                              {(entry.user?.fullName || entry.user?.username || "?")[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate max-w-[180px]">
                              {entry.user?.fullName || entry.user?.username || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {entry.user?.email || ""}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.status === 'Passed' ? (
                          <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/25 text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Passed
                          </Badge>
                        ) : entry.status === 'Completed' ? (
                          <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25 text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        ) : entry.status === 'Failed' ? (
                          <div className="flex items-center gap-1.5">
                            <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25 text-[11px] font-bold">
                              <XCircle className="w-3 h-3 mr-1" />
                              Failed
                            </Badge>
                            {entry.examScore != null && (
                              <Badge variant="outline" className="text-[10px] text-red-500/70 border-red-500/20 font-mono font-bold">
                                {entry.examScore}%
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[11px] text-muted-foreground">
                            {entry.status || 'N/A'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {entry.completedCourses?.slice(0, 3).map((course: any) => (
                            <Badge
                              key={course.id}
                              variant="secondary"
                              className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                            >
                              {course.title?.length > 30
                                ? course.title.substring(0, 30) + "..."
                                : course.title}
                            </Badge>
                          ))}
                          {(entry.completedCourses?.length || 0) > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{entry.completedCourses.length - 3} more
                            </Badge>
                          )}
                          {(!entry.completedCourses || entry.completedCourses.length === 0) && (
                            <span className="text-xs text-muted-foreground">
                              {entry.completedCourseIds?.length || 0} course(s)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.hasCertificate ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                              {entry.certificate?.credentialId
                                ? `#${entry.certificate.credentialId}`
                                : "Issued"}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">No certificate</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {entry.completedLessonsCount || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {(() => {
                            const raw = entry.completedAt;
                            if (!raw) return "N/A";

                            // Handle both numeric timestamp strings ("1782130668867") and ISO strings
                            const ts = Number(raw);
                            const d = isNaN(ts) ? new Date(raw) : new Date(ts);
                            if (Number.isNaN(d.getTime())) return "N/A";

                            return formatDistanceToNow(d, { addSuffix: true });
                          })()}
                        </span>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>

              {filteredUsers.length === 0 && (
                <div className="py-20 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No completed users found</p>
                </div>
              )}
            </div>

            <PaginationBar
              currentPage={currentPage}
              totalPages={pagination?.totalPages || 0}
              totalCount={pagination?.totalCount}
              onPageChange={setCurrentPage}
              hasPreviousPage={pagination?.hasPreviousPage}
              hasNextPage={pagination?.hasNextPage}
              pageSize={pageSize}
              pageSizeLabel="Show"
            />
          </>
        )}
      </div>
    </PortalLayout>
  );
}
