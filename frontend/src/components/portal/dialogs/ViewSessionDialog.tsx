import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Users, Video, MapPin, Copy, ExternalLink, Pen, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { UPDATE_INTERNSHIP_MEETING, CANCEL_INTERNSHIP_MEETING } from "@/lib/graphql/mutations";
import { GET_INTERNSHIP_MEETINGS } from "@/lib/graphql/queries";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Session {
  id?: string | number;
  title: string;
  course?: string;
  date?: string;
  time?: string;
  type?: string;
  attendees?: number;
  link?: string;
  description?: string;
  instructor?: string;
  contextTitle?: string;
  contextType?: string;
  actualId?: string;
}

interface ViewSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: any | null;
  onJoin?: (session: any) => void;
  onMeetingUpdated?: () => void;
}

const sessionTypeLabels: Record<string, string> = {
  live: "Live Session",
  workshop: "Workshop",
  office_hours: "Office Hours",
  review: "Project Review",
  mentorship: "Mentorship Call",
  "Live Session": "Live Session",
  "Mentorship": "Mentorship",
  "Review": "Review",
  "Workshop": "Workshop",
  "Program": "Program",
  ONCE: "One-Time",
  DAILY: "Daily",
  WEEKLY: "Weekly",
};

const sessionTypeColors: Record<string, string> = {
  live: "bg-green-500/20 text-green-400",
  workshop: "bg-blue-500/20 text-blue-400",
  office_hours: "bg-purple-500/20 text-purple-400",
  review: "bg-orange-500/20 text-orange-400",
  mentorship: "bg-accent/20 text-accent",
  "Live Session": "bg-green-500/20 text-green-400",
  "Mentorship": "bg-accent/20 text-accent",
  "Review": "bg-purple-500/20 text-purple-400",
  "Workshop": "bg-blue-500/20 text-blue-400",
  "Program": "bg-orange-500/20 text-orange-400",
  ONCE: "bg-accent/20 text-accent",
  DAILY: "bg-green-500/20 text-green-400",
  WEEKLY: "bg-purple-500/20 text-purple-400",
};

