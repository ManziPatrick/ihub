import { useState } from 'react';
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import {
  GET_INTERNSHIP_PROGRAMS,
  GET_INTERNSHIP_APPLICATIONS,
  GET_EVENTS,
  GET_EVENT_APPLICATIONS,
} from '@/lib/graphql/queries';
import {
  REVIEW_INTERNSHIP_APPLICATION,
  REVIEW_EVENT_APPLICATION,
} from '@/lib/graphql/mutations';
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
  FileText,
  Presentation,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from "framer-motion";
import { PaginationBar } from '@/components/ui/pagination-bar';

// ── Query to get applicant counts per internship program ────────────────
const GET_PROGRAM_APPLICANT_STATS = gql`
  query GetProgramApplicantStats($programId: ID!) {
    internshipApplications(programId: $programId, page: 1, limit: 1) {
      pagination { totalCount }
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

// ── Query to get applicant counts per event ─────────────────────────────
const GET_EVENT_APPLICANT_STATS = gql`
  query GetEventApplicantStats($eventId: ID!) {
    eventApplications(eventId: $eventId, page: 1, limit: 1) {
      pagination { totalCount }
    }
    pending: eventApplications(eventId: $eventId, status: "pending", page: 1, limit: 1) {
      pagination { totalCount }
    }
    approved: eventApplications(eventId: $eventId, status: "approved", page: 1, limit: 1) {
      pagination { totalCount }
    }
    rejected: eventApplications(eventId: $eventId, status: "rejected", page: 1, limit: 1) {
      pagination { totalCount }
    }
    waitlisted: eventApplications(eventId: $eventId, status: "waitlisted", page: 1, limit: 1) {
      pagination { totalCount }
    }
  }
