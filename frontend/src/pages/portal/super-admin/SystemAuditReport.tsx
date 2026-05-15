import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@apollo/client/react";
import { 
  GET_RECENT_ACTIVITY, 
  GET_INTERNSHIP_TIME_LOGS, 
  GET_ANALYTICS,
  GET_USERS
} from "@/lib/graphql/queries";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  Clock, 
  Users, 
  TrendingUp, 
  BarChart3, 
  Calendar, 
  Download, 
  Search,
  LogIn,
  Layers,
  Shield,
  Loader2,
  ArrowRight
} from "lucide-react";
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
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { Input } from "@/components/ui/input";
import { format, subDays, isSameDay, startOfDay, isValid } from "date-fns";
import { toast } from "sonner";
import { downloadAsCSV } from "@/lib/utils/exportUtils";

const COLORS = ['#D4AF37', '#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#EC4899'];

export default function SystemAuditReport() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Queries
  const { data: activityData, loading: activityLoading } = useQuery(GET_RECENT_ACTIVITY, {
    variables: { limit: 200 } // Fetch more for reporting
  });
  const { data: timeData, loading: timeLoading } = useQuery(GET_INTERNSHIP_TIME_LOGS);
  const { data: analyticsData, loading: analyticsLoading } = useQuery(GET_ANALYTICS);
  const { data: usersData, loading: usersLoading } = useQuery(GET_USERS, {
    variables: { limit: 1000 }
  });

  const activities = (activityData as any)?.recentActivity || [];
  const timeLogs = (timeData as any)?.internshipTimeLogs || [];
  const analytics = (analyticsData as any)?.analytics;
  const allUsers = (usersData as any)?.users?.items || [];

  // Aggregated Stats
  const totalMinutes = timeLogs.reduce((acc: number, log: any) => acc + log.minutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  // Match multiple variants of login or session start
  const loginActions = activities.filter((a: any) => 
    a.action.toUpperCase().includes('LOGIN') || 
    a.action.toUpperCase().includes('AUTH') ||
    a.action.toUpperCase().includes('SESSION') ||
    a.action.toUpperCase().includes('STARTED') ||
    a.action.toUpperCase().includes('REGISTER')
  );
  
  const parseSafeDate = (timestamp: any) => {
    if (!timestamp) return new Date();
    // Try parsing as ISO string or number
    const date = new Date(!isNaN(Number(timestamp)) ? Number(timestamp) : timestamp);
    return isValid(date) ? date : new Date();
  };

  // Login Activity Trend (Last 7 Days)
  const loginTrendData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();
    return days.map(day => {
      const count = loginActions.filter((a: any) => 
        isSameDay(parseSafeDate(a.timestamp), day)
      ).length;
      return {
        label: format(day, 'MMM dd'),
        value: count
      };
    });
  }, [loginActions]);

  // Hourly Activity Distribution
  const hourlyActivityData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map(hour => {
      const count = activities.filter((a: any) => 
        parseSafeDate(a.timestamp).getHours() === hour
      ).length;
      return {
        hour: `${hour}:00`,
        actions: count
      };
    });
  }, [activities]);



  const exportReport = () => {
    const reportData = allUsers.map(u => {
      const userActions = activities.filter((a: any) => a.username === u.username);
      const userHours = (timeLogs.filter((t: any) => t.user?.id === u.id).reduce((acc: number, t: any) => acc + t.minutes, 0) / 60).toFixed(1);
      return {
        Username: u.username,
        Email: u.email,
        Role: u.role,
        TotalActions: userActions.length,
        TotalHoursSpent: userHours,
        JoinedAt: format(parseSafeDate(u.createdAt), 'yyyy-MM-dd')
      };
    });
    
    downloadAsCSV(reportData, "System_Audit_Report");
    toast.success("System report exported successfully");
  };

  if (analyticsLoading || usersLoading) {
    return (
      <PortalLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-gold" />
          <p className="text-muted-foreground font-medium animate-pulse">Aggregating Global System Data...</p>
        </div>
      </PortalLayout>
    );
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
            <div className="w-14 h-14 rounded-2xl bg-gold/20 flex items-center justify-center border border-gold/40 shadow-xl shadow-gold/5">
              <Shield className="w-8 h-8 text-gold" />
            </div>
            <div>
              <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
                Global System Audit
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Full numbers and time analytics across all platform modules.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportReport} className="rounded-xl border-border/50 hover:bg-gold/5">
              <Download className="w-4 h-4 mr-2" />
              Export Full Report
            </Button>
          </div>
        </motion.div>

        {/* Global Numbers Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Platform Users", value: allUsers.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: "Total Logins (Recent)", value: loginActions.length, icon: LogIn, color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { label: "Total Work Hours", value: `${totalHours}h`, icon: Clock, color: 'text-gold', bg: 'bg-gold/10' },
            { label: "Global Engagement", value: `${activities.length}`, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          ].map((stat, i) => (
            <Card key={i} className="border-border/50 bg-card/30 backdrop-blur-sm shadow-sm overflow-hidden relative">
              <div className={`absolute top-0 right-0 p-3 opacity-20 ${stat.color}`}>
                <stat.icon className="w-12 h-12" />
              </div>
              <CardContent className="p-5">
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">{stat.label}</p>
                <h3 className={`text-2xl font-bold ${stat.color}`}>{stat.value}</h3>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Visualizations */}
          <div className="lg:col-span-2 space-y-6">
            {/* Login Trend */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="border-b border-border/20">
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gold" />
                  Recent Login Frequency
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={loginTrendData}>
                      <defs>
                        <linearGradient id="loginGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                      <XAxis 
                        dataKey="label" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '12px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#D4AF37" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#loginGradient)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Course Performance Bar Chart */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="border-b border-border/20">
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  Course Enrollment vs. Revenue
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.courseDistribution}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '12px' }}
                      />
                      <Bar dataKey="value" fill="#D4AF37" name="Students" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Hourly Activity Heatmap (Visualization) */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="border-b border-border/20">
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  Peak Activity Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyActivityData}>
                      <XAxis 
                        dataKey="hour" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '12px' }}
                      />
                      <Bar dataKey="actions" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Live Analytics Table */}
            <Card className="border-border/50 shadow-sm overflow-hidden">
               <CardHeader className="border-b border-border/20 flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg font-heading flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    Global User Audit
                  </CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Audit username..." 
                      className="pl-9 h-9 rounded-xl border-border/50"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
               </CardHeader>
               <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    <div className="divide-y divide-border/20">
                      {allUsers.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase())).map((u: any) => {
                        const userActions = activities.filter((a: any) => a.username === u.username);
                        const userHours = (timeLogs.filter((t: any) => t.user?.id === u.id).reduce((acc: number, t: any) => acc + t.minutes, 0) / 60).toFixed(1);
                        
                        return (
                          <div key={u.id} className="p-4 flex items-center justify-between hover:bg-muted/5 transition-colors group">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-border/50 flex items-center justify-center font-black uppercase text-accent group-hover:bg-accent/20">
                                {u.username.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-sm text-foreground">{u.username}</h4>
                                  {u.isDeleted && <Badge variant="destructive" className="text-[9px] h-4 px-1 py-0 leading-none">DELETED</Badge>}
                                </div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{u.role}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-8">
                              <div className="text-right">
                                <p className="text-xs font-black text-foreground">{u.enrolledCourses?.length || 0}</p>
                                <p className="text-[9px] text-muted-foreground uppercase">Courses</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-black text-foreground">{userActions.length}</p>
                                <p className="text-[9px] text-muted-foreground uppercase">Actions</p>
                              </div>
                              <div className="text-right hidden sm:block">
                                <p className="text-xs font-black text-gold">{userHours}h</p>
                                <p className="text-[9px] text-muted-foreground uppercase">Log Time</p>
                              </div>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gold/10 hover:text-gold">
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
               </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - High Density Numbers */}
          <div className="space-y-6">
            <Card className="border-border/50 bg-gold/5 shadow-sm overflow-hidden">
               <div className="h-1 w-full bg-gold" />
               <CardHeader>
                  <CardTitle className="text-lg font-heading">Engagement Summary</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  {[
                    { label: "Role Diversity", value: analytics?.roleDistribution?.length || 0, desc: "Distinct system roles" },
                    { label: "Intern Success", value: analytics?.internshipStats?.graduated || 0, desc: "Total certifications" },
                    { label: "Course Density", value: analytics?.courseDistribution?.length || 0, desc: "Active learning tracks" },
                    { label: "Project Velocity", value: analytics?.projectStats?.completed || 0, desc: "Industry projects finished" },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-background/50 border border-border/20">
                      <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{item.label}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-gold">{item.value}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{item.desc}</span>
                      </div>
                    </div>
                  ))}
               </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/10 border-b border-border/20">
                   <CardTitle className="text-sm font-black uppercase text-muted-foreground tracking-tighter">Global Role Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics?.roleDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {analytics?.roleDistribution?.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '12px', fontSize: '10px' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/10 border-b border-border/20">
                   <CardTitle className="text-sm font-black uppercase text-muted-foreground tracking-tighter">System Health</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-accent" />
                            <span className="text-xs font-medium">Database Load</span>
                         </div>
                         <Badge variant="outline" className="text-green-500 font-bold border-green-500/20 bg-green-500/5">Normal</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-accent" />
                            <span className="text-xs font-medium">Latent Syncs</span>
                         </div>
                         <span className="text-xs font-bold">0 Active</span>
                      </div>
                   </div>
                </CardContent>
            </Card>

            {/* Audit Logs Quick Feed */}
            <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-border/20">
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Login History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[300px]">
                    <div className="p-2 space-y-2">
                      {loginActions.slice(0, 10).map((log: any, i: number) => (
                        <div key={i} className="flex flex-col p-3 bg-muted/10 rounded-xl border border-border/50 gap-1 overflow-hidden transition-all hover:border-gold/30">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-foreground font-black uppercase tracking-tight">{log.username}</span>
                            <span className="text-muted-foreground">
                              {format(parseSafeDate(log.timestamp), 'HH:mm:ss')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-medium text-gold">
                            <LogIn className="w-3 h-3" />
                            Successfull Authentication
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
