import { useState } from "react";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Bug,
  ServerCrash,
  WifiOff,
  Lock,
  CreditCard,
  Upload,
  Calendar,
  Loader2,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  ExternalLink,
  Clock,
  User,
  Eye,
  EyeOff,
  Trash2,
  Shield,
  ChevronDown,
  ChevronUp,
  Copy,
  Activity,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { useToast } from "@/hooks/use-toast";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── GraphQL ─────────────────────────────────────────────────────────────────

const GET_ERROR_REPORTS = gql`
  query GetErrorReports($page: Int, $limit: Int, $status: String, $errorType: String, $severity: String, $search: String) {
    getErrorReports(page: $page, limit: $limit, status: $status, errorType: $errorType, severity: $severity, search: $search) {
      items {
        id
        userId
        username
        errorType
        severity
        message
        stack
        componentName
        operationName
        statusCode
        url
        userAgent
        browserInfo {
          name
          version
          os
          mobile
        }
        context
        status
        resolvedBy {
          id
          username
          fullName
        }
        resolvedAt
        resolution
        occurrenceCount
        fingerprint
        createdAt
        updatedAt
      }
      pagination {
        totalCount
        totalPages
        currentPage
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

const GET_ERROR_REPORT_STATS = gql`
  query GetErrorReportStats {
    getErrorReportStats {
      total
      open
      investigating
      resolved
      dismissed
      critical
      high
      medium
      low
      byType {
        errorType
        count
      }
      byComponent {
        componentName
        count
      }
    }
  }
`;

const RESOLVE_ERROR_REPORT = gql`
  mutation ResolveErrorReport($id: ID!, $resolution: String) {
    resolveErrorReport(id: $id, resolution: $resolution) {
      id
      status
      resolvedBy {
        id
        username
        fullName
      }
      resolvedAt
      resolution
    }
  }
