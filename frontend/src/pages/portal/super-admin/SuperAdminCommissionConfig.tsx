import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_COMMISSION_CONFIGS, GET_COMMISSION_ADMINS, GET_ADMIN_COMMISSION_REPORT, GET_ALL_COMMISSION_REPORTS } from "@/lib/graphql/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Plus,
  Percent,
  Globe,
  BookOpen,
  Briefcase,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle,
  Users,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Banknote,
  PiggyBank,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { CommissionSidebar } from "@/components/portal/CommissionSidebar";
import { PortalLayout } from "@/components/portal/PortalLayout";

// ─── Mutations ──────────────────────────────────────────────────────────
const SET_COMMISSION = gql`
  mutation SetCommission($adminId: ID!, $scope: String!, $scopeId: ID, $scopeTitle: String, $percentage: Float!, $description: String) {
    setCommission(adminId: $adminId, scope: $scope, scopeId: $scopeId, scopeTitle: $scopeTitle, percentage: $percentage, description: $description) {
      id
      adminId { id username fullName email }
      scope
      scopeId
      scopeTitle
      percentage
      description
      active
      createdAt
    }
  }
`;

const TOGGLE_COMMISSION = gql`
  mutation ToggleCommission($id: ID!) {
    toggleCommission(id: $id) {
      id
      active
    }
  }
`;

const DELETE_COMMISSION = gql`
  mutation DeleteCommission($id: ID!) {
    deleteCommission(id: $id)
  }
`;

// ─── Helper queries ─────────────────────────────────────────────────────
const GET_ALL_COURSES_QUERY = gql`
  query GetAllCoursesForCommission {
    courses(page: 1, limit: 200) {
      items { id title }
    }
  }
`;

const GET_INTERNSHIP_PROGRAMS_QUERY = gql`
  query GetInternshipProgramsForCommission {
    internshipPrograms(page: 1, limit: 200) {
      items { id title }
    }
  }
`;

// ─── Types ──────────────────────────────────────────────────────────────
interface Admin {
  id: string;
  username: string;
  fullName: string;
  email: string;
}

interface CommissionConfig {
  id: string;
  adminId: Admin;
  scope: "global" | "course" | "internship";
  scopeId?: string;
  scopeTitle?: string;
  percentage: number;
  description?: string;
  active: boolean;
  createdAt: string;
}