`;

// ── Applicant stats for one internship program ──────────────────────────
function ProgramApplicantStats({ entityId }: { entityId: string }) {
  const { data, loading } = useQuery(GET_PROGRAM_APPLICANT_STATS, {
    variables: { programId: entityId },
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

// ── Applicant stats for one event ───────────────────────────────────────
function EventApplicantStats({ entityId }: { entityId: string }) {
  const { data, loading } = useQuery(GET_EVENT_APPLICANT_STATS, {
    variables: { eventId: entityId },
    fetchPolicy: "cache-and-network",
  });
  if (loading) return <div className="h-4 w-20 bg-muted/30 rounded animate-pulse" />;
  const total = (data as any)?.eventApplications?.pagination?.totalCount ?? 0;
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
  const [tab, setTab] = useState<'internships' | 'events'>('internships');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [filter, setFilter] = useState('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list' | 'all'>('grid');
  const pageSize = 10;

  // ── Internship programs ──────────────────────────────────────────────
  const { data: programsData, loading: programsLoading, refetch: refetchPrograms } = useQuery(
    GET_INTERNSHIP_PROGRAMS,
    { variables: { page: 1, limit: 100 }, skip: tab !== 'internships' }
  );

  // ── Events ────────────────────────────────────────────────────────────
  const { data: eventsData, loading: eventsLoading, refetch: refetchEvents } = useQuery(
    GET_EVENTS,
    { variables: { page: 1, limit: 100 }, skip: tab !== 'events' }
  );

  // ── Internship applications ──────────────────────────────────────────
  const {
    data: internshipAppsData,
    loading: internshipAppsLoading,
    refetch: refetchInternshipApps,
  } = useQuery(GET_INTERNSHIP_APPLICATIONS, {
    variables: {
      programId: selectedEntityId || undefined,
      status: filter === 'all' ? undefined : filter,
      page,
      limit: pageSize,
    },
    skip: !(tab === 'internships' && view !== 'grid'),
  });

  // ── Event applications ───────────────────────────────────────────────
  const {
    data: eventAppsData,
    loading: eventAppsLoading,
    refetch: refetchEventApps,
  } = useQuery(GET_EVENT_APPLICATIONS, {
    variables: {
      eventId: selectedEntityId || undefined,
      status: filter === 'all' ? undefined : filter,
      page,
      limit: pageSize,
    },
    skip: !(tab === 'events' && view !== 'grid'),
  });

  // ── Mutations ────────────────────────────────────────────────────────
  const [reviewInternshipApp] = useMutation(REVIEW_INTERNSHIP_APPLICATION, {
    onCompleted: () => { refetchInternshipApps(); refetchPrograms(); },
  });
  const [reviewEventApp] = useMutation(REVIEW_EVENT_APPLICATION, {
    onCompleted: () => { refetchEventApps(); refetchEvents(); },
  });

  const programs = (programsData as any)?.internshipPrograms?.items || [];
  const events = (eventsData as any)?.events?.items || [];
  const internshipApps = (internshipAppsData as any)?.internshipApplications?.items || [];
  const eventApps = (eventAppsData as any)?.eventApplications?.items || [];

  const apps = tab === 'internships' ? internshipApps : eventApps;
  const pagination =
    tab === 'internships'
      ? (internshipAppsData as any)?.internshipApplications?.pagination
      : (eventAppsData as any)?.eventApplications?.pagination;

  const loading =
    view !== 'grid' && (tab === 'internships' ? internshipAppsLoading : eventAppsLoading);

  // ── Helpers ───────────────────────────────────────────────────────────
  const handleStatusUpdate = async (e: React.MouseEvent, id: string, status: string) => {
    e.stopPropagation();
    try {
      if (tab === 'internships') {
        await reviewInternshipApp({ variables: { id, status } });
      } else {
        await reviewEventApp({ variables: { id, status } });
      }
      toast.success(`Application → ${status}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleSwitchTab = (t: 'internships' | 'events') => {
    setTab(t);
    setView('grid');
    setSelectedEntityId(null);
    setExpandedId(null);
    setPage(1);
    setSearch('');
    setFilter('pending');
  };

  const handleBackToGrid = () => {
    setView('grid');
    setSelectedEntityId(null);
    setExpandedId(null);
    setPage(1);
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

  // ── Tab toggle ────────────────────────────────────────────────────────
  const tabBar = (
    <div className="flex gap-1 bg-muted/50 p-1 rounded-xl border border-border/50 w-fit">
      <Button
        size="sm"
        variant={tab === 'internships' ? 'gold' : 'ghost'}
        onClick={() => handleSwitchTab('internships')}
        className="h-9 rounded-lg gap-2 text-xs font-black uppercase tracking-wider"
      >
        <GraduationCap className="w-4 h-4" />
        Internship Programs
      </Button>
      <Button
        size="sm"
        variant={tab === 'events' ? 'gold' : 'ghost'}
        onClick={() => handleSwitchTab('events')}
        className="h-9 rounded-lg gap-2 text-xs font-black uppercase tracking-wider"
      >
        <Sparkles className="w-4 h-4" />
        Events & Sessions
      </Button>
    </div>
  );

  // ── Grid view: browse programs or events ──────────────────────────────
  if (view === 'grid') {
    const dataItems = tab === 'internships' ? programs : events;
    const loadingItems = tab === 'internships' ? programsLoading : eventsLoading;
    const Icon = tab === 'internships' ? GraduationCap : Presentation;
    const entityLabel = tab === 'internships' ? 'program' : 'event';
    const entityPlural = tab === 'internships' ? 'Programs' : 'Events';
    const StatsCmp = tab === 'internships' ? ProgramApplicantStats : EventApplicantStats;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-foreground">Applicant Manager</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Select a {entityLabel} to review and manage its applicants, or view all
            </p>
          </div>
          <div className="flex items-center gap-3">
            {tabBar}
          </div>
        </div>

        {/* Search + All Applicants */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${entityPlural.toLowerCase()}...`}
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

        {/* Grid */}
        {loadingItems ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : dataItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-muted/20 rounded-3xl border border-dashed border-border/50">
            <Icon className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-bold">No {entityPlural.toLowerCase()} yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create a {entityLabel} first to manage applicants</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(dataItems as any[])
              .filter((item: any) => !search || item.title?.toLowerCase().includes(search.toLowerCase()))
              .map((item: any) => (
                <Card
                  key={item.id}
                  className="border-border/50 hover:border-accent/30 hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
                  onClick={() => { setSelectedEntityId(item.id); setView('list'); setPage(1); setFilter('pending'); }}
                >
                  <CardContent className="p-0">
                    <div className="h-1.5 bg-gradient-to-r from-accent/60 to-accent/30" />
                    <div className="p-5">
                      {/* Icon + Status */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                          {tab === 'events' ? (
                            <Sparkles className="w-5.5 h-5.5 text-accent" />
                          ) : (
                            <GraduationCap className="w-5.5 h-5.5 text-accent" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold capitalize border-border/50 ${
                              item.status === 'active' || item.status === 'published'
                                ? 'text-green-600 bg-green-500/5'
                                : item.status === 'upcoming'
                                ? 'text-blue-600 bg-blue-500/5'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {item.status}
                          </Badge>
                          {tab === 'events' && item.price && item.price > 0 && (
                            <Badge variant="secondary" className="text-[10px] font-bold">
                              {item.price?.toLocaleString()} {item.currency || 'RWF'}
                            </Badge>
                          )}
                          {tab === 'internships' && item.price && item.price > 0 && (
                            <Badge variant="secondary" className="text-[10px] font-bold">
                              {item.price?.toLocaleString()} {item.currency || 'RWF'}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Title + Description */}
                      <h3 className="font-bold text-sm text-foreground mb-1 line-clamp-1 group-hover:text-accent transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                        {item.description || item.shortDescription}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {tab === 'events' ? formatDate(item.startDate) : formatDate(item.startDate)}
                        </span>
                        {tab === 'events' && item.type && (
                          <span className="flex items-center gap-1 capitalize">
                            <Presentation className="w-3 h-3" />
                            {item.type}
                          </span>
                        )}
                        {tab === 'internships' && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.duration}
                          </span>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="border-t border-border/30 pt-3 mt-1">
                        <StatsCmp entityId={item.id} />
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

  // ── Applicant list view ──────────────────────────────────────────────
  const entities = tab === 'internships' ? programs : events;
  const entityLabel = tab === 'internships' ? 'Internship Program' : 'Event';
  const selectedTitle = selectedEntityId
    ? entities.find((e: any) => e.id === selectedEntityId)?.title || entityLabel
    : tab === 'internships' ? 'All Internship Programs' : 'All Events';

  return (
    <div className="space-y-6">
      {/* Header */}
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
                {entityLabel} — Review, approve & manage candidates
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            onClick={() => {
              if (tab === 'internships') refetchInternshipApps();
              else refetchEventApps();
              toast.success('Refreshed');
            }}
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex">{tabBar}</div>

      {/* Applicant list */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-muted/20 rounded-3xl border border-dashed border-border/50">
            <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-bold text-lg">
              {filter === 'all' ? 'No applicants found' : `No ${filter} applicants found`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {filter === 'pending'
                ? 'Great — no pending applications to review!'
                : filter === 'all'
                ? `This ${entityLabel.toLowerCase()} has no applications yet`
                : `No ${filter} applicants for this ${entityLabel.toLowerCase()}`}
            </p>
          </div>
        ) : (
          apps.map((app: any) => {
            const program = app.internshipProgram;
            const event = app.event;
            const isEvent = tab === 'events';
            const entityTitle = isEvent ? event?.title : program?.title;
            const skills = isEvent ? [] : app.skills || [];
            const availability = isEvent ? null : app.availability;
            const portfolioUrl = isEvent ? null : app.portfolioUrl;
            const resumeUrl = isEvent ? null : app.resumeUrl;

            return (
              <Card
                key={app.id}
                className={`border-border/50 overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer ${
                  expandedId === app.id ? 'ring-1 ring-accent/30 bg-accent/5' : 'bg-card hover:bg-muted/10'
                }`}
                onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
              >
                <CardContent className="p-0">
                  {/* Collapsed row */}
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
                          {entityTitle && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              {isEvent ? (
                                <Sparkles className="w-3.5 h-3.5 text-accent/60" />
                              ) : (
                                <Briefcase className="w-3.5 h-3.5 text-accent/60" />
                              )}
                              {entityTitle}
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

                  {/* Expanded detail */}
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
                                  {!isEvent && (
                                    <div className="flex items-center gap-3 text-sm">
                                      <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border border-border/50">
                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-black">Phone</p>
                                        <p className="font-bold">{app.user?.phone || 'Not provided'}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Skills (internships only) */}
                              {!isEvent && (
                                <div>
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-4">
                                    Skills
                                  </h4>
                                  <div className="flex flex-wrap gap-1.5">
                                    {skills.length > 0 ? (
                                      skills.map((skill: string) => (
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
                              )}

                              {/* Availability (internships only) */}
                              {!isEvent && availability && (
                                <div className="p-3 bg-background/50 rounded-xl border border-border/30">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">
                                    Availability
                                  </p>
                                  <p className="text-sm font-bold">{availability}</p>
                                </div>
                              )}

                              {/* Event type info */}
                              {isEvent && event && (
                                <div className="p-3 bg-background/50 rounded-xl border border-border/30">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">
                                    Event Type
                                  </p>
                                  <p className="text-sm font-bold capitalize">{event.type}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDate(event.startDate)}
                                    {event.isOnline === true ? ' · Online' : event.location ? ` · ${event.location}` : ''}
                                  </p>
                                </div>
                              )}

                              {/* Portfolio / Links (internships only) */}
                              {!isEvent && (portfolioUrl || resumeUrl) && (
                                <div>
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-3">
                                    Links
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {portfolioUrl && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 rounded-xl gap-2 text-xs"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(portfolioUrl, '_blank');
                                        }}
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        Portfolio
                                      </Button>
                                    )}
                                    {resumeUrl && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 rounded-xl gap-2 text-xs"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(resumeUrl, '_blank');
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
                                        &ldquo;{entityTitle || (isEvent ? 'Event' : 'Program')}&rdquo;
                                      </strong>
                                      {!isEvent && `. Listed ${skills.length || 0} skills.`}
                                      {!isEvent && availability && ` Availability: ${availability}.`}
                                    </p>
                                    {app.status === 'approved' && (
                                      <p className="text-[11px] text-green-600 font-bold mt-1">
                                        ✓ Approved — ready to proceed.
                                      </p>
                                    )}
                                    {app.status === 'rejected' && app.rejectionReason && (
                                      <p className="text-[11px] text-red-600 mt-1">
                                        ✗ Reason: {app.rejectionReason}
                                      </p>
                                    )}
                                    {isEvent && app.selectedDeliveryMode && (
                                      <p className="text-[11px] text-muted-foreground mt-1">
                                        Delivery mode: <strong className="text-foreground">{app.selectedDeliveryMode}</strong>
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
            );
          })
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
