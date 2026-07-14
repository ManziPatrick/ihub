import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_INTERNSHIP_PROGRAMS } from "@/lib/graphql/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  CheckCircle,
  Send,
  Info,
  Users,
  Lock,
  Zap,
} from "lucide-react";
import { ApplyInternshipDialog } from "../../dialogs/ApplyInternshipDialog";

// Robust date formatter that handles both ISO strings and numeric timestamps
const formatDate = (raw: any): string => {
  if (!raw) return "TBD";
  const ts = Number(raw);
  const date = isNaN(ts) ? new Date(raw) : new Date(ts);
  if (isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getStatusBadge = (program: any, deadlinePassed: boolean, alreadyApplied: boolean) => {
  if (alreadyApplied) {
    return (
      <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] font-bold uppercase tracking-wider gap-1">
        <CheckCircle className="w-3 h-3" /> Applied
      </Badge>
    );
  }
  if (program.status === "upcoming") {
    return (
      <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] font-bold uppercase tracking-wider gap-1">
        <Clock className="w-3 h-3" /> Upcoming
      </Badge>
    );
  }
  if (program.status === "closed" || deadlinePassed) {
    return (
      <Badge className="bg-muted text-muted-foreground border-border/40 text-[10px] font-bold uppercase tracking-wider gap-1">
        <Lock className="w-3 h-3" /> Closed
      </Badge>
    );
  }
  if (program.maxSpots > 0) {
    return (
      <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[10px] font-bold uppercase tracking-wider gap-1">
        <Users className="w-3 h-3" /> {program.maxSpots} Spots
      </Badge>
    );
  }
  return (
    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] font-bold uppercase tracking-wider gap-1">
      <Zap className="w-3 h-3" /> Open
    </Badge>
  );
};

export function ProgramCatalog() {
  const { data, loading, refetch } = useQuery(GET_INTERNSHIP_PROGRAMS);
  const [applyingToId, setApplyingToId] = useState<string | null>(null);

  const programs = (data as any)?.internshipPrograms?.items || [];
  const myApplications = (data as any)?.myInternshipApplications || [];

  const isDeadlinePassed = (deadline: any) => {
    if (!deadline) return false;
    const ts = Number(deadline);
    const date = isNaN(ts) ? new Date(deadline) : new Date(ts);
    return isNaN(date.getTime()) ? false : date < new Date();
  };

  const hasUserApplied = (programId: string) => {
    return myApplications.some((app: any) => app.internshipProgramId === programId);
  };

  const getDiscountedPrice = (program: any) => {
    if (!program.discount || program.discount <= 0) return null;
    return Math.round(program.price * (1 - program.discount / 100));
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20 bg-muted/5 rounded-2xl border border-dashed border-border/50">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Loading Tracks...</p>
      </div>
    </div>
  );

  const visiblePrograms = programs.filter((p: any) =>
    p.status === "active" || p.status === "upcoming"
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visiblePrograms.map((program: any) => {
          const deadlinePassed = isDeadlinePassed(program.applicationDeadline);
          const alreadyApplied = hasUserApplied(program.id);
          const isUpcoming = program.status === "upcoming";
          const isClosed = program.status === "closed" || deadlinePassed;
          const isApplyDisabled = isClosed || alreadyApplied || isUpcoming;
          const discountedPrice = getDiscountedPrice(program);

          return (
            <Card
              key={program.id}
              className="group overflow-hidden border-border/50 hover:border-accent/40 transition-all hover:shadow-xl bg-card/60 backdrop-blur-sm relative"
            >
              {/* Hero Image */}
              {program.image && (
                <div className="w-full aspect-video overflow-hidden relative">
                  <img
                    src={program.image}
                    alt={program.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              )}

              <CardHeader className={`${program.image ? "pt-4" : "bg-gradient-to-br from-accent/10 to-accent/5 pb-6"} relative overflow-hidden`}>
                {!program.image && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl -mr-16 -mt-16 transform transition-transform group-hover:scale-150 duration-700" />
                )}
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-accent/20 text-accent bg-accent/5 px-2.5 py-1">
                      {program.duration}
                    </Badge>
                    {getStatusBadge(program, deadlinePassed, alreadyApplied)}
                  </div>
                  <CardTitle className="text-xl font-heading font-bold leading-tight text-foreground group-hover:text-accent transition-colors">
                    {program.title}
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-5">
                <div
                  className="text-sm text-muted-foreground line-clamp-3 min-h-[4.5rem] prose prose-sm dark:prose-invert max-w-none leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: program.description }}
                />

                <div className="grid grid-cols-1 gap-2.5 pt-4 border-t border-border/40">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Calendar className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <span className="text-muted-foreground font-medium">
                      Starts: <strong className="text-foreground">{formatDate(program.startDate)}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <span className="text-muted-foreground font-medium">
                      Apply by: <strong className="text-foreground">{formatDate(program.applicationDeadline)}</strong>
                    </span>
                  </div>
                  {program.maxSpots > 0 && (
                    <div className="flex items-center gap-3 text-xs">
                      <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-orange-500" />
                      </div>
                      <span className="text-muted-foreground font-medium">
                        <strong className="text-orange-600">{program.maxSpots} spots</strong> remaining
                      </span>
                    </div>
                  )}
                </div>

                {Array.isArray(program.eligibility) && program.eligibility.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest pl-1">Requirements</p>
                    <div className="flex flex-wrap gap-1.5">
                      {program.eligibility.slice(0, 3).map((req: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-muted/40 font-bold px-2.5 py-1.5 rounded-lg text-muted-foreground border border-border/50 flex items-center gap-1.5 transition-colors hover:bg-muted"
                        >
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          {req}
                        </span>
                      ))}
                      {program.eligibility.length > 3 && (
                        <span className="text-[10px] text-muted-foreground font-bold px-1 py-1">
                          +{program.eligibility.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">Application Fee</p>
                    {Number(program.price) > 0 ? (
                      discountedPrice ? (
                        <div className="space-y-0.5">
                          <div className="flex items-baseline gap-2">
                            <p className="text-lg font-black text-foreground">
                              {discountedPrice.toLocaleString()} <span className="text-[10px] font-bold text-muted-foreground uppercase">RWF</span>
                            </p>
                            <span className="text-xs text-muted-foreground line-through">{program.price.toLocaleString()}</span>
                          </div>
                          <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20 font-black">
                            {program.discount}% discount
                          </Badge>
                        </div>
                      ) : (
                        <p className="text-lg font-black text-foreground">
                          {program.price.toLocaleString()} <span className="text-[10px] font-bold text-muted-foreground uppercase">RWF</span>
                        </p>
                      )
                    ) : (
                      <p className="text-lg font-black text-green-600">Free</p>
                    )}
                  </div>
                  <Button
                    variant={alreadyApplied ? "outline" : isUpcoming ? "outline" : "gold"}
                    className="px-6 gap-2 shadow-premium hover:-translate-y-1 transition-all h-11"
                    onClick={() => setApplyingToId(program.id)}
                    disabled={isApplyDisabled}
                  >
                    {alreadyApplied ? (
                      <><Info className="w-4 h-4" />Applied</>
                    ) : isUpcoming ? (
                      <><Clock className="w-4 h-4" />Coming Soon</>
                    ) : isClosed ? (
                      <><Lock className="w-4 h-4" />Closed</>
                    ) : (
                      <><Send className="w-4 h-4" />Apply Now</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ApplyInternshipDialog
        open={!!applyingToId}
        onOpenChange={(open) => !open && setApplyingToId(null)}
        internshipProgramId={applyingToId || ""}
      />
    </div>
  );
}
