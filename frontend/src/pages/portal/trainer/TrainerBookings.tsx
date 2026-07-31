import { useState } from "react";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_MY_BOOKINGS } from "@/lib/graphql/queries";
// Assuming an update status mutation exists or will be added, otherwise placeholder
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, User } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

// Define Booking interface based on schema
interface Booking {
    id: string;
    date: string;
    time: string;
    status: string; // 'pending', 'confirmed', 'cancelled', 'completed'
    meetingLink?: string;
    topic?: string;
    notes?: string;
    contextType?: string;
    contextTitle?: string;
    createdAt?: string;
    mentor?: {
        id: string;
        username: string;
        fullName: string;
        avatar?: string;
    };
    user: {
        id: string;
        username: string;
        fullName: string;
        avatar?: string;
        email: string;
    };
}

export default function TrainerBookings() {
    const { user } = useAuth();
    const { data, loading, error } = useQuery(GET_MY_BOOKINGS);

    if (!user || user.role !== 'trainer') {
        return (
            <PortalLayout>
                <div className="flex items-center justify-center h-[50vh]">
                    <Alert variant="destructive" className="max-w-md">
                        <AlertTitle>Access Denied</AlertTitle>
                        <AlertDescription>
                            You must be a trainer to view this page.
                        </AlertDescription>
                    </Alert>
                </div>
            </PortalLayout>
        );
    }

    const bookings = (data as any)?.myBookings || [];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed': return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Confirmed</Badge>;
            case 'completed': return <Badge variant="secondary" className="bg-blue-500/20 text-blue-500 border-blue-500/30">Completed</Badge>;
            case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
            default: return <Badge variant="outline" className="text-amber-500 border-amber-500 bg-amber-500/10">Pending</Badge>;
        }
    };

    const getContextBadge = (contextType?: string) => {
        switch (contextType) {
            case 'course': return <Badge variant="outline" className="text-purple-500 border-purple-500/30 bg-purple-500/10 text-[10px]">Course</Badge>;
            case 'internship': return <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 text-[10px]">Program</Badge>;
            case 'event': return <Badge variant="outline" className="text-orange-500 border-orange-500/30 bg-orange-500/10 text-[10px]">Event</Badge>;
            default: return <Badge variant="outline" className="text-muted-foreground border-border/50 text-[10px]">General</Badge>;
        }
    };

    return (
        <PortalLayout>
            <div className="space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="font-heading text-2xl lg:text-3xl font-medium">
                        My Student Bookings
                        <span className="text-sm font-normal text-muted-foreground ml-3">(View Only)</span>
                    </h1>
                    <p className="text-muted-foreground mt-1">View mentorship sessions booked by your students and sessions where you are the mentor.</p>
                </motion.div>

                {loading ? (
                    <div className="text-center py-12">Loading bookings...</div>
                ) : error ? (
                    <div className="text-center py-12 text-red-500">Error loading bookings</div>
                ) : bookings.length === 0 ? (
                    <div className="text-center py-16 bg-muted/30 rounded-lg border-2 border-dashed">
                        <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No Bookings Found</h3>
                        <p className="text-muted-foreground">There are no student bookings yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {bookings.map((booking: Booking) => (
                            <Card key={booking.id} className="overflow-hidden border-border/50 hover:border-border/80 transition-colors">
                                <CardHeader className="bg-muted/30 pb-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 ring-2 ring-background">
                                                <AvatarImage src={booking.user?.avatar} />
                                                <AvatarFallback className="bg-gold/10 text-gold">
                                                    <User className="w-5 h-5" />
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-base">{booking.user?.fullName || booking.user?.username || 'Student'}</CardTitle>
                                                <CardDescription className="text-xs">{booking.user?.email || 'Unknown'}</CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            {getStatusBadge(booking.status)}
                                            {getContextBadge(booking.contextType)}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-3">
                                    {booking.contextTitle && (
                                        <div className="text-xs font-medium text-muted-foreground bg-muted/20 px-2.5 py-1.5 rounded-md border border-border/30">
                                            📌 {booking.contextTitle}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <span>{format(new Date(booking.date), 'PPP')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <span>{booking.time}</span>
                                    </div>
                                    {booking.mentor && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <User className="w-4 h-4 shrink-0" />
                                            <span>Mentor: {booking.mentor.fullName || booking.mentor.username}</span>
                                        </div>
                                    )}
                                    {booking.meetingLink && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Video className="w-4 h-4 text-blue-500 shrink-0" />
                                            <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium">
                                                Join Meeting
                                            </a>
                                        </div>
                                    )}
                                    {booking.topic && (
                                        <div className="bg-muted/30 p-3 rounded-lg text-sm mt-2 border border-border/30">
                                            <span className="font-semibold block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Topic</span>
                                            {booking.topic}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="bg-muted/10 border-t border-border/30 px-4 py-3">
                                    <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">
                                        Booked on {format(new Date(booking.createdAt), 'MMM d, yyyy')} · View Only
                                    </p>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </PortalLayout>
    );
}
