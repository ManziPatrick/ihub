import { useTranslation } from "react-i18next";
import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Users,
  Calendar,
  Clock,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Video,
  GraduationCap,
  FolderOpen,
  ExternalLink,
  Check,
  X,
  Loader2
} from "lucide-react";
import { StartLiveSessionDialog, AddSessionDialog, ApproveBookingDialog } from "@/components/portal/dialogs";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_MY_BOOKINGS, GET_TRAINER_STUDENTS, GET_CONVERSATIONS, GET_TRAINER_STATS } from "@/lib/graphql/queries";
import { UPDATE_BOOKING_STATUS, CREATE_BOOKING } from "@/lib/graphql/mutations";
import { toast } from "sonner";
import { usePusher } from "@/hooks/use-pusher";
import { useEffect, useMemo } from "react";

export default function TrainerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isLiveSessionOpen, setIsLiveSessionOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [approveBooking, setApproveBooking] = useState<any | null>(null);

  const { data: bookingsData, loading: bookingsLoading, refetch: refetchBookings } = useQuery(GET_MY_BOOKINGS);
  const { data: studentsData, refetch: refetchStudents } = useQuery(GET_TRAINER_STUDENTS);
  const { data: conversationsData, refetch: refetchConversations } = useQuery(GET_CONVERSATIONS);
  const { data: statsData, refetch: refetchStats } = useQuery(GET_TRAINER_STATS);

  const pusher = usePusher();

  useEffect(() => {
    if (!pusher || !user) return;

    const channel = pusher.subscribe(`user-${user.id}`);

    const handleNewBooking = () => {
      refetchBookings();
      refetchStats();
      toast.info("New session request received!");
    };

    const handleBookingUpdate = () => {
      refetchBookings();
      refetchStats();
    };

    const handleNewMessage = () => {
      refetchConversations();
    };

    const handleNotification = (data: any) => {
      refetchStats();
      if (data.type === 'NEW_SUBMISSION' || data.type === 'COURSE_ENROLLMENT') {
        toast.info(data.message || "New notification received");
      }
    };

    const handleStudentActivity = () => {
      refetchStudents();
    };

    channel.bind('new_booking', handleNewBooking);
    channel.bind('booking_updated', handleBookingUpdate);
    channel.bind('receive_message', handleNewMessage);
    channel.bind('notification', handleNotification);
    channel.bind('student_activity', handleStudentActivity);

    return () => {
      channel.unbind('new_booking', handleNewBooking);
      channel.unbind('booking_updated', handleBookingUpdate);
      channel.unbind('receive_message', handleNewMessage);
      channel.unbind('notification', handleNotification);
      channel.unbind('student_activity', handleStudentActivity);
    };
  }, [pusher, user, refetchBookings, refetchStats, refetchConversations, refetchStudents]);

  const [updateBookingStatus] = useMutation(UPDATE_BOOKING_STATUS, {
    onCompleted: () => {
      toast.success("Booking status updated");
      refetchBookings();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update booking");
    }
  });

  const [createBooking] = useMutation(CREATE_BOOKING, {
    onCompleted: () => {
      refetchBookings();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to schedule session");
    }
  });

  const bookings = (bookingsData as any)?.myBookings || [];
  const students = (studentsData as any)?.trainerStudents || [];
  const trainerStats = (statsData as any)?.trainerStats || { activeCourses: 0, totalStudents: 0, pendingReviews: 0, mentees: 0 };
  const conversations = (conversationsData as any)?.conversations || [];

  // Aggregate Course Activity
  const recentActivity = useMemo(() => {
    const allActivities: any[] = [];
    students.forEach((student: any) => {
      if (student.activityLog) {
        student.activityLog.forEach((log: any) => {
          allActivities.push({
            ...log,
            studentName: student.fullName || student.username,
            avatar: student.avatar
          });
        });
      }
    });
    return allActivities
      .sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp))
      .slice(0, 5);
  }, [students]);

  // Calculate Course Statistics logic
  const courseStats = useMemo(() => {
    if (students.length === 0) return { avgProgress: 0, topPerformers: [] };

    let totalAcademyProgress = 0;
    const studentEffort: any[] = [];

    students.forEach((s: any) => {
      // Use the student's enrolledCourses and completedLessons
      const courses = s.enrolledCourses || [];
      const completedList = s.completedLessons || [];

      let studentTotalAcademyLessons = 0;
      let studentTotalAcademyCompleted = 0;

      courses.forEach((course: any) => {
        // Match the StudentDashboard calculation logic
        const totalInCourse = course.modules?.reduce((acc: number, mod: any) => acc + (mod.lessons?.length || 0), 0) || 0;
        const completedInCourse = completedList.filter((l: any) => l.courseId === (course.id || course._id)).length;

        studentTotalAcademyLessons += totalInCourse;
        studentTotalAcademyCompleted += completedInCourse;
      });

      const studentPercentage = studentTotalAcademyLessons > 0
        ? Math.round((studentTotalAcademyCompleted / studentTotalAcademyLessons) * 100)
        : 0;

      totalAcademyProgress += studentPercentage;
      studentEffort.push({
        name: s.fullName || s.username || "Unknown Student",
        progress: studentPercentage
      });
    });

    return {
      avgProgress: Math.round(totalAcademyProgress / students.length),
      topPerformers: studentEffort.sort((a, b) => b.progress - a.progress).slice(0, 5)
    };
  }, [students]);

  const handleStatusUpdate = async (id: string, status: string, meetingLink: string = "") => {
    await updateBookingStatus({
      variables: { id, status, meetingLink }
    });
    setApproveBooking(null);
  };

  const onConfirmClick = (booking: any) => {
    setApproveBooking(booking);
  };


  const handleAddSession = async (session: any) => {
    try {
      await createBooking({
        variables: {
          mentorId: user?.id, // Trainer acts as mentor
          type: session.type,
          date: session.date,
          time: session.time,
          topic: session.title,
          notes: `Course: ${session.course}\n${session.description || ''}`,
          meetingLink: session.link
        }
      });
      setIsScheduleOpen(false);
    } catch (error) {
      console.error("Error scheduling session:", error);
    }
  };

  const handleStartLiveSession = async (session: any) => {
    try {
      await createBooking({
        variables: {
          mentorId: user?.id,
          type: 'live',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          topic: session.title,
          notes: `Course ID: ${session.courseId}\n${session.description || ''}`,
          meetingLink: session.meetingLink
        }
      });
      // Dialog handles its own state for 'Ready' step
    } catch (error) {
      console.error("Error starting live session:", error);
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
              {t("portal.welcomeTrainer") || "Welcome, " + user?.fullName?.split(" ")[0] + "!"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <p className="text-xs text-muted-foreground font-medium">{t("portal.liveFeedActive") || "Live Feed Active"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="gold" onClick={() => setIsLiveSessionOpen(true)}>
              <Video className="w-4 h-4 mr-2" />
              {t("portal.startLiveSession") || "Start Live Session"}
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">{trainerStats.activeCourses}</p>
                  <p className="text-xs text-card-foreground/60">Active Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">{trainerStats.totalStudents}</p>
                  <p className="text-xs text-card-foreground/60">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">{trainerStats.pendingReviews}</p>
                  <p className="text-xs text-card-foreground/60">Pending Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">{trainerStats.mentees}</p>
                  <p className="text-xs text-card-foreground/60">Mentees</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Activity Placeholder (Simplified) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-heading">Your Course Statistics</CardTitle>
                <Link to="/portal/trainer/students">
                  <Button variant="ghost" size="sm" className="text-accent">
                    View Student Data <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-6 border-t border-border/10">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Average Student Progress</p>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-bold text-accent">{courseStats.avgProgress}%</div>
                      <div className="flex-1">
                        <Progress value={courseStats.avgProgress} className="h-2" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Top Performing Students</p>
                    {courseStats.topPerformers.map((s: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-accent font-bold">{s.progress}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  Course Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No recent course activity found.</p>
                    </div>
                  ) : (
                    recentActivity.map((activity, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs">
                          {activity.studentName[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            <span className="text-accent">{activity.studentName}</span> {activity.action.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">{activity.details}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(parseInt(activity.timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Sessions & Bookings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-heading flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-accent" />
                    Session Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {bookingsLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
                  ) : bookings.length === 0 ? (
                    <div className="text-center py-8 border border-dashed rounded-lg">
                      <p className="text-xs text-muted-foreground">No pending requests</p>
                    </div>
                  ) : (
                    bookings.map((booking: any) => (
                      <div
                        key={booking.id}
                        className="p-3 bg-background/50 rounded-lg border border-border/30"
                      >
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-sm text-card-foreground capitalize">{booking.type.replace('-', ' ')}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                            booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-xs text-card-foreground/60 mt-1">Student: {booking.user?.username || 'Unknown'}</p>
                        <p className="text-xs text-card-foreground/80 mt-1 line-clamp-1 italic">{booking.topic}</p>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/10">
                          <span className="text-xs text-accent font-medium">{booking.date} @ {booking.time}</span>

                          <div className="flex gap-1">
                            {booking.status === 'pending' ? (
                              <>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-green-400 hover:bg-green-500/10" onClick={() => onConfirmClick(booking)}>
                                  <Check className="h-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:bg-red-500/10" onClick={() => handleStatusUpdate(booking.id, 'cancelled')}>
                                  <X className="h-4 h-4" />
                                </Button>
                              </>
                            ) : booking.status === 'confirmed' && booking.meetingLink ? (
                              <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer">
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-accent">
                                  <ExternalLink className="h-4 h-4" />
                                </Button>
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setIsScheduleOpen(true)}>
                    Schedule New Class
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Conversations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="border-border/50">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-heading flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-accent" />
                    Recent Chats
                  </CardTitle>
                  <Link to="/chat">
                    <Button variant="ghost" size="sm" className="text-accent h-7 px-2">
                      View All
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!conversations.length ? (
                    <div className="text-center py-6 border border-dashed rounded-lg">
                      <p className="text-xs text-muted-foreground">No recent messages</p>
                    </div>
                  ) : (
                    conversations.slice(0, 3).map((conv: any) => {
                      const otherParticipant = conv.participants.find((p: any) => p.id !== user?.id);
                      return (
                        <Link to="/chat" key={conv.id}>
                          <div className="p-2 transition-colors hover:bg-accent/5 rounded-lg border border-transparent hover:border-accent/10">
                            <div className="flex justify-between items-start">
                              <p className="font-medium text-xs text-card-foreground">{otherParticipant?.username || 'Chat'}</p>
                              <span className="text-[10px] text-muted-foreground">
                                {conv.lastMessage ? new Date(parseInt(conv.lastMessage.createdAt)).toLocaleDateString() : ''}
                              </span>
                            </div>
                            <p className="text-[10px] text-card-foreground/60 mt-0.5 line-clamp-1">
                              {conv.lastMessage?.content || 'No messages yet'}
                            </p>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-heading">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link to="/portal/trainer/projects">
                    <Button variant="ghost" className="w-full justify-start hover:bg-accent/5">
                      <GraduationCap className="w-4 h-4 mr-2 text-accent" />
                      Review Assignments
                    </Button>
                  </Link>
                  <Link to="/portal/trainer/assignments">
                    <Button variant="ghost" className="w-full justify-start hover:bg-accent/5">
                      <FolderOpen className="w-4 h-4 mr-2 text-accent" />
                      Manage Projects
                    </Button>
                  </Link>
                  <Link to="/portal/trainer/students">
                    <Button variant="ghost" className="w-full justify-start hover:bg-accent/5">
                      <MessageSquare className="w-4 h-4 mr-2 text-accent" />
                      Student Inquiries
                    </Button>
                  </Link>
                  <Link to="/portal/trainer/courses">
                    <Button variant="ghost" className="w-full justify-start hover:bg-accent/5">
                      <BookOpen className="w-4 h-4 mr-2 text-accent" />
                      Update Curriculum
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <StartLiveSessionDialog
        open={isLiveSessionOpen}
        onOpenChange={setIsLiveSessionOpen}
        onStart={handleStartLiveSession}
      />
      <AddSessionDialog
        open={isScheduleOpen}
        onOpenChange={setIsScheduleOpen}
        onAdd={handleAddSession}
      />
      <ApproveBookingDialog
        open={!!approveBooking}
        onOpenChange={(open) => !open && setApproveBooking(null)}
        onApprove={(link) => handleStatusUpdate(approveBooking?.id, 'confirmed', link)}
        bookingType={approveBooking?.type || 'Session'}
        studentName={approveBooking?.user?.username || 'Student'}
      />
    </PortalLayout>
  );
}
