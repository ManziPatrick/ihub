import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Users,
  TrendingUp,
  BookOpen,
  DollarSign,
  GraduationCap,
  UserCog,
  Percent,
  Landmark,
  ArrowLeftRight,
  Send,
  Loader2,
  CircleAlert,
  ArrowUp,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useQuery } from "@apollo/client/react";
import { GET_ADMIN_DASHBOARD_DATA, GET_USERS, GET_ANALYTICS, GET_STATS, GET_ALL_TRAINERS, GET_DISBURSEMENT_STATS, GET_INTOUCH_BALANCE, GET_PAWAPAY_STATUS, GET_PAWAPAY_BALANCE } from "@/lib/graphql/queries";
import { format, isValid } from "date-fns";

export default function SuperAdminDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, refetch: refetchDashboard } = useQuery(GET_ADMIN_DASHBOARD_DATA);
  const { data: usersData, refetch: refetchUsers } = useQuery(GET_USERS);

  const { data: analyticsData, refetch: refetchAnalytics } = useQuery(GET_ANALYTICS);
  const { data: statsData, refetch: refetchStats } = useQuery(GET_STATS);
  const { data: trainersData, refetch: refetchTrainers } = useQuery(GET_ALL_TRAINERS);
  const { data: disbStatsData, loading: disbStatsLoading, refetch: refetchDisbStats } = useQuery(GET_DISBURSEMENT_STATS, {
  });
  const { data: balanceData, loading: balanceLoading, error: intouchBalanceError, refetch: refetchIntouchBalance } = useQuery(GET_INTOUCH_BALANCE, {
    fetchPolicy: "network-only",
  });
  const { data: pawapayData, error: pawapayStatusError, refetch: refetchPawaPayStatus } = useQuery(GET_PAWAPAY_STATUS, {
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

  const pawapayTotal = (pawapayBalance?.balances || []).reduce((s: number, b: any) => s + (b.available || 0), 0);

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

        {/* ─── Platform Balance (condensed strip) ─────────────────────── */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <Landmark className="w-4 h-4 text-accent" />
              Platform Balance
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/portal/super-admin/disbursements">
                  <ArrowLeftRight className="w-3.5 h-3.5 mr-1" />
                  Disbursements
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/portal/super-admin/intouch-pay">
                  <Send className="w-3.5 h-3.5 mr-1" />
                  Send Money
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {/* PawaPay Wallet */}
            <div className="p-3 rounded-xl bg-background/60 border border-emerald-500/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">PawaPay</span>
                {pawapayStatusError ? (
                  <button
                    onClick={() => refetchPawaPayStatus()}
                    className="flex items-center gap-1 text-[10px] text-red-500 underline"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> retry
                  </button>
                ) : (
                  <span className={`w-1.5 h-1.5 rounded-full ${pawapayStatus?.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                )}
              </div>
              <p className="text-base font-bold text-foreground">
                {pawapayBalanceError ? (
                  <button
                    onClick={() => refetchPawaPayBalance()}
                    className="text-[10px] font-normal text-red-500 underline"
                  >
                    failed — retry
                  </button>
                ) : pawapayBalanceLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : pawapayBalance?.success ? (
                  pawapayTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })
                ) : (
                  '—'
                )}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {pawapayBalance?.balances?.length
                  ? `${pawapayBalance.balances.length} currencies`
                  : pawapayStatusError ? 'unavailable'
                  : pawapayStatus?.connected ? 'connected' : 'disconnected'}
              </p>
            </div>

            {/* IntouchPay Balance */}
            <div className="p-3 rounded-xl bg-background/60 border border-blue-500/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">IntouchPay</span>
                <span className={`w-1.5 h-1.5 rounded-full ${intouchBalance?.success ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
              <p className="text-base font-bold text-blue-600">
                {intouchBalanceError ? (
                  <button
                    onClick={() => refetchIntouchBalance()}
                    className="text-[10px] font-normal text-red-500 underline"
                  >
                    failed — retry
                  </button>
                ) : balanceLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : intouchBalance?.success ? (
                  <>{intouchBalance.balance?.toLocaleString() || '0'} <span className="text-[10px] font-normal text-muted-foreground">{intouchBalance.currency || 'RWF'}</span></>
                ) : (
                  'Unavailable'
                )}
              </p>
              <Button variant="link" size="sm" className="h-auto p-0 mt-0.5 text-[10px] text-blue-600" asChild>
                <Link to="/portal/super-admin/intouch-pay">
                  Manage <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                </Link>
              </Button>
            </div>

            {/* Total Disbursed */}
            <div className="p-3 rounded-xl bg-background/60 border border-purple-500/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Disbursed</span>
                <ArrowUp className="w-3 h-3 text-purple-500" />
              </div>
              <p className="text-base font-bold text-purple-600">
                {disbStatsLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>{disbStats?.totalDisbursed?.toLocaleString() || '0'} <span className="text-[10px] font-normal text-muted-foreground">RWF</span></>
                )}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {disbStats?.successfulCount || 0} payouts
              </p>
            </div>

            {/* Commission Earned */}
            <div className="p-3 rounded-xl bg-background/60 border border-indigo-500/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Commission</span>
                <Percent className="w-3 h-3 text-indigo-500" />
              </div>
              <p className="text-base font-bold text-indigo-600">
                {disbStatsLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>{disbStats?.totalCommission?.toLocaleString() || '0'} <span className="text-[10px] font-normal text-muted-foreground">RWF</span></>
                )}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {disbStats?.pendingToDisburse?.toLocaleString() || '0'} RWF pending
              </p>
            </div>

            {/* On Hold */}
            <div className="p-3 rounded-xl bg-background/60 border border-amber-500/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">On Hold</span>
                <CircleAlert className="w-3 h-3 text-amber-500" />
              </div>
              <p className="text-base font-bold text-amber-600">
                {disbStatsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : disbStats?.onHoldCount || 0}
              </p>
              <Button variant="link" size="sm" className="h-auto p-0 mt-0.5 text-[10px] text-amber-600" asChild>
                <Link to="/portal/super-admin/disbursements">
                  Review <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Admin Accounts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="border-border/50 h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent" />
                  Admin Accounts
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/portal/super-admin/admins">Add Admin</Link>
                </Button>
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
            {/* System Snapshot */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
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
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
