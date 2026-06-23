import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
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
  Award
} from "lucide-react";
import { Link } from "react-router-dom";

import { useQuery } from "@apollo/client/react";
import { GET_ADMIN_DASHBOARD_DATA, GET_RECENT_ACTIVITY, GET_USERS, GET_ANALYTICS, GET_STATS, GET_ALL_TRAINERS } from "@/lib/graphql/queries";
import { format, isValid } from "date-fns";

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  
  const { data, loading } = useQuery(GET_ADMIN_DASHBOARD_DATA);
  const { data: usersData } = useQuery(GET_USERS);
  const { data: activityData, loading: recentActivityLoading } = useQuery(GET_RECENT_ACTIVITY, {
    pollInterval: 15000
  });

  const { data: analyticsData } = useQuery(GET_ANALYTICS);
  const { data: statsData } = useQuery(GET_STATS);
  const { data: trainersData } = useQuery(GET_ALL_TRAINERS);
  const analytics = (analyticsData as any)?.analytics;

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
