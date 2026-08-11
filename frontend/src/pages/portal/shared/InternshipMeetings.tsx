import { useState, useMemo } from "react";
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
  isSameYear,
  startOfToday
} from "date-fns";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
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
  Calendar
} from "lucide-react";
import { ViewSessionDialog } from "@/components/portal/dialogs";
import { CalendarGrid } from "@/components/portal/CalendarGrid";
import { toast } from "sonner";
import { useQuery } from "@apollo/client/react";
import { GET_MY_INTERNSHIP_MEETINGS } from "@/lib/graphql/queries";

export default function InternshipMeetings() {
  const [viewSession, setViewSession] = useState<any | null>(null);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');
  const { data: meetingsData, loading: meetingsLoading } = useQuery(GET_MY_INTERNSHIP_MEETINGS);

  const internshipMeetings = (meetingsData as any)?.getMyInternshipMeetings || [];
  
  const expandMeeting = (m: any) => {
    const instances: any[] = [];
    const startTimestamp = Number(m.startTime);
    const isTimestamp = !isNaN(startTimestamp);
    const startDateObj = new Date(isTimestamp ? startTimestamp : m.startTime);
    
    if (isNaN(startDateObj.getTime())) return [];

    const now = new Date();
    const rangeStart = addDays(now, -30); // Show up to 30 days in the past
    let rangeEnd = addDays(now, 90);    // Show up to 90 days in the future by default

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
    } else if (m.type === 'MONTHLY') {
      let current = startDateObj;
      if (isBefore(current, rangeStart)) {
        // Find first occurrence after rangeStart
        while (isBefore(current, rangeStart)) {
          current = new Date(current.setMonth(current.getMonth() + 1));
        }
      }

      while (isBefore(current, rangeEnd) || isSameDay(current, rangeEnd)) {
        instances.push({
          ...baseEvent,
          id: `${m.id}-${format(current, "yyyy-MM-dd")}`,
          date: format(current, "yyyy-MM-dd"),
          time: format(startDateObj, "HH:mm"),
        });
        current = new Date(current.setMonth(current.getMonth() + 1));
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

  const allEvents = internshipMeetings
    .flatMap((m: any) => expandMeeting(m));

  const filteredEvents = useMemo(() => {
    const today = startOfToday();
    const now = new Date();

    return allEvents.filter((event: any) => {
      if (event.status && event.status !== 'confirmed') return false;
      const eventDate = new Date(event.date + "T12:00:00");
      
      // Rule: Hide past events
      if (isBefore(eventDate, today)) return false;

      if (timeFilter === 'all') return true;
      if (timeFilter === 'today') return isToday(eventDate);
      if (timeFilter === 'week') return isSameWeek(eventDate, now);
      if (timeFilter === 'month') return isSameMonth(eventDate, now);
      if (timeFilter === 'year') return isSameYear(eventDate, now);
      
      return true;
    });
  }, [allEvents, timeFilter]);

  const handleJoinSession = (link: string) => {
    if (!link) {
      toast.error("No meeting link available yet.");
      return;
    }
    toast.success(`Joining meeting...`);
    window.open(link, "_blank");
  };

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
              Opportunity Meetings
            </h1>
            <p className="text-muted-foreground mt-1">
              Stay in sync with your program syncs and team meetings.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-8 bg-muted/30 p-1.5 rounded-2xl w-fit border border-border/50">
          {[
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'year', label: 'This Year' },
            { id: 'all', label: 'Show All' },
          ].map((filter) => (
            <Button
              key={filter.id}
              onClick={() => setTimeFilter(filter.id as any)}
              variant={timeFilter === filter.id ? 'gold' : 'ghost'}
              size="sm"
              className={`rounded-[14px] px-6 text-xs font-bold transition-all duration-300 ${
                timeFilter === filter.id ? 'shadow-lg shadow-gold/20' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {meetingsLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-12 h-12 animate-spin text-accent" /></div>
        ) : allEvents.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-20 text-center">
              <CalendarIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-heading text-xl font-medium text-foreground mb-2">
                No Meetings Scheduled
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                There are no upcoming program meetings or sync sessions at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <CalendarGrid
              events={allEvents}
              onEventClick={(event) => setViewSession(event)}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-xl font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent" />
                  Upcoming Syncs
                </h3>
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-muted/50">
                  {filteredEvents.length} {timeFilter} sessions
                </Badge>
              </div>

              <div className="grid gap-4">
                  {filteredEvents.map((booking: any) => {
                    const activeToday = isToday(new Date(booking.date + "T12:00:00"));
                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <Card className={`border-border/50 transition-all duration-300 relative overflow-hidden group ${
                          activeToday 
                            ? 'bg-gold/5 border-gold/40 shadow-xl shadow-gold/5 ring-1 ring-gold/20' 
                            : 'hover:border-accent/30 '
                        } bg-accent/5`}>
                          {activeToday && (
                            <div className="absolute top-0 left-0 w-1 h-full bg-gold" />
                          )}
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="flex items-start gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
                                  activeToday ? 'bg-gold/20' : 'bg-accent/20'
                                }`}>
                                  <Video className={`w-7 h-7 ${activeToday ? 'text-gold' : 'text-accent'}`} />
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h3 className={`font-heading font-semibold text-xl capitalize ${activeToday ? 'text-gold' : 'text-card-foreground'}`}>
                                      {booking.title}
                                    </h3>
                                    {activeToday ? (
                                      <Badge className="bg-gold text-black hover:bg-gold/90 font-black text-[10px] uppercase tracking-tighter">Live Session Today</Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-gold/10 text-gold border-gold/20">Hub Meeting</Badge>
                                    )}
                                  </div>
                                  <p className="text-card-foreground/80 font-medium mb-1">{booking.description || "Production Sync Session"}</p>
                                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-card-foreground/60">
                                    <span className="flex items-center gap-1.5 text-accent">
                                      <CalendarIcon className="w-4 h-4" />
                                      {booking.date}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-accent">
                                      <Clock className="w-4 h-4" />
                                      {booking.time}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                      <Users className="w-4 h-4 text-accent" />
                                      Host: {booking.host?.fullName || booking.host?.username || 'TBD'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                            <div className="flex sm:flex-col md:flex-row gap-3">
                              {booking.meetLink && (
                                <Button variant="gold" className="flex-1" onClick={() => handleJoinSession(booking.meetLink)}>
                                  <Video className="w-4 h-4 mr-2" />
                                  Join Now
                                </Button>
                              )}
                              <Button variant="outline" className="flex-1" onClick={() => setViewSession(booking)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      </motion.div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>

      <ViewSessionDialog
        open={!!viewSession}
        onOpenChange={(open) => !open && setViewSession(null)}
        session={{
          title: viewSession?.title || "Meeting",
          instructor: viewSession?.host?.fullName || viewSession?.host?.username || 'TBD',
          date: viewSession?.date,
          time: viewSession?.time,
          course: viewSession?.description || "Program Sync",
          type: 'internship',
          link: viewSession?.meetLink
        }}
        onJoin={() => handleJoinSession(viewSession?.meetLink)}
      />
    </PortalLayout>
  );
}
