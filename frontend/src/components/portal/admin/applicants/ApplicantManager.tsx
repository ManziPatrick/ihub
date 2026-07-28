import { useState, useEffect } from 'react';
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { GET_INTERNSHIP_PROGRAMS, GET_INTERNSHIP_APPLICATIONS } from '@/lib/graphql/queries';
import { REVIEW_INTERNSHIP_APPLICATION } from '@/lib/graphql/mutations';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Check,
  X,
  Clock,
  Search,
  Mail,
  Phone,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Calendar,
  Users,
  GraduationCap,
  UserCheck,
  Loader2,
  RefreshCw,
  Activity,
  Award,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from "framer-motion";
import { PaginationBar } from '@/components/ui/pagination-bar';

// ── Query to get applicant counts per program ──────────────────────────
const GET_PROGRAM_APPLICANT_STATS = gql`
  query GetProgramApplicantStats($programId: ID!) {
    internshipApplications(programId: $programId, page: 1, limit: 1) {
      pagination {
        totalCount
      }
    }
    pending: internshipApplications(programId: $programId, status: "pending", page: 1, limit: 1) {
      pagination { totalCount }
    }
    approved: internshipApplications(programId: $programId, status: "approved", page: 1, limit: 1) {
      pagination { totalCount }
    }
    rejected: internshipApplications(programId: $programId, status: "rejected", page: 1, limit: 1) {
      pagination { totalCount }
    }
    waitlisted: internshipApplications(programId: $programId, status: "waitlisted", page: 1, limit: 1) {
      pagination { totalCount }
    }
  }
`;

