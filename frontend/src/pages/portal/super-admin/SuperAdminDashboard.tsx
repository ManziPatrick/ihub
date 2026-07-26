import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Users,
  Settings,
  BarChart3,
  Globe,
  Database,
  Lock,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Server,
  BookOpen,
  DollarSign,
  GraduationCap,
  UserCog,
  ClipboardList,
  Award,
  Wallet,
  Banknote,
  Percent,
  Landmark,
  ArrowLeftRight,
  Send,
  Download,
  Loader2,
  CircleAlert,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useQuery } from "@apollo/client/react";
import { GET_ADMIN_DASHBOARD_DATA, GET_RECENT_ACTIVITY, GET_USERS, GET_ANALYTICS, GET_STATS, GET_ALL_TRAINERS, GET_DISBURSEMENT_STATS, GET_INTOUCH_BALANCE, GET_PAWAPAY_STATUS, GET_PAWAPAY_BALANCE } from "@/lib/graphql/queries";
import { format, isValid } from "date-fns";

// Currency → country mapping with flags for wallet display
const CURRENCY_MAP: Record<string, { flag: string; name: string; country: string; currency: string }> = {
  RWF: { flag: '🇷🇼', name: 'Rwandan Franc', country: 'Rwanda', currency: 'RWF' },
  KES: { flag: '🇰🇪', name: 'Kenyan Shilling', country: 'Kenya', currency: 'KES' },
  UGX: { flag: '🇺🇬', name: 'Ugandan Shilling', country: 'Uganda', currency: 'UGX' },
  TZS: { flag: '🇹🇿', name: 'Tanzanian Shilling', country: 'Tanzania', currency: 'TZS' },
  GHS: { flag: '🇬🇭', name: 'Ghanaian Cedi', country: 'Ghana', currency: 'GHS' },
  NGN: { flag: '🇳🇬', name: 'Nigerian Naira', country: 'Nigeria', currency: 'NGN' },
  ZMW: { flag: '🇿🇲', name: 'Zambian Kwacha', country: 'Zambia', currency: 'ZMW' },
  XAF: { flag: '🇨🇲', name: 'CFA Franc BEAC', country: 'Cameroon', currency: 'XAF' },
  XOF: { flag: '🇨🇮', name: 'CFA Franc BCEAO', country: 'Côte d\'Ivoire', currency: 'XOF' },
  CDF: { flag: '🇨🇩', name: 'Congolese Franc', country: 'DR Congo', currency: 'CDF' },
  MWK: { flag: '🇲🇼', name: 'Malawian Kwacha', country: 'Malawi', currency: 'MWK' },
  ETB: { flag: '🇪🇹', name: 'Ethiopian Birr', country: 'Ethiopia', currency: 'ETB' },
  MZN: { flag: '🇲🇿', name: 'Mozambican Metical', country: 'Mozambique', currency: 'MZN' },
  LSL: { flag: '🇱🇸', name: 'Lesotho Loti', country: 'Lesotho', currency: 'LSL' },
  SLE: { flag: '🇸🇱', name: 'Sierra Leonean Leone', country: 'Sierra Leone', currency: 'SLE' },
  SOS: { flag: '🇸🇴', name: 'Somali Shilling', country: 'Somalia', currency: 'SOS' },
};

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data, loading, refetch: refetchDashboard } = useQuery(GET_ADMIN_DASHBOARD_DATA);
  const { data: usersData, refetch: refetchUsers } = useQuery(GET_USERS);
  const { data: activityData, loading: recentActivityLoading, refetch: refetchActivity } = useQuery(GET_RECENT_ACTIVITY, {
  });

  const { data: analyticsData, refetch: refetchAnalytics } = useQuery(GET_ANALYTICS);
  const { data: statsData, refetch: refetchStats } = useQuery(GET_STATS);
  const { data: trainersData, refetch: refetchTrainers } = useQuery(GET_ALL_TRAINERS);
  const { data: disbStatsData, loading: disbStatsLoading, refetch: refetchDisbStats } = useQuery(GET_DISBURSEMENT_STATS, {
  });
  const { data: balanceData, loading: balanceLoading, error: intouchBalanceError, refetch: refetchIntouchBalance } = useQuery(GET_INTOUCH_BALANCE, {
    fetchPolicy: "network-only",
  });
  const { data: pawapayData, loading: pawapayLoading, error: pawapayStatusError, refetch: refetchPawaPayStatus } = useQuery(GET_PAWAPAY_STATUS, {
  });
  const { data: pawapayBalanceData, loading: pawapayBalanceLoading, error: pawapayBalanceError, refetch: refetchPawaPayBalance } = useQuery(GET_PAWAPAY_BALANCE, {
    fetchPolicy: "network-only",
  });
  const analytics = (analyticsData as any)?.analytics;
  const disbStats = (disbStatsData as any)?.getDisbursementStats;
  const intouchBalance: any = (balanceData as any)?.getIntouchBalance;
  const pawapayStatus: any = (pawapayData as any)?.getPawaPayStatus;
  const pawapayBalance: any = (pawapayBalanceData as any)?.getPawaPayBalance;

  // Use GET_STATS for accurate global counts (bypasses adminDashboardData bugs)
  const globalStats = (statsData as any)?.stats;
  const dashboardData = (data as any)?.adminDashboardData || { 
      stats: { totalUsers: 0, totalCourses: 0, totalStudents: 0, totalRevenue: 0 },
      recentEnrollments: [],
      coursePerformance: []
  };
  // Fallback to adminDashboardData if GET_STATS is not implemented on the backend
  const liveStats = globalStats || dashboardData.stats;
  const allTrainers = (trainersData as any)?.getAllTrainers || [];
  
  const allAdmins = ((usersData as any)?.users?.items || []).filter((u: any) => u.role === "admin" || u.role === "super_admin");
  const recentActivity = (activityData as any)?.recentActivity || [];

  const parseSafeDate = (timestamp: any) => {
    if (!timestamp) return new Date();
    const date = new Date(!isNaN(Number(timestamp)) ? Number(timestamp) : timestamp);
    return isValid(date) ? date : new Date();
  };

  const systemStats = [
    { label: "Total Users", value: liveStats.totalUsers.toString(), icon: Users },
    { label: "Active Courses", value: liveStats.totalCourses.toString(), icon: BookOpen },
    { label: "Total Students", value: liveStats.totalStudents.toString(), icon: GraduationCap },
    { label: "Trainers", value: allTrainers.length.toString(), icon: UserCog },
    { label: "Total Revenue (RWF)", value: liveStats.totalRevenue.toLocaleString(), icon: DollarSign },
  ];

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
            <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground flex items-center gap-3">
              <Shield className="w-8 h-8 text-accent" />
              Super Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Full system oversight and configuration
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              setIsRefreshing(true);
              Promise.all([
                refetchDashboard(),
                refetchUsers(),
                refetchActivity(),
                refetchAnalytics(),
                refetchStats(),
                refetchTrainers(),
                refetchDisbStats(),
                refetchIntouchBalance(),
                refetchPawaPayStatus(),
                refetchPawaPayBalance(),
              ]).then(() => {
                toast.success("Dashboard refreshed");
              }).catch(() => {
                toast.error("Failed to refresh dashboard");
              }).finally(() => {
                setIsRefreshing(false);
              });
            }} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="outline">
              <Database className="w-4 h-4 mr-2" />
              Backup System
            </Button>
            <Button variant="gold">
              <Settings className="w-4 h-4 mr-2" />
              System Settings
            </Button>
          </div>
        </motion.div>

        {/* System Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
        >
          {systemStats.map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                    <p className="text-xs text-card-foreground/60">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* ─── Platform Balance ─────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-medium text-foreground flex items-center gap-2">
              <Landmark className="w-5 h-5 text-accent" />
              Platform Balance
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/portal/super-admin/disbursements">
                  <ArrowLeftRight className="w-4 h-4 mr-1.5" />
                  Disbursements
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/portal/super-admin/intouch-pay">
                  <Send className="w-4 h-4 mr-1.5" />
                  Send Money
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {/* ── PawaPay Wallet Section ── */}
            <Card className="border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-emerald-500/[0.02]">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${pawapayStatus?.connected ? 'bg-emerald-500/20 text-emerald-600' : 'bg-amber-500/20 text-amber-600'}`}>
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">PawaPay Wallet</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {pawapayStatusError ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span className="text-[11px] font-medium text-red-500">Error</span>
                            <button
                              onClick={() => refetchPawaPayStatus()}
                              className="text-[10px] text-red-500/80 hover:text-red-500 underline ml-1"
                            >
                              Retry
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className={`w-1.5 h-1.5 rounded-full ${pawapayStatus?.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <span className={`text-[11px] font-medium ${pawapayStatus?.connected ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {pawapayLoading ? '...' : pawapayStatus?.connected ? 'Connected' : 'Disconnected'}
                            </span>
                          </>
                        )}
                        {pawapayStatus?.activeConfigs > 0 && (
                          <span className="text-[11px] text-muted-foreground ml-1">
                            · {pawapayStatus.activeConfigs} active configs
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wallet balances per currency */}
                {pawapayBalanceError ? (
                  <div className="flex items-start gap-3 py-3">
                    <CircleAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-600">Failed to load balances</p>
                      <p className="text-xs text-red-500/80 mt-0.5">
                        {pawapayBalanceError.message || 'GraphQL query error'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => refetchPawaPayBalance()}
                      className="shrink-0 h-8 px-3 text-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      Retry
                    </Button>
                  </div>
                ) : pawapayBalanceLoading ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading balances...
                  </div>
                ) : pawapayBalance?.success && pawapayBalance.balances?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {pawapayBalance.balances.map((b: any) => {
                      const currencyInfo = CURRENCY_MAP[b.currency as keyof typeof CURRENCY_MAP] || { flag: '💳', name: b.currency, country: b.currency, currency: b.currency };
                      return (
                        <div key={b.currency} className="flex items-center gap-3 p-3 rounded-xl bg-background/60 border border-border/40 hover:border-emerald-500/30 transition-all">
                          <span className="text-2xl">{currencyInfo.flag}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{currencyInfo.country}</p>
                            <p className="text-lg font-bold text-foreground">
                              {b.available?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              <span className="text-xs font-normal text-muted-foreground ml-1">{b.currency}</span>
                            </p>
                            <div className="flex gap-3 mt-0.5">
                              {b.pending != null && b.pending > 0 && (
                                <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                                  <ArrowUp className="w-3 h-3" />
                                  {b.pending?.toLocaleString()} pending
                                </span>
                              )}
                              {b.reserved != null && b.reserved > 0 && (
                                <span className="text-[10px] text-blue-600 flex items-center gap-0.5">
                                  <ArrowDown className="w-3 h-3" />
                                  {b.reserved?.toLocaleString()} reserved
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            {currencyInfo.currency}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 py-4 text-sm text-amber-600">
                    <CircleAlert className="w-4 h-4" />
                    {pawapayBalance?.message || 'Wallet balance unavailable'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Summary Cards Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* IntouchPay Balance */}
              <Card className={`border ${intouchBalance?.success ? 'border-blue-500/30 bg-blue-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">IntouchPay Wallet</p>
                      <p className={`text-lg font-bold mt-1 ${intouchBalance?.success ? 'text-blue-600' : 'text-amber-600'}`}>
                        {intouchBalanceError ? (
                          <span className="text-red-500 text-xs font-normal flex items-center gap-1">
                            <CircleAlert className="w-3.5 h-3.5" />
                            Query failed
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => refetchIntouchBalance()}
                              className="h-5 px-1.5 text-[10px] ml-1"
                            >
                              <RefreshCw className="w-3 h-3 mr-0.5" />
                              Retry
                            </Button>
                          </span>
                        ) : balanceLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : intouchBalance?.success ? (
                          <>{intouchBalance.balance?.toLocaleString() || '0'} <span className="text-xs font-normal text-muted-foreground">{intouchBalance.currency || 'RWF'}</span></>
                        ) : (
                          'Unavailable'
                        )}
                      </p>
                      <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-[11px] text-blue-600" asChild>
                        <Link to="/portal/super-admin/intouch-pay">
                          Manage <ExternalLink className="w-3 h-3 ml-0.5" />
                        </Link>
                      </Button>
                    </div>
                    <div className="p-2 rounded-full bg-blue-500/20 text-blue-600">
                      <Download className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Disbursed */}
              <Card className="border border-purple-500/30 bg-purple-500/5">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Total Disbursed</p>
                      <p className="text-lg font-bold text-purple-600 mt-1">
                        {disbStatsLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>{disbStats?.totalDisbursed?.toLocaleString() || '0'} <span className="text-xs font-normal text-muted-foreground">RWF</span></>
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {disbStats?.successfulCount || 0} successful payout{disbStats?.successfulCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="p-2 rounded-full bg-purple-500/20 text-purple-600">
                      <ArrowUp className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Commission Earned */}
              <Card className="border border-indigo-500/30 bg-indigo-500/5">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Commission Earned</p>
                      <p className="text-lg font-bold text-indigo-600 mt-1">
                        {disbStatsLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>{disbStats?.totalCommission?.toLocaleString() || '0'} <span className="text-xs font-normal text-muted-foreground">RWF</span></>
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {disbStats?.pendingToDisburse?.toLocaleString() || '0'} RWF pending
                      </p>
                    </div>
                    <div className="p-2 rounded-full bg-indigo-500/20 text-indigo-600">
                      <Percent className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* On Hold */}
              <Card className="border border-amber-500/30 bg-amber-500/5">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">On Hold</p>
                      <p className="text-lg font-bold text-amber-600 mt-1">
                        {disbStatsLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>{disbStats?.onHoldCount || 0} <span className="text-xs font-normal text-muted-foreground">disbursements</span></>
                        )}
                      </p>
                      <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-[11px] text-amber-600" asChild>
                        <Link to="/portal/super-admin/disbursements">
                          Review <ExternalLink className="w-3 h-3 ml-0.5" />
                        </Link>
                      </Button>
                    </div>
                    <div className="p-2 rounded-full bg-amber-500/20 text-amber-600">
                      <CircleAlert className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Admin Accounts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent" />
                  Admin Accounts
                </CardTitle>
                <Button variant="outline" size="sm">Add Admin</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allAdmins.slice(0, 5).map((admin: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-background/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          admin.role === "super_admin" ? "bg-red-500/20" : "bg-purple-500/20"
                        }`}>
                          <Shield className={`w-5 h-5 ${
                            admin.role === "super_admin" ? "text-red-400" : "text-purple-400"
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-card-foreground">{admin.username}</p>
                          <p className="text-sm text-card-foreground/60">{admin.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-medium ${
                          admin.role === "super_admin" ? "text-red-400" : "text-purple-400"
                        }`}>
                          {admin.role.replace("_", " ").toUpperCase()}
                        </p>
                        <p className="text-xs text-card-foreground/60">{format(parseSafeDate(admin.createdAt), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </motion.div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* System Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-heading flex items-center gap-2">
                    <Activity className="w-5 h-5 text-accent" />
                    System Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                  {recentActivityLoading ? (
                    <div className="text-center py-4 text-xs text-muted-foreground animate-pulse">Loading updates...</div>
                  ) : recentActivity.length === 0 ? (
                    <div className="text-center py-4 text-xs text-muted-foreground">No recent activity.</div>
                  ) : (
                    recentActivity.map((log: any, i: number) => (
                      <div key={i} className="flex flex-col p-2 bg-background/30 rounded-md gap-1 border-l-2 border-accent/30">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-card-foreground font-semibold uppercase tracking-wider">{log.username}</span>
                          <span className="text-card-foreground/40">
                            {format(parseSafeDate(log.timestamp), 'HH:mm:ss')}
                          </span>
                        </div>
                        <p className="text-xs text-card-foreground/80 font-medium">
                          {log.action.replace('_', ' ')}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* System Snapshot */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="border-border/50 bg-accent/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-heading flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    System Snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-background/50 rounded-xl border border-border/20">
                      <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Graduates</p>
                      <p className="text-lg font-black text-accent">{analytics?.internshipStats?.graduated || 0}</p>
                    </div>
                    <div className="p-3 bg-background/50 rounded-xl border border-border/20">
                      <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Enrolled</p>
                      <p className="text-lg font-black text-blue-400">{analytics?.internshipStats?.enrolled || 0}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Projects Finished</span>
                      <span className="font-bold">{analytics?.projectStats?.completed || 0}</span>
                    </div>
                    <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent" 
                        style={{ width: `${(analytics?.projectStats?.completed / analytics?.projectStats?.total * 100) || 0}%` }} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-heading">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start">
                    <Globe className="w-4 h-4 mr-2 text-accent" />
                    View Public Site
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Lock className="w-4 h-4 mr-2 text-accent" />
                    Security Settings
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link to="/portal/super-admin/system-report">
                      <ClipboardList className="w-4 h-4 mr-2 text-accent" />
                      Full System Audit Report
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link to="/portal/super-admin/performance">
                      <Award className="w-4 h-4 mr-2 text-gold" />
                      Performance Report
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <TrendingUp className="w-4 h-4 mr-2 text-accent" />
                    Market Growth Data
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
