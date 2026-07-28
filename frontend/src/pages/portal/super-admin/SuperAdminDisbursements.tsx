import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@apollo/client/react";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { PortalLayout } from "@/components/portal/PortalLayout";
import {
  GET_ALL_DISBURSEMENTS,
  GET_DISBURSEMENT_STATS,
  GET_PLATFORM_COMMISSION_CONFIG,
  GET_INTOUCH_BALANCE,
  GET_HOLD_DAYS_CONFIG,
} from "@/lib/graphql/queries";
import {
  RETRY_DISBURSEMENT,
  VOID_DISBURSEMENT,
  TOGGLE_AUTO_DISBURSEMENT,
  UPDATE_PLATFORM_COMMISSION_CONFIG,
  MANUAL_DISBURSE,
  APPROVE_DISBURSEMENT,
  FORCE_APPROVE_DISBURSEMENT,
  SET_DISBURSEMENT_PRIMARY_PROVIDER,
  SET_HOLD_DAYS_CONFIG,
} from "@/lib/graphql/mutations";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DialogTrigger,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Loader2,
  DollarSign,
  Send,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Banknote,
  Users,
  TrendingUp,
  Percent,
  Settings,
  RotateCcw,
  Activity,
  ShieldAlert,
  Ban,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Filter,
  Search,
  Wallet,
  Globe,
  Zap,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

// ─── Types ──────────────────────────────────────────────────────────────

interface DisbursementItem {
  id: string;
  paymentId: string;
  customerId: string;
  ownerId: string;
  ownerPhone: string;
  itemId: string;
  itemType: string;
  grossAmount: number;
  platformCommission: number;
  commissionType: string;
  commissionValue: number;
  netAmount: number;
  status: "Pending" | "Processing" | "Successful" | "Failed" | "OnHold";
  releaseDate?: string;
  approvedBy?: string;
  approvedAt?: string;
  holdNote?: string;
  intouchTransactionRef?: string;
  intouchReferenceId?: string;
  failureReason?: string;
  retryCount: number;
  autoDisbursement: boolean;
  statusHistory: { status: string; timestamp: string; note?: string }[];
  createdAt: string;
  updatedAt: string;
}

interface DisbursementStats {
  totalDisbursements: number;
  onHoldCount: number;
  pendingCount: number;
  processingCount: number;
  successfulCount: number;
  failedCount: number;
  totalDisbursed: number;
  totalCommission: number;
  pendingToDisburse: number;
}

interface PlatformConfig {
  type: string;
  value: number;
  autoDisbursement: boolean;
  disbursementPrimaryProvider?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  OnHold: { label: "On Hold", variant: "outline", icon: ShieldAlert },
  Pending: { label: "Pending", variant: "outline", icon: Clock },
  Processing: { label: "Processing", variant: "secondary", icon: Activity },
  Successful: { label: "Successful", variant: "default", icon: CheckCircle },
  Failed: { label: "Failed", variant: "destructive", icon: XCircle },
};

const itemTypeIcons: Record<string, any> = {
  course: "📚",
  internship: "💼",
  manual: "✋",
};

function formatCurrency(amount: number): string {
  return (amount || 0).toLocaleString() + " RWF";
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "MMM dd, yyyy HH:mm");
  } catch {
    return dateStr;
  }
}

// ─── Component ──────────────────────────────────────────────────────────

