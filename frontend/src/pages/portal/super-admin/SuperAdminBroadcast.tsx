import { useState, useMemo } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_ALL_STUDENTS, GET_ALL_TRAINERS } from "@/lib/graphql/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Send,
  Loader2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Users,
  Mail,
  Bell,
  Globe,
  UserPlus,
  CalendarClock,
  Clock,
  Trash2,
  XCircle,
  CalendarDays,
  ListTodo,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { PortalLayout } from "@/components/portal/PortalLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDesc,
  AlertDialogFooter as AlertFoot,
  AlertDialogHeader,
  AlertDialogTitle as AlertTitle,
} from "@/components/ui/alert-dialog";

// ─── Queries ────────────────────────────────────────────────────────────
const GET_TEAMS_FOR_BROADCAST = gql`
  query GetTeamsForBroadcast {
    internshipTeams(page: 1, limit: 200) {
      items {
        id
        name
        mentor {
          id
          username
          fullName
        }
      }
    }
  }
`;

const GET_SCHEDULED_BROADCASTS = gql`
  query GetScheduledBroadcasts($page: Int, $limit: Int, $status: String) {
    scheduledBroadcasts(page: $page, limit: $limit, status: $status) {
      items {
        id
        title
        message
        link
        targetRole
        sendEmail
        sendNotification
        scheduledAt
        status
        sentAt
        createdBy {
          id
          username
          fullName
        }
        result {
          totalRecipients
          notificationsSent
          emailsSent
          errors
        }
        createdAt
      }
      pagination {
        totalCount
        totalPages
        currentPage
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

// ─── Mutations ──────────────────────────────────────────────────────────
const SEND_BULK_NOTIFICATION = gql`
  mutation SendBulkNotification(
    $title: String!
    $message: String!
    $link: String
    $targetRole: String
    $userIds: [ID!]
    $teamIds: [ID!]
    $sendEmail: Boolean!
    $sendNotification: Boolean!
  ) {
    sendBulkNotification(
      title: $title
      message: $message
      link: $link
      targetRole: $targetRole
      userIds: $userIds
      teamIds: $teamIds
      sendEmail: $sendEmail
      sendNotification: $sendNotification
    ) {
      success
      totalRecipients
      notificationsSent
      emailsSent
      errors
    }
  }
`;

const SCHEDULE_BROADCAST = gql`
  mutation ScheduleBroadcast(
    $title: String!
    $message: String!
    $link: String
    $targetRole: String
    $userIds: [ID!]
    $teamIds: [ID!]
    $sendEmail: Boolean!
    $sendNotification: Boolean!
    $scheduledAt: String!
  ) {
    scheduleBroadcast(
      title: $title
      message: $message
      link: $link
      targetRole: $targetRole
      userIds: $userIds
      teamIds: $teamIds
      sendEmail: $sendEmail
      sendNotification: $sendNotification
      scheduledAt: $scheduledAt
    ) {
      id
      title
      scheduledAt
      status
    }
  }
`;

const CANCEL_SCHEDULED_BROADCAST = gql`
  mutation CancelScheduledBroadcast($id: ID!) {
    cancelScheduledBroadcast(id: $id) {
      id
      status
    }
  }
`;

const UPDATE_SCHEDULED_BROADCAST = gql`
  mutation UpdateScheduledBroadcast(
    $id: ID!
    $title: String
    $message: String
    $link: String
    $targetRole: String
    $userIds: [ID!]
    $teamIds: [ID!]
    $sendEmail: Boolean
    $sendNotification: Boolean
    $scheduledAt: String
  ) {
    updateScheduledBroadcast(
      id: $id
      title: $title
      message: $message
      link: $link
      targetRole: $targetRole
      userIds: $userIds
      teamIds: $teamIds
      sendEmail: $sendEmail
      sendNotification: $sendNotification
      scheduledAt: $scheduledAt
    ) {
      id
      title
      message
      link
      targetRole
      sendEmail
      sendNotification
      scheduledAt
      status
    }
  }
`;

const DELETE_SCHEDULED_BROADCAST = gql`
  mutation DeleteScheduledBroadcast($id: ID!) {
    deleteScheduledBroadcast(id: $id)
  }
