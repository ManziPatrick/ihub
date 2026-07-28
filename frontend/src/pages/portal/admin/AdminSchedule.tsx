import { useState } from "react";
import { motion } from "framer-motion";
import { 
  format, 
  addDays, 
  isBefore, 
  isSameDay, 
  getDay, 
  isToday, 
  isSameWeek, 
  isSameMonth, 
  startOfToday,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek
} from "date-fns";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Plus,
  CheckCircle2,
  XCircle,
  BookOpen,
  Layout,
  Building2,
  GraduationCap,
  Globe,
  CalendarCheck,
  Sparkles
} from "lucide-react";
import { ViewSessionDialog, CreateProgramMeetingDialog } from "@/components/portal/dialogs";
import { toast } from "sonner";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_ALL_BOOKINGS, GET_INTERNSHIP_MEETINGS, GET_MEETING_ATTENDANCE } from "@/lib/graphql/queries";
import { BATCH_MARK_ATTENDANCE } from "@/lib/graphql/mutations";
import { useAuth } from "@/contexts/AuthContext";

const CONTEXT_FILTERS = [
  { id: 'all', label: 'All', icon: Globe },
  { id: 'course', label: 'Courses', icon: BookOpen },
  { id: 'project', label: 'Projects', icon: Layout },
  { id: 'client', label: 'Clients', icon: Building2 },
  { id: 'internship', label: 'Programs', icon: GraduationCap },
  { id: 'event', label: 'Events', icon: CalendarCheck },
  { id: 'session', label: 'Sessions', icon: Sparkles },
];