export default function SuperAdminCommissionConfig() {
  const { user } = useAuth();

  const {
    data: configsData,
    loading: configsLoading,
    refetch: refetchConfigs,
  } = useQuery(GET_COMMISSION_CONFIGS);
  const { data: adminsData, loading: adminsLoading } = useQuery(GET_COMMISSION_ADMINS);
  const {
    data: allReportsData,
    loading: allReportsLoading,
    refetch: refetchAllReports,
  } = useQuery(GET_ALL_COMMISSION_REPORTS, {
  });
  const { data: coursesData } = useQuery(GET_ALL_COURSES_QUERY);
  const { data: programsData } = useQuery(GET_INTERNSHIP_PROGRAMS_QUERY);


  const [setCommission, { loading: setting }] = useMutation(SET_COMMISSION);
  const [toggleCommission] = useMutation(TOGGLE_COMMISSION);
  const [deleteCommission] = useMutation(DELETE_COMMISSION);

  // Sidebar — selected admin commission report
  const [selectedReportAdmin, setSelectedReportAdmin] = useState("");
  const { data: reportData, loading: reportLoading, error: reportError, refetch: refetchReport } = useQuery(GET_ADMIN_COMMISSION_REPORT, {
    variables: { adminId: selectedReportAdmin },
    skip: !selectedReportAdmin,
  });
  const report: any = (reportData as any)?.getAdminCommissionReport || null;
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [scope, setScope] = useState<"global" | "course" | "internship">("global");
  const [scopeId, setScopeId] = useState("");
  const [percentage, setPercentage] = useState("10");
  const [description, setDescription] = useState("");

  const configs: CommissionConfig[] = (configsData as any)?.commissionConfigs || [];
  const admins: Admin[] = (adminsData as any)?.getCommissionAdmins || [];
  const courses: { id: string; title: string }[] = (coursesData as any)?.courses?.items || [];
  const programs: { id: string; title: string }[] = (programsData as any)?.internshipPrograms?.items || [];

  // Aggregated commission report across ALL admins
  const allReports: any = (allReportsData as any)?.getAllCommissionReports || null;

  const [showFullOverview, setShowFullOverview] = useState(true);
  const [expandedAdmin, setExpandedAdmin] = useState<string | null>(null);

  // ─── Admin filter for configs table ─────────────────────────────────
  const [filterAdmin, setFilterAdmin] = useState("");
  const filteredConfigs = useMemo(() => {
    if (!filterAdmin) return configs;
    return configs.filter(c => c.adminId.id === filterAdmin);
  }, [configs, filterAdmin]);

  // ─── Pagination for configs table ───────────────────────────────────
  const CONFIGS_PER_PAGE = 10;
  const [configPage, setConfigPage] = useState(1);
  const totalConfigPages = Math.ceil(filteredConfigs.length / CONFIGS_PER_PAGE);
  const paginatedConfigs = filteredConfigs.slice(
    (configPage - 1) * CONFIGS_PER_PAGE,
    configPage * CONFIGS_PER_PAGE
  );

  // Reset to page 1 when filter changes
  useEffect(() => {
    setConfigPage(1);
  }, [filterAdmin]);

  const handleCreate = async () => {
    if (!selectedAdmin) {
      toast.error("Please select an admin");
      return;
    }
    if (!percentage || isNaN(Number(percentage)) || Number(percentage) < 0 || Number(percentage) > 100) {
      toast.error("Percentage must be between 0 and 100");
      return;
    }
    if ((scope === "course" || scope === "internship") && !scopeId) {
      toast.error("Please select a course or internship program");
      return;
    }
    if (scope === "global" && configs.some(c => c.adminId.id === selectedAdmin && c.scope === "global")) {
      toast.error("This admin already has a global commission config. Edit or delete the existing one first.");
      return;
    }

    try {
      const scopeTitle = scope === "course"
        ? courses.find(c => c.id === scopeId)?.title
        : scope === "internship"
          ? programs.find(p => p.id === scopeId)?.title
          : null;

      await setCommission({
        variables: {
          adminId: selectedAdmin,
          scope,
          scopeId: scope !== "global" ? scopeId : null,
          scopeTitle,
          percentage: Number(percentage),
          description: description || null,
        },
      });
      toast.success("Commission config created");
      setDialogOpen(false);
      resetForm();
      refetchConfigs();
    } catch (err: any) {
      toast.error(err.message || "Failed to create commission");
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleCommission({ variables: { id } });
      refetchConfigs();
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle commission");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCommission({ variables: { id } });
      refetchConfigs();
      toast.success("Commission config deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete commission");
    }
  };

  const resetForm = () => {
    setSelectedAdmin("");
    setScope("global");
    setScopeId("");
    setPercentage("10");
    setDescription("");
  };

  const getScopeIcon = (s: string) => {
    switch (s) {
      case "global": return <Globe className="w-4 h-4" />;
      case "course": return <BookOpen className="w-4 h-4" />;
      case "internship": return <Briefcase className="w-4 h-4" />;
      default: return <Percent className="w-4 h-4" />;
    }
  };

  const getScopeLabel = (s: string) => {
    switch (s) {
      case "global": return "Global";
      case "course": return "Course";
      case "internship": return "Internship";
      default: return s;
    }
  };

  if (configsLoading || adminsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PortalLayout>
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Commission Configuration</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Set commission percentages for admins — globally, per course, or per internship
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Commission
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>New Commission Config</DialogTitle>
                    <DialogDescription>
                      Set the percentage an admin earns from payments
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* Admin */}
                    <div className="space-y-2">
                      <Label>Admin</Label>
                      <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select admin..." />
                        </SelectTrigger>
                        <SelectContent>
                          {admins.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.fullName || a.username} ({a.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Scope */}
                    <div className="space-y-2">
                      <Label>Scope</Label>
                      <Select value={scope} onValueChange={(v: any) => { setScope(v); setScopeId(""); }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">
                            <span className="flex items-center gap-2"><Globe className="w-4 h-4" /> Global — All payments</span>
                          </SelectItem>
                          <SelectItem value="course">
                            <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Per Course</span>
                          </SelectItem>
                          <SelectItem value="internship">
                            <span className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> Per Opportunity</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Scope-specific selector */}
                    {scope === "course" && (
                      <div className="space-y-2">
                        <Label>Course</Label>
                        <Select value={scopeId} onValueChange={setScopeId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select course..." />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {scope === "internship" && (
                      <div className="space-y-2">
                        <Label>Program</Label>
                        <Select value={scopeId} onValueChange={setScopeId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select program..." />
                          </SelectTrigger>
                          <SelectContent>
                            {programs.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Percentage */}
                    <div className="space-y-2">
                      <Label>Commission Percentage (0-100)</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          value={percentage}
                          onChange={(e) => setPercentage(e.target.value)}
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">%</span>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., 10% commission for course sales"
                        rows={2}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={setting}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={setting}>
                      {setting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {setting ? "Creating..." : "Create Commission"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* ── Full Commission Overview (Aggregated) ── */}
          <Card className="overflow-hidden border-primary/20">
            <button
              onClick={() => setShowFullOverview(!showFullOverview)}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Banknote className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-sm">Full Commission Overview</h3>
                  <p className="text-xs text-muted-foreground">Aggregated earnings across all admins</p>
                </div>
              </div>
              {showFullOverview ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </button>

            {showFullOverview && (
              <div className="px-4 pb-4 space-y-4">
                {allReportsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : allReports ? (
                  <>
                    {/* Grand Total Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                        <CardHeader className="pb-1 pt-3 px-3">
                          <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                            <PiggyBank className="w-3.5 h-3.5 text-primary" />
                            Grand Total Commission
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 pb-3">
                          <div className="text-2xl font-bold text-primary">
                            {allReports.grandTotalCommission?.toLocaleString() || 0} RWF
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-1 pt-3 px-3">
                          <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                            Admins
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 pb-3">
                          <div className="text-2xl font-bold">{allReports.totalAdmins || 0}</div>
                          <p className="text-xs text-muted-foreground mt-0.5">With active commission configs</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-1 pt-3 px-3">
                          <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                            Total Payments
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 pb-3">
                          <div className="text-2xl font-bold">{allReports.grandTotalPayments || 0}</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Per-Admin Breakdown */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Breakdown by Admin</h4>
                      {allReports.adminReports?.map((ar: any) => (
                        <div key={ar.adminId} className="rounded-lg border border-border/40 overflow-hidden">
                          <button
                            onClick={() => setExpandedAdmin(expandedAdmin === ar.adminId ? null : ar.adminId)}
                            className="w-full flex items-center justify-between p-3 hover:bg-accent/5 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                                <DollarSign className="w-4 h-4" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-medium">{ar.adminName}</p>
                                <p className="text-xs text-muted-foreground">{ar.adminEmail}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-sm font-bold text-primary">{ar.totalCommission?.toLocaleString() || 0} RWF</p>
                                <p className="text-[10px] text-muted-foreground">{ar.activeConfigsCount} configs &middot; {ar.totalPayments} payments</p>
                              </div>
                              {expandedAdmin === ar.adminId ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                            </div>
                          </button>

                          {expandedAdmin === ar.adminId && (
                            <div className="px-3 pb-3 space-y-2">
                              {ar.recentEntries?.length > 0 ? (
                                <div className="space-y-1">
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Recent Commission Entries</p>
                                  {ar.recentEntries.slice(0, 5).map((entry: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between py-1.5 px-2 rounded bg-accent/5 text-xs">
                                      <div className="min-w-0 flex-1">
                                        <p className="font-medium truncate">{entry.itemTitle || "Payment"}</p>
                                        <p className="text-muted-foreground">{entry.scope} &middot; {entry.commissionPercentage}%</p>
                                      </div>
                                      <span className="font-bold text-primary whitespace-nowrap ml-2">
                                        {entry.commissionAmount?.toLocaleString()} RWF
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground text-center py-3">No commission entries yet for this admin</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Refresh */}
                    <div className="flex justify-center">
                      <Button variant="ghost" size="sm" onClick={() => refetchAllReports()} className="text-xs">
                        <RefreshCw className="w-3 h-3 mr-1" /> Refresh Overview
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Could not load aggregated report data.</p>
                )}
              </div>
            )}
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Configs</CardTitle>
                <Percent className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{configs.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Admins Configured</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(configs.map(c => c.adminId.id)).size}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Configs</CardTitle>
                <ToggleRight className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {configs.filter(c => c.active).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Commissions Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>All Commission Configurations</CardTitle>
                <CardDescription>
                  Each row represents a commission rule for an admin
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                {/* Admin filter */}
                <Select value={filterAdmin || "__all__"} onValueChange={(v) => setFilterAdmin(v === "__all__" ? "" : v)}>
                  <SelectTrigger className="w-[200px] h-8 text-xs">
                    <SelectValue placeholder="All Admins" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Admins</SelectItem>
                    {admins.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.fullName || a.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">
                  {filteredConfigs.length} of {configs.length}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {configs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p className="font-medium">No commission configs yet</p>
                  <p className="text-sm mt-1">Click "Add Commission" to create your first one</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Admin</TableHead>
                        <TableHead>Scope</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedConfigs.map((config) => (
                        <TableRow key={config.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{config.adminId.fullName || config.adminId.username}</p>
                              <p className="text-xs text-muted-foreground">{config.adminId.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              {getScopeIcon(config.scope)}
                              {getScopeLabel(config.scope)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {config.scopeTitle || "—"}
                          </TableCell>
                          <TableCell className="font-bold text-lg">
                            {config.percentage}%
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">
                            {config.description || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={config.active ? "default" : "secondary"}>
                              {config.active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggle(config.id)}
                                title={config.active ? "Deactivate" : "Activate"}
                              >
                                {config.active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(config.id)}
                                className="text-destructive hover:text-destructive"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalConfigPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Showing {(configPage - 1) * CONFIGS_PER_PAGE + 1}–{Math.min(configPage * CONFIGS_PER_PAGE, configs.length)} of {configs.length}
                      </span>
                      <Pagination className="w-auto mx-0">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => { e.preventDefault(); setConfigPage(p => Math.max(1, p - 1)); }}
                              className={configPage <= 1 ? "pointer-events-none opacity-40" : ""}
                            />
                          </PaginationItem>
                          {Array.from({ length: totalConfigPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalConfigPages || Math.abs(p - configPage) <= 1)
                            .map((p, idx, arr) => (
                              <span key={p}>
                                {idx > 0 && arr[idx - 1] !== p - 1 && (
                                  <PaginationItem>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )}
                                <PaginationItem>
                                  <PaginationLink
                                    href="#"
                                    isActive={p === configPage}
                                    onClick={(e) => { e.preventDefault(); setConfigPage(p); }}
                                  >
                                    {p}
                                  </PaginationLink>
                                </PaginationItem>
                              </span>
                            ))}
                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => { e.preventDefault(); setConfigPage(p => Math.min(totalConfigPages, p + 1)); }}
                              className={configPage >= totalConfigPages ? "pointer-events-none opacity-40" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Admin selector for commission report */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-3.5 h-3.5" />
                View Commission Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedReportAdmin} onValueChange={setSelectedReportAdmin}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select an admin..." />
                </SelectTrigger>
                <SelectContent>
                  {admins.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.fullName || a.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedReportAdmin && (
            <CommissionSidebar
              report={report}
              loading={reportLoading}
              error={reportError}
              onRefresh={() => refetchReport()}
            />
          )}

          {!selectedReportAdmin && (
            <Card>
              <CardContent className="py-8 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Select an admin above</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Choose an admin to view their commission earnings report
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </PortalLayout>
  );
}
