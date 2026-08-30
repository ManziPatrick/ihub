import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { GET_COURSES_LITE_SUMMARY } from "@/lib/graphql/queries";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { cn } from "@/lib/utils";
import { getApiBaseUrl } from "@/lib/env";
import { toast } from "sonner";
import {
  BookOpen,
  Search,
  Download,
  Eye,
  GraduationCap,
  Layers,
  LayoutGrid,
  FileText,
  Star,
  Users,
  ExternalLink,
  ArrowUpDown,
} from "lucide-react";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600";

const STATUS_STYLES: Record<string, string> = {
  published: "bg-green-500/10 text-green-500 border-green-500/20",
  draft: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  closed: "bg-red-500/10 text-red-500 border-red-500/20",
  archived: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  inactive: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

function statusKey(s?: string) {
  return (s || "draft").toLowerCase();
}

export default function SuperAdminCourses() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<"course" | "instructor" | "students">("course");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const { data, loading, error, refetch } = useQuery(GET_COURSES_LITE_SUMMARY, {
    variables: { page: 1, limit: 500, sortBy: "latest" },
    fetchPolicy: "network-only",
  });

  const allCourses = useMemo(() => (data as any)?.courses?.items || [], [data]);
  const serverTotal = (data as any)?.courses?.pagination?.totalCount ?? allCourses.length;
  const isCapped = serverTotal > allCourses.length;

  // Client-side filtering across the full fetched set (server fetches all for monitoring)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const dir = sortDir === "asc" ? 1 : -1;
    return allCourses
      .filter((c: any) => {
        if (statusFilter !== "all" && statusKey(c.status) !== statusFilter) return false;
        if (!q) return true;
        return [
          c.title,
          c.category,
          c.school,
          c.level,
          c.instructor?.username,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      })
      .sort((a: any, b: any) => {
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
  }, [allCourses, search, statusFilter, sortField, sortDir]);

  const handleSortToggle = (field: "course" | "instructor" | "students") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "course" ? "asc" : "desc");
    }
    setPage(1);
  };

  const stats = useMemo(() => {
    const published = allCourses.filter((c: any) => statusKey(c.status) === "published").length;
    const drafts = allCourses.filter((c: any) => statusKey(c.status) === "draft").length;
    const enrollments = allCourses.reduce((s: number, c: any) => s + (c.studentsEnrolledCount || 0), 0);
    const free = allCourses.filter((c: any) => !c.price || c.price === 0).length;
    const instructors = new Set(
      allCourses.map((c: any) => c.instructor?.username || c.instructor?.id).filter(Boolean)
    ).size;
    return { published, drafts, enrollments, free, instructors };
  }, [allCourses]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const downloadPdf = async (course: any) => {
    const token = localStorage.getItem("ihub_token");
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/export/course/${course.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("PDF export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${course.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Course PDF downloaded");
    } catch (e: any) {
      toast.error(e.message || "Download failed");
    }
  };

  const statCards = [
    { icon: LayoutGrid, label: "Total Courses", value: serverTotal, color: "from-accent/20 to-accent/5 border-accent/20 text-accent" },
    { icon: BookOpen, label: "Published", value: stats.published, color: "from-green-500/20 to-green-600/5 border-green-500/20 text-green-500" },
    { icon: FileText, label: "Drafts", value: stats.drafts, color: "from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-500" },
    { icon: Users, label: "Total Enrollments", value: stats.enrollments, color: "from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-500" },
    { icon: GraduationCap, label: "Instructors", value: stats.instructors, color: "from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-500" },
  ];

  return (
    <PortalLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <LayoutGrid className="w-6 h-6 text-accent" /> Course Manager
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Full platform monitoring — every course across every instructor, school and status.
              {isCapped && (
                <span className="text-amber-500"> (showing first {allCourses.length} — {serverTotal} total)</span>
              )}
            </p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="super-admin-course-search"
              placeholder="Search title, category, school, instructor..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statCards.map(({ icon: Icon, label, value, color }) => (
            <Card key={label} className="border-border/40 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br border flex items-center justify-center shrink-0", color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-black text-foreground leading-tight">{value}</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider truncate">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Status:</span>
          {["all", "published", "draft", "closed", "archived"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all border",
                statusFilter === s
                  ? "bg-accent text-accent-foreground border-accent shadow"
                  : "bg-card text-muted-foreground border-border/40 hover:border-accent/40 hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <ListSkeleton count={6} className="lg:grid-cols-2" />
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-destructive font-bold">Failed to load courses</p>
            <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border/50 rounded-3xl">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-bold">No courses match your filters.</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-border/30 overflow-hidden bg-card shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/20 text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                      <th
                        className="px-4 py-3 cursor-pointer select-none hover:text-accent transition-colors"
                        onClick={() => handleSortToggle("course")}
                      >
                        <span className="inline-flex items-center gap-1">
                          Course {sortField === "course" && <ArrowUpDown className="w-3 h-3" />}
                        </span>
                      </th>
                      <th
                        className="px-4 py-3 cursor-pointer select-none hover:text-accent transition-colors"
                        onClick={() => handleSortToggle("instructor")}
                      >
                        <span className="inline-flex items-center gap-1">
                          Created By {sortField === "instructor" && <ArrowUpDown className="w-3 h-3" />}
                        </span>
                      </th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-center">Structure</th>
                      <th
                        className="px-4 py-3 text-center cursor-pointer select-none hover:text-accent transition-colors"
                        onClick={() => handleSortToggle("students")}
                      >
                        <span className="inline-flex items-center gap-1">
                          Students {sortField === "students" && <ArrowUpDown className="w-3 h-3" />}
                        </span>
                      </th>
                      <th className="px-4 py-3 text-right">Price</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedItems.map((c: any) => (
                      <tr key={c.id} className="border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-[220px]">
                            <div className="w-12 h-9 rounded-lg overflow-hidden border border-border/30 shrink-0 bg-muted/20">
                              <img
                                src={c.thumbnail || FALLBACK_IMG}
                                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                                alt={c.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground text-xs truncate max-w-[220px]">{c.title}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Badge className="bg-accent/10 text-accent border-accent/20 text-[8px] px-1.5 py-0 h-4 font-black uppercase">
                                  {c.category || "General"}
                                </Badge>
                                <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 font-bold text-muted-foreground border-border/40 capitalize">
                                  {c.level || "All"}
                                </Badge>
                                {c.isFeatured && (
                                  <Star className="w-3 h-3 text-gold fill-gold" />
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {c.instructor?.username || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={cn(
                            "text-[8px] px-1.5 py-0 h-4 font-black uppercase tracking-wider",
                            STATUS_STYLES[statusKey(c.status)] || STATUS_STYLES.draft
                          )}>
                            {statusKey(c.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <Layers className="w-3 h-3 text-accent" /> {c.modulesCount || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3 text-accent" /> {c.totalLessonsCount || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1 text-xs font-bold text-foreground">
                            <Users className="w-3.5 h-3.5 text-accent" /> {c.studentsEnrolledCount || 0}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {c.price === 0 || c.price == null ? (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[8px] font-black">FREE</Badge>
                          ) : c.discountPrice && c.discountPrice < c.price ? (
                            <div className="text-right">
                              <span className="text-xs font-black text-foreground">
                                {Number(c.discountPrice).toLocaleString()}
                              </span>
                              <span className="text-[9px] text-muted-foreground line-through ml-1">{Number(c.price).toLocaleString()}</span>
                            </div>
                          ) : (
                            <span className="text-xs font-black text-foreground">{Number(c.price).toLocaleString()}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" title="Public view" asChild>
                              <Link to={`/courses/${c.id}`} target="_blank"><ExternalLink className="w-4 h-4" /></Link>
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" title="Structure preview" asChild>
                              <Link to={`/portal/admin/course-preview/${c.id}`}><Eye className="w-4 h-4" /></Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg"
                              title="Download outline PDF (with quizzes, no answers)"
                              onClick={() => downloadPdf(c)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <PaginationBar
              currentPage={safePage}
              totalPages={totalPages}
              totalCount={filtered.length}
              onPageChange={setPage}
              hasPreviousPage={safePage > 1}
              hasNextPage={safePage < totalPages}
              pageSize={pageSize}
              onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
              pageSizeOptions={[12, 24, 50, 100]}
            />
          </>
        )}
      </div>
    </PortalLayout>
  );
}
