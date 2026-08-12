import { useTranslation } from "react-i18next";
import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  DollarSign,
  GraduationCap,
  ArrowRight,
  Download,
  RefreshCw,
} from "lucide-react";

import { useQuery } from "@apollo/client/react";
import { GET_ADMIN_DASHBOARD_DATA } from "@/lib/graphql/queries";
import { ExportDataDialog } from "@/components/portal/ExportDataDialog";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { data, refetch: refetchDashboard } = useQuery(GET_ADMIN_DASHBOARD_DATA, {
    variables: { createdBy: user?.id },
  });

  const dashboardData = (data as any)?.adminDashboardData || {
      stats: { totalUsers: 0, totalCourses: 0, totalStudents: 0, totalRevenue: 0 },
      recentEnrollments: [],
      coursePerformance: []
  };

  const liveStats = dashboardData.stats;
  const recentEnrollments = dashboardData.recentEnrollments;
  const coursePerformance = dashboardData.coursePerformance;

  const stats = [
    { label: t("portal.totalUsers") || "Total Users", value: liveStats.totalUsers.toString(), icon: Users },
    { label: t("portal.activeCourses") || "Active Courses", value: liveStats.totalCourses.toString(), icon: BookOpen },
    { label: t("portal.students") || "Students", value: liveStats.totalStudents.toString(), icon: GraduationCap },
    { label: t("portal.revenue") || "Revenue ($)", value: liveStats.totalRevenue.toLocaleString(), icon: DollarSign },
  ];

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
            <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
                {t("portal.adminDashboard") || "Admin Dashboard"}
            </h1>
            <p className="text-muted-foreground mt-1">
                {t("portal.adminDashboardDesc") || "Overview"}
            </p>
            </div>
            <div className="flex gap-2">
            <Button variant="outline" onClick={async () => {
                setIsRefreshing(true);
                try {
                  await refetchDashboard();
                  toast.success('Dashboard refreshed!');
                } catch {
                  toast.error('Failed to refresh dashboard');
                } finally {
                  setIsRefreshing(false);
                }
              }} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="outline" onClick={() => setShowExportDialog(true)}>
                <Download className="w-4 h-4 mr-2" />
                Export
            </Button>
            <Link to="/portal/admin/users">
                <Button variant="gold">
                <Users className="w-4 h-4 mr-2" />
                Manage Users
                </Button>
            </Link>
            </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
            {stats.map((stat) => (
            <Card key={stat.label} className="border-border/50">
                <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                    <p className="text-xs text-card-foreground/60 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-accent" />
                    </div>
                </div>
                </CardContent>
            </Card>
            ))}
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Enrollments */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            >
            <Card className="border-border/50 h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-heading">Recent Enrollments</CardTitle>
                <Link to="/portal/admin/payments">
                    <Button variant="ghost" size="sm" className="text-accent">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </Link>
                </CardHeader>
                <CardContent>
                <div className="space-y-4">
                    {recentEnrollments.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-sm">No recent enrollments found.</div>
                    ) : (
                    recentEnrollments.map((enrollment: any, index: number) => (
                    <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
                    >
                        <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <p className="font-medium text-card-foreground">{enrollment.studentName}</p>
                            <p className="text-xs text-card-foreground/60">{enrollment.courseTitle}</p>
                        </div>
                        </div>
                        <div className="text-right">
                        <p className="font-medium text-accent">${enrollment.amount}</p>
                        <p className="text-xs text-card-foreground/60">{enrollment.enrolledAt}</p>
                        </div>
                    </div>
                    )))}
                </div>
                </CardContent>
            </Card>
            </motion.div>

            {/* Course Performance */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            >
            <Card className="border-border/50 h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-heading">Course Performance</CardTitle>
                <Link to="/portal/admin/courses">
                    <Button variant="ghost" size="sm" className="text-accent">
                    Manage Courses <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </Link>
                </CardHeader>
                <CardContent>
                <div className="space-y-4">
                    {coursePerformance.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-sm">No courses found.</div>
                    ) : (
                    coursePerformance.map((course: any, index: number) => (
                    <div
                        key={index}
                        className="p-4 bg-background/50 rounded-lg"
                    >
                        <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-card-foreground">{course.courseTitle}</h4>
                        <span className="text-sm text-accent font-medium">${course.revenue}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="text-card-foreground/60">Students</p>
                            <p className="font-medium text-card-foreground">{course.studentCount}</p>
                        </div>
                        <div>
                            <p className="text-card-foreground/60">Completion</p>
                            <p className="font-medium text-card-foreground">{course.avgCompletion}%</p>
                        </div>
                        <div className="text-right">
                            <Button variant="outline" size="sm">View</Button>
                        </div>
                        </div>
                    </div>
                    )))}
                </div>
                </CardContent>
            </Card>
            </motion.div>
        </div>
      </div>
      <ExportDataDialog open={showExportDialog} onOpenChange={setShowExportDialog} />
    </PortalLayout>
  );
}