// ── Small component to show applicant counts for one program ──────────
function ProgramApplicantStats({ programId }: { programId: string }) {
  const { data, loading } = useQuery(GET_PROGRAM_APPLICANT_STATS, {
    variables: { programId },
    fetchPolicy: "cache-and-network",
  });

  if (loading) return <div className="h-4 w-20 bg-muted/30 rounded animate-pulse" />;

  const total = (data as any)?.internshipApplications?.pagination?.totalCount ?? 0;
  const pending = (data as any)?.pending?.pagination?.totalCount ?? 0;
  const approved = (data as any)?.approved?.pagination?.totalCount ?? 0;

  if (total === 0) return <span className="text-xs text-muted-foreground">No applicants yet</span>;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground font-medium">{total} total</span>
      {pending > 0 && (
        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-bold px-1.5 py-0">
          {pending} pending
        </Badge>
      )}
      {approved > 0 && (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] font-bold px-1.5 py-0">
          {approved} approved
        </Badge>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────
export default function ApplicantManager() {
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [filter, setFilter] = useState('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list' | 'all'>('grid');
  const pageSize = 10;

  // ── All programs ──────────────────────────────────────────────────────
  const { data: programsData, loading: programsLoading, refetch: refetchPrograms } = useQuery(GET_INTERNSHIP_PROGRAMS, {
    variables: { page: 1, limit: 100 },
  });

  // ── Applications for selected program OR all programs ──────────────────
  const {
    data: internshipAppsData,
    loading: internshipAppsLoading,
    refetch: refetchInternshipApps,
  } = useQuery(GET_INTERNSHIP_APPLICATIONS, {
    variables: {
      programId: selectedProgramId || undefined,
      status: filter === 'all' ? undefined : filter,
      page,
      limit: pageSize,
    },
    skip: view === 'grid',
  });

  // ── Mutation ──────────────────────────────────────────────────────────
  const [reviewInternshipApp] = useMutation(REVIEW_INTERNSHIP_APPLICATION, {
    onCompleted: () => {
      refetchInternshipApps();
      refetchPrograms();
    },
  });

  const programs = (programsData as any)?.internshipPrograms?.items || [];
  const internshipApps = (internshipAppsData as any)?.internshipApplications?.items || [];
  const pagination = (internshipAppsData as any)?.internshipApplications?.pagination;

  // ── Helpers ───────────────────────────────────────────────────────────
  const handleStatusUpdate = async (e: React.MouseEvent, id: string, status: string) => {
    e.stopPropagation();
    try {
      await reviewInternshipApp({ variables: { id, status } });
      toast.success(`Application → ${status}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 font-black uppercase tracking-wider text-[10px]">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 font-black uppercase tracking-wider text-[10px]">Rejected</Badge>;
      case 'waitlisted':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-black uppercase tracking-wider text-[10px]">Waitlisted</Badge>;
      default:
        return <Badge variant="secondary" className="font-black uppercase tracking-wider text-[10px]">Pending</Badge>;
    }
  };

  const getInitials = (name: string) =>
    (name || "").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch { return dateStr; }
  };

  const loading = view !== 'grid' && internshipAppsLoading;

  const handleBackToGrid = () => {
    setView('grid');
    setSelectedProgramId(null);
    setExpandedId(null);
    setPage(1);
  };

  // ── Grid view: browse programs ────────────────────────────────────────
  if (view === 'grid') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-foreground">Internship Applicant Manager</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Select a program to review and manage its applicants, or view all
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search programs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Button
              variant="gold"
              size="sm"
              className="h-10 rounded-xl gap-2 text-xs font-black uppercase tracking-wider"
              onClick={() => { setView('all'); setPage(1); setFilter('all'); }}
            >
              <Users className="w-4 h-4" />
              All Applicants
            </Button>
          </div>
        </div>

        {/* Program grid */}
        {programsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : programs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-muted/20 rounded-3xl border border-dashed border-border/50">
            <GraduationCap className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-bold">No internship programs yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create a program first to manage applicants</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {programs
              .filter((p: any) => !search || p.title.toLowerCase().includes(search.toLowerCase()))
              .map((program: any) => (
                <Card
                  key={program.id}
                  className="border-border/50 hover:border-accent/30 hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
                  onClick={() => { setSelectedProgramId(program.id); setView('list'); setPage(1); setFilter('pending'); }}
                >
                  <CardContent className="p-0">
                    {/* Top accent bar */}
                    <div className="h-1.5 bg-gradient-to-r from-accent/60 to-accent/30" />

                    <div className="p-5">
                      {/* Icon + Status */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                          <GraduationCap className="w-5.5 h-5.5 text-accent" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold capitalize border-border/50 ${
                              program.status === 'active'
                                ? 'text-green-600 bg-green-500/5'
                                : program.status === 'upcoming'
                                ? 'text-blue-600 bg-blue-500/5'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {program.status}
                          </Badge>
                          {program.price && program.price > 0 && (
                            <Badge variant="secondary" className="text-[10px] font-bold">
                              {program.price?.toLocaleString()} {program.currency || 'RWF'}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Title + Description */}
                      <h3 className="font-bold text-sm text-foreground mb-1 line-clamp-1 group-hover:text-accent transition-colors">
                        {program.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                        {program.description}
                      </p>

                      {/* Meta info */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(program.startDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {program.duration}
                        </span>
                      </div>

                      {/* Applicant stats — divider */}
                      <div className="border-t border-border/30 pt-3 mt-1">
                        <ProgramApplicantStats programId={program.id} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    );
  }

  // ── Applicant list view (per program OR all) ──────────────────────────
  const selectedTitle = selectedProgramId
    ? programs.find((p: any) => p.id === selectedProgramId)?.title || 'Program'
    : 'All Internship Programs';

  return (
    <div className="space-y-6">
      {/* Header with back */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg"
              onClick={handleBackToGrid}
            >
              <ChevronUp className="w-4 h-4 -rotate-90" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-foreground">{selectedTitle}</h2>
                {pagination && (
                  <span className="text-xs text-muted-foreground font-medium bg-muted/30 px-2 py-0.5 rounded-full">
                    {pagination.totalCount} applicant{pagination.totalCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Internship Program — Review, approve & manage candidates
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter buttons */}
          <div className="flex gap-1 bg-muted/50 p-1 rounded-xl border border-border/50">
            {['all', 'pending', 'approved', 'waitlisted', 'rejected'].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={filter === s ? 'gold' : 'ghost'}
                onClick={() => { setFilter(s); setExpandedId(null); setPage(1); }}
                className="capitalize text-[11px] font-black tracking-wider h-8 rounded-lg"
              >
                {s}
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-lg text-[10px] font-black uppercase tracking-wider gap-1"
            onClick={() => { refetchInternshipApps(); toast.success('Refreshed'); }}
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Applicant list */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : internshipApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-muted/20 rounded-3xl border border-dashed border-border/50">
            <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />                            <p className="text-muted-foreground font-bold text-lg">
                                  {filter === 'all' ? 'No applicants found' : `No ${filter} applicants found`}
                                </p>
            <p className="text-xs text-muted-foreground mt-1">
              {filter === 'pending'
                ? 'Great — no pending applications to review!'
                : filter === 'all'
                ? 'This program has no applications yet'
                : `No ${filter} applicants for this program`}
            </p>
          </div>
        ) : (
          internshipApps.map((app: any) => (
            <Card
              key={app.id}
              className={`border-border/50 overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer ${
                expandedId === app.id ? 'ring-1 ring-accent/30 bg-accent/5' : 'bg-card hover:bg-muted/10'
              }`}
              onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
            >
              <CardContent className="p-0">
                {/* ── Collapsed row ── */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 border-2 border-border/50">
                      <AvatarImage src={app.user?.avatar} />
                      <AvatarFallback className="bg-accent/10 text-accent font-black">
                        {getInitials(app.user?.fullName || app.user?.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-base text-foreground">
                          {app.user?.fullName || app.user?.username}
                        </h3>
                        {getStatusBadge(app.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="w-3.5 h-3.5 text-accent/60" />
                          {app.user?.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5 text-accent/60" />
                          Applied {formatDate(app.createdAt)}
                        </div>
                        {app.internshipProgram?.title && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Briefcase className="w-3.5 h-3.5 text-accent/60" />
                            {app.internshipProgram.title}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {app.status !== 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-xl text-green-600 border-green-500/20 hover:bg-green-500/10 font-black text-[11px] uppercase tracking-wider gap-1.5"
                        onClick={(e) => handleStatusUpdate(e, app.id, 'approved')}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </Button>
                    )}
                    {app.status !== 'rejected' && app.status !== 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-xl text-red-600 border-red-500/20 hover:bg-red-500/10 font-black text-[11px] uppercase tracking-wider gap-1.5"
                        onClick={(e) => handleStatusUpdate(e, app.id, 'rejected')}
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </Button>
                    )}
                    {app.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-xl text-amber-600 border-amber-500/20 hover:bg-amber-500/10 font-black text-[11px] uppercase tracking-wider gap-1.5"
                        onClick={(e) => handleStatusUpdate(e, app.id, 'waitlisted')}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Waitlist
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-9 w-9 rounded-xl p-0">
                      {expandedId === app.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* ── Expanded detail ── */}
                <AnimatePresence>
                  {expandedId === app.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-border/50"
                    >
                      <div className="p-6 space-y-8 bg-muted/20">
                        <div className="grid md:grid-cols-2 gap-8">
                          {/* Left column */}
                          <div className="space-y-6">
                            {/* Contact */}
                            <div>
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-4">
                                Contact Information
                              </h4>
                              <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                  <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border border-border/50">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-black">Email</p>
                                    <p className="font-bold">{app.user?.email}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                  <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border border-border/50">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-black">Phone</p>
                                    <p className="font-bold">{app.user?.phone || 'Not provided'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Skills */}
                            <div>
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-4">
                                Skills
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {app.skills?.length > 0 ? (
                                  app.skills.map((skill: string) => (
                                    <Badge
                                      key={skill}
                                      variant="outline"
                                      className="bg-background border-border/50 rounded-lg text-[11px] font-bold py-1 px-2.5"
                                    >
                                      {skill}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">No skills listed</span>
                                )}
                              </div>
                            </div>

                            {/* Availability */}
                            {app.availability && (
                              <div className="p-3 bg-background/50 rounded-xl border border-border/30">
                                <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">
                                  Availability
                                </p>
                                <p className="text-sm font-bold">{app.availability}</p>
                              </div>
                            )}

                            {/* Portfolio / Links */}
                            {(app.portfolioUrl || app.resumeUrl) && (
                              <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-3">
                                  Links
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {app.portfolioUrl && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-9 rounded-xl gap-2 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(app.portfolioUrl, '_blank');
                                      }}
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      Portfolio
                                    </Button>
                                  )}
                                  {app.resumeUrl && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-9 rounded-xl gap-2 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(app.resumeUrl, '_blank');
                                      }}
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      Resume
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right column */}
                          <div className="space-y-6">
                            {/* Application answers */}
                            <div>
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-4">
                                Application Responses
                              </h4>
                              <div className="space-y-4">
                                {app.applicationAnswers?.length > 0 ? (
                                  app.applicationAnswers.map((ans: any, idx: number) => (
                                    <div key={idx} className="space-y-1.5">
                                      <p className="text-xs font-black text-foreground/80">{ans.questionLabel}</p>
                                      <div className="p-3 bg-background/50 rounded-xl border border-border/30 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                        {ans.answer || (
                                          <span className="italic text-muted-foreground/50">No answer</span>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-muted-foreground italic bg-background/30 p-4 rounded-xl border border-dashed border-border/50 text-center">
                                    No specific application answers provided.
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Management notes */}
                            <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10">
                              <h4 className="text-[9px] font-black uppercase tracking-widest text-accent mb-2">
                                Management Notes
                              </h4>
                              <div className="flex items-start gap-2">
                                <UserCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    Applying for <strong className="text-foreground">
                                      &ldquo;{app.internshipProgram?.title || 'Program'}&rdquo;
                                    </strong>
                                    . Listed {app.skills?.length || 0} skills.
                                    {app.availability && ` Availability: ${app.availability}.`}
                                  </p>
                                  {app.status === 'approved' && (
                                    <p className="text-[11px] text-green-600 font-bold mt-1">
                                      ✓ Approved — ready to proceed with enrollment.
                                    </p>
                                  )}
                                  {app.status === 'rejected' && app.rejectionReason && (
                                    <p className="text-[11px] text-red-600 mt-1">
                                      ✗ Reason: {app.rejectionReason}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 rounded-xl gap-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`/portal/admin/users?search=${app.user?.email}`, '_blank');
                                }}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                View Full Profile
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 rounded-xl gap-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`/portal/admin/users/${app.user?.id}`, '_blank');
                                }}
                              >
                                <Activity className="w-3.5 h-3.5" />
                                User Report
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <PaginationBar
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
          onPageChange={setPage}
          isLoading={loading}
          pageSize={pageSize}
          onPageSizeChange={() => {}}
        />
      )}
    </div>
  );
}