`;

interface Team {
  id: string;
  name: string;
  mentor?: { id: string; username: string; fullName: string };
}

interface User {
  id: string;
  username: string;
  fullName?: string;
  email?: string;
}

export default function SuperAdminBroadcast() {
  const [activeTab, setActiveTab] = useState("send");

  return (
    <PortalLayout>
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">📢 Broadcast Center</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Send announcements via in-app notifications and/or email — instantly or scheduled
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="send" className="gap-2">
            <Send className="w-4 h-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-2">
            <CalendarClock className="w-4 h-4" />
            Scheduled
          </TabsTrigger>
        </TabsList>

        {/* ── Compose Tab ── */}
        <TabsContent value="send" className="mt-6">
          <BroadcastComposer />
        </TabsContent>

        {/* ── Scheduled Tab ── */}
        <TabsContent value="scheduled" className="mt-6">
          <ScheduledBroadcastsList />
        </TabsContent>
      </Tabs>
    </div>
    </PortalLayout>
  );
}

// ─── Broadcast Composer (with scheduling support) ───────────────────────
function BroadcastComposer() {
  const { data: studentsData } = useQuery(GET_ALL_STUDENTS);
  const { data: trainersData } = useQuery(GET_ALL_TRAINERS);
  const { data: teamsData } = useQuery(GET_TEAMS_FOR_BROADCAST);

  const students: User[] = (studentsData as any)?.getAllStudents || [];
  const trainers: User[] = (trainersData as any)?.getAllTrainers || [];
  const teams: Team[] = (teamsData as any)?.internshipTeams?.items || [];


  const [targetMode, setTargetMode] = useState<"role" | "ids" | "teams">("role");
  const [selectedRole, setSelectedRole] = useState("student");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [sendNotification, setSendNotification] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");

  // Scheduling state
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const [sendBulk, { loading: sending }] = useMutation(SEND_BULK_NOTIFICATION);
  const [scheduleBulk, { loading: scheduling }] = useMutation(SCHEDULE_BROADCAST, {
    refetchQueries: [{ query: GET_SCHEDULED_BROADCASTS, variables: { page: 1, limit: 50 } }],
  });
  const [result, setResult] = useState<any>(null);

  const recipientCount = useMemo(() => {
    switch (targetMode) {
      case "role":
        return selectedRole === "student" ? students.length
          : selectedRole === "trainer" ? trainers.length : 0;
      case "ids": return selectedUserIds.length;
      case "teams": return selectedTeamIds.length;
      default: return 0;
    }
  }, [targetMode, selectedRole, students, trainers, selectedUserIds, selectedTeamIds]);

  const toggleUserId = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleTeamId = (id: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const buildVariables = () => {
    const vars: any = {
      title: title.trim(),
      message: message.trim(),
      link: link.trim() || null,
      sendEmail,
      sendNotification,
    };
    if (targetMode === "role") vars.targetRole = selectedRole;
    else if (targetMode === "ids") vars.userIds = selectedUserIds;
    else if (targetMode === "teams") vars.teamIds = selectedTeamIds;
    return vars;
  };

  const validate = (): string | null => {
    if (!title.trim()) return "Title is required";
    if (!message.trim()) return "Message is required";
    if (!sendEmail && !sendNotification) return "Select at least one delivery channel";
    if (recipientCount === 0) return "No recipients selected";
    if (isScheduled) {
      if (!scheduleDate || !scheduleTime) return "Schedule date and time are required";
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
      if (isNaN(scheduledAt.getTime())) return "Invalid date/time";
      if (scheduledAt <= new Date()) return "Scheduled time must be in the future";
    }
    return null;
  };

  const handleSend = async () => {
    const error = validate();
    if (error) { toast.error(error); return; }

    try {
      const variables = buildVariables();

      if (isScheduled) {
        const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
        await scheduleBulk({ variables: { ...variables, scheduledAt } });
        toast.success(`Broadcast scheduled for ${format(scheduledAt, "MMM d, yyyy HH:mm")}`);
        resetForm();
      } else {
        const { data } = await sendBulk({ variables });
        const res = (data as any)?.sendBulkNotification;
        setResult(res);
        if (res?.success) toast.success(`Sent to ${res.totalRecipients} recipients`);
        else toast.warning(`Sent with ${res?.errors?.length || 0} errors`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send broadcast");
    }
  };

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setLink("");
    setSelectedRole("student");
    setSelectedUserIds([]);
    setSelectedTeamIds([]);
    setSendNotification(true);
    setSendEmail(false);
    setResult(null);
    setIsScheduled(false);
    setScheduleDate("");
    setScheduleTime("");
  };

  const isLoading = sending || scheduling;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Targeting + Channels + Schedule */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Target Audience</CardTitle>
            <CardDescription className="text-xs">Choose who receives this announcement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Target By</Label>
              <Select value={targetMode} onValueChange={(v: any) => setTargetMode(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="role"><span className="flex items-center gap-2"><Users className="w-4 h-4" /> By Role</span></SelectItem>
                  <SelectItem value="ids"><span className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> Specific Users</span></SelectItem>
                  <SelectItem value="teams"><span className="flex items-center gap-2"><Globe className="w-4 h-4" /> By Team</span></SelectItem>
                </SelectContent>
              </Select>
            </div>

            {targetMode === "role" && (
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="trainer">Trainers</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {targetMode === "ids" && (
              <div className="space-y-2">
                <Label>Select Users ({selectedUserIds.length} selected)</Label>
                <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
                  {students.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm">
                      <input type="checkbox" checked={selectedUserIds.includes(s.id)} onChange={() => toggleUserId(s.id)} className="rounded" />
                      {s.fullName || s.username}
                    </label>
                  ))}
                  {trainers.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm">
                      <input type="checkbox" checked={selectedUserIds.includes(t.id)} onChange={() => toggleUserId(t.id)} className="rounded" />
                      {t.fullName || t.username} (Trainer)
                    </label>
                  ))}
                </div>
              </div>
            )}

            {targetMode === "teams" && (
              <div className="space-y-2">
                <Label>Select Teams ({selectedTeamIds.length} selected)</Label>
                <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
                  {teams.map((team) => (
                    <label key={team.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm">
                      <input type="checkbox" checked={selectedTeamIds.includes(team.id)} onChange={() => toggleTeamId(team.id)} className="rounded" />
                      {team.name}
                      {team.mentor && <span className="text-xs text-muted-foreground">(Mentor: {team.mentor.fullName || team.mentor.username})</span>}
                    </label>
                  ))}
                  {teams.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No teams available</p>}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs text-muted-foreground">Recipients</span>
              <Badge variant="secondary" className="text-xs"><Users className="w-3 h-3 mr-1" />{recipientCount}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Delivery Channels</CardTitle>
            <CardDescription className="text-xs">How should recipients receive this?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <div><Label className="text-sm">In-App Notification</Label><p className="text-xs text-muted-foreground">Push to portal dashboard</p></div>
              </div>
              <Switch checked={sendNotification} onCheckedChange={setSendNotification} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div><Label className="text-sm">Email</Label><p className="text-xs text-muted-foreground">Send via SMTP email</p></div>
              </div>
              <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
            </div>
          </CardContent>
        </Card>

        {/* Schedule Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Schedule</CardTitle>
            <CardDescription className="text-xs">Send immediately or schedule for later</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm">Schedule for later</Label>
                  <p className="text-xs text-muted-foreground">Set a future date and time</p>
                </div>
              </div>
              <Switch checked={isScheduled} onCheckedChange={setIsScheduled} />
            </div>

            {isScheduled && (
              <div className="space-y-3 pt-2 border-t">
                <div className="space-y-2">
                  <Label htmlFor="schedule-date">Date</Label>
                  <Input
                    id="schedule-date"
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-time">Time</Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right: Message Composer + Preview */}
      <div className="lg:col-span-2 space-y-4">
        {/* Message Preview */}
        {title || message ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-2">
                <Mail className="w-3 h-3" /> Preview
              </div>
              <div className="bg-card rounded-lg border p-4">
                <h3 className="font-bold text-sm">{title || "(No title)"}</h3>
                <p className="text-xs text-muted-foreground mt-2 whitespace-pre-line line-clamp-4">{message || "(No message)"}</p>
                {link && (
                  <div className="mt-2">
                    <span className="text-xs text-accent underline truncate block">{link}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground pt-2 border-t">
                  {sendNotification && <span><Bell className="w-3 h-3 inline mr-1" />Notification</span>}
                  {sendEmail && <span><Mail className="w-3 h-3 inline mr-1" />Email</span>}
                  {isScheduled && scheduleDate && <span><CalendarClock className="w-3 h-3 inline mr-1" />{scheduleDate} {scheduleTime}</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Message</CardTitle>
            <CardDescription className="text-xs">Compose your announcement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
              <Input id="title" placeholder="e.g., New Internship Program Launch" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message <span className="text-destructive">*</span></Label>
              <Textarea id="message" placeholder="Write your announcement message here..." value={message} onChange={(e) => setMessage(e.target.value)} rows={8} className="min-h-[200px]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">Link (optional)</Label>
              <Input id="link" placeholder="https://... (optional link for 'View Details' button)" value={link} onChange={(e) => setLink(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Send / Schedule Button */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSend}
            disabled={isLoading || recipientCount === 0}
            className="flex-1"
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : isScheduled ? (
              <CalendarClock className="w-5 h-5 mr-2" />
            ) : (
              <Send className="w-5 h-5 mr-2" />
            )}
            {isLoading
              ? "Processing..."
              : isScheduled
                ? `Schedule for ${recipientCount} recipient${recipientCount !== 1 ? "s" : ""}`
                : `Send to ${recipientCount} recipient${recipientCount !== 1 ? "s" : ""}`}
          </Button>
          {result && (
            <Button variant="outline" onClick={resetForm}>
              New Broadcast
            </Button>
          )}
        </div>

        {/* Result */}
        {result && (
          <Card className={result.success ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-amber-500 bg-amber-50 dark:bg-amber-950/20"}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                {result.success ? <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" /> : <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />}
                <div>
                  <p className="font-medium">{result.success ? "✅ Broadcast sent successfully" : "⚠️ Broadcast sent with some errors"}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                    <span>Total recipients: <strong>{result.totalRecipients}</strong></span>
                    {result.notificationsSent > 0 && <span><Bell className="w-3.5 h-3.5 inline mr-1" /> Notifications: <strong>{result.notificationsSent}</strong></span>}
                    {result.emailsSent > 0 && <span><Mail className="w-3.5 h-3.5 inline mr-1" /> Emails: <strong>{result.emailsSent}</strong></span>}
                  </div>
                  {result.errors?.length > 0 && (
                    <div className="mt-2 text-xs text-destructive space-y-1">
                      {result.errors.slice(0, 5).map((err: string, i: number) => <p key={i}>{err}</p>)}
                      {result.errors.length > 5 && <p>...and {result.errors.length - 5} more errors</p>}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Scheduled Broadcasts List ──────────────────────────────────────────
function ScheduledBroadcastsList() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, loading, refetch } = useQuery(GET_SCHEDULED_BROADCASTS, {
    variables: { page: 1, limit: 50, status: statusFilter || undefined },
  });

  const [editBroadcast, setEditBroadcast] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editSendNotif, setEditSendNotif] = useState(true);
  const [editSendEmail, setEditSendEmail] = useState(false);
  const [editTargetRole, setEditTargetRole] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [cancelBroadcast, { loading: cancelling }] = useMutation(CANCEL_SCHEDULED_BROADCAST, {
    onCompleted: () => { toast.success("Broadcast cancelled"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const [deleteBroadcast, { loading: deleting }] = useMutation(DELETE_SCHEDULED_BROADCAST, {
    onCompleted: () => { toast.success("Broadcast deleted"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const [updateBroadcast, { loading: updating }] = useMutation(UPDATE_SCHEDULED_BROADCAST, {
    onCompleted: () => { toast.success("Broadcast updated"); setEditBroadcast(null); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const openEdit = (b: any) => {
    setEditBroadcast(b);
    setEditTitle(b.title || "");
    setEditMessage(b.message || "");
    setEditLink(b.link || "");
    const sched = new Date(b.scheduledAt);
    setEditDate(format(sched, "yyyy-MM-dd"));
    setEditTime(format(sched, "HH:mm"));
    setEditSendNotif(b.sendNotification !== false);
    setEditSendEmail(b.sendEmail === true);
    setEditTargetRole(b.targetRole || "");
  };

  const handleUpdate = async () => {
    if (!editTitle.trim() || !editMessage.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (!editDate || !editTime) {
      toast.error("Date and time are required");
      return;
    }
    const scheduledAt = new Date(`${editDate}T${editTime}`).toISOString();
    if (new Date(scheduledAt) <= new Date()) {
      toast.error("Scheduled time must be in the future");
      return;
    }
    const vars: any = {
      id: editBroadcast.id,
      title: editTitle.trim(),
      message: editMessage.trim(),
      link: editLink.trim() || null,
      sendNotification: editSendNotif,
      sendEmail: editSendEmail,
      scheduledAt,
    };
    if (editTargetRole) vars.targetRole = editTargetRole;
    await updateBroadcast({ variables: vars });
  };

  const broadcasts = (data as any)?.scheduledBroadcasts?.items || [];
  const pagination = (data as any)?.scheduledBroadcasts?.pagination || {};

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      processing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      sent: "bg-green-500/10 text-green-500 border-green-500/20",
      cancelled: "bg-gray-500/10 text-gray-500 border-gray-500/20",
      failed: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return styles[status] || "bg-accent/10 text-accent border-accent/20";
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-accent" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2">
        {["", "pending", "sent", "cancelled", "failed"].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
            className="rounded-xl text-xs"
          >
            {s || "All"}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto">
          <Loader2 className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* List */}
      {broadcasts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarClock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No scheduled broadcasts found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {broadcasts.map((b: any) => (
            <Card key={b.id} className="border-border/50 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm">{b.title}</h3>
                      <Badge variant="outline" className={`text-[9px] uppercase font-bold px-1.5 py-0 leading-none ${getStatusBadge(b.status)}`}>
                        {b.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{b.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {b.scheduledAt ? format(new Date(b.scheduledAt), "MMM d, yyyy HH:mm") : "—"}
                      </span>
                      {b.sentAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Sent: {format(new Date(b.sentAt), "MMM d, HH:mm")}
                        </span>
                      )}
                      {b.targetRole && <span>Role: {b.targetRole}</span>}
                      {b.result?.totalRecipients > 0 && <span>{b.result.totalRecipients} recipients</span>}
                    </div>
                    {b.result?.errors?.length > 0 && (
                      <p className="text-[10px] text-destructive mt-1">{b.result.errors.length} error(s)</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {b.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          disabled={updating}
                          onClick={() => openEdit(b)}
                        >
                          <Pencil className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          disabled={cancelling}
                          onClick={() => cancelBroadcast({ variables: { id: b.id } })}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </>
                    )}
                    {(b.status === "cancelled" || b.status === "sent" || b.status === "failed") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8 text-destructive hover:text-destructive"
                        disabled={deleting}
                        onClick={() => setDeleteId(b.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="text-xs text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Broadcast Record
            </AlertTitle>
            <AlertDesc>
              Are you sure you want to delete this broadcast record? This action cannot be undone.
            </AlertDesc>
          </AlertDialogHeader>
          <AlertFoot>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteBroadcast({ variables: { id: deleteId } });
                  setDeleteId(null);
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertFoot>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editBroadcast} onOpenChange={(open) => !open && setEditBroadcast(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" />
              Edit Scheduled Broadcast
            </DialogTitle>
            <DialogDescription>
              Update the message, reschedule, or change delivery settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Broadcast title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-message">Message</Label>
              <Textarea id="edit-message" value={editMessage} onChange={(e) => setEditMessage(e.target.value)} rows={5} placeholder="Broadcast message" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-link">Link (optional)</Label>
              <Input id="edit-link" value={editLink} onChange={(e) => setEditLink(e.target.value)} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input id="edit-date" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">Time</Label>
                <Input id="edit-time" type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Target Role</Label>
              <Select value={editTargetRole} onValueChange={setEditTargetRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Keep current targeting" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Keep current targeting</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="trainer">Trainers</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Switch id="edit-notif" checked={editSendNotif} onCheckedChange={setEditSendNotif} />
                <Label htmlFor="edit-notif" className="text-sm">
                  <Bell className="w-3.5 h-3.5 inline mr-1" />
                  Notification
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="edit-email" checked={editSendEmail} onCheckedChange={setEditSendEmail} />
                <Label htmlFor="edit-email" className="text-sm">
                  <Mail className="w-3.5 h-3.5 inline mr-1" />
                  Email
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBroadcast(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updating}>
              {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Pencil className="w-4 h-4 mr-2" />}
              Update Broadcast
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
