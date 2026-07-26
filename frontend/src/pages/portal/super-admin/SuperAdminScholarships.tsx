import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@apollo/client/react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import {
  GET_ALL_SCHOLARSHIPS,
  GET_SCHOLARSHIP_STATS,
} from "@/lib/graphql/queries";
import { REVOKE_SCHOLARSHIP, APPROVE_SCHOLARSHIP } from "@/lib/graphql/mutations";
import { ScholarshipDialog } from "@/components/portal/dialogs/ScholarshipDialog";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Award,
  GraduationCap,
  BookOpen,
  Users,
  Loader2,
  Search,
  Filter,
  XCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  User,
  Calendar,
  Ban,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { toast } from "sonner";
import { format } from "date-fns";

// ─── Types ──────────────────────────────────────────────────────────────

interface ScholarshipItem {
  id: string;
  userId: string;
  user?: { id: string; username: string; fullName: string; email: string };
  grantedBy: string;
  grantedByUser?: { id: string; username: string; fullName: string };
  type: "course" | "internship";
  itemId: string;
  itemTitle: string;
  status: "pending" | "active" | "revoked";
  reason?: string;
  approvedAt?: string;
  approvedBy?: string;
  approvedByUser?: { id: string; username: string; fullName: string };
  revokedAt?: string;
  revokedBy?: string;
  revokedByUser?: { id: string; username: string };
  revokedReason?: string;
  grantedLatitude?: number;
  grantedLongitude?: number;
  grantedCity?: string;
  grantedCountry?: string;
  createdAt: string;
  updatedAt: string;
}

interface PerAdminStat {
  adminId: string;
  total: number;
  pending: number;
  active: number;
  revoked: number;
}

interface ScholarshipStats {
  totalScholarships: number;
  pendingScholarships: number;
  activeScholarships: number;
  courseScholarships: number;
  internshipScholarships: number;
  perAdmin?: PerAdminStat[];
}

// ─── Helpers ────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "MMM dd, yyyy HH:mm");
  } catch {
    return dateStr;
  }
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  pending: { label: "Pending", variant: "secondary", icon: Clock },
  active: { label: "Active", variant: "default", icon: CheckCircle2 },
  revoked: { label: "Revoked", variant: "destructive", icon: XCircle },
};

// ─── Custom Marker Icon ────────────────────────────────────────────────

const scholarshipMarkerIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center">
      <div style="position:absolute;inset:0;border-radius:50%;background:#D4AF3740;animation:rippleRing 2s ease-out infinite;"></div>
      <div style="width:28px;height:28px;background:linear-gradient(135deg,#D4AF37,#B8860B);border:3px solid #fff;border-radius:50%;box-shadow:0 2px 12px rgba(212,175,55,0.6),0 3px 14px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

// ─── Component ──────────────────────────────────────────────────────────

