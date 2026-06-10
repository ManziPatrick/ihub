import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Clock, MessageSquare, Calendar, Trash2, Filter } from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GET_NOTIFICATIONS } from "@/lib/graphql/queries";
import { MARK_NOTIFICATION_READ, MARK_ALL_NOTIFICATIONS_READ } from "@/lib/graphql/mutations";

const typeIcon = (type: string) => {
    if (type === "message") return <MessageSquare className="w-4 h-4" />;
    if (type === "booking" || type === "BOOKING_UPDATED") return <Calendar className="w-4 h-4" />;
    return <Bell className="w-4 h-4" />;
};

const typeColor = (type: string) => {
    if (type === "message") return "bg-blue-500/20 text-blue-400";
    if (type === "booking" || type === "BOOKING_UPDATED") return "bg-purple-500/20 text-purple-400";
    if (type === "PROJECT_ASSIGNED") return "bg-green-500/20 text-green-400";
    return "bg-accent/20 text-accent";
};

export default function NotificationsPage() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<"all" | "unread">("all");

    const { data, refetch } = useQuery<{ notifications: any[] }>(GET_NOTIFICATIONS, {
        fetchPolicy: "network-only",
    });

    const [markRead] = useMutation(MARK_NOTIFICATION_READ, {
        onCompleted: () => refetch(),
    });

    const [markAllRead] = useMutation(MARK_ALL_NOTIFICATIONS_READ, {
        onCompleted: () => {
            toast.success("All notifications marked as read");
            refetch();
        },
    });

    const notifications = data?.notifications || [];
    const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
    const unreadCount = notifications.filter((n) => !n.read).length;

    const handleClick = async (notif: any) => {
        if (!notif.read) {
            await markRead({ variables: { id: notif.id || notif._id } });
        }
        if (notif.link) {
            navigate(notif.link);
        }
    };

    return (
        <PortalLayout>
            <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold font-heading flex items-center gap-3">
                            <Bell className="w-6 h-6 text-accent" />
                            Notifications
                            {unreadCount > 0 && (
                                <Badge className="bg-accent text-accent-foreground text-xs px-2 py-0.5">
                                    {unreadCount} unread
                                </Badge>
                            )}
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Stay up to date with your latest activity
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-xs"
                            onClick={() => markAllRead()}
                        >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Mark all read
                        </Button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                    <Button
                        variant={filter === "all" ? "gold" : "outline"}
                        size="sm"
                        onClick={() => setFilter("all")}
                    >
                        All ({notifications.length})
                    </Button>
                    <Button
                        variant={filter === "unread" ? "gold" : "outline"}
                        size="sm"
                        onClick={() => setFilter("unread")}
                    >
                        <Filter className="w-3.5 h-3.5 mr-1.5" />
                        Unread ({unreadCount})
                    </Button>
                </div>

                {/* Notifications List */}
                <Card className="border-border/50">
                    <CardContent className="p-0">
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                                    <Bell className="w-8 h-8 text-muted-foreground/40" />
                                </div>
                                <p className="font-semibold text-card-foreground">
                                    {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {filter === "unread"
                                        ? "You're all caught up!"
                                        : "Notifications will appear here when there's activity."}
                                </p>
                            </div>
                        ) : (
                            <ScrollArea className="max-h-[600px]">
                                <div className="divide-y divide-border/30">
                                    {filtered.map((notif) => (
                                        <div
                                            key={notif.id || notif._id}
                                            onClick={() => handleClick(notif)}
                                            className={`flex items-start gap-4 p-5 transition-colors cursor-pointer hover:bg-accent/5 ${!notif.read ? "bg-accent/5 border-l-2 border-l-accent" : ""
                                                }`}
                                        >
                                            {/* Icon */}
                                            <div className={`mt-0.5 p-2 rounded-full shrink-0 ${typeColor(notif.type)}`}>
                                                {typeIcon(notif.type)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p
                                                        className={`text-sm leading-snug ${!notif.read
                                                                ? "font-semibold text-card-foreground"
                                                                : "text-card-foreground/80"
                                                            }`}
                                                    >
                                                        {notif.title}
                                                    </p>
                                                    {!notif.read && (
                                                        <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                    {notif.message}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDistanceToNow(
                                                            new Date(parseInt(notif.createdAt) || notif.createdAt),
                                                            { addSuffix: true }
                                                        )}
                                                    </span>
                                                    {notif.link && (
                                                        <span className="text-[11px] text-accent font-medium">
                                                            Click to view →
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PortalLayout>
    );
}
