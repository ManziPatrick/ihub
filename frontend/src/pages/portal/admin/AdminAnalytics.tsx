import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  BookOpen,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
  Globe,
  Smartphone,
  CheckCircle,
  Clock,
  Briefcase
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@apollo/client/react";
import { GET_ANALYTICS } from "@/lib/graphql/queries";

const COLORS = ['#D4AF37', '#9CA3AF', '#F59E0B', '#10B981', '#3B82F6'];

export default function AdminAnalytics() {
  const { user } = useAuth();
  const { data, loading } = useQuery(GET_ANALYTICS, {
    variables: { createdBy: user?.id },
  });

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </PortalLayout>
    );
  }

  const analytics = (data as any)?.analytics;

  const overviewStats = [
    { label: "Total Students", value: analytics?.roleDistribution?.find((r: any) => r.name === 'Student')?.value || 0, change: "+12%", trend: "up", icon: Users },
    { label: "Active Courses", value: analytics?.courseDistribution?.length || 0, change: "+5%", trend: "up", icon: BookOpen },
    { label: "Graduated Interns", value: analytics?.internshipStats?.graduated || 0, change: "+2%", trend: "up", icon: CheckCircle },
    { label: "Pending Reviews", value: analytics?.projectStats?.pendingReview || 0, change: "-8%", trend: "down", icon: Clock },
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
            <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
              Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Platform performance and user engagement insights
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Last 6 Months
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {overviewStats.map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs text-card-foreground/60">{stat.label}</p>
                  <stat.icon className="w-4 h-4 text-accent/60" />
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                  <div className={`flex items-center gap-1 text-xs ${
                    stat.trend === "up" ? "text-green-400" : "text-red-400"
                  }`}>
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {stat.change}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Charts Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* User Growth Chart */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  Student Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics?.userGrowth}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
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
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                        itemStyle={{ color: '#D4AF37' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#D4AF37" 
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Course Distribution Bar Chart */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-accent" />
                  Enrollment per Course
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.courseDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 11 }}
                        width={150}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                        cursor={{ fill: '#374151', opacity: 0.4 }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#D4AF37" 
                        radius={[0, 4, 4, 0]} 
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* User Roles Pie Chart */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent" />
                  User Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {analytics?.roleDistribution?.map((role: any, index: number) => (
                    <div key={role.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-card-foreground/70">{role.name}</span>
                      </div>
                      <span className="font-medium">{role.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Internship Summary */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-accent" />
                  Internship Funnel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-card-foreground/60">Enrolled (Active)</span>
                    <span className="font-medium">{analytics?.internshipStats?.enrolled}</span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${(analytics?.internshipStats?.enrolled / analytics?.internshipStats?.total) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-card-foreground/60">Eligible</span>
                    <span className="font-medium">{analytics?.internshipStats?.eligible}</span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(analytics?.internshipStats?.eligible / analytics?.internshipStats?.total) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Status */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  Project Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-background/50 rounded-lg text-center">
                  <p className="text-xs text-card-foreground/60">Completed</p>
                  <p className="text-xl font-bold text-accent">{analytics?.projectStats?.completed}</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg text-center">
                  <p className="text-xs text-card-foreground/60">Pending</p>
                  <p className="text-xl font-bold text-orange-400">{analytics?.projectStats?.pendingReview}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </PortalLayout>
  );
}
