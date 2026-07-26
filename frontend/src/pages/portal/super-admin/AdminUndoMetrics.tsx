import { useState } from "react";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { toast } from "sonner";
import {
  BarChart3,
  RotateCcw,
  Trash2,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  User,
  BookOpen,
  Award,
  FolderOpen,
  Calendar,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

const GET_UNDO_METRICS = gql`
  query GetUndoMetrics($days: Int) {
    undoMetrics(days: $days) {
      totalDeletes
      totalRestores
      overallUndoRate
      breakdown {
        entityType
        deletes
        restores
        undoRate
        total
      }
      recentEntries {
        id
        actionType
        entityType
        entityId
        entityTitle
        userId
        user {
          id
          username
          email
        }
        timestamp
        createdAt
      }
    }
  }
`;

const entityIcons: Record<string, React.ReactNode> = {
  course: <BookOpen className="w-4 h-4" />,
  user: <User className="w-4 h-4" />,
  badge: <Award className="w-4 h-4" />,
  project: <FolderOpen className="w-4 h-4" />,
  booking: <Calendar className="w-4 h-4" />,
  projectApplication: <FileText className="w-4 h-4" />,
};

const entityLabels: Record<string, string> = {
  course: "Course",
  user: "User",
  badge: "Badge",
  project: "Project",
  booking: "Booking",
  projectApplication: "Proposal",
};

export default function AdminUndoMetrics() {
  const [days, setDays] = useState(30);
  const { data, loading, refetch } = useQuery(GET_UNDO_METRICS, {
    variables: { days },
  });

  const metrics = (data as any)?.undoMetrics;
  const breakdown = metrics?.breakdown || [];
  const entries = metrics?.recentEntries || [];

  const StatsCard = ({ label, value, icon: Icon, sub, trend }: {
    label: string;
    value: string | number;
    icon: any;
    sub?: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {sub && (
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${
            trend === 'up' ? 'bg-green-500/10 text-green-500' :
            trend === 'down' ? 'bg-red-500/10 text-red-500' :
            'bg-accent/10 text-accent'
          }`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
              Undo Metrics
            </h1>
            <p className="text-muted-foreground mt-1">
              Track how often users delete and undo their actions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-muted/20 rounded-xl p-1 border border-border/30">
              {[7, 30, 90].map((d) => (
                <Button
                  key={d}
                  variant={days === d ? "gold" : "ghost"}
                  size="sm"
                  onClick={() => setDays(d)}
                  className="rounded-lg px-4 text-xs"
                >
                  {d}d
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <StatsCard
                label="Total Deletes"
                value={metrics?.totalDeletes || 0}
                icon={Trash2}
                trend="down"
              />
              <StatsCard
                label="Total Undos"
                value={metrics?.totalRestores || 0}
                icon={RotateCcw}
                trend="up"
              />
              <StatsCard
                label="Undo Rate"
                value={`${metrics?.overallUndoRate || 0}%`}
                icon={TrendingUp}
                sub={`${metrics?.totalRestores || 0} of ${metrics?.totalDeletes || 0} actions undone`}
                trend={metrics?.overallUndoRate > 30 ? 'up' : 'neutral'}
              />
              <StatsCard
                label="Actions Tracked"
                value={(metrics?.totalDeletes || 0) + (metrics?.totalRestores || 0)}
                icon={Activity}
                trend="neutral"
              />
            </motion.div>

            {/* Breakdown by Type */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="w-5 h-5 text-accent" />
                    Breakdown by Entity Type
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left p-4 text-sm font-medium text-card-foreground/70">Entity Type</th>
                          <th className="text-center p-4 text-sm font-medium text-card-foreground/70">Deletes</th>
                          <th className="text-center p-4 text-sm font-medium text-card-foreground/70">Undos</th>
                          <th className="text-center p-4 text-sm font-medium text-card-foreground/70">Undo Rate</th>
                          <th className="text-center p-4 text-sm font-medium text-card-foreground/70">Bar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {breakdown.map((item: any, idx: number) => {
                          const maxVal = Math.max(...breakdown.map((b: any) => b.total), 1);
                          const barWidth = (item.total / maxVal) * 100;
                          return (
                            <tr key={item.entityType} className="border-b border-border/10 hover:bg-accent/5 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                                    {entityIcons[item.entityType] || <Activity className="w-4 h-4" />}
                                  </div>
                                  <span className="font-bold capitalize">
                                    {entityLabels[item.entityType] || item.entityType}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <span className="text-red-500 font-bold">{item.deletes}</span>
                              </td>
                              <td className="p-4 text-center">
                                <span className="text-green-500 font-bold">{item.restores}</span>
                              </td>
                              <td className="p-4 text-center">
                                <Badge className={`text-xs font-bold ${
                                  item.undoRate > 50 ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                  item.undoRate > 20 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                  'bg-red-500/10 text-red-500 border-red-500/20'
                                }`}>
                                  {item.undoRate}%
                                </Badge>
                              </td>
                              <td className="p-4 w-48">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-3 bg-muted/20 rounded-full overflow-hidden flex">
                                    <div
                                      className="h-full bg-red-500/60 rounded-l-full transition-all"
                                      style={{ width: `${(item.deletes / maxVal) * 100}%` }}
                                    />
                                    <div
                                      className="h-full bg-green-500/60 rounded-r-full transition-all"
                                      style={{ width: `${(item.restores / maxVal) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {breakdown.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-12 text-center text-muted-foreground">
                              No metrics data available yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Activity Log */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="w-5 h-5 text-accent" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    <div className="divide-y divide-border/10">
                      {entries.map((entry: any) => (
                        <div key={entry.id} className="flex items-start gap-4 p-4 hover:bg-accent/5 transition-colors">
                          <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            entry.actionType === 'delete'
                              ? 'bg-red-500/10 text-red-500'
                              : 'bg-green-500/10 text-green-500'
                          }`}>
                            {entry.actionType === 'delete' ? <Trash2 className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold uppercase tracking-wider ${
                                entry.actionType === 'delete' ? 'text-red-500' : 'text-green-500'
                              }`}>
                                {entry.actionType}
                              </span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs font-bold text-accent uppercase tracking-wider">
                                {entityLabels[entry.entityType] || entry.entityType}
                              </span>
                            </div>
                            <p className="text-sm font-medium mt-0.5 truncate">
                              {entry.entityTitle}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{entry.user?.username || 'Unknown'}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {entry.timestamp ? format(new Date(parseInt(entry.timestamp)), "MMM d, HH:mm") : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {entries.length === 0 && (
                        <div className="p-12 text-center text-muted-foreground">
                          No recent activity.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </PortalLayout>
  );
}