`;

const DELETE_ERROR_REPORT = gql`
  mutation DeleteErrorReport($id: ID!) {
    deleteErrorReport(id: $id)
  }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ERROR_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  graphql: { label: "GraphQL", icon: ServerCrash, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  network: { label: "Network", icon: WifiOff, color: "text-red-500 bg-red-500/10 border-red-500/20" },
  runtime: { label: "Runtime", icon: Bug, color: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
  payment: { label: "Payment", icon: CreditCard, color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
  auth: { label: "Auth", icon: Lock, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  upload: { label: "Upload", icon: Upload, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  meeting: { label: "Meeting", icon: Calendar, color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20" },
  render: { label: "Render", icon: Eye, color: "text-pink-500 bg-pink-500/10 border-pink-500/20" },
  timeout: { label: "Timeout", icon: Clock, color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" },
  unknown: { label: "Unknown", icon: AlertTriangle, color: "text-gray-500 bg-gray-500/10 border-gray-500/20" },
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  critical: { label: "Critical", color: "bg-red-500/15 text-red-600 border-red-500/30" },
  high: { label: "High", color: "bg-orange-500/15 text-orange-600 border-orange-500/30" },
  medium: { label: "Medium", color: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  low: { label: "Low", color: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  open: { label: "Open", icon: AlertTriangle, color: "bg-red-500/10 text-red-600" },
  investigating: { label: "Investigating", icon: Eye, color: "bg-amber-500/10 text-amber-600" },
  resolved: { label: "Resolved", icon: CheckCircle2, color: "bg-green-500/10 text-green-600" },
  dismissed: { label: "Dismissed", icon: XCircle, color: "bg-gray-500/10 text-gray-600" },
};

function getTypeIcon(type: string) {
  return ERROR_TYPE_CONFIG[type]?.icon || AlertTriangle;
}

function getTypeColor(type: string) {
  return ERROR_TYPE_CONFIG[type]?.color || "text-gray-500 bg-gray-500/10 border-gray-500/20";
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SuperAdminErrorReports() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const { data, loading, refetch } = useQuery(GET_ERROR_REPORTS, {
    variables: {
      page,
      limit: 50,
      status: statusFilter || undefined,
      errorType: typeFilter || undefined,
      severity: severityFilter || undefined,
      search: searchQuery || undefined,
    },
    pollInterval: 30000,
    fetchPolicy: "network-only",
  });

  const { data: statsData, loading: statsLoading, refetch: refetchStats } = useQuery(GET_ERROR_REPORT_STATS, {
    pollInterval: 60000,
    fetchPolicy: "network-only",
  });

  const [resolveReport, { loading: resolving }] = useMutation(RESOLVE_ERROR_REPORT, {
    onCompleted: () => {
      toast({ title: "Report resolved", description: "Error report has been marked as resolved." });
      refetch();
      refetchStats();
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const [deleteReport, { loading: deleting }] = useMutation(DELETE_ERROR_REPORT, {
    onCompleted: () => {
      toast({ title: "Report deleted", description: "Error report has been removed." });
      refetch();
      refetchStats();
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const reports = (data as any)?.getErrorReports?.items || [];
  const pagination = (data as any)?.getErrorReports?.pagination || {};
  const stats = (statsData as any)?.getErrorReportStats || {};

  const filteredReports = searchQuery
    ? reports.filter((r: any) =>
        r.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.componentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.operationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : reports;

  // ─── Stat cards ──────────────────────────────────────────────────────

  const statCards = [
    {
      label: "Open",
      count: stats.open || 0,
      color: "text-red-500",
      bg: "bg-red-500/10",
      icon: AlertTriangle,
    },
    {
      label: "Investigating",
      count: stats.investigating || 0,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      icon: Eye,
    },
    {
      label: "Resolved",
      count: stats.resolved || 0,
      color: "text-green-500",
      bg: "bg-green-500/10",
      icon: CheckCircle2,
    },
    {
      label: "Critical",
      count: stats.critical || 0,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      icon: ServerCrash,
    },
    {
      label: "High",
      count: stats.high || 0,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      icon: Bug,
    },
    {
      label: "Total",
      count: stats.total || 0,
      color: "text-accent",
      bg: "bg-accent/10",
      icon: Activity,
    },
  ];

  function getExpandedMessage(message: string) {
    // Show more of the message when expanded
    return message;
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 flex items-center justify-center border border-rose-500/40 shadow-xl shadow-rose-500/5">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <div>
              <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
                Error Reports
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Automatically captured frontend errors — detect user blockers in real time
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { refetch(); refetchStats(); }}
              className="rounded-xl gap-2 border-border/50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          {statCards.map((stat, i) => (
            <Card key={i} className="border-border/50 bg-card/30 backdrop-blur-sm shadow-sm overflow-hidden relative">
              <div className={`absolute top-0 right-0 p-2 opacity-10 ${stat.color}`}>
                <stat.icon className="w-10 h-10" />
              </div>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-card-foreground">{stat.count}</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-3"
        >
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by error message, component, operation, or username..."
              className="pl-9 h-10 rounded-xl border-border/50"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            />
          </div>
          {/* Filter chips */}
          <div className="flex flex-wrap gap-2">
            {/* Status */}
            <div className="flex gap-1 items-center">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mr-1">Status:</span>
              {["", "open", "investigating", "resolved", "dismissed"].map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className="rounded-lg text-[11px] h-7 px-2.5"
                >
                  {s || "All"}
                </Button>
              ))}
            </div>
            {/* Severity */}
            <div className="flex gap-1 items-center">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mr-1">Severity:</span>
              {["", "critical", "high", "medium", "low"].map((s) => (
                <Button
                  key={s}
                  variant={severityFilter === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setSeverityFilter(s); setPage(1); }}
                  className="rounded-lg text-[11px] h-7 px-2.5"
                >
                  {s || "All"}
                </Button>
              ))}
            </div>
            {/* Error type */}
            <div className="flex gap-1 items-center">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mr-1">Type:</span>
              {["", "graphql", "network", "runtime", "payment", "auth"].map((t) => (
                <Button
                  key={t}
                  variant={typeFilter === t ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setTypeFilter(t); setPage(1); }}
                  className="rounded-lg text-[11px] h-7 px-2.5"
                >
                  {t || "All"}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Error Types Distribution */}
        {stats.byType?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="flex flex-wrap gap-2"
          >
            {stats.byType.map((t: any) => {
              const config = ERROR_TYPE_CONFIG[t.errorType];
              const Icon = config?.icon || AlertTriangle;
              return (
                <Badge
                  key={t.errorType}
                  variant="outline"
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs ${config?.color || ''}`}
                >
                  <Icon className="w-3 h-3" />
                  {config?.label || t.errorType}: {t.count}
                </Badge>
              );
            })}
          </motion.div>
        )}

        {/* Error List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/20 py-4">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                Error Reports
                {pagination.totalCount > 0 && (
                  <Badge variant="outline" className="ml-2 text-xs font-bold">
                    {pagination.totalCount} total
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No errors detected</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchQuery || statusFilter || typeFilter || severityFilter
                      ? "Try adjusting your filters"
                      : "Your application is running smoothly — no errors have been reported."}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="divide-y divide-border/10">
                    {filteredReports.map((report: any) => {
                      const isExpanded = expandedId === report.id;
                      const TypeIcon = getTypeIcon(report.errorType);
                      const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.open;
                      const severityCfg = SEVERITY_CONFIG[report.severity] || SEVERITY_CONFIG.low;
                      const StatusIcon = statusCfg.icon;
                      const createdAt = report.createdAt ? new Date(parseInt(report.createdAt)) : new Date();
                      const resolvedAt = report.resolvedAt ? new Date(parseInt(report.resolvedAt)) : null;

                      return (
                        <div key={report.id} className="hover:bg-muted/5 transition-colors">
                          {/* Main row */}
                          <div
                            className="flex items-start gap-4 p-4 cursor-pointer"
                            onClick={() => setExpandedId(isExpanded ? null : report.id)}
                          >
                            {/* Type icon */}
                            <div className={`mt-1 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${getTypeColor(report.errorType)}`}>
                              <TypeIcon className="w-4 h-4" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[11px] font-semibold uppercase tracking-wider ${severityCfg.color.split(' ')[1]}`}>
                                  {severityCfg.label}
                                </span>
                                <Badge variant="outline" className={`text-[9px] uppercase font-bold px-1.5 py-0 leading-none ${severityCfg.color}`}>
                                  {report.errorType}
                                </Badge>
                                {report.occurrenceCount > 1 && (
                                  <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0">
                                    x{report.occurrenceCount}
                                  </Badge>
                                )}
                                <div className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${statusCfg.color}`}>
                                  <StatusIcon className="w-2.5 h-2.5" />
                                  {statusCfg.label}
                                </div>
                              </div>
                              <p className="text-sm font-medium text-foreground mt-1 line-clamp-2">
                                {report.message}
                              </p>
                              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                                {report.operationName && (
                                  <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-[9px]">
                                    {report.operationName}
                                  </span>
                                )}
                                {report.componentName && (
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-2.5 h-2.5" />
                                    {report.componentName}
                                  </span>
                                )}
                                {report.username && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-2.5 h-2.5" />
                                    {report.username}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  {formatDistanceToNow(createdAt, { addSuffix: true })}
                                </span>
                              </div>
                            </div>

                            {/* Expand toggle */}
                            <div className="shrink-0 text-muted-foreground">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </div>

                          {/* Expanded details */}
                          {isExpanded && (
                            <div className="px-4 pb-4 pl-[72px] space-y-3">
                              {/* Stack trace */}
                              {report.stack && (
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Stack Trace</p>
                                  <pre className="text-[10px] font-mono bg-muted/30 p-3 rounded-lg overflow-x-auto max-h-[200px] text-muted-foreground whitespace-pre-wrap break-all">
                                    {report.stack}
                                  </pre>
                                </div>
                              )}

                              {/* Details grid */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">URL</p>
                                  <p className="text-[11px] font-mono truncate text-foreground">{report.url || '—'}</p>
                                </div>
                                {report.statusCode && (
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status Code</p>
                                    <p className="text-[11px] font-mono text-foreground">{report.statusCode}</p>
                                  </div>
                                )}
                                {report.browserInfo?.name && (
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Browser</p>
                                    <p className="text-[11px] text-foreground">
                                      {report.browserInfo.name} {report.browserInfo.version}
                                      {report.browserInfo.mobile ? ' (Mobile)' : ''}
                                    </p>
                                  </div>
                                )}
                                {report.browserInfo?.os && (
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">OS</p>
                                    <p className="text-[11px] text-foreground">{report.browserInfo.os}</p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Created</p>
                                  <p className="text-[11px] text-foreground">{format(createdAt, 'MMM d, yyyy HH:mm:ss')}</p>
                                </div>
                                {resolvedAt && (
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Resolved At</p>
                                    <p className="text-[11px] text-foreground">{format(resolvedAt, 'MMM d, yyyy HH:mm:ss')}</p>
                                  </div>
                                )}
                                {report.resolvedBy && (
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Resolved By</p>
                                    <p className="text-[11px] text-foreground">{report.resolvedBy.fullName || report.resolvedBy.username}</p>
                                  </div>
                                )}
                                {report.resolution && (
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Resolution</p>
                                    <p className="text-[11px] text-foreground">{report.resolution}</p>
                                  </div>
                                )}
                                {report.fingerprint && (
                                  <div className="col-span-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fingerprint</p>
                                    <p className="text-[10px] font-mono text-muted-foreground">{report.fingerprint}</p>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 pt-2 border-t border-border/10">
                                {(report.status === 'open' || report.status === 'investigating') && (
                                  <>
                                    <Input
                                      placeholder="Resolution note (optional)..."
                                      className="h-8 text-xs rounded-lg flex-1"
                                      value={resolutionText[report.id] || ''}
                                      onChange={(e) => setResolutionText(prev => ({ ...prev, [report.id]: e.target.value }))}
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-xs gap-1.5"
                                      onClick={() => {
                                        resolveReport({
                                          variables: {
                                            id: report.id,
                                            resolution: resolutionText[report.id] || undefined,
                                          },
                                        });
                                        setResolutionText(prev => ({ ...prev, [report.id]: '' }));
                                      }}
                                      disabled={resolving}
                                    >
                                      {resolving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 text-green-500" />}
                                      Resolve
                                    </Button>
                                  </>
                                )}
                                {report.status === 'open' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-500"
                                    onClick={() => {
                                      resolveReport({ variables: { id: report.id, resolution: 'Marked as investigating' } });
                                    }}
                                    title="Mark as investigating"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                                        onClick={(e) => { e.stopPropagation(); setDeleteId(report.id); }}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete report</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPreviousPage}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Error Report
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this error report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteReport({ variables: { id: deleteId } });
                  setDeleteId(null);
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
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