export function ViewSessionDialog({ open, onOpenChange, session, onJoin, onMeetingUpdated }: ViewSessionDialogProps) {
  const [mode, setMode] = useState<'view' | 'edit' | 'cancel'>('view');
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [reason, setReason] = useState("");

  const [updateMeeting, { loading: updating }] = useMutation(UPDATE_INTERNSHIP_MEETING, {
    onCompleted: () => {
      toast.success("Meeting updated! Participants notified.");
      setMode('view');
      onMeetingUpdated?.();
    },
    onError: (err) => toast.error(err.message),
    refetchQueries: [{ query: GET_INTERNSHIP_MEETINGS }],
  });

  const [cancelMeeting, { loading: cancelling }] = useMutation(CANCEL_INTERNSHIP_MEETING, {
    onCompleted: () => {
      toast.success("Meeting cancelled. Participants notified.");
      onOpenChange(false);
      onMeetingUpdated?.();
    },
    onError: (err) => toast.error(err.message),
    refetchQueries: [{ query: GET_INTERNSHIP_MEETINGS }],
  });

  if (!session) return null;

  const meetingId = session.actualId || session.id?.toString();

  const handleCopyLink = () => {
    if (session.link) {
      navigator.clipboard.writeText(session.link);
      toast.success("Meeting link copied to clipboard!");
    }
  };

  const handleJoinMeeting = () => {
    if (session.link) {
      window.open(session.link, "_blank");
      onJoin?.(session);
    }
  };

  const handleEditInit = () => {
    // Parse existing date/time from the meeting
    const dateStr = session.date || "";
    const timeStr = session.time || "";
    setEditDate(dateStr);
    if (timeStr) {
      const parts = timeStr.split(":");
      setEditStartTime(parts.length >= 2 ? `${parts[0]}:${parts[1]}` : "10:00");
      setEditEndTime(parts.length >= 2 ? `${parseInt(parts[0]) + 1}:${parts[1]}` : "11:00");
    }
    setReason("");
    setMode('edit');
  };

  const handleSaveEdit = async () => {
    if (!editDate || !editStartTime || !editEndTime) {
      toast.error("Please fill in date and time");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for the change");
      return;
    }
    const startISO = `${editDate}T${editStartTime}:00`;
    const endISO = `${editDate}T${editEndTime}:00`;
    await updateMeeting({
      variables: {
        id: meetingId,
        startTime: startISO,
        endTime: endISO,
        changeReason: reason,
      },
    });
  };

  const handleCancelMeeting = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }
    await cancelMeeting({
      variables: { id: meetingId, reason },
    });
  };

  const contextLabels: Record<string, string> = {
    course: "Course",
    project: "Project",
    client: "Client",
    internship: "Program",
    event: "Event",
    session: "Session",
    general: "General",
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setMode('view'); setReason(""); } onOpenChange(o); }}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-xl">{session.title}</DialogTitle>
            <Badge className={sessionTypeColors[session.type] || "bg-muted text-muted-foreground"}>
              {sessionTypeLabels[session.type] || session.type}
            </Badge>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-4 sm:px-6 custom-scrollbar">
          <div className="space-y-4 py-4">
            {/* Context badge */}
            {session.contextType && session.contextType !== 'general' && (
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-accent/20 text-accent">
                {contextLabels[session.contextType] || session.contextType}: {session.contextTitle || ''}
              </Badge>
            )}

            {/* Edit mode: Date/Time inputs */}
            {mode === 'edit' ? (
              <div className="space-y-4 p-4 bg-accent/5 rounded-2xl border border-accent/10">
                <h4 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
                  <Pen className="w-3.5 h-3.5" /> Edit Meeting Time
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Date</Label>
                    <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="h-10 rounded-xl" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Start Time</Label>
                    <Input type="time" value={editStartTime} onChange={e => setEditStartTime(e.target.value)} className="h-10 rounded-xl" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">End Time</Label>
                    <Input type="time" value={editEndTime} onChange={e => setEditEndTime(e.target.value)} className="h-10 rounded-xl" />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" /> Reason for change (required — sent to participants)
                  </Label>
                  <Textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="e.g. The trainer is unavailable at the original time. We apologize for the inconvenience."
                    rows={3}
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="ghost" size="sm" className="h-9 text-xs flex-1" onClick={() => setMode('view')}>
                    Back
                  </Button>
                  <Button variant="gold" size="sm" className="h-9 text-xs flex-1" onClick={handleSaveEdit} disabled={updating}>
                    {updating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    Save & Notify
                  </Button>
                </div>
              </div>
            ) : mode === 'cancel' ? (
              /* Cancel mode */
              <div className="space-y-4 p-4 bg-red-500/5 rounded-2xl border border-red-500/20">
                <h4 className="text-xs font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                  <XCircle className="w-3.5 h-3.5" /> Cancel Meeting
                </h4>
                <p className="text-xs text-muted-foreground">
                  All participants will be notified of the cancellation. Please provide a reason.
                </p>
                <div className="grid gap-1.5">
                  <Label className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-400" /> Reason for cancellation
                  </Label>
                  <Textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="e.g. Due to unforeseen circumstances, this session has been cancelled. We apologize."
                    rows={3}
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="ghost" size="sm" className="h-9 text-xs flex-1" onClick={() => setMode('view')}>
                    Keep Meeting
                  </Button>
                  <Button variant="destructive" size="sm" className="h-9 text-xs flex-1 gap-1" onClick={handleCancelMeeting} disabled={cancelling}>
                    {cancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                    Confirm Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* View mode details */
              <>
                {/* Course/Program */}
                {session.course && (
                  <div className="text-sm text-muted-foreground">{session.course}</div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{session.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{session.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{session.attendees || 0} attendees</span>
                  </div>
                  {session.instructor && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{session.instructor}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {session.description && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">{session.description}</p>
                  </div>
                )}

                {/* Meeting Link */}
                {session.link && (
                  <div className="p-4 bg-accent/10 rounded-lg border border-accent/30">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-accent" />
                      <span className="text-sm font-medium">Meeting Link</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-background/50 p-2 rounded truncate">
                        {session.link}
                      </code>
                      <Button variant="ghost" size="icon" onClick={handleCopyLink}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        {mode === 'view' && (
          <div className="flex flex-col gap-2 p-4 sm:p-6 border-t border-border">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button variant="gold" className="flex-1" onClick={handleJoinMeeting} disabled={!session.link}>
                <Video className="w-4 h-4 mr-2" />
                Join Meeting
              </Button>
            </div>
            <div className="flex gap-2">
              {meetingId && (
                <>
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-[10px] font-black uppercase tracking-widest gap-1" onClick={handleEditInit}>
                    <Pen className="w-3 h-3" /> Edit Time
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-[10px] font-black uppercase tracking-widest gap-1 text-red-500 border-red-500/30 hover:bg-red-500/10" onClick={() => { setReason(""); setMode('cancel'); }}>
                    <XCircle className="w-3 h-3" /> Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
