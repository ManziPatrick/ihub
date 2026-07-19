import { useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_DISCOUNT_CODES, GET_COURSES } from "@/lib/graphql/queries";
import { motion } from "framer-motion";
import { normalizeId } from "@/lib/utils";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Tag,
  TrendingUp,
  TrendingDown,
  Percent,
  Clock,
  Loader2,
  BarChart3,
  PieChart,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Hash,
  DollarSign,
} from "lucide-react";

export default function SuperAdminDiscountStats() {
  const { data: codesData, loading, refetch } = useQuery(GET_DISCOUNT_CODES, {
    variables: { limit: 500 },
    fetchPolicy: "network-only",
  });

  const { data: coursesData } = useQuery(GET_COURSES, {
    variables: { limit: 200 },
  });

  const discountCodes = (codesData as any)?.discountCodes?.items || [];
  const courses = (coursesData as any)?.courses?.items || [];

  // Build a courseId → course map
  const courseMap = useMemo(() => {
    const map = new Map<string, any>();
    courses.forEach((c: any) => map.set(c.id, c));
    return map;
  }, [courses]);

  // Compute stats
  const stats = useMemo(() => {
    const total = discountCodes.length;
    const active = discountCodes.filter((dc: any) => dc.isActive).length;
    const inactive = total - active;
    const expired = discountCodes.filter(
      (dc: any) => dc.expiresAt && new Date(+dc.expiresAt) < new Date()
    ).length;
    const totalUses = discountCodes.reduce(
      (sum: number, dc: any) => sum + (dc.currentUses || 0),
      0
    );
    const totalCapacity = discountCodes.reduce(
      (sum: number, dc: any) => sum + (dc.maxUses || 0),
      0
    );
    const usageRate = totalCapacity > 0 ? Math.round((totalUses / totalCapacity) * 100) : 0;
    const percentageCodes = discountCodes.filter(
      (dc: any) => dc.discountType === "percentage"
    ).length;
    const fixedCodes = discountCodes.filter(
      (dc: any) => dc.discountType === "fixed"
    ).length;

    return { total, active, inactive, expired, totalUses, totalCapacity, usageRate, percentageCodes, fixedCodes };
  }, [discountCodes]);

  // Top 10 most used codes
  const topCodes = useMemo(() => {
    return [...discountCodes]
      .sort((a: any, b: any) => (b.currentUses || 0) - (a.currentUses || 0))
      .slice(0, 10);
  }, [discountCodes]);

  // Per-course breakdown
  const courseBreakdown = useMemo(() => {
    const breakdown = new Map<string, { total: number; active: number; uses: number; capacity: number }>();
    discountCodes.forEach((dc: any) => {
      const courseId = normalizeId(dc.courseId, "unknown");
      if (courseId === "unknown") return; // Skip general codes in per-course breakdown
      const entry = breakdown.get(courseId) || { total: 0, active: 0, uses: 0, capacity: 0 };
      entry.total++;
      if (dc.isActive) entry.active++;
      entry.uses += dc.currentUses || 0;
      entry.capacity += dc.maxUses || 0;
      breakdown.set(courseId, entry);
    });
    return Array.from(breakdown.entries())
      .map(([courseId, data]) => ({
        courseId,
        courseTitle: courseId === "unknown" ? "General (All Courses)" : (courseMap.get(courseId)?.title || "Unknown Course"),
        coursePrice: courseMap.get(courseId)?.price || 0,
        ...data,
        usageRate: data.capacity > 0 ? Math.round((data.uses / data.capacity) * 100) : 0,
      }))
      .sort((a, b) => b.uses - a.uses);
  }, [discountCodes, courseMap]);

  const statCards = [
    {
      label: "Total Codes",
      value: stats.total,
      icon: Tag,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Active",
      value: stats.active,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Expired",
      value: stats.expired,
      icon: Clock,
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
    {
      label: "Total Uses",
      value: stats.totalUses,
      icon: TrendingUp,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
    {
      label: "Usage Rate",
      value: `${stats.usageRate}%`,
      icon: Percent,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: "Capacity",
      value: stats.totalCapacity,
      icon: Hash,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
    },
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
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center border border-accent/30 shadow-xl shadow-accent/5">
              <BarChart3 className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
                Discount Code Analytics
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Track usage, performance, and distribution of all discount codes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={loading}
              className="rounded-xl gap-2 border-border/50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="default" size="sm" className="rounded-xl gap-2" asChild>
              <Link to="/portal/super-admin/discount-codes">
                <Tag className="w-4 h-4" />
                Manage Codes
              </Link>
            </Button>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-accent" />
              <p className="text-sm text-muted-foreground">Loading discount code data...</p>
            </div>
          </div>
        ) : discountCodes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-32 border-2 border-dashed border-border/20 rounded-2xl bg-muted/5"
          >
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <Tag className="w-10 h-10 text-accent/50" />
            </div>
            <h3 className="text-lg font-bold text-foreground/70 mb-2">No discount codes yet</h3>
            <p className="text-sm text-muted-foreground/60 max-w-md mx-auto mb-6">
              Create discount codes to track promotional campaigns and offer students special pricing on courses.
            </p>
            <Button variant="default" className="rounded-xl gap-2" asChild>
              <Link to="/portal/super-admin/discount-codes">
                <Tag className="w-4 h-4" />
                Create Discount Codes
              </Link>
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
            >
              {statCards.map((stat, i) => (
                <Card
                  key={i}
                  className={`border ${stat.border} ${stat.bg}/5 shadow-sm overflow-hidden relative`}
                >
                  <div className={`absolute top-0 right-0 p-2 opacity-[0.07] ${stat.color}`}>
                    <stat.icon className="w-12 h-12" />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>

            {/* Distribution & Type Breakdown */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Code Type Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-border/50">
                  <CardHeader className="pb-3 border-b border-border/20">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <PieChart className="w-3.5 h-3.5" />
                      Code Type Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {/* Percentage vs Fixed bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-foreground/80 flex items-center gap-1.5">
                            <Percent className="w-3 h-3 text-accent" />
                            Percentage Discount
                          </span>
                          <span className="font-bold">
                            {stats.percentageCodes} ({discountCodes.length > 0 ? Math.round((stats.percentageCodes / discountCodes.length) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full transition-all duration-500"
                            style={{ width: `${discountCodes.length > 0 ? (stats.percentageCodes / discountCodes.length) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-foreground/80 flex items-center gap-1.5">
                            <DollarSign className="w-3 h-3 text-violet-500" />
                            Fixed Amount
                          </span>
                          <span className="font-bold">
                            {stats.fixedCodes} ({discountCodes.length > 0 ? Math.round((stats.fixedCodes / discountCodes.length) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full transition-all duration-500"
                            style={{ width: `${discountCodes.length > 0 ? (stats.fixedCodes / discountCodes.length) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Status Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
              >
                <Card className="border-border/50">
                  <CardHeader className="pb-3 border-b border-border/20">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5" />
                      Status Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                        <div className="flex justify-center mb-2">
                          <div className="p-2 rounded-full bg-emerald-500/10">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          </div>
                        </div>
                        <p className="text-2xl font-black text-emerald-500">{stats.active}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
                          Active
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/30 text-center">
                        <div className="flex justify-center mb-2">
                          <div className="p-2 rounded-full bg-muted/50">
                            <XCircle className="w-5 h-5 text-muted-foreground/60" />
                          </div>
                        </div>
                        <p className="text-2xl font-black text-muted-foreground/60">{stats.inactive}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
                          Inactive
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-center">
                        <div className="flex justify-center mb-2">
                          <div className="p-2 rounded-full bg-red-500/10">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          </div>
                        </div>
                        <p className="text-2xl font-black text-red-500">{stats.expired}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
                          Expired
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Usage Rate Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-accent" />
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Overall Usage Rate
                      </span>
                    </div>
                    <span className="text-lg font-black text-foreground">{stats.usageRate}%</span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.usageRate}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        stats.usageRate > 60
                          ? "bg-emerald-500"
                          : stats.usageRate > 30
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                    <span>{stats.totalUses} used</span>
                    <span>{stats.totalCapacity} total capacity</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Top 10 Most Used Codes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
            >
              <Card className="border-border/50">
                <CardHeader className="pb-3 border-b border-border/20">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Top 10 Most Used Codes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/10">
                    {topCodes.map((dc: any, i: number) => {
                      const isExpired = dc.expiresAt && new Date(+dc.expiresAt) < new Date();
                      const cId = normalizeId(dc.courseId);
                      const course = cId ? courseMap.get(cId) : null;
                      return (
                        <div
                          key={dc.id}
                          className="flex items-center gap-4 p-4 hover:bg-muted/5 transition-colors"
                        >
                          {/* Rank */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                            i === 0
                              ? "bg-amber-500/15 text-amber-500"
                              : i === 1
                                ? "bg-gray-400/15 text-gray-400"
                                : i === 2
                                  ? "bg-orange-500/15 text-orange-500"
                                  : "bg-muted text-muted-foreground"
                          }`}>
                            {i + 1}
                          </div>

                          {/* Code */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black tracking-widest text-sm">
                                {dc.code}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[9px] font-bold px-1.5 py-0 h-4 ${
                                  isExpired
                                    ? "text-red-400 bg-red-400/10 border-red-400/30"
                                    : dc.isActive
                                      ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30"
                                      : "text-muted-foreground bg-muted/50 border-border/50"
                                }`}
                              >
                                {isExpired ? "Expired" : dc.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                              <span>
                                {dc.discountType === "percentage"
                                  ? `${dc.discountValue}% off`
                                  : `${dc.discountValue.toLocaleString()} RWF off`}
                              </span>
                              {course && (
                                <>
                                  <span className="text-muted-foreground/40">·</span>
                                  <span className="truncate max-w-[200px]">{course.title}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Usage */}
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-foreground">
                              {dc.currentUses || 0}
                              <span className="text-xs font-normal text-muted-foreground">
                                /{dc.maxUses || 0}
                              </span>
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {dc.maxUses > 0
                                ? `${Math.round(((dc.currentUses || 0) / dc.maxUses) * 100)}% used`
                                : "unlimited"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Per-Course Breakdown */}
            {courseBreakdown.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
              >
                <Card className="border-border/50">
                  <CardHeader className="pb-3 border-b border-border/20">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5" />
                      Per-Course Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/10">
                      {courseBreakdown.map((course: any) => (
                        <div
                          key={course.courseId}
                          className="flex items-center gap-4 p-4 hover:bg-muted/5 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                            <Tag className="w-4 h-4 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {course.courseTitle}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                              <span>{course.total} codes</span>
                              <span className="text-emerald-500">{course.active} active</span>
                              <span>{course.uses} uses</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-foreground">{course.usageRate}%</p>
                            <div className="mt-1 h-1.5 w-20 bg-muted rounded-full overflow-hidden ml-auto">
                              <div
                                className={`h-full rounded-full ${
                                  course.usageRate > 60
                                    ? "bg-emerald-500"
                                    : course.usageRate > 30
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${course.usageRate}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </div>
    </PortalLayout>
  );
}
