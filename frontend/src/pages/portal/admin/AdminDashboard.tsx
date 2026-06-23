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
  Briefcase,
  TrendingUp,
  ArrowRight,
  Activity,
  DollarSign,
  GraduationCap,
  MessageSquare,
  Download,
} from "lucide-react";

import { useQuery } from "@apollo/client/react";
import { GET_ADMIN_DASHBOARD_DATA, GET_RECENT_ACTIVITY, GET_CONVERSATIONS } from "@/lib/graphql/queries";
import { ExportDataDialog } from "@/components/portal/ExportDataDialog";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { data, loading } = useQuery(GET_ADMIN_DASHBOARD_DATA, {
    variables: { createdBy: user?.id },
  });
  const { data: activityData, loading: recentActivityLoading } = useQuery(GET_RECENT_ACTIVITY, {
    pollInterval: 10000
  });
  const { data: conversationsData } = useQuery(GET_CONVERSATIONS);

  const dashboardData = (data as any)?.adminDashboardData || { 
      stats: { totalUsers: 0, totalCourses: 0, totalStudents: 0, totalRevenue: 0 },
      recentEnrollments: [],
      coursePerformance: []
  };
  
  const liveStats = dashboardData.stats;
  const recentEnrollments = dashboardData.recentEnrollments;
  const coursePerformance = dashboardData.coursePerformance;
  const recentActivity = (activityData as any)?.recentActivity || [];

  const stats = [
    { label: "Total Users", value: liveStats.totalUsers.toString(), change: "+0%", trend: "up", icon: Users },
    { label: "Active Courses", value: liveStats.totalCourses.toString(), change: "+0%", trend: "up", icon: BookOpen },
    { label: "Students", value: liveStats.totalStudents.toString(), change: "+0%", trend: "up", icon: GraduationCap },
    { label: "Revenue ($)", value: liveStats.totalRevenue.toLocaleString(), change: "+0%", trend: "up", icon: DollarSign },
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
                Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
                Platform overview and management
            </p>
            </div>
            <div className="flex gap-2">
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
            {stats.map((stat, index) => (
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
        <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Enrollments */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
            >
            <Card className="border-border/50">
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

            {/* Course Performance */}
            <Card className="border-border/50 mt-6">
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Live Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-heading flex items-center gap-2">
                    <Activity className="w-5 h-5 text-accent" />
                    Live Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
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
                            {new Date(parseInt(log.timestamp) || log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-card-foreground/80 font-medium">
                          {log.action.replace('_', ' ')}
                        </p>
                        {log.details && (
                          <p className="text-[10px] text-card-foreground/50 truncate italic">{log.details}</p>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Conversations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="border-border/50">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-heading flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-accent" />
                    Recent Chats
                  </CardTitle>
                  <Link to="/chat">
                    <Button variant="ghost" size="sm" className="text-accent h-7 px-2">
                       View All
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!(conversationsData as any)?.conversations?.length ? (
                    <div className="text-center py-6 border border-dashed rounded-lg">
                      <p className="text-xs text-muted-foreground">No recent messages</p>
                    </div>
                  ) : (
                    ((conversationsData as any).conversations as any[]).slice(0, 3).map((conv: any) => {
                      const otherParticipant = conv.participants.find((p: any) => p.id !== user?.id);
                      return (
                        <Link to="/chat" key={conv.id}>
                          <div className="p-2 transition-colors hover:bg-accent/5 rounded-lg border border-transparent hover:border-accent/10">
                            <div className="flex justify-between items-start">
                              <p className="font-medium text-xs text-card-foreground">{otherParticipant?.username || 'Chat'}</p>
                              <span className="text-[10px] text-muted-foreground">
                                {conv.lastMessage ? new Date(parseInt(conv.lastMessage.createdAt)).toLocaleDateString() : ''}
                              </span>
                            </div>
                            <p className="text-[10px] text-card-foreground/60 mt-0.5 line-clamp-1">
                              {conv.lastMessage?.content || 'No messages yet'}
                            </p>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
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
                  <Link to="/portal/admin/courses">
                    <Button variant="ghost" className="w-full justify-start">
                      <BookOpen className="w-4 h-4 mr-2 text-accent" />
                      Create New Course
                    </Button>
                  </Link>
                  <Link to="/portal/admin/assignment-reviews">
                    <Button variant="ghost" className="w-full justify-start">
                      <GraduationCap className="w-4 h-4 mr-2 text-accent" />
                      Review Assignments
                    </Button>
                  </Link>
                  <Link to="/portal/admin/internships">
                    <Button variant="ghost" className="w-full justify-start">
                      <Briefcase className="w-4 h-4 mr-2 text-accent" />
                      Manage Internships
                    </Button>
                  </Link>
                  <Link to="/portal/admin/analytics">
                    <Button variant="ghost" className="w-full justify-start">
                      <TrendingUp className="w-4 h-4 mr-2 text-accent" />
                      View Analytics
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
