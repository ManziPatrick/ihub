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

// ── Unified card icon based on item type ──────────────────────────────
function SourceIcon({ source, className }: { source: string; className?: string }) {
  if (source === 'internship') {
    return <GraduationCap className={className || 'w-5 h-5'} />;
  }
  return <Sparkles className={className || 'w-5 h-5'} />;
}

// ── Applicant stats for one entity (program or event) ─────────────────
function EntityApplicantStats({ source, entityId }: { source: string; entityId: string }) {
  // Two separate queries — only the matching one fires meaningful data
  const intQuery = useQuery(
    gql`query StatsInt($id:ID!){
      total: internshipApplications(programId:$id,page:1,limit:1){pagination{totalCount}}
      pending: internshipApplications(programId:$id,status:"pending",page:1,limit:1){pagination{totalCount}}
      approved: internshipApplications(programId:$id,status:"approved",page:1,limit:1){pagination{totalCount}}
    }`,
    { variables: { id: entityId }, fetchPolicy: "cache-and-network", skip: source !== 'internship' }
  );
  const evtQuery = useQuery(
    gql`query StatsEvt($id:ID!){
      total: eventApplications(eventId:$id,page:1,limit:1){pagination{totalCount}}
      pending: eventApplications(eventId:$id,status:"pending",page:1,limit:1){pagination{totalCount}}
      approved: eventApplications(eventId:$id,status:"approved",page:1,limit:1){pagination{totalCount}}
    }`,
    { variables: { id: entityId }, fetchPolicy: "cache-and-network", skip: source !== 'event' }
  );

  const data = source === 'internship' ? intQuery.data : evtQuery.data;
  const loading = source === 'internship' ? intQuery.loading : evtQuery.loading;

  if (loading) return <div className="h-4 w-20 bg-muted/30 rounded animate-pulse" />;
  const total = (data as any)?.total?.pagination?.totalCount ?? 0;
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
  const [selectedItem, setSelectedItem] = useState<{ id: string; source: 'internship' | 'event' } | null>(null);
  const [filter, setFilter] = useState('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list' | 'all'>('grid');
  const pageSize = 10;

  // ── Load both programs and events simultaneously ──────────────────────
  const { data: programsData, loading: programsLoading, refetch: refetchPrograms } = useQuery(
    GET_INTERNSHIP_PROGRAMS, { variables: { page: 1, limit: 100 } }
  );
  const { data: eventsData, loading: eventsLoading, refetch: refetchEvents } = useQuery(
    GET_EVENTS, { variables: { page: 1, limit: 100 } }
  );

  // ── Applications for selected entity OR all ──────────────────────────
  const {
    data: internshipAppsData,
    loading: internshipAppsLoading,
    refetch: refetchProgramApps,
  } = useQuery(GET_INTERNSHIP_APPLICATIONS, {
    variables: {
      programId: selectedItem?.source === 'internship' ? selectedItem.id : undefined,
      status: filter === 'all' ? undefined : filter,
      page,
      limit: pageSize,
    },
    skip: view === 'grid' || selectedItem?.source === 'event',
  });
  const {
    data: eventAppsData,
    loading: eventAppsLoading,
    refetch: refetchEventApps,
  } = useQuery(GET_EVENT_APPLICATIONS, {
    variables: {
      eventId: selectedItem?.source === 'event' ? selectedItem.id : undefined,
      status: filter === 'all' ? undefined : filter,
      page,
      limit: pageSize,
    },
    skip: view === 'grid' || selectedItem?.source === 'internship',
  });

  // ── Mutations ────────────────────────────────────────────────────────
  const [reviewProgramApp] = useMutation(REVIEW_INTERNSHIP_APPLICATION, {
    onCompleted: () => { refetchProgramApps(); refetchPrograms(); },
  });
  const [reviewEventApp] = useMutation(REVIEW_EVENT_APPLICATION, {
    onCompleted: () => { refetchEventApps(); refetchEvents(); },
  });

  const programs = (programsData as any)?.internshipPrograms?.items || [];
  const events = (eventsData as any)?.events?.items || [];
  const internshipApps = (internshipAppsData as any)?.internshipApplications?.items || [];
  const eventApps = (eventAppsData as any)?.eventApplications?.items || [];

  // Merge all items into one unified list for the grid
  const allItems = [
    ...programs.map((p: any) => ({ ...p, source: 'internship' as const })),
    ...events.map((e: any) => ({ ...e, source: 'event' as const })),
  ].sort((a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

  // Merge both types of applications
  const mergedApps = [
    ...internshipApps.map((a: any) => ({ ...a, source: 'internship' as const })),
    ...eventApps.map((a: any) => ({ ...a, source: 'event' as const })),
  ];

  // Merge both types of applications, filter by source when drilling in
  const apps = view !== 'all' && selectedItem
    ? mergedApps.filter(a => a.source === selectedItem.source)
    : mergedApps;

  // Source-aware pagination
  const intPagination = (internshipAppsData as any)?.internshipApplications?.pagination;
  const evtPagination = (eventAppsData as any)?.eventApplications?.pagination;
  const pagination = selectedItem?.source === 'event' ? evtPagination : intPagination;

  const loading =
    view !== 'grid' && (internshipAppsLoading || eventAppsLoading);

  // ── Helpers ───────────────────────────────────────────────────────────
  const handleStatusUpdate = async (e: React.MouseEvent, app: any, status: string) => {
    e.stopPropagation();
    try {
      if (app.source === 'internship') {
        await reviewProgramApp({ variables: { id: app.id, status } });
      } else {
        await reviewEventApp({ variables: { id: app.id, status } });
      }
      toast.success(`Application → ${status}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleBackToGrid = () => {
    setView('grid');
    setSelectedItem(null);
    setExpandedId(null);
    setPage(1);
  };

  const isProgram = (item: any) => item.source === 'internship';
  const isEvent = (item: any) => item.source === 'event';

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
    (name || "").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch { return dateStr; }
  };

  // ── Grid: browse all programs & events together ──────────────────────
  if (view === 'grid') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-foreground">Applicant Manager</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Browse all programs, bootcamps, events & sessions — manage their applicants
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search programs & events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Button
            variant="gold"
            size="sm"
            className="h-10 rounded-xl gap-2 text-xs font-black uppercase tracking-wider"                          onClick={() => { setSelectedItem(null); setView('all'); setPage(1); setFilter('all'); }}
          >
            <Users className="w-4 h-4" />
            All Applicants
          </Button>
        </div>

        {(programsLoading || eventsLoading) ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : allItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-muted/20 rounded-3xl border border-dashed border-border/50">
            <GraduationCap className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-bold">No programs or events yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create one first to manage applicants</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allItems
              .filter((item: any) => !search || item.title?.toLowerCase().includes(search.toLowerCase()))
              .map((item: any) => (
                <Card
                  key={`${item.source}-${item.id}`}
                  className="border-border/50 hover:border-accent/30 hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
                  onClick={() => { setSelectedItem({ id: item.id, source: item.source }); setView('list'); setPage(1); setFilter('pending'); }}
                >
                  <CardContent className="p-0">
                    <div className={`h-1.5 bg-gradient-to-r ${
                      isProgram(item) ? 'from-accent/60 to-accent/30' : 'from-purple-500/60 to-pink-500/30'
                    }`} />
                    <div className="p-5">
                      {/* Icon + Status */}
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center group-hover:opacity-80 transition-colors ${
                          isProgram(item) ? 'bg-accent/10' : 'bg-purple-500/10'
                        }`}>
                          <SourceIcon source={item.source} className={`w-5.5 h-5.5 ${isProgram(item) ? 'text-accent' : 'text-purple-500'}`} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {/* Source badge */}
                          <Badge className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0 ${
                            isProgram(item)
                              ? 'bg-accent/10 text-accent border-accent/20'
                              : 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                          }`}>
                            {isProgram(item) ? 'Program' : item.type || 'Event'}
                          </Badge>
                          <Badge variant="outline"
                            className={`text-[10px] font-bold capitalize border-border/50 ${
                              (item.status === 'active' || item.status === 'published')
                                ? 'text-green-600 bg-green-500/5'
                                : item.status === 'upcoming'
                                ? 'text-blue-600 bg-blue-500/5'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {item.status}
                          </Badge>
                          {item.price && item.price > 0 && (
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
                          {formatDate(item.startDate || item.createdAt)}
                        </span>
                        {isProgram(item) && item.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.duration}
                          </span>
                        )}
                        {isEvent(item) && item.type && (
                          <span className="flex items-center gap-1 capitalize">
                            <Presentation className="w-3 h-3" />
                            {item.type}
                          </span>
                        )}
                      </div>

                      {/* Applicant stats */}
                      <div className="border-t border-border/30 pt-3 mt-1">
                        <EntityApplicantStats source={item.source} entityId={item.id} />
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
  const currentSource = selectedItem?.source || 'internship';
  const selectedTitle = selectedItem
    ? allItems.find((i: any) => i.id === selectedItem.id && i.source === selectedItem.source)?.title || 'Selected'
    : 'All Programs & Events';

  const sourceLabel = currentSource === 'internship' ? 'Program' : 'Event';

  return (
    <div className="space-y-6">
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
                <Badge className={`text-[9px] font-black uppercase tracking-widest ${
                  currentSource === 'internship'
                    ? 'bg-accent/10 text-accent border-accent/20'
                    : 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                }`}>
                  {sourceLabel}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {sourceLabel} — Review, approve & manage candidates
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
              refetchProgramApps();
              refetchEventApps();
              toast.success('Refreshed');
            }}
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </Button>
        </div>
      </div>

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
                : `No ${filter} applicants`}
            </p>
          </div>
        ) : (
          apps.map((app: any) => {
            const appIsProgram = app.source === 'internship';
            const entityTitle = appIsProgram
              ? app.internshipProgram?.title
              : app.event?.title;
            const skills = appIsProgram ? app.skills || [] : [];
            const availability = appIsProgram ? app.availability : null;
            const portfolioUrl = appIsProgram ? app.portfolioUrl : null;
            const resumeUrl = appIsProgram ? app.resumeUrl : null;

            return (
              <Card
                key={`${app.source}-${app.id}`}
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
                              {appIsProgram ? (
                                <Briefcase className="w-3.5 h-3.5 text-accent/60" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5 text-accent/60" />
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
                          onClick={(e) => handleStatusUpdate(e, app, 'approved')}
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
                          onClick={(e) => handleStatusUpdate(e, app, 'rejected')}
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
                          onClick={(e) => handleStatusUpdate(e, app, 'waitlisted')}
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
                                  {appIsProgram && (
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

                              {appIsProgram && (
                                <div>
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-4">Skills</h4>
                                  <div className="flex flex-wrap gap-1.5">
                                    {skills.length > 0 ? (
                                      skills.map((skill: string) => (
                                        <Badge key={skill} variant="outline" className="bg-background border-border/50 rounded-lg text-[11px] font-bold py-1 px-2.5">{skill}</Badge>
                                      ))
                                    ) : (
                                      <span className="text-xs text-muted-foreground italic">No skills listed</span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {appIsProgram && availability && (
                                <div className="p-3 bg-background/50 rounded-xl border border-border/30">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Availability</p>
                                  <p className="text-sm font-bold">{availability}</p>
                                </div>
                              )}

                              {!appIsProgram && app.event && (
                                <div className="p-3 bg-background/50 rounded-xl border border-border/30">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Event Type</p>
                                  <p className="text-sm font-bold capitalize">{app.event.type}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDate(app.event.startDate)}
                                    {app.event.isOnline === true ? ' · Online' : app.event.location ? ` · ${app.event.location}` : ''}
                                  </p>
                                </div>
                              )}

                              {appIsProgram && (portfolioUrl || resumeUrl) && (
                                <div>
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-3">Links</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {portfolioUrl && (
                                      <Button variant="outline" size="sm" className="h-9 rounded-xl gap-2 text-xs"
                                        onClick={(e) => { e.stopPropagation(); window.open(portfolioUrl, '_blank'); }}>
                                        <ExternalLink className="w-3.5 h-3.5" /> Portfolio
                                      </Button>
                                    )}
                                    {resumeUrl && (
                                      <Button variant="outline" size="sm" className="h-9 rounded-xl gap-2 text-xs"
                                        onClick={(e) => { e.stopPropagation(); window.open(resumeUrl, '_blank'); }}>
                                        <FileText className="w-3.5 h-3.5" /> Resume
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Right column */}
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-4">Application Responses</h4>
                                <div className="space-y-4">
                                  {app.applicationAnswers?.length > 0 ? (
                                    app.applicationAnswers.map((ans: any, idx: number) => (
                                      <div key={idx} className="space-y-1.5">
                                        <p className="text-xs font-black text-foreground/80">{ans.questionLabel}</p>
                                        <div className="p-3 bg-background/50 rounded-xl border border-border/30 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                          {ans.answer || <span className="italic text-muted-foreground/50">No answer</span>}
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

                              <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10">
                                <h4 className="text-[9px] font-black uppercase tracking-widest text-accent mb-2">Management Notes</h4>
                                <div className="flex items-start gap-2">
                                  <UserCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                      Applying for <strong className="text-foreground">&ldquo;{entityTitle || (appIsProgram ? 'Program' : 'Event')}&rdquo;</strong>
                                      {appIsProgram && `. Listed ${skills.length || 0} skills.`}
                                      {appIsProgram && availability && ` Availability: ${availability}.`}
                                    </p>
                                    {app.status === 'approved' && (
                                      <p className="text-[11px] text-green-600 font-bold mt-1">✓ Approved — ready to proceed.</p>
                                    )}
                                    {app.status === 'rejected' && app.rejectionReason && (
                                      <p className="text-[11px] text-red-600 mt-1">✗ Reason: {app.rejectionReason}</p>
                                    )}
                                    {!appIsProgram && app.selectedDeliveryMode && (
                                      <p className="text-[11px] text-muted-foreground mt-1">
                                        Delivery mode: <strong className="text-foreground">{app.selectedDeliveryMode}</strong>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Button variant="outline" size="sm" className="h-9 rounded-xl gap-2 text-xs"
                                  onClick={(e) => { e.stopPropagation(); window.open(`/portal/admin/users?search=${app.user?.email}`, '_blank'); }}>
                                  <ExternalLink className="w-3.5 h-3.5" /> View Full Profile
                                </Button>
                                <Button variant="outline" size="sm" className="h-9 rounded-xl gap-2 text-xs"
                                  onClick={(e) => { e.stopPropagation(); window.open(`/portal/admin/users/${app.user?.id}`, '_blank'); }}>
                                  <Activity className="w-3.5 h-3.5" /> User Report
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
