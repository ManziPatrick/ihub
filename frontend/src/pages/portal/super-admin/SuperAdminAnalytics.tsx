import { useState } from "react";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  Globe,
  Activity,
  Server,
  Zap,
  Star,
  ShieldCheck,
  Trophy,
  Book,
  Download,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format, isValid } from "date-fns";

const COLORS = ['#D4AF37', '#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#EC4899'];

import { useQuery, useLazyQuery } from "@apollo/client/react";
import { GET_ANALYTICS, GET_ADMIN_DASHBOARD_DATA, GET_RECENT_ACTIVITY, GET_TOP_STUDENTS, GET_USERS, GET_COURSES_LITE_SUMMARY, GET_COURSE_ENROLLED_STUDENTS } from "@/lib/graphql/queries";
import { ExportDataDialog } from "@/components/portal/ExportDataDialog";


export default function SuperAdminAnalytics() {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { data: analyticsData, loading: analyticsLoading } = useQuery(GET_ANALYTICS);
  const { data: dashboardData } = useQuery(GET_ADMIN_DASHBOARD_DATA);
  const { data: activityData } = useQuery(GET_RECENT_ACTIVITY, { pollInterval: 15000 });
  const { data: topStudentsData } = useQuery(GET_TOP_STUDENTS, { variables: { limit: 5 } });
  const { data: usersData } = useQuery(GET_USERS, { variables: { limit: 100 } });
  const { data: coursesData } = useQuery(GET_COURSES_LITE_SUMMARY, {
    variables: { limit: 50 },
    fetchPolicy: "cache-first",
  });
  const [fetchStudents, { data: studentsData }] = useLazyQuery(GET_COURSE_ENROLLED_STUDENTS, {
    fetchPolicy: "cache-and-network",
  });

  const analytics = (analyticsData as any)?.analytics;
  const liveStats = (dashboardData as any)?.adminDashboardData?.stats || { totalRevenue: 0, totalUsers: 0, totalCourses: 0 };
  const recentActivityLogs = (activityData as any)?.recentActivity || [];
  const topStudents = (topStudentsData as any)?.getTopStudents || [];
  
  // Try to find the best admins by checking enrolled courses if possible, otherwise just get admins
  const allUsers = (usersData as any)?.users?.items || [];
  const bestAdmins = allUsers
    .filter((u: any) => u.role === 'admin' || u.role === 'super_admin')
    .sort((a: any, b: any) => (b.enrolledCourses?.length || 0) - (a.enrolledCourses?.length || 0))
    .slice(0, 5);
    
  const allCourses = (coursesData as any)?.courses?.items || [];
  const topCourses = [...allCourses].sort((a: any, b: any) => (b.studentsEnrolledCount || 0) - (a.studentsEnrolledCount || 0)).slice(0, 5);

  const monthlyGrowth = analytics ? analytics.userGrowth.map((ug: any, i: number) => ({
    month: ug.label,
    users: ug.value,
    revenue: analytics.revenueGrowth[i]?.value || 0
  })) : [];

  const maxUsers = Math.max(...monthlyGrowth.map((m: any) => m.users), 1);
  const maxRevenue = Math.max(...monthlyGrowth.map((m: any) => m.revenue), 1);

  const globalStats = [
    { label: "Total Revenue", value: liveStats.totalRevenue.toLocaleString() + " RWF", icon: DollarSign },
    { label: "Total Users", value: liveStats.totalUsers.toString(), icon: Users },
    { label: "Active Courses", value: liveStats.totalCourses.toString(), icon: BookOpen },
    { label: "Platform Health", value: "99.9%", icon: Activity },
  ];

  const parseSafeDate = (timestamp: any) => {
    if (!timestamp) return new Date();
    const date = new Date(!isNaN(Number(timestamp)) ? Number(timestamp) : timestamp);
    return isValid(date) ? date : new Date();
  };

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
            <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
              Global Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Live platform metrics and performance tracking
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Live Feed
            </Button>
          </div>
        </motion.div>

        {/* Global Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {globalStats.map((stat) => (
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

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  Growth Trajectory (Users & Revenue)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyGrowth}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '12px' }} />
                      <Legend verticalAlign="top" height={36}/>
                      <Area type="monotone" dataKey="users" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                      <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <Card className="border-border/50 h-full">
              <CardHeader>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <Globe className="w-5 h-5 text-accent" />
                  Global Role Hub
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pt-4">
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.roleDistribution}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analytics?.roleDistribution?.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full mt-6 space-y-3">
                  {analytics?.roleDistribution?.map((role: any, index: number) => (
                    <div key={role.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-muted-foreground font-medium">{role.name}</span>
                      </div>
                      <span className="font-black text-foreground">{role.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Top Performers */}
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card className="border-border/50 h-full">
              <CardHeader>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-accent" />
                  Top Performing Admins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bestAdmins.map((admin: any, index: number) => (
                    <div key={admin.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/30">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-accent/20 text-accent text-xs">
                            {admin.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm text-foreground">{admin.username}</p>
                          <p className="text-xs text-muted-foreground">{admin.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                        {admin.role}
                      </Badge>
                    </div>
                  ))}
                  {bestAdmins.length === 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground">No admin data available.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
            <Card className="border-border/50 h-full">
              <CardHeader>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Top Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topStudents.map((student: any, index: number) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="w-6 text-center font-bold text-muted-foreground">#{index + 1}</div>
                        <Avatar>
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {student.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm text-foreground">{student.username}</p>
                          <p className="text-xs text-muted-foreground">{student.xp || 0} XP</p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30">
                        Level {student.level || 1}
                      </Badge>
                    </div>
                  ))}
                  {topStudents.length === 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground">No student data available.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Top Courses */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Book className="w-5 h-5 text-accent" />
                Top Enrolled Courses & Owner Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-2 gap-4">
                {topCourses.map((course: any, idx: number) => (
                  <div key={course.id} className="flex flex-col gap-3 p-4 bg-background/50 rounded-lg border border-border/30">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-accent/10 flex items-center justify-center text-accent">
                          <Book className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{course.title}</p>
                          <p className="text-xs text-muted-foreground">Owner: {course.instructor?.username || 'System'}</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">{course.level || 'Beginner'}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-border/50 pt-2 mt-1">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">{course.studentsEnrolledCount || 0}</span> Students Enrolled
                      </div>
                      <Popover onOpenChange={(open) => { if (open) fetchStudents({ variables: { courseId: course.id } }); }}>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] uppercase">View List</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 max-h-64 overflow-y-auto" align="end">
                          <h4 className="font-bold text-xs mb-2">Enrolled Students</h4>
                          {(() => {
                            const enrolled = (studentsData as any)?.getCourseEnrolledStudents;
                            if (!enrolled) return <p className="text-xs text-muted-foreground italic">Loading...</p>;
                            if (enrolled.length === 0) return <p className="text-xs text-muted-foreground italic">No students enrolled yet.</p>;
                            return (
                              <ul className="space-y-1">
                                {enrolled.map((student: any) => (
                                  <li key={student.id} className="text-sm py-1 border-b border-border/20 last:border-0 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-accent/50" />
                                    {student.username || 'Unknown User'}
                                  </li>
                                ))}
                              </ul>
                            );
                          })()}
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Admin Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent" />
                Live System Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivityLogs.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">No recent activity detected.</div>
                ) : recentActivityLogs.slice(0, 10).map((activity: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-accent/20`}>
                        <Activity className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground capitalize">{activity.action.replace('_', ' ')}</p>
                        <p className="text-xs text-card-foreground/60">{activity.username}</p>
                      </div>
                    </div>
                    <span className="text-xs text-card-foreground/50">{format(parseSafeDate(activity.timestamp), 'MMM dd, HH:mm')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <ExportDataDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
      />
    </PortalLayout>
  );
}