export default function SuperAdminDisbursements() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("disbursements");

  // ── Disbursements Tab ──────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const LIMIT = 20;

  const { data: disbData, loading: disbLoading, refetch: refetchDisb } = usePaginatedQuery(GET_ALL_DISBURSEMENTS, {
    variables: { page, limit: LIMIT, status: statusFilter || undefined },
  });
  const { data: statsData, loading: statsLoading, refetch: refetchStats } = usePaginatedQuery(GET_DISBURSEMENT_STATS, {});
  const { data: configData, loading: configLoading, refetch: refetchConfig } = useQuery(GET_PLATFORM_COMMISSION_CONFIG);
  const { data: holdDaysData, refetch: refetchHoldDays } = useQuery(GET_HOLD_DAYS_CONFIG);
  const { data: balanceData, loading: balanceLoading, refetch: refetchBalance } = useQuery(GET_INTOUCH_BALANCE, {
    fetchPolicy: "network-only",
  });

  const balance: any = (balanceData as any)?.getIntouchBalance;

  const [retryDisbursement, { loading: retrying }] = useMutation(RETRY_DISBURSEMENT);
  const [voidDisbursement, { loading: voiding }] = useMutation(VOID_DISBURSEMENT);
  const [approveDisbursement, { loading: approving }] = useMutation(APPROVE_DISBURSEMENT);
  const [forceApproveDisbursement, { loading: forceApproving }] = useMutation(FORCE_APPROVE_DISBURSEMENT);
  const [setHoldDaysConfig, { loading: settingHoldDays }] = useMutation(SET_HOLD_DAYS_CONFIG);
  const [toggleAutoDisb, { loading: toggling }] = useMutation(TOGGLE_AUTO_DISBURSEMENT);
  const [updatePlatformConfig, { loading: updatingConfig }] = useMutation(UPDATE_PLATFORM_COMMISSION_CONFIG);
  const [setPrimaryProvider, { loading: settingPrimary }] = useMutation(SET_DISBURSEMENT_PRIMARY_PROVIDER, {
    onCompleted: () => {
      toast.success("Primary disbursement provider updated");
      refetchConfig();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update provider");
    },
  });
  const [manualDisburse, { loading: manualDisbursing }] = useMutation(MANUAL_DISBURSE);

  const disbursements: DisbursementItem[] = (disbData as any)?.getAllDisbursements?.items || [];
  const pagination = (disbData as any)?.getAllDisbursements?.pagination || { totalPages: 0, totalCount: 0, hasPreviousPage: false, hasNextPage: false };
  const stats: DisbursementStats = (statsData as any)?.getDisbursementStats;
  const platformConfig: PlatformConfig = (configData as any)?.getPlatformCommissionConfig;
  const holdDays: number = (holdDaysData as any)?.getHoldDaysConfig ?? 15;

  // Manual disburse dialog
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualPaymentId, setManualPaymentId] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualReason, setManualReason] = useState("");

  // Platform config state
  const [configType, setConfigType] = useState("percentage");
  const [configValue, setConfigValue] = useState("10");
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [primaryProvider, setPrimaryProviderState] = useState("pawapay");
  const [holdDaysInput, setHoldDaysInput] = useState("15");

  useEffect(() => {
    if (platformConfig) {
      setConfigType(platformConfig.type);
      setConfigValue(platformConfig.value.toString());
      setAutoEnabled(platformConfig.autoDisbursement);
      if (platformConfig.disbursementPrimaryProvider) {
        setPrimaryProviderState(platformConfig.disbursementPrimaryProvider);
      }
    }
    if (holdDays) {
      setHoldDaysInput(holdDays.toString());
    }
  }, [platformConfig, holdDays]);

  const handleApprove = async (id: string) => {
    try {
      const res = await approveDisbursement({ variables: { id } });
      const result = (res.data as any)?.approveDisbursement;
      if (result.status === "Successful" || result.status === "Processing") {
        toast.success("Disbursement approved and processing!");
      } else {
        toast.error(`Approval failed: ${result.failureReason || "Unknown error"}`);
      }
      refetchDisb();
      refetchStats();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve disbursement");
    }
  };

  const handleForceApprove = async (id: string) => {
    try {
      const res = await forceApproveDisbursement({ variables: { id } });
      const result = (res.data as any)?.forceApproveDisbursement;
      if (result.status === "Successful" || result.status === "Processing") {
        toast.success("⚡ Disbursement force-approved and processing!");
      } else {
        toast.error(`Force approval failed: ${result.failureReason || "Unknown error"}`);
      }
      refetchDisb();
      refetchStats();
    } catch (err: any) {
      toast.error(err.message || "Failed to force-approve disbursement");
    }
  };

  const isReleaseEligible = (releaseDate?: string) => {
    if (!releaseDate) return false;
    try {
      return new Date() >= new Date(releaseDate);
    } catch {
      return false;
    }
  };

  const handleRetry = async (id: string) => {
    try {
      const res = await retryDisbursement({ variables: { id } });
      const result = (res.data as any)?.retryDisbursement;
      if (result.status === "Successful") {
        toast.success("Disbursement retry successful!");
      } else {
        toast.error(`Retry failed: ${result.failureReason || "Unknown error"}`);
      }
      refetchDisb();
      refetchStats();
    } catch (err: any) {
      toast.error(err.message || "Failed to retry disbursement");
    }
  };

  const handleToggleAuto = async (enabled: boolean) => {
    try {
      await toggleAutoDisb({ variables: { enabled } });
      setAutoEnabled(enabled);
      toast.success(`Auto-disbursement ${enabled ? "enabled" : "disabled"}`);
      refetchConfig();
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle auto-disbursement");
    }
  };

  const handleUpdateConfig = async () => {
    try {
      const value = parseFloat(configValue);
      if (isNaN(value) || value < 0) {
        toast.error("Please enter a valid value");
        return;
      }
      if (configType === "percentage" && value > 100) {
        toast.error("Percentage must be <= 100");
        return;
      }
      await updatePlatformConfig({ variables: { type: configType, value } });
      toast.success("Platform commission config updated");
      refetchConfig();
    } catch (err: any) {
      toast.error(err.message || "Failed to update config");
    }
  };

  const handleManualDisburse = async () => {
    if (!manualPaymentId || !manualAmount || !manualPhone) {
      toast.error("Payment ID, amount, and phone number are required");
      return;
    }
    try {
      const amount = parseFloat(manualAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Invalid amount");
        return;
      }
      await manualDisburse({
        variables: {
          paymentId: manualPaymentId,
          amount,
          phoneNumber: manualPhone,
          reason: manualReason || undefined,
        },
      });
      toast.success("Manual disbursement initiated");
      setManualDialogOpen(false);
      setManualPaymentId("");
      setManualAmount("");
      setManualPhone("");
      setManualReason("");
      refetchDisb();
      refetchStats();
    } catch (err: any) {
      toast.error(err.message || "Manual disbursement failed");
    }
  };

  // Pagination controls
  const totalPages = pagination?.totalPages || 1;
  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 2) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  }, [totalPages, page]);

  return (
    <PortalLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Banknote className="w-6 h-6 text-primary" />
              Payment Disbursements
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage automatic and manual disbursements to item owners
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Send className="w-4 h-4 mr-2" />
                  Manual Disburse
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manual Disbursement</DialogTitle>
                  <DialogDescription>
                    Manually send money to an owner via InTouchPay
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Payment ID</Label>
                    <Input
                      value={manualPaymentId}
                      onChange={(e) => setManualPaymentId(e.target.value)}
                      placeholder="Enter payment ID..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (RWF)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      placeholder="e.g. 1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      placeholder="e.g. 0784086021"
                    />
                    <p className="text-xs text-muted-foreground">Rwandan format: 0784XXXXXX or 250784XXXXXX</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Reason (optional)</Label>
                    <Input
                      value={manualReason}
                      onChange={(e) => setManualReason(e.target.value)}
                      placeholder="e.g. Manual payout"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setManualDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleManualDisburse} disabled={manualDisbursing}>
                    {manualDisbursing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Send Disbursement
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* IntouchPay Balance Card */}
        <Card
          className={`bg-gradient-to-br ${
            balance?.success
              ? "from-green-500/10 via-emerald-500/5 to-blue-500/10 border-green-500/20"
              : "from-amber-500/10 via-yellow-500/5 to-amber-500/10 border-amber-500/20"
          }`}
        >
          <CardContent className="p-4">
            {balanceLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : balance ? (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-full ${
                      balance.success
                        ? "bg-green-500/20 text-green-600"
                        : "bg-amber-500/20 text-amber-600"
                    }`}
                  >
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      IntouchPay Wallet Balance
                    </p>
                    <p className="text-2xl font-black tracking-tight">
                      {balance.balance?.toLocaleString() || "0"}{" "}
                      <span className="text-sm font-bold text-muted-foreground">
                        {balance.currency || "RWF"}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!balance.success && balance.message && (
                    <span className="text-xs text-amber-600">{balance.message}</span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetchBalance()}
                    disabled={balanceLoading}
                    className="text-xs"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 mr-1 ${balanceLoading ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs" asChild>
                    <a href="/portal/super-admin/intouch-pay">
                      <Send className="w-3.5 h-3.5 mr-1" />
                      Send Money
                    </a>
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="disbursements" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Disbursements
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Platform Config
            </TabsTrigger>
          </TabsList>

          {/* ─── TAB: Disbursements List ─────────────────────────────── */}
          <TabsContent value="disbursements" className="space-y-4 mt-6">
            {/* Summary Cards */}
            {stats && !statsLoading && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card className="bg-green-500/5 border-green-500/20">
                  <CardContent className="p-3 flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-500 shrink-0" />
                    <div>
                      <p className="text-lg font-bold text-green-500">{stats.successfulCount}</p>
                      <p className="text-xs text-muted-foreground">Successful</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-red-500/5 border-red-500/20">
                  <CardContent className="p-3 flex items-center gap-3">
                    <XCircle className="w-8 h-8 text-red-500 shrink-0" />
                    <div>
                      <p className="text-lg font-bold text-red-500">{stats.failedCount}</p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-purple-500/5 border-purple-500/20">
                  <CardContent className="p-3 flex items-center gap-3">
                    <ShieldAlert className="w-8 h-8 text-purple-500 shrink-0" />
                    <div>
                      <p className="text-lg font-bold text-purple-500">{stats.onHoldCount}</p>
                      <p className="text-xs text-muted-foreground">On Hold ({holdDays || 15}-day)</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-amber-500/5 border-amber-500/20">
                  <CardContent className="p-3 flex items-center gap-3">
                    <Clock className="w-8 h-8 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-lg font-bold text-amber-500">{stats.pendingCount + stats.processingCount}</p>
                      <p className="text-xs text-muted-foreground">Pending/Processing</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-primary shrink-0" />
                    <div>
                      <p className="text-lg font-bold">{formatCurrency(stats.totalDisbursed)}</p>
                      <p className="text-xs text-muted-foreground">Total Disbursed</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Status:</span>
                  </div>
                  <Select value={statusFilter || "__all__"} onValueChange={(v) => { setStatusFilter(v === "__all__" ? "" : v); setPage(1); }}>
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Statuses</SelectItem>
                      <SelectItem value="OnHold">On Hold</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Successful">Successful</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {pagination?.totalCount || 0} total
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                {disbLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : disbursements.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Banknote className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No disbursements found</p>
                    <p className="text-sm mt-1">Disbursements appear here after payments are processed</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8"></TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Owner Phone</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead>Commission</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {disbursements.map((d) => {
                          const StatusIcon = statusConfig[d.status]?.icon || Clock;
                          return (
                            <>
                              <TableRow
                                key={d.id}
                                className="cursor-pointer hover:bg-accent/5"
                                onClick={() => setExpandedRow(expandedRow === d.id ? null : d.id)}
                              >
                                <TableCell>
                                  {expandedRow === d.id ? (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {formatCurrency(d.netAmount)}
                                </TableCell>
                                <TableCell>{d.ownerPhone || "—"}</TableCell>
                                <TableCell>
                                  <span className="flex items-center gap-1">
                                    {itemTypeIcons[d.itemType] || "📦"}
                                    <span className="text-xs text-muted-foreground capitalize">{d.itemType}</span>
                                  </span>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {formatCurrency(d.platformCommission)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={statusConfig[d.status]?.variant || "outline"} className="flex items-center gap-1 w-fit">
                                    <StatusIcon className="w-3 h-3" />
                                    {statusConfig[d.status]?.label || d.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs font-mono max-w-[100px] truncate">
                                  {d.intouchReferenceId || d.intouchTransactionRef || "—"}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {formatDate(d.createdAt)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {d.status === "OnHold" && (
                                      <>
                                        {isReleaseEligible(d.releaseDate) && (
                                          <Button
                                            variant="default"
                                            size="sm"
                                            onClick={(e) => { e.stopPropagation(); handleApprove(d.id); }}
                                            disabled={approving}
                                            title="Approve disbursement release (after hold period)"
                                            className="h-7 text-xs"
                                          >
                                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                            Approve
                                          </Button>
                                        )}
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          onClick={(e) => { e.stopPropagation(); handleForceApprove(d.id); }}
                                          disabled={forceApproving}
                                          title="Force approve — bypass hold period and disburse immediately"
                                          className="h-7 text-xs"
                                        >
                                          <Zap className="w-3.5 h-3.5 mr-1" />
                                          Force
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            const reason = prompt("Reason for voiding this disbursement (optional):");
                                            if (reason !== null) {
                                              try {
                                                await voidDisbursement({ variables: { id: d.id, reason: reason || undefined } });
                                                toast.success("Disbursement voided! Owner will NOT receive payment.");
                                                refetchDisb();
                                                refetchStats();
                                              } catch (err: any) {
                                                toast.error(err.message || "Failed to void disbursement");
                                              }
                                            }
                                          }}
                                          disabled={voiding}
                                          title="Void this disbursement (cancel payout and refund customer)"
                                          className="h-7 text-xs"
                                        >
                                          <Ban className="w-3.5 h-3.5 mr-1" />
                                          Void
                                        </Button>
                                      </>
                                    )}
                                    {d.status === "Failed" && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => { e.stopPropagation(); handleRetry(d.id); }}
                                        disabled={retrying}
                                        title="Retry disbursement"
                                      >
                                        <RotateCcw className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>

                              {/* Expanded row — detail */}
{expandedRow === d.id && (
                                <TableRow key={`${d.id}-detail-${d.status}`}>
                                  <TableCell colSpan={9} className="bg-accent/5 p-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <p className="text-xs text-muted-foreground font-medium">Gross Amount</p>
                                        <p className="font-medium">{formatCurrency(d.grossAmount)}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground font-medium">Platform Commission</p>
                                        <p className="font-medium">{formatCurrency(d.platformCommission)}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground font-medium">Net Disbursed</p>
                                        <p className="font-medium">{formatCurrency(d.netAmount)}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground font-medium">Commission Type</p>
                                        <p className="font-medium capitalize">{d.commissionType} ({d.commissionValue}{d.commissionType === "percentage" ? "%" : " RWF"})</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground font-medium">Payment ID</p>
                                        <p className="font-mono text-xs truncate">{d.paymentId}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground font-medium">Owner ID</p>
                                        <p className="font-mono text-xs truncate">{d.ownerId}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground font-medium">Retry Count</p>
                                        <p className="font-medium">{d.retryCount}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground font-medium">Auto-Disbursement</p>
                                        <Badge variant={d.autoDisbursement ? "default" : "secondary"} className="text-[10px]">
                                          {d.autoDisbursement ? "Enabled" : "Disabled"}
                                        </Badge>
                                      </div>
                                      {d.failureReason && (
                                        <div className="col-span-full">
                                          <p className="text-xs text-muted-foreground font-medium">Failure Reason</p>
                                          <p className="text-sm text-destructive flex items-center gap-1">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            {d.failureReason}
                                          </p>
                                        </div>
                                      )}
                                      {d.statusHistory.length > 0 && (
                                        <div className="col-span-full">
                                          <p className="text-xs text-muted-foreground font-medium mb-1">Status History</p>
                                          <div className="space-y-1">
                                            {d.statusHistory.map((h, idx) => (
                                              <div key={idx} className="flex items-center gap-2 text-xs">
                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                  h.status === "Successful" ? "bg-green-500" :
                                                  h.status === "Failed" ? "bg-red-500" :
                                                  h.status === "Processing" ? "bg-blue-500" :
                                                  "bg-amber-500"
                                                }`} />
                                                <span className="font-medium">{h.status}</span>
                                                <span className="text-muted-foreground">{formatDate(h.timestamp)}</span>
                                                {h.note && <span className="text-muted-foreground">— {h.note}</span>}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
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

                    {/* Pagination */}
                    {totalPages > 1 && (
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
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB: Statistics ──────────────────────────────────────── */}
          <TabsContent value="stats" className="space-y-4 mt-6">
            {statsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-primary" />
                        Total Disbursed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-primary">{formatCurrency(stats.totalDisbursed)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Sent to owners</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Percent className="w-4 h-4 text-muted-foreground" />
                        Total Commission Collected
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{formatCurrency(stats.totalCommission)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Platform revenue share</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-500/5 border-amber-500/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        Pending to Disburse
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-amber-500">{formatCurrency(stats.pendingToDisburse)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Awaiting processing</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Disbursement Status Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                      <div className="p-4 rounded-lg bg-card border text-center">
                        <p className="text-2xl font-bold">{stats.totalDisbursements}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20 text-center">
                        <p className="text-2xl font-bold text-purple-500">{stats.onHoldCount}</p>
                        <p className="text-xs text-muted-foreground">On Hold</p>
                      </div>
                      <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 text-center">
                        <p className="text-2xl font-bold text-amber-500">{stats.pendingCount}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                      <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-center">
                        <p className="text-2xl font-bold text-blue-500">{stats.processingCount}</p>
                        <p className="text-xs text-muted-foreground">Processing</p>
                      </div>
                      <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20 text-center">
                        <p className="text-2xl font-bold text-green-500">{stats.successfulCount}</p>
                        <p className="text-xs text-muted-foreground">Successful</p>
                      </div>
                      <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20 text-center">
                        <p className="text-2xl font-bold text-red-500">{stats.failedCount}</p>
                        <p className="text-xs text-muted-foreground">Failed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-center">
                  <Button variant="ghost" size="sm" onClick={() => refetchStats()} className="text-xs">
                    <RefreshCw className="w-3 h-3 mr-1" /> Refresh Stats
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No statistics available yet</p>
              </div>
            )}
          </TabsContent>

          {/* ─── TAB: Platform Config ─────────────────────────────────── */}
          <TabsContent value="config" className="space-y-4 mt-6">
            {configLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Auto-Disbursement Toggle */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      Auto-Disbursement
                    </CardTitle>
                    <CardDescription>
                      When enabled, owner commissions are automatically sent after each successful payment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${autoEnabled ? "bg-green-500" : "bg-gray-300"}`} />
                        <span className="font-medium">{autoEnabled ? "Enabled" : "Disabled"}</span>
                      </div>
                      <Switch
                        checked={autoEnabled}
                        onCheckedChange={handleToggleAuto}
                        disabled={toggling}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Primary Provider Selector */}
                <Card className="bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-500" />
                      Primary Disbursement Provider
                    </CardTitle>
                    <CardDescription>
                      Choose which provider to try first when sending disbursements. Default is <strong>PawaPay</strong>.
                      If the primary fails, the secondary is tried automatically.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Primary Provider</Label>
                      <Select
                        value={primaryProvider}
                        onValueChange={async (val) => {
                          setPrimaryProviderState(val);
                          try {
                            await setPrimaryProvider({ variables: { provider: val } });
                          } catch {}
                        }}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pawapay">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🌍</span>
                              <div>
                                <span className="font-semibold">PawaPay</span>
                                <p className="text-[10px] text-muted-foreground">20 African countries — MTN, M-Pesa, Airtel, Orange + more</p>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="intouch">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🇷🇼</span>
                              <div>
                                <span className="font-semibold">IntouchPay</span>
                                <p className="text-[10px] text-muted-foreground">Rwanda only — MTN & Airtel Mobile Money</p>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-muted-foreground">
                      <Globe className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>
                        Currently: <strong className="text-foreground">{primaryProvider === 'pawapay' ? '🌍 PawaPay' : '🇷🇼 IntouchPay'}</strong> is primary.
                        {primaryProvider === 'pawapay' ? ' IntouchPay' : ' PawaPay'} is used as fallback if the primary fails.
                      </span>
                    </div>
                    {settingPrimary && (
                      <div className="flex items-center gap-2 text-xs text-blue-500">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Saving...
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      IntouchPay only works for Rwandan phone numbers (MTN, Airtel).
                      PawaPay works for Rwanda and 19 other African countries.
                    </p>
                  </CardContent>
                </Card>

                {/* Commission Config */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Percent className="w-4 h-4 text-primary" />
                      Platform Commission Configuration
                    </CardTitle>
                    <CardDescription>
                      Set the default commission for the platform (applies as fallback when no admin-specific config exists)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Commission Type</Label>
                      <Select value={configType} onValueChange={setConfigType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount (RWF)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        {configType === "percentage" ? "Commission Percentage" : "Fixed Amount (RWF)"}
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          max={configType === "percentage" ? 100 : undefined}
                          step={configType === "percentage" ? 0.5 : 1}
                          value={configValue}
                          onChange={(e) => setConfigValue(e.target.value)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          {configType === "percentage" ? "%" : "RWF"}
                        </span>
                      </div>
                      {configType === "percentage" && (
                        <p className="text-xs text-muted-foreground">Value between 0 and 100</p>
                      )}
                    </div>
                    <Button onClick={handleUpdateConfig} disabled={updatingConfig} className="w-full">
                      {updatingConfig ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Save Configuration
                    </Button>
                  </CardContent>
                </Card>

                {/* Hold Days Config */}
                <Card className="bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-purple-500" />
                      Disbursement Hold Period
                    </CardTitle>
                    <CardDescription>
                      Number of days a disbursement stays On Hold before it can be approved for release.
                      Set to <strong>0</strong> for no hold period (immediate availability).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Hold Days</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={365}
                          value={holdDaysInput}
                          onChange={(e) => setHoldDaysInput(e.target.value)}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">days (0-365)</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Current: <strong>{holdDays || 15} day(s)</strong>. Changes apply to new disbursements.
                      </p>
                    </div>
                    <Button
                      onClick={async () => {
                        const days = parseInt(holdDaysInput, 10);
                        if (isNaN(days) || days < 0 || days > 365) {
                          toast.error("Hold days must be between 0 and 365");
                          return;
                        }
                        try {
                          await setHoldDaysConfig({ variables: { days } });
                          toast.success(`Hold period set to ${days} day(s)`);
                          refetchHoldDays();
                        } catch (err: any) {
                          toast.error(err.message || "Failed to update hold days");
                        }
                      }}
                      disabled={settingHoldDays}
                      className="w-full"
                    >
                      {settingHoldDays ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Save Hold Period
                    </Button>
                  </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-muted-foreground" />
                      How Disbursements Work
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>
                      <strong>1.</strong> Customer makes a successful payment for an item (course, internship, etc.)
                    </p>
                    <p>
                      <strong>2.</strong> The system finds the item owner (instructor/admin) and their registered phone number
                    </p>
                    <p>
                      <strong>3.</strong> Platform commission is calculated based on the configured rate
                    </p>
                    <p>
                      <strong>4.</strong> The disbursement is placed <strong>On Hold</strong> for a {holdDays || 15}-day refund period
                    </p>
                    <p>
                      <strong>5.</strong> After the hold period, a <strong>super admin</strong> can review and approve the release
                    </p>
                    <p>
                      <strong>6.</strong> Super admin can <strong>Force Approve</strong> to bypass the hold period and disburse immediately
                    </p>
                    <p>
                      <strong>7.</strong> Once approved, the owner&apos;s net share is sent via PawaPay (primary) or IntouchPay (fallback)
                    </p>
                    <p>
                      <strong>8.</strong> Failed disbursements can be retried from the Disbursements tab
                    </p>
                    <div className="mt-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                      <p className="font-medium text-foreground flex items-center gap-1">
                        <ShieldAlert className="w-4 h-4 text-amber-500" />
                        {holdDays || 15}-Day Hold Policy:
                      </p>
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
                        <li>All owner disbursements are held for {holdDays || 15} days after payment (configurable above)</li>
                        <li>This allows time to process refunds if any issues occur</li>
                        <li>Only a super admin can approve the release after the hold period</li>
                        <li>Use <strong>Force Approve</strong> (⚡) to bypass the hold period immediately</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PortalLayout>
  );
}