export default function SuperAdminScholarships() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showGrantDialog, setShowGrantDialog] = useState(false);

  // Revoke dialog state
  const [revokeTarget, setRevokeTarget] = useState<ScholarshipItem | null>(null);
  const [revokeReason, setRevokeReason] = useState("");

  const { data, loading, refetch } = useQuery(GET_ALL_SCHOLARSHIPS, {
    variables: {
      page,
      limit: pageSize,
      status: statusFilter || undefined,
      type: typeFilter || undefined,
    },
    fetchPolicy: "cache-and-network",
  });

  const { data: statsData, loading: statsLoading, refetch: refetchStats } = useQuery(GET_SCHOLARSHIP_STATS, {
  });

  const [approveScholarship, { loading: approving }] = useMutation(APPROVE_SCHOLARSHIP, {
    refetchQueries: [
      { query: GET_ALL_SCHOLARSHIPS, variables: { page, limit: pageSize, status: statusFilter || undefined, type: typeFilter || undefined } },
      { query: GET_SCHOLARSHIP_STATS },
    ],
    onCompleted: () => {
      toast.success("Scholarship approved successfully");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to approve scholarship");
    },
  });

  const [revokeScholarship, { loading: revoking }] = useMutation(REVOKE_SCHOLARSHIP, {
    refetchQueries: [
      { query: GET_ALL_SCHOLARSHIPS, variables: { page, limit: pageSize, status: statusFilter || undefined, type: typeFilter || undefined } },
      { query: GET_SCHOLARSHIP_STATS },
    ],
    onCompleted: () => {
      const wasPending = revokeTarget?.status === 'pending';
      toast.success(wasPending ? "Scholarship rejected successfully" : "Scholarship revoked successfully");
      setRevokeTarget(null);
      setRevokeReason("");
    },
    onError: (err) => {
      const wasPending = revokeTarget?.status === 'pending';
      toast.error(err.message || (wasPending ? "Failed to reject scholarship" : "Failed to revoke scholarship"));
    },
  });

  const scholarships: ScholarshipItem[] = (data as any)?.getAllScholarships?.items || [];
  const pagination = (data as any)?.getAllScholarships?.pagination || { totalPages: 0, totalCount: 0, hasPreviousPage: false, hasNextPage: false };
  const stats: ScholarshipStats = (statsData as any)?.getScholarshipStats;

  // Client-side search
  const filteredScholarships = scholarships.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.user?.username || "").toLowerCase().includes(q) ||
      (s.user?.fullName || "").toLowerCase().includes(q) ||
      (s.user?.email || "").toLowerCase().includes(q) ||
      s.itemTitle.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    );
  });

  const handleRevoke = async () => {
    if (!revokeTarget || !revokeReason.trim()) {
      const wasPending = revokeTarget?.status === 'pending';
      toast.error(wasPending ? "Please provide a reason for rejection" : "Please provide a reason for revoking");
      return;
    }
    await revokeScholarship({
      variables: { id: revokeTarget.id, reason: revokeReason },
    });
  };

  // Pagination
  const totalPages = pagination?.totalPages || 1;
  const pageNumbers: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 2) {
      pageNumbers.push(i);
    } else if (pageNumbers[pageNumbers.length - 1] !== "...") {
      pageNumbers.push("...");
    }
  }

  return (
    <PortalLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Award className="w-6 h-6 text-accent" />
              Scholarship Management
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Grant, manage, and revoke course and internship scholarships
            </p>
          </div>
          <Button variant="gold" onClick={() => setShowGrantDialog(true)}>
            <Award className="w-4 h-4 mr-2" />
            Grant Scholarship
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          {statsLoading ? (
            <div className="col-span-full flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : stats ? (
            <>
              <Card className="bg-accent/5 border-accent/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <Award className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalScholarships}</p>
                    <p className="text-xs text-muted-foreground">Total Scholarships</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-amber-500/5 border-amber-500/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-500">{stats.pendingScholarships}</p>
                    <p className="text-xs text-muted-foreground">Pending Approval</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-500">{stats.activeScholarships}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-blue-500/5 border-blue-500/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-500">{stats.courseScholarships}</p>
                    <p className="text-xs text-muted-foreground">Course Scholarships</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-purple-500/5 border-purple-500/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-500">{stats.internshipScholarships}</p>
                    <p className="text-xs text-muted-foreground">Internship Scholarships</p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </motion.div>

        {/* Per-Admin Stats (super_admin only) */}
        {stats?.perAdmin && stats.perAdmin.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card border border-border/50 rounded-xl p-4"
          >
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-accent" />
              Scholarships by Admin
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {stats.perAdmin.map((admin) => (
                <div
                  key={admin.adminId}
                  className="p-2.5 rounded-lg bg-accent/5 border border-accent/10 text-center"
                >
                  <p className="text-xs text-muted-foreground truncate" title={admin.adminId}>
                    ID: {admin.adminId.slice(-8)}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-sm font-bold text-green-500">{admin.active}</span>
                    <span className="text-xs text-muted-foreground">/</span>
                    <span className="text-sm font-bold">{admin.total}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {admin.pending > 0 && <span className="text-amber-500">{admin.pending} pending</span>}
                    {admin.pending > 0 && ' · '}
                    {admin.active} active · {admin.revoked} revoked
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 flex-wrap"
        >
          <Card>
            <CardContent className="p-3 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student, item, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 h-9 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Status:</span>
                <Select
                  value={statusFilter || "__all__"}
                  onValueChange={(v) => { setStatusFilter(v === "__all__" ? "" : v); setPage(1); }}
                >
                  <SelectTrigger className="w-[140px] h-9 text-sm">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="revoked">Revoked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Type:</span>
                <Select
                  value={typeFilter || "__all__"}
                  onValueChange={(v) => { setTypeFilter(v === "__all__" ? "" : v); setPage(1); }}
                >
                  <SelectTrigger className="w-[160px] h-9 text-sm">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Types</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Per page:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}
                >
                  <SelectTrigger className="w-[80px] h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { refetch(); refetchStats(); }} className="text-xs">
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
              </Button>
              <span className="text-xs text-muted-foreground ml-auto">
                {pagination?.totalCount || 0} total
              </span>
            </CardContent>
          </Card>
        </motion.div>

        {/* Scholarships Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
              ) : filteredScholarships.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No scholarships found</p>
                  <p className="text-sm mt-1">
                    {searchQuery || statusFilter || typeFilter
                      ? "Try adjusting your filters"
                      : "Click \"Grant Scholarship\" to create the first one"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Granted By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredScholarships.map((s) => {
                      const StatusIcon = statusConfig[s.status]?.icon || Clock;
                      return (
                        <>
                          <TableRow
                            key={s.id}
                            className="cursor-pointer hover:bg-accent/5"
                            onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)}
                          >
                            <TableCell>
                              {expandedRow === s.id ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                                  <User className="w-4 h-4 text-accent" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {s.user?.fullName || s.user?.username || "Unknown"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {s.user?.email || ""}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={s.type === "course" ? "bg-blue-500/10 text-blue-500 border-blue-500/30" : "bg-purple-500/10 text-purple-500 border-purple-500/30"}
                              >
                                {s.type === "course" ? (
                                  <BookOpen className="w-3 h-3 mr-1" />
                                ) : (
                                  <GraduationCap className="w-3 h-3 mr-1" />
                                )}
                                {s.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              <span className="text-sm font-medium">{s.itemTitle}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusConfig[s.status]?.variant || "outline"} className="flex items-center gap-1 w-fit">
                                <StatusIcon className="w-3 h-3" />
                                {statusConfig[s.status]?.label || s.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {s.grantedByUser?.fullName || s.grantedByUser?.username || "—"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDate(s.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {s.status === "pending" && (
                                  <>
                                    <Button
                                      variant="gold"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        approveScholarship({ variables: { id: s.id } });
                                      }}
                                      disabled={approving}
                                      className="h-8 text-xs"
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setRevokeTarget(s);
                                        setRevokeReason("");
                                      }}
                                      className="h-8 text-xs border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    >
                                      <XCircle className="w-3.5 h-3.5 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                                {s.status === "active" && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRevokeTarget(s);
                                      setRevokeReason("");
                                    }}
                                    className="h-8 text-xs"
                                  >
                                    <Ban className="w-3.5 h-3.5 mr-1" />
                                    Revoke
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Expanded row — detail */}
                          {expandedRow === s.id && (
                            <TableRow key={`${s.id}-detail`}>
                              <TableCell colSpan={8} className="bg-accent/5 p-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-xs text-muted-foreground font-medium">Scholarship ID</p>
                                    <p className="font-mono text-xs">{s.id}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground font-medium">Item ID</p>
                                    <p className="font-mono text-xs">{s.itemId}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground font-medium">Student ID</p>
                                    <p className="font-mono text-xs">{s.userId}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground font-medium">Granted By</p>
                                    <p className="font-mono text-xs">{s.grantedBy}</p>
                                  </div>
                                  {s.reason && (
                                    <div className="col-span-full">
                                      <p className="text-xs text-muted-foreground font-medium">Reason</p>
                                      <p className="text-sm">{s.reason}</p>
                                    </div>
                                  )}
                                  {(s.grantedLatitude != null || s.grantedCity) && (
                                    <div className="col-span-full space-y-2">
                                      <div className="flex items-center justify-between">
                                        <p className="text-xs text-muted-foreground font-medium">Granted From</p>
                                        <p className="text-sm flex items-center gap-1.5">
                                          <MapPin className="w-3.5 h-3.5 text-accent" />
                                          <span className="font-medium">{[s.grantedCity, s.grantedCountry].filter(Boolean).join(', ')}</span>
                                          {s.grantedLatitude != null && s.grantedLongitude != null && !s.grantedCity && (
                                            <span className="text-muted-foreground font-mono text-xs">
                                              {s.grantedLatitude.toFixed(4)}, {s.grantedLongitude.toFixed(4)}
                                            </span>
                                          )}
                                        </p>
                                      </div>
                                      {s.grantedLatitude != null && s.grantedLongitude != null && (
                                        <div className="rounded-xl overflow-hidden border border-border/40 shadow-sm">
                                          <MapContainer
                                            center={[s.grantedLatitude, s.grantedLongitude]}
                                            zoom={13}
                                            scrollWheelZoom={false}
                                            dragging={false}
                                            style={{ height: "180px", width: "100%", background: "#b5d0d9" }}
                                            zoomControl={false}
                                            doubleClickZoom={false}
                                            touchZoom={false}
                                            keyboard={false}
                                          >
                                            <TileLayer
                                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            <Marker
                                              position={[s.grantedLatitude, s.grantedLongitude]}
                                              icon={scholarshipMarkerIcon}
                                            >
                                              <Popup>
                                                <div className="text-sm font-medium px-0.5 py-0.5">
                                                  <p className="flex items-center gap-1.5">
                                                    <Award className="w-4 h-4 text-amber-500" />
                                                    Scholarship Granted Here
                                                  </p>
                                                  <p className="text-xs text-muted-foreground mt-1">
                                                    {[s.grantedCity, s.grantedCountry].filter(Boolean).join(', ') || `${s.grantedLatitude?.toFixed(4)}, ${s.grantedLongitude?.toFixed(4)}`}
                                                  </p>
                                                </div>
                                              </Popup>
                                            </Marker>
                                          </MapContainer>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {s.status === "pending" && (
                                <>
                                  <div className="col-span-2">
                                    <p className="text-xs text-muted-foreground font-medium">Status</p>
                                    <p className="text-sm text-amber-500 flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" />
                                      Pending super admin approval
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground font-medium">Granted By</p>
                                    <p className="text-sm">{s.grantedByUser?.fullName || s.grantedBy || "—"}</p>
                                  </div>
                                </>
                              )}
                              {s.status === "revoked" && (
                                    <>
                                      <div className="col-span-2">
                                        <p className="text-xs text-muted-foreground font-medium">Revoked Reason</p>
                                        <p className="text-sm text-destructive flex items-center gap-1">
                                          <AlertTriangle className="w-3.5 h-3.5" />
                                          {s.revokedReason || "No reason provided"}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground font-medium">Revoked By</p>
                                        <p className="text-sm">{s.revokedByUser?.username || s.revokedBy || "—"}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground font-medium">Revoked At</p>
                                        <p className="text-sm flex items-center gap-1">
                                          <Calendar className="w-3 h-3 text-muted-foreground" />
                                          {formatDate(s.revokedAt || "")}
                                        </p>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {/* Pagination */}
              {pagination && totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Pagination className="w-auto mx-0">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }}
                          className={page <= 1 ? "pointer-events-none opacity-40" : ""}
                        />
                      </PaginationItem>
                      {pageNumbers.map((p, idx) =>
                        p === "..." ? (
                          <PaginationItem key={`ellipsis-${idx}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={p}>
                            <PaginationLink
                              href="#"
                              isActive={p === page}
                              onClick={(e) => { e.preventDefault(); setPage(p as number); }}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }}
                          className={page >= totalPages ? "pointer-events-none opacity-40" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Grant Scholarship Dialog */}
      <ScholarshipDialog
        open={showGrantDialog}
        onOpenChange={(open) => {
          setShowGrantDialog(open);
          if (!open) {
            refetch();
            refetchStats();
          }
        }}
      />

      {/* Reject / Revoke Scholarship Dialog */}
      <Dialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {revokeTarget?.status === 'pending' ? (
                <><XCircle className="w-5 h-5 text-destructive" /> Reject Scholarship</>
              ) : (
                <><Ban className="w-5 h-5 text-destructive" /> Revoke Scholarship</>
              )}
            </DialogTitle>
            <DialogDescription>
              {revokeTarget?.status === 'pending' ? (
                <>This will reject the {revokeTarget?.type} scholarship request for{" "}
                <strong>{revokeTarget?.user?.fullName || revokeTarget?.user?.username}</strong>{" "}
                on <strong>{revokeTarget?.itemTitle}</strong>. The student will be notified.</>
              ) : (
                <>This will revoke the {revokeTarget?.type} scholarship for{" "}
                <strong>{revokeTarget?.user?.fullName || revokeTarget?.user?.username}</strong>{" "}
                on <strong>{revokeTarget?.itemTitle}</strong>.</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-sm">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              <span className="text-muted-foreground">
                {revokeTarget?.status === 'pending'
                  ? 'The student will be notified that their scholarship request has been rejected. This action cannot be undone.'
                  : 'The student will be notified and will lose access to the scholarship benefits. This action cannot be undone.'}
              </span>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {revokeTarget?.status === 'pending' ? 'Reason for Rejection *' : 'Reason for Revocation *'}
              </label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder={revokeTarget?.status === 'pending'
                  ? "e.g., Student doesn't meet eligibility requirements..."
                  : "e.g., Student no longer meets eligibility criteria..."}
                className="w-full min-h-[80px] rounded-lg border border-border/50 bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-destructive/50"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeTarget(null)} disabled={revoking}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={!revokeReason.trim() || revoking}
            >
              {revoking ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {revokeTarget?.status === 'pending' ? 'Rejecting...' : 'Revoking...'}</>
              ) : revokeTarget?.status === 'pending' ? (
                <><XCircle className="w-4 h-4 mr-2" /> Reject Scholarship</>
              ) : (
                <><Ban className="w-4 h-4 mr-2" /> Revoke Scholarship</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