export default function AdminSchedule() {
  const { user: currentUser } = useAuth();
  const [viewSession, setViewSession] = useState<any | null>(null);
  const [timeFilter, setTimeFilter] = useState<'today' | '3days' | 'week' | 'month' | 'all'>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [viewDate, setViewDate] = useState(startOfToday());
  const [selectedDay, setSelectedDay] = useState<Date>(startOfToday());
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [contextFilter, setContextFilter] = useState('all');
  const [attendanceOpen, setAttendanceOpen] = useState<string | null>(null);

  const { data: bookingsData, loading: bookingsLoading } = useQuery(GET_ALL_BOOKINGS, {
    variables: { limit: 100 }
  });
  const { data: meetingsData, loading: meetingsLoading, refetch: refetchProgramMeetings } = useQuery(GET_INTERNSHIP_MEETINGS, {
    variables: contextFilter !== 'all' ? { contextType: contextFilter } : {},
  });
  const { data: attendanceData, loading: attendanceLoading } = useQuery(GET_MEETING_ATTENDANCE, {
    variables: { meetingId: attendanceOpen },
    skip: !attendanceOpen,
  });
  const [batchMarkAttendance] = useMutation(BATCH_MARK_ATTENDANCE);

  const bookings = (bookingsData as any)?.bookings?.items || [];
  const internshipMeetings = (meetingsData as any)?.getProgramMeetings || [];
  const meetingAttendees = (attendanceData as any)?.getMeetingAttendance || [];

  // Expand recurring meetings
  const expandMeeting = (m: any) => {
    const instances: any[] = [];
    const startTimestamp = Number(m.startTime);
    const isTimestamp = !isNaN(startTimestamp);
    const startDateObj = new Date(isTimestamp ? startTimestamp : m.startTime);
    
    if (isNaN(startDateObj.getTime())) return [];

    const now = new Date();
    const rangeStart = addDays(now, -30);
    let rangeEnd = addDays(now, 90);

    const recurrenceEnd = m.recurrenceEndDate ? new Date(isNaN(Number(m.recurrenceEndDate)) ? m.recurrenceEndDate : Number(m.recurrenceEndDate)) : null;
    if (recurrenceEnd && !isNaN(recurrenceEnd.getTime())) {
      rangeEnd = recurrenceEnd;
    }

    const baseEvent = {
      ...m,
      id: m.id,
      title: m.title,
      mentor: m.host,
      meetingLink: m.meetLink,
      status: 'confirmed',
      source: 'internship'
    };

    if (m.type === 'DAILY') {
      let current = startDateObj;
      if (isBefore(current, rangeStart)) current = rangeStart;
      
      while (isBefore(current, rangeEnd) || isSameDay(current, rangeEnd)) {
        if (m.recurrenceDays?.length === 0 || m.recurrenceDays?.includes(getDay(current))) {
          instances.push({
            ...baseEvent,
            id: `${m.id}-${format(current, "yyyy-MM-dd")}`,
            date: format(current, "yyyy-MM-dd"),
            time: format(startDateObj, "HH:mm"),
          });
        }
        current = addDays(current, 1);
        if (instances.length > 365) break; 
      }
    } else if (m.type === 'WEEKLY' && m.recurrenceDays?.length > 0) {
      let current = startDateObj;
      if (isBefore(current, rangeStart)) current = rangeStart;

      while (isBefore(current, rangeEnd) || isSameDay(current, rangeEnd)) {
        if (m.recurrenceDays.includes(getDay(current))) {
          instances.push({
            ...baseEvent,
            id: `${m.id}-${format(current, "yyyy-MM-dd")}`,
            date: format(current, "yyyy-MM-dd"),
            time: format(startDateObj, "HH:mm"),
          });
        }
        current = addDays(current, 1);
        if (instances.length > 365) break;
      }
    } else {
      instances.push({
        ...baseEvent,
        date: format(startDateObj, "yyyy-MM-dd"),
        time: format(startDateObj, "HH:mm"),
      });
    }
    return instances;
  };

  const expandedMeetings = internshipMeetings.flatMap((m: any) => expandMeeting(m));

  const allEvents = [
    ...bookings.map((b: any) => ({
      ...b,
      id: b.id,
      title: (b.type || 'Mentorship').replace('-', ' ') + (b.user ? ` - ${b.user.username}` : ""),
      source: 'booking',
      contextType: 'general',
      contextTitle: 'Mentorship',
    })),
    ...expandedMeetings
  ].sort((a: any, b: any) => {
    const aTime = new Date(`${a.date}T${a.time}:00`).getTime();
    const bTime = new Date(`${b.date}T${b.time}:00`).getTime();
    return aTime - bTime;
  });

  const today = startOfToday();

  const filteredEvents = allEvents.filter((event: any) => {
    const eventDate = new Date(event.date + "T12:00:00");
    if (timeFilter === 'all') return true;
    if (timeFilter === 'today') return isToday(eventDate);
    if (timeFilter === '3days') {
        const endDate = addDays(viewDate, 3);
        return (isSameDay(eventDate, viewDate) || isBefore(eventDate, endDate)) && (isSameDay(eventDate, viewDate) || !isBefore(eventDate, viewDate));
    }
    if (timeFilter === 'week') return isSameWeek(eventDate, viewDate);
    if (timeFilter === 'month') return isSameMonth(eventDate, viewDate);
    return true;
  });

  const handleJoinSession = (link: string) => {
    if (!link) {
      toast.error("No meeting link available yet.");
      return;
    }
    window.open(link, "_blank");
  };

  const getEventsForDay = (d: Date) => {
    return allEvents.filter(event => isSameDay(new Date(event.date + "T12:00:00"), d));
  };

  // Handle batch attendance
  const handleMarkAllPresent = async (meetingId: string) => {
    const meeting = internshipMeetings.find((m: any) => m.id === meetingId);
    if (!meeting?.attendees?.length) {
      toast.error("No attendees to mark");
      return;
    }
    try {
      await batchMarkAttendance({
        variables: {
          meetingId,
          attendanceData: meeting.attendees.map((a: any) => ({
            userId: a.userId,
            attended: true,
          })),
        },
      });
      toast.success("All marked present");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Calendar Grid Logic
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = [];
  let day = startDate;
  while (day <= endDate) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  const loading = bookingsLoading || meetingsLoading;

  // Context badge config
  const contextConfig: Record<string, { label: string; color: string }> = {
    course: { label: 'Course', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    project: { label: 'Project', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    client: { label: 'Client', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    internship: { label: 'Program', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    event: { label: 'Event', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    session: { label: 'Session', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
    general: { label: 'General', color: 'bg-gold/10 text-gold border-gold/20' },
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
              Admin Calendar
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor student sessions, program meetings, and attendance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="gold" size="sm" className="h-10 px-6 font-bold" onClick={() => setScheduleOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Meeting
            </Button>
            <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50">
              <Button 
                variant={viewMode === 'calendar' ? 'gold' : 'ghost'} 
                size="sm" 
                className="rounded-lg px-4 h-9 font-bold text-xs"
                onClick={() => setViewMode('calendar')}
              >
                <CalendarIcon className="w-3.5 h-3.5 mr-2" />
                Calendar
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'gold' : 'ghost'} 
                size="sm" 
                className="rounded-lg px-4 h-9 font-bold text-xs"
                onClick={() => setViewMode('list')}
              >
                <Users className="w-3.5 h-3.5 mr-2" />
                List View
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Context Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border/50 w-fit">
          {CONTEXT_FILTERS.map((filter) => {
            const Icon = filter.icon;
            return (
              <Button
                key={filter.id}
                onClick={() => setContextFilter(filter.id)}
                variant={contextFilter === filter.id ? 'gold' : 'ghost'}
                size="sm"
                className="rounded-[14px] px-4 text-xs font-bold"
              >
                <Icon className="w-3.5 h-3.5 mr-1.5" />
                {filter.label}
              </Button>
            );
          })}
        </div>

        {viewMode === 'calendar' ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-8 space-y-6">
              <Card className="border-border/50 bg-card/30 backdrop-blur-md overflow-hidden rounded-3xl">
                <CardHeader className="border-b border-border/20 py-6 px-8 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-heading font-bold text-foreground">
                      {format(viewDate, "MMMM yyyy")}
                    </h2>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setViewDate(new Date())}>
                        <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-7 border-b border-border/20 bg-muted/20">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 border-r border-border/10 last:border-0">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 border-border/10">
                    {calendarDays.map((d, i) => {
                      const dayEvents = getEventsForDay(d);
                      const isCurrentMonth = isSameMonth(d, viewDate);
                      const isSelected = isSameDay(d, selectedDay);
                      const isTodayDate = isToday(d);
                      
                      return (
                        <div 
                          key={i} 
                          onClick={() => setSelectedDay(d)}
                          className={`min-h-[120px] p-2 border-r border-b border-border/10 transition-all duration-300 cursor-pointer group hover:bg-gold/5 ${
                            !isCurrentMonth ? 'opacity-20' : ''
                          } ${isSelected ? 'bg-gold/10' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                              isTodayDate ? 'bg-gold text-white shadow-lg' : (isSelected ? 'text-gold' : 'text-muted-foreground group-hover:text-foreground')
                            }`}>
                              {format(d, "d")}
                            </span>
                            {dayEvents.length > 0 && (
                              <span className="text-[9px] font-black text-gold bg-gold/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                {dayEvents.length}
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            {dayEvents.slice(0, 3).map((e, idx) => (
                              <div key={idx} className={`text-[9px] font-bold p-1 rounded border leading-tight truncate ${
                                e.source === 'internship' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-gold/10 border-gold/20 text-gold'
                              }`}>
                                {e.time} {e.title}
                              </div>
                            ))}
                            {dayEvents.length > 3 && (
                              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest text-center mt-1">
                                + {dayEvents.length - 3} more
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="xl:col-span-4 space-y-6">
              <motion.div
                key={selectedDay.toString()}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="border-border/50 bg-card/5 backdrop-blur-md rounded-3xl overflow-hidden border-l-4 border-l-gold">
                  <CardHeader className="pb-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gold">Schedule for</h3>
                    <div className="flex items-end gap-2 mt-1">
                      <span className="text-4xl font-black text-foreground tracking-tighter">{format(selectedDay, "d")}</span>
                      <div className="mb-1">
                        <p className="text-sm font-bold text-foreground leading-none">{format(selectedDay, "EEEE")}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">{format(selectedDay, "MMMM yyyy")}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {getEventsForDay(selectedDay).length === 0 ? (
                      <div className="py-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto">
                          <CalendarIcon className="w-6 h-6 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">No meetings scheduled for this day.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {getEventsForDay(selectedDay).map((event: any) => {
                          const ctxConf = contextConfig[event.contextType] || contextConfig.general;
                          return (
                            <div key={event.id} className="p-4 rounded-2xl bg-background/50 border border-border/30 hover:border-gold/30 transition-all group">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-widest h-5 ${
                                    event.source === 'internship' ? 'text-purple-400 border-purple-500/20' : 'text-gold border-gold/20'
                                  }`}>
                                    {event.source === 'internship' ? 'Program Meet' : 'Mentorship'}
                                  </Badge>
                                  {event.contextType && event.contextType !== 'general' && (
                                    <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-widest h-5 ${ctxConf.color}`}>
                                      {ctxConf.label}
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs font-black text-foreground/80">{event.time}</span>
                              </div>
                              <h4 className="font-bold text-sm text-foreground mb-1 leading-snug group-hover:text-gold transition-colors">{event.title}</h4>
                              {event.contextTitle && (
                                <p className="text-[9px] text-muted-foreground mb-1 font-medium">{event.contextTitle}</p>
                              )}
                              <p className="text-[10px] text-muted-foreground mb-3 truncate">
                                {event.mentor?.username ? `With ${event.mentor.username}` : (event.user?.username ? `Student: ${event.user.username}` : '')}
                              </p>
                              <div className="flex gap-2">
                                {event.meetingLink && (
                                  <Button variant="gold" size="sm" className="flex-1 h-8 text-[10px] font-black uppercase tracking-widest" onClick={() => handleJoinSession(event.meetingLink)}>
                                    Join Call
                                  </Button>
                                )}
                                <Button variant="outline" size="sm" className="flex-1 h-8 text-[10px] font-black uppercase tracking-widest" onClick={() => {
                                  setViewSession(event);
                                  setAttendanceOpen(event.source === 'internship' ? event.id?.split('-')[0] : null);
                                }}>
                                  Details
                                </Button>
                              </div>
                              {/* Attendance indicator for internship meetings */}
                              {event.source === 'internship' && event.attendees && event.attendees.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-border/10 flex items-center gap-2">
                                  <Users className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-[10px] font-medium text-muted-foreground">
                                    {event.attendees.filter((a: any) => a.attended).length}/{event.attendees.length} attended
                                  </span>
                                  {event.attendees.filter((a: any) => !a.attended).length > 0 && (
                                    <Badge variant="outline" className="text-[8px] font-black uppercase text-amber-400 border-amber-500/20">
                                      {event.attendees.filter((a: any) => !a.attended).length} absent
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border/50 w-fit">
              {[
                { id: 'today', label: 'Today' },
                { id: '3days', label: 'Upcoming 3 Days' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
                { id: 'all', label: 'Show All' },
              ].map((filter) => (
                <Button
                  key={filter.id}
                  onClick={() => setTimeFilter(filter.id as any)}
                  variant={timeFilter === filter.id ? 'gold' : 'ghost'}
                  size="sm"
                  className="rounded-[14px] px-6 text-xs font-bold"
                >
                  {filter.label}
                </Button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-12 h-12 animate-spin text-gold" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEvents.map((booking: any) => {
                  const ctxConf = contextConfig[booking.contextType] || contextConfig.general;
                  return (
                    <Card key={booking.id} className="border-border/50 bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden hover:border-gold/30 transition-colors">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                              <Video className="w-4 h-4 text-gold" />
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-gold">{booking.source === 'internship' ? 'Meeting' : 'Call'}</span>
                              {booking.contextType && booking.contextType !== 'general' && (
                                <Badge variant="outline" className={`ml-2 text-[7px] font-black uppercase tracking-widest h-4 ${ctxConf.color}`}>
                                  {ctxConf.label}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-bold text-card-foreground/60">{booking.time}</span>
                        </div>
                        
                        <h3 className="font-bold text-base text-foreground mb-1 line-clamp-1">{booking.title}</h3>
                        {booking.contextTitle && (
                          <p className="text-[10px] text-muted-foreground mb-1 font-medium">{booking.contextTitle}</p>
                        )}
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-4">
                          <Clock className="w-3 h-3" />
                          {format(new Date(booking.date + "T12:00:00"), "EEEE, MMM d")}
                        </div>

                        {/* Attendance quick actions for internship meetings */}
                        {booking.source === 'internship' && (
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground">
                                {booking.attendees?.filter((a: any) => a.attended).length || 0}/{booking.attendees?.length || 0}
                              </span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 text-[9px] font-black uppercase tracking-widest text-gold"
                              onClick={() => handleMarkAllPresent(booking.id?.split('-')[0])}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Mark All Present
                            </Button>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button variant="gold" size="sm" className="flex-1 text-[10px] font-black" onClick={() => handleJoinSession(booking.meetingLink)}>Join</Button>
                          <Button variant="outline" size="sm" className="flex-1 text-[10px] font-black" onClick={() => setViewSession(booking)}>Details</Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <ViewSessionDialog
        open={!!viewSession}
        onOpenChange={(open) => { if (!open) setViewSession(null); }}
        session={{
          ...viewSession,
          actualId: viewSession?.id?.split('-')[0] || viewSession?.id,
          title: viewSession?.title || "Session",
          instructor: viewSession?.mentor?.username || viewSession?.host?.username || 'TBD',
          date: viewSession?.date,
          time: viewSession?.time,
          course: viewSession?.topic || viewSession?.contextTitle || "Program Session",
          type: viewSession?.type,
          link: viewSession?.meetingLink || viewSession?.link,
        }}
        onJoin={() => handleJoinSession(viewSession?.meetingLink || viewSession?.link)}
        onMeetingUpdated={() => { refetchProgramMeetings?.(); }}
      />

      <CreateProgramMeetingDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
      />
    </PortalLayout>
  );
}
