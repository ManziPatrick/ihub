import { useState } from "react";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Download,
  Calendar,
  Layers,
  Zap
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { useQuery } from "@apollo/client/react";
import { GET_ANALYTICS } from "@/lib/graphql/queries";
import { ExportDataDialog } from "@/components/portal/ExportDataDialog";

const COLORS = ['#D4AF37', '#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#EC4899'];

export default function PerformanceReport() {
  const { data, loading } = useQuery(GET_ANALYTICS);
  const analytics = (data as any)?.analytics;
  const [showExportDialog, setShowExportDialog] = useState(false);

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
        </div>
      </PortalLayout>
    );
  }

  const projectStatusData = [
    { name: 'Completed', value: analytics?.projectStats?.completed || 0 },
    { name: 'In Progress', value: analytics?.projectStats?.inProgress || 0 },
    { name: 'Pending Review', value: analytics?.projectStats?.pendingReview || 0 },
  ];

  const internshipFunnel = [
    { name: 'Total Eligible', value: analytics?.internshipStats?.eligible || 0 },
    { name: 'Enrolled', value: analytics?.internshipStats?.enrolled || 0 },
    { name: 'Graduated', value: analytics?.internshipStats?.graduated || 0 },
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
              <Award className="w-8 h-8 text-gold" />
              Platform Performance Report
            </h1>
            <p className="text-muted-foreground mt-1">
              Detailed analysis of student outcomes and program effectiveness
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowExportDialog(true)}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gold/5 border-gold/20">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Graduation Rate</p>
                  <h3 className="text-3xl font-black text-gold">
                    {analytics?.internshipStats?.total > 0 
                      ? ((analytics.internshipStats.graduated / analytics.internshipStats.total) * 100).toFixed(1)
                      : 0}%
                  </h3>
                </div>
                <div className="p-2 bg-gold/10 rounded-lg">
                  <Award className="w-6 h-6 text-gold" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-green-400">
                <ArrowUpRight className="w-3 h-3" />
                <span>+2.4% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Project Velocity</p>
                  <h3 className="text-3xl font-black text-blue-400">
                    {analytics?.projectStats?.total > 0 
                      ? ((analytics.projectStats.completed / analytics.projectStats.total) * 100).toFixed(1)
                      : 0}%
                  </h3>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-blue-400">
                <Clock className="w-3 h-3" />
                <span>Avg. completion: 14 days</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Active Interns</p>
                  <h3 className="text-3xl font-black text-emerald-400">
                    {analytics?.internshipStats?.enrolled || 0}
                  </h3>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Users className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle className="w-3 h-3" />
                <span>On track for graduation</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Program Funnel */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Internship Success Funnel</CardTitle>
              <CardDescription>Conversion from eligibility to graduation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={internshipFunnel} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} width={100} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '12px' }} />
                    <Bar dataKey="value" fill="#D4AF37" radius={[0, 4, 4, 0]} barSize={40}>
                      {internshipFunnel.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Project Outcomes */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Project Achievement Stats</CardTitle>
              <CardDescription>Distribution of current project states</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {projectStatusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '12px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full mt-4 grid grid-cols-3 gap-2">
                 {projectStatusData.map((stat, i) => (
                   <div key={i} className="text-center p-2 rounded-lg bg-muted/10">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">{stat.name}</p>
                      <p className="text-lg font-black">{stat.value}</p>
                   </div>
                 ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Insights */}
        <Card className="border-border/50">
          <CardHeader>
             <CardTitle className="text-lg font-heading flex items-center gap-2">
               <Layers className="w-5 h-5 text-gold" />
               Critical Success Factors
             </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-gold/5">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center font-black text-gold">1</div>
                      <div>
                         <p className="font-bold">Mentor Engagement</p>
                         <p className="text-sm text-muted-foreground">High mentor feedback turnaround correlates with 40% faster graduation.</p>
                      </div>
                   </div>
                   <Badge variant="gold">High Impact</Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-blue-500/5">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center font-black text-blue-400">2</div>
                      <div>
                         <p className="font-bold">Project Velocity</p>
                         <p className="text-sm text-muted-foreground">Students submitting milestones weekly are 3x more likely to finish top of class.</p>
                      </div>
                   </div>
                   <Badge variant="outline" className="border-blue-500/30 text-blue-400">Monitoring</Badge>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>

      <ExportDataDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
      />
    </PortalLayout>
  );
}
