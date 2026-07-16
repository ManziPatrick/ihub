import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_DISCOUNT_CODES, GET_COURSES } from "@/lib/graphql/queries";
import {
  CREATE_DISCOUNT_CODE,
  UPDATE_DISCOUNT_CODE,
  DELETE_DISCOUNT_CODE,
} from "@/lib/graphql/mutations";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, normalizeId } from "@/lib/utils";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import {
  Loader2,
  Plus,
  Trash2,
  Tag,
  RefreshCw,
  Search,
  Copy,
  CheckCheck,
  BookOpen,
  BarChart3,
  X,
  ExternalLink,
  Globe,
} from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";

export default function SuperAdminDiscountCodes() {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const courseSearchRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [highlightedCodeId, setHighlightedCodeId] = useState<string | null>(null);
  const codeListRef = useRef<HTMLDivElement>(null);

  // Form state
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [description, setDescription] = useState("");

  const { data: coursesData } = useQuery(GET_COURSES, {
    variables: { limit: 200 },
  });

  const { data: codesData, loading, refetch } = useQuery(GET_DISCOUNT_CODES, {
    variables: { courseId: selectedCourseId && selectedCourseId !== '__general__' ? selectedCourseId : undefined, page, limit: pageSize },
    skip: !selectedCourseId || selectedCourseId === '__general__',
  });

  // Fetch GENERAL codes (no courseId) for the "General" view
  const { data: generalCodesData, loading: loadingGeneral, refetch: generalRefetch } = useQuery(GET_DISCOUNT_CODES, {
    variables: { page, limit: pageSize },
    skip: selectedCourseId !== '__general__',
    fetchPolicy: "network-only",
  });

  // Pagination info
  const codesPagination = (codesData as any)?.discountCodes?.pagination || {};
  const generalPagination = (generalCodesData as any)?.discountCodes?.pagination || {};
  const activePagination = selectedCourseId === '__general__' ? generalPagination : codesPagination;
  const totalPages = activePagination.totalPages || 1;
  const currentPage = activePagination.currentPage || 1;
  const totalCount = activePagination.totalCount || 0;

  const [createCode, { loading: creating }] = useMutation(CREATE_DISCOUNT_CODE, {
    onCompleted: () => {
      toast.success("Discount code created!");
      refetch();
      if (generalRefetch) generalRefetch();
      resetForm();
    },
    onError: (err) => {
      const msg = err.message || '';
      // If duplicate code error, find the existing code and highlight it
      if (msg.includes('already exists')) {
        const existingCode = displayCodes.find((dc: any) =>
          dc.code === code.trim().toUpperCase()
        );
        if (existingCode) {
          setHighlightedCodeId(existingCode.id);
          toast.error(
            <div className="flex flex-col gap-1">
              <span className="font-bold">⚠️ Code already exists</span>
              <span className="text-xs text-muted-foreground">
                "{existingCode.code}" ({existingCode.discountType === 'percentage' ? `${existingCode.discountValue}%` : `${existingCode.discountValue.toLocaleString()} RWF`} off · {existingCode.isActive ? 'Active' : 'Inactive'})
              </span>
              <span className="text-xs text-muted-foreground">
                The code is highlighted below — edit or delete it instead.
              </span>
            </div>,
            { duration: 6000 }
          );
          // Scroll to the highlighted code after a brief delay
          setTimeout(() => {
            const el = document.getElementById(`discount-code-${existingCode.id}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
          // Clear highlight after 4 seconds
          setTimeout(() => setHighlightedCodeId(null), 4000);
        } else {
          toast.error(msg);
        }
      } else {
        toast.error(msg);
      }
    },
  });

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [deleteCode, { loading: deleting }] = useMutation(DELETE_DISCOUNT_CODE, {
    onCompleted: () => {
      toast.success("Discount code deleted successfully");
      refetch();
      if (generalRefetch) generalRefetch();
      setDeleteId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  // Toggle active/inactive
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleCode] = useMutation(UPDATE_DISCOUNT_CODE, {
    onCompleted: () => {
      toast.success("Discount code status updated");
      refetch();
      if (generalRefetch) generalRefetch();
      setTogglingId(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setTogglingId(null);
    },
  });

  // Copy to clipboard
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetForm = () => {
    setCode("");
    setDiscountType("percentage");
    setDiscountValue("");
    setMaxUses("1");
    setExpiresAt("");
    setDescription("");
    setShowForm(false);
  };

  const handleCreate = () => {
    if (!code.trim() || !discountValue) {
      toast.error("Code and discount value are required");
      return;
    }
    createCode({
      variables: {
        code: code.trim().toUpperCase(),
        courseId: selectedCourseId && selectedCourseId !== '__general__' ? selectedCourseId : null,
        discountType,
        discountValue: parseFloat(discountValue),
        maxUses: parseInt(maxUses) || 1,
        expiresAt: expiresAt || null,
        description: description || null,
      },
    });
  };

  // Fetch ALL discount codes for the overview table (no course filter)
  const { data: allCodesData, loading: loadingAll } = useQuery(GET_DISCOUNT_CODES, {
    variables: { limit: 500 },
    fetchPolicy: "network-only",
  });

  const allDiscountCodes = (allCodesData as any)?.discountCodes?.items || [];

  const courses = (coursesData as any)?.courses?.items || [];
  const discountCodes = (codesData as any)?.discountCodes?.items || [];
  const generalCodes = (generalCodesData as any)?.discountCodes?.items || [];
  const allCodes = (allCodesData as any)?.discountCodes?.items || [];
  
  // When a specific course is selected, show filtered codes; otherwise show ALL codes grouped by course
  const isPerCourseView = selectedCourseId && selectedCourseId !== '__general__';
  const isGeneralView = selectedCourseId === '__general__';
  const displayCodes = isGeneralView ? generalCodes : (isPerCourseView ? discountCodes : []);

  // Filter courses by search text
  const filteredCourses = useMemo(() => {
    if (!courseSearch.trim()) return courses.slice(0, 50);
    const q = courseSearch.toLowerCase();
    return courses.filter((c: any) =>
      c.title?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      c.school?.toLowerCase().includes(q) ||
      c.price?.toString().includes(q)
    ).slice(0, 50);
  }, [courses, courseSearch]);

  // Compute course breakdown from all discount codes
  const courseBreakdown = useMemo(() => {
    const breakdown = new Map<string, { total: number; active: number; uses: number; capacity: number; codes: any[] }>();
    allDiscountCodes.forEach((dc: any) => {
      const cId = normalizeId(dc.courseId, "unknown");
      const entry = breakdown.get(cId) || { total: 0, active: 0, uses: 0, capacity: 0, codes: [] };
      entry.total++;
      if (dc.isActive) entry.active++;
      entry.uses += dc.currentUses || 0;
      entry.capacity += dc.maxUses || 0;
      entry.codes.push(dc);
      breakdown.set(cId, entry);
    });
    const courseMap = new Map<string, any>(courses.map((c: any) => [c.id, c]));
    return Array.from(breakdown.entries())
      .map(([courseId, data]) => ({
        courseId,
        courseTitle: courseId === "unknown" ? "General (All Courses)" : (courseMap.get(courseId)?.title || "Unknown Course"),
        coursePrice: courseMap.get(courseId)?.price || 0,
        ...data,
        usageRate: data.capacity > 0 ? Math.round((data.uses / data.capacity) * 100) : 0,
      }))
      .sort((a, b) => b.uses - a.uses);
  }, [allDiscountCodes, courses]);

  // Selected course name for display
  const selectedCourse = useMemo(() => {
    return courses.find((c: any) => c.id === selectedCourseId);
  }, [courses, selectedCourseId]);

  // Reset page and selections when course changes
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [selectedCourseId]);

  // Close course dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (courseSearchRef.current && !courseSearchRef.current.contains(event.target as Node)) {
        setShowCourseDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Bulk action handlers
  const isAllSelected = displayCodes.length > 0 && selectedIds.size === displayCodes.length;
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayCodes.map((dc: any) => dc.id)));
    }
  };

  const handleBulkToggle = async (isActive: boolean) => {
    for (const id of selectedIds) {
      try {
        await toggleCode({ variables: { id, isActive } });
      } catch {
        toast.error("Failed to update some codes");
      }
    }
    toast.success(`${selectedIds.size} code(s) ${isActive ? 'activated' : 'deactivated'}`);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      try {
        await deleteCode({ variables: { id } });
      } catch {
        toast.error("Failed to delete some codes");
      }
    }
    toast.success(`${selectedIds.size} code(s) deleted`);
    setSelectedIds(new Set());
    setDeleteId(null);
  };

  return (
    <PortalLayout>
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center border border-accent/30 shadow-xl shadow-accent/5">
            <Tag className="w-7 h-7 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-widest">
              Discount Codes
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage discount codes per course
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={loading}
          className="gap-2 rounded-xl border-border/50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Discounted Courses Overview Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 }}
      >
        <Card className="border-border/40">
          <CardHeader className="pb-3 border-b border-border/20">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5" />
              Discounted Courses Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingAll ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : courseBreakdown.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                No discount codes created yet. Select a course below to create one.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground h-10">Course</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Codes</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Active</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Uses</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Capacity</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Usage Rate</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseBreakdown.map((course: any) => (
                    <TableRow
                      key={course.courseId}
                      className={`cursor-pointer transition-colors hover:bg-muted/5 ${
                        selectedCourseId === course.courseId
                          ? "bg-accent/5 border-l-2 border-l-accent"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedCourseId(course.courseId);
                        setCourseSearch(course.courseTitle);
                        setShowForm(false);
                      }}
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground truncate max-w-[250px]">
                              {course.courseTitle}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {course.coursePrice === 0 ? "Free" : `${course.coursePrice.toLocaleString()} RWF`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <span className="font-bold text-sm">{course.total}</span>
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <span className={`text-sm font-bold ${
                          course.active > 0 ? "text-emerald-500" : "text-muted-foreground/50"
                        }`}>
                          {course.active}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <span className="text-sm font-bold">{course.uses}</span>
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <span className="text-sm text-muted-foreground">{course.capacity}</span>
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                course.usageRate > 60
                                  ? "bg-emerald-500"
                                  : course.usageRate > 30
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${course.usageRate}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold ${
                            course.usageRate > 60
                              ? "text-emerald-500"
                              : course.usageRate > 30
                                ? "text-amber-500"
                                : "text-muted-foreground"
                          }`}>
                            {course.usageRate}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[10px] font-bold rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCourseId(course.courseId);
                            setCourseSearch(course.courseTitle);
                            setShowForm(false);
                          }}
                        >
                          {selectedCourseId === course.courseId ? (
                            <span className="text-accent">Selected</span>
                          ) : (
                            <span className="flex items-center gap-1">
                              Manage
                              <ExternalLink className="w-3 h-3" />
                            </span>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Searchable Course Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        ref={courseSearchRef}
        className="relative"
      >
        <Card className="border-border/40">
          <CardHeader className="pb-3 border-b border-border/20">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5" />
                {selectedCourseId === '__general__' ? 'Manage General Codes' : (selectedCourseId ? `Manage Codes — ${selectedCourse?.title || "Selected Course"}` : "Search & Select Course")}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={courseSearch}
                    onChange={(e) => {
                      setCourseSearch(e.target.value);
                      setShowCourseDropdown(true);
                    }}
                    onFocus={() => setShowCourseDropdown(true)}
                    placeholder="Search courses by name, category, or school..."
                    className="h-12 pl-10 bg-muted/20 border-border/50 rounded-xl"
                  />
                  {selectedCourseId && (
                    <button
                      onClick={() => {
                        setSelectedCourseId("");
                        setCourseSearch("");
                        setShowForm(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {showCourseDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute z-50 mt-1 w-full bg-popover border border-border/50 rounded-xl shadow-2xl max-h-64 overflow-y-auto"
                    >
                      {filteredCourses.map((c: any) => {
                        const isSelected = selectedCourseId === c.id;
                        return (
                          <button
                            key={c.id}
                            onClick={() => {
                              setSelectedCourseId(c.id);
                              setCourseSearch(c.title);
                              setShowCourseDropdown(false);
                              setShowForm(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/5 ${
                              isSelected ? "bg-accent/10 border-l-2 border-l-accent" : ""
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected ? "bg-accent/20" : "bg-muted"
                            }`}>
                              <BookOpen className={`w-4 h-4 ${isSelected ? "text-accent" : "text-muted-foreground"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {c.category || "General"} · {c.price === 0 ? "Free" : `${c.price.toLocaleString()} RWF`}
                                {c.school && ` · ${c.school}`}
                              </p>
                            </div>
                            {isSelected && (
                              <CheckCheck className="w-4 h-4 text-accent shrink-0" />
                            )}
                          </button>
                        );
                      })}
                      {/* General Codes Option */}
                      <button
                        onClick={() => {
                          setSelectedCourseId('__general__');
                          setCourseSearch('General (All Courses & Internships)');
                          setShowCourseDropdown(false);
                          setShowForm(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/5 ${selectedCourseId === '__general__' ? 'bg-accent/10 border-l-2 border-l-accent' : ''}`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center shrink-0">
                          <Globe className="w-4 h-4 text-purple-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">General (All Courses & Internships)</p>
                          <p className="text-[10px] text-muted-foreground">Applies everywhere · No restriction</p>
                        </div>
                        {selectedCourseId === '__general__' && (
                          <CheckCheck className="w-4 h-4 text-accent shrink-0" />
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* No results */}
                {showCourseDropdown && courseSearch.trim() && filteredCourses.length === 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-popover border border-border/50 rounded-xl shadow-2xl p-6 text-center">
                    <p className="text-sm text-muted-foreground">No courses found matching "{courseSearch}"</p>
                  </div>
                )}
              </div>

              {selectedCourseId && (
                <Button
                  variant="default"
                  onClick={() => setShowForm(!showForm)}
                  className={`h-12 px-6 gap-2 text-xs font-bold rounded-xl transition-all shrink-0 ${
                    showForm ? "bg-destructive hover:bg-destructive/90" : ""
                  }`}
                >
                  {showForm ? (
                    <>
                      <span className="text-lg leading-none mr-1">×</span>
                      Cancel
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      New Code
                    </>
                  )}
                </Button>
              )}
              {!selectedCourseId && (
                <Button
                  variant="default"
                  onClick={() => {
                    setSelectedCourseId('__general__');
                    setCourseSearch('General (All Courses & Internships)');
                    setShowForm(true);
                  }}
                  className="h-12 px-6 gap-2 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  General Code
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && selectedCourseId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-accent/20 bg-accent/5 overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-accent/40 to-accent" />
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Discount Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Code *
                    </Label>
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SAVE50"
                      className="h-12 bg-background border-border/50 rounded-xl text-lg font-bold tracking-widest uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Max Uses
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                      className="h-12 bg-background border-border/50 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Discount Type
                    </Label>
                    <Select value={discountType} onValueChange={setDiscountType}>
                      <SelectTrigger className="h-12 bg-background border-border/50 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (RWF)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {discountType === "percentage" ? "Percentage (%) *" : "Amount (RWF) *"}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max={discountType === "percentage" ? "100" : undefined}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === "percentage" ? "e.g. 50" : "e.g. 5000"}
                      className="h-12 bg-background border-border/50 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Expires At (Optional)
                    </Label>
                    <Input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="h-12 bg-background border-border/50 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Description (Optional)
                    </Label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Internal note about this code"
                      className="h-12 bg-background border-border/50 rounded-xl"
                    />
                  </div>
                </div>

                <Button
                  variant="default"
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full h-12 gap-2 text-xs font-bold rounded-xl"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {creating ? "Creating..." : "Create Discount Code"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Codes List - Per-Course View */}
      {(isPerCourseView || isGeneralView) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {displayCodes.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer" onClick={handleSelectAll}>
                  <Checkbox checked={isAllSelected} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Select All
                  </span>
                </label>
              )}
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {displayCodes.length} Discount Code{displayCodes.length !== 1 ? "s" : ""}
                {isGeneralView && (
                  <span className="ml-2 text-purple-500">(General)</span>
                )}
                {totalCount > 0 && (
                  <span className="ml-1 text-muted-foreground/50">· {totalCount} total</span>
                )}
              </h2>
            </div>
          </div>

          {/* Bulk Action Toolbar */}
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/20"
            >
              <span className="text-xs font-bold text-accent">
                {selectedIds.size} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-[10px] font-bold rounded-lg border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                  onClick={() => handleBulkToggle(true)}
                >
                  Activate All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-[10px] font-bold rounded-lg border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                  onClick={() => handleBulkToggle(false)}
                >
                  Deactivate All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-[10px] font-bold rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteId('bulk')}
                >
                  Delete All
                </Button>
              </div>
            </motion.div>
          )}

          {(loading || loadingGeneral) ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
                <p className="text-xs text-muted-foreground">Loading discount codes...</p>
              </div>
            </div>
          ) : displayCodes.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-border/20 rounded-2xl bg-muted/5">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-purple-500/50" />
              </div>
              <p className="text-sm font-bold text-muted-foreground/60">
                {isGeneralView ? 'No general discount codes yet' : 'No discount codes for this course yet'}
              </p>
              <p className="text-xs text-muted-foreground/40 mt-2">
                Click "New Code" to create the first one
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(true)}
                className="mt-4 gap-2 rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                Create First Code
              </Button>
            </div>
          ) : (
            <div className="grid gap-2.5">
              {displayCodes.map((dc: any) => {
                const isExpired = dc.expiresAt && new Date(+dc.expiresAt) < new Date();
                return (
                  <motion.div
                    id={`discount-code-${dc.id}`}
                    key={dc.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      scale: highlightedCodeId === dc.id ? [1, 1.02, 1] : 1,
                      borderColor: highlightedCodeId === dc.id ? ['rgb(251 191 36 / 0.6)', 'rgb(251 191 36 / 0.8)', 'rgb(251 191 36 / 0.6)'] : undefined,
                    }}
                    transition={{
                      scale: highlightedCodeId === dc.id ? { duration: 0.6, repeat: 2 } : { duration: 0.3 },
                      borderColor: highlightedCodeId === dc.id ? { duration: 0.8, repeat: Infinity } : { duration: 0.3 },
                    }}
                    className={`group flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      selectedIds.has(dc.id)
                        ? 'border-accent/40 bg-accent/5 shadow-md shadow-accent/5'
                        : 'border-border/40 bg-card hover:border-accent/30 hover:shadow-md hover:shadow-accent/5'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <Checkbox
                        checked={selectedIds.has(dc.id)}
                        onCheckedChange={(checked) => {
                          const next = new Set(selectedIds);
                          if (checked) {
                            next.add(dc.id);
                          } else {
                            next.delete(dc.id);
                          }
                          setSelectedIds(next);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0"
                      />
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${dc.isActive && !isExpired ? 'bg-emerald-500/10' : 'bg-muted'}`}>
                        <Tag className={`w-5 h-5 ${dc.isActive && !isExpired ? 'text-emerald-500' : 'text-muted-foreground/50'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-base font-black tracking-widest text-foreground font-mono">
                            {dc.code}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 h-5",
                              isExpired
                                ? "text-red-400 bg-red-400/10 border-red-400/30"
                                : dc.isActive
                                  ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30"
                                  : "text-muted-foreground bg-muted/50 border-border/50"
                            )}
                          >
                            {isExpired ? "Expired" : dc.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {dc.currentUses > 1 && (
                            <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0">
                              {dc.currentUses}/{dc.maxUses} used
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground/80">
                            {dc.discountType === "percentage"
                              ? `${dc.discountValue}% off`
                              : `${dc.discountValue.toLocaleString()} RWF off`}
                          </span>
                          <span className="text-muted-foreground/50">|</span>
                          <span>
                            Used <span className="font-semibold text-foreground/70">{dc.currentUses}/{dc.maxUses}</span> times
                          </span>
                          {dc.expiresAt && (
                            <>
                              <span className="text-muted-foreground/50">|</span>
                              <span className={isExpired ? 'text-red-400' : ''}>
                                {isExpired ? 'Expired' : 'Expires'} {new Date(+dc.expiresAt).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                        {dc.description && (
                          <p className="text-[10px] text-muted-foreground/50 mt-1 truncate max-w-[300px]">
                            {dc.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {/* Toggle Active/Inactive */}
                      <div
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
                          togglingId === dc.id
                            ? "opacity-50"
                            : "opacity-0 group-hover:opacity-100"
                        } hover:bg-background/80`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          dc.isActive && !isExpired
                            ? "text-emerald-500"
                            : "text-muted-foreground/50"
                        }`}>
                          {dc.isActive ? "On" : "Off"}
                        </span>
                        <Switch
                          checked={dc.isActive && !isExpired}
                          disabled={togglingId === dc.id || isExpired}
                          onCheckedChange={() => {
                            setTogglingId(dc.id);
                            toggleCode({
                              variables: {
                                id: dc.id,
                                isActive: !dc.isActive,
                              },
                            });
                          }}
                          className={`scale-75 ${
                            isExpired
                              ? "opacity-30 cursor-not-allowed"
                              : ""
                          }`}
                        />
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-accent/10 text-muted-foreground hover:text-accent transition-all"
                        onClick={() => copyToClipboard(dc.code, dc.id)}
                      >
                        {copiedId === dc.id ? (
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-all"
                        onClick={() => setDeleteId(dc.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Paginator */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Pagination className="w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage(Math.max(1, page - 1))}
                      className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const startPage = Math.max(1, currentPage - 2);
                    const pageNum = startPage + i;
                    if (pageNum > totalPages) return null;
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          isActive={pageNum === currentPage}
                          onClick={() => setPage(pageNum)}
                          className="cursor-pointer text-xs font-bold"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </motion.div>
      )}
      
      {/* All Codes Grouped by Course (when no course selected) */}
      {!selectedCourseId && allCodes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              All Discount Codes by Course — {allCodes.length} total
            </h2>
          </div>
          
          {(() => {
            // Build course lookup map FIRST (before using it)
            const courseMap = new Map<string, any>(courses.map((c: any) => [c.id, c]));
            // Group all codes by course
            const grouped = new Map<string, { courseTitle: string; codes: any[] }>();
            allCodes.forEach((dc: any) => {
              const cId = normalizeId(dc.courseId, 'general');
              const title = cId === 'general' 
                ? 'General (All Courses)' 
                : (courseMap.get(cId)?.title || 'Unknown Course');
              if (!grouped.has(cId)) {
                grouped.set(cId, { courseTitle: title, codes: [] });
              }
              grouped.get(cId)!.codes.push(dc);
            });
            
            return Array.from(grouped.entries())
              .sort((a, b) => b[1].codes.length - a[1].codes.length)
              .map(([courseId, group]) => (
                <Card key={courseId} className="border-border/40 overflow-hidden">
                  <div className={`h-1 w-full ${courseId === 'general' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-accent'}`} />
                  <CardHeader className="pb-3 border-b border-border/20">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {courseId === 'general' ? (
                          <Globe className="w-3.5 h-3.5 text-purple-500" />
                        ) : (
                          <BookOpen className="w-3.5 h-3.5" />
                        )}
                        {group.courseTitle}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px]">{group.codes.length} code{group.codes.length !== 1 ? 's' : ''}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[10px] font-bold rounded-lg"
                          onClick={() => {
                            setSelectedCourseId(courseId);
                            setCourseSearch(group.courseTitle);
                          }}
                        >
                          <span className="flex items-center gap-1">
                            Manage
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="grid gap-2">
                      {group.codes.map((dc: any) => {
                        const isExpired = dc.expiresAt && new Date(+dc.expiresAt) < new Date();
                        return (
                          <div
                            key={dc.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/5 border border-border/30 hover:border-accent/20 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Tag className={`w-4 h-4 shrink-0 ${dc.isActive && !isExpired ? 'text-emerald-500' : 'text-muted-foreground/50'}`} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black tracking-widest font-mono">{dc.code}</span>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[9px] font-bold px-1.5 py-0 h-4",
                                      isExpired
                                        ? "text-red-400 bg-red-400/10 border-red-400/30"
                                        : dc.isActive
                                          ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30"
                                          : "text-muted-foreground bg-muted/50 border-border/50"
                                    )}
                                  >
                                    {isExpired ? "Expired" : dc.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {dc.discountType === 'percentage' ? `${dc.discountValue}% off` : `${dc.discountValue.toLocaleString()} RWF off`}
                                  {' · '}{dc.currentUses}/{dc.maxUses} used
                                  {dc.expiresAt && ` · ${isExpired ? 'Expired' : 'Expires'} ${new Date(+dc.expiresAt).toLocaleDateString()}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 rounded-lg hover:bg-accent/10"
                                onClick={() => copyToClipboard(dc.code, dc.id)}
                              >
                                {copiedId === dc.id ? (
                                  <CheckCheck className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 rounded-lg hover:bg-destructive/10 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteId(dc.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ));
          })()}
        </motion.div>
      )}

      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              {deleteId === 'bulk' ? `Delete ${selectedIds.size} Codes` : 'Delete Discount Code'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteId === 'bulk'
                ? `Are you sure you want to delete ${selectedIds.size} discount codes? This action cannot be undone.`
                : 'Are you sure you want to permanently delete this discount code? Users who have already applied this code will not be affected.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId === 'bulk') {
                  handleBulkDelete();
                } else if (deleteId) {
                  deleteCode({ variables: { id: deleteId } });
                }
              }}
              className="bg-destructive hover:bg-destructive/90 text-white rounded-xl"
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
}