import { ReactNode, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "@apollo/client/react";
import { TRACK_ACTIVITY } from "@/lib/graphql/mutations";
import { GET_BRANDING } from "@/lib/graphql/queries";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  BookOpen,
  FolderOpen,
  Award,
  Briefcase,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Users,
  BarChart3,
  Palette,
  CreditCard,
  Shield,
  Cog,
  Bell,
  HelpCircle,
  Table,
  FileText,
  UserCog,
  GraduationCap,
  Circle,
  Clock,
  ExternalLink,
  Star,
  Flame,
  Trophy,
  ClipboardList,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePusher } from "@/hooks/use-pusher";
import { toast } from "sonner";
import { FloatingChat } from "@/components/chat/FloatingChat";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: { label: string; href: string; icon: React.ElementType }[];
}

const studentNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/student", icon: LayoutDashboard },
  { 
    label: "Academics", 
    icon: GraduationCap,
    children: [
      { label: "My Courses", href: "/portal/student/courses", icon: BookOpen },
      { label: "Certificates", href: "/portal/student/certificates", icon: Award },
      { label: "Gradings", href: "/portal/student/gradings", icon: Star },
    ]
  },
  { 
    label: "Internship", 
    href: "/portal/student/internship", 
    icon: Briefcase 
  },
  { label: "Schedule", href: "/portal/student/schedule", icon: Calendar },
  { label: "Billing", href: "/portal/student/billing", icon: CreditCard },
  { label: "Messages", href: "/chat", icon: MessageSquare },
  { label: "Profile", href: "/portal/student/profile", icon: UserCog },
];

const trainerNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/trainer", icon: LayoutDashboard },
  { 
    label: "Academics", 
    icon: GraduationCap,
    children: [
      { label: "My Courses", href: "/portal/trainer/courses", icon: BookOpen },
      { label: "Students", href: "/portal/trainer/students", icon: Users },
      { label: "Assignments", href: "/portal/trainer/projects", icon: GraduationCap },
      { label: "Projects", href: "/portal/trainer/assignments", icon: FolderOpen },
    ]
  },
  { 
    label: "Professional", 
    icon: Briefcase,
    children: [
      { label: "Mentorship", href: "/portal/trainer/mentorship", icon: GraduationCap },
      { label: "Internships", href: "/portal/trainer/internships", icon: Briefcase },
    ]
  },
  { label: "Schedule", href: "/portal/trainer/schedule", icon: Calendar },
  { label: "Messages", href: "/chat", icon: MessageSquare },
];

const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/admin", icon: LayoutDashboard },
  { 
    label: "Management", 
    icon: Cog,
    children: [
      { label: "Users", href: "/portal/admin/users", icon: Users },
      { label: "Courses", href: "/portal/admin/courses", icon: BookOpen },
      { label: "Applications", href: "/portal/admin/applications", icon: ClipboardList },
      { label: "Internships", href: "/portal/admin/internships", icon: Briefcase },
    ]
  },
  { 
    label: "Content", 
    icon: FileText,
    children: [
      { label: "Projects", href: "/portal/admin/projects", icon: FolderOpen },
      { label: "Assignments", href: "/portal/admin/assignment-reviews", icon: GraduationCap },
      { label: "Badges", href: "/portal/admin/badges", icon: Award },
      { label: "Blog", href: "/portal/admin/blogs", icon: FileText },
    ]
  },
  { 
    label: "Operations", 
    icon: Cog,
    children: [
      { label: "Team", href: "/portal/admin/team", icon: UserCog },
      { label: "Payments", href: "/portal/admin/payments", icon: CreditCard },
      { label: "Branding", href: "/portal/admin/branding", icon: Palette },
      { label: "Analytics", href: "/portal/admin/analytics", icon: BarChart3 },
      { label: "Toolbox", href: "/portal/admin/tools", icon: Table },
    ]
  },
  { label: "Schedule", href: "/portal/admin/schedule", icon: Calendar },
  { label: "Messages", href: "/chat", icon: MessageSquare },
];

const superAdminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/super-admin", icon: LayoutDashboard },
  { 
    label: "System", 
    icon: Shield,
    children: [
      { label: "Admins", href: "/portal/super-admin/admins", icon: Shield },
      { label: "All Users", href: "/portal/super-admin/users", icon: Users },
      { label: "Configuration", href: "/portal/super-admin/config", icon: Cog },
    ]
  },
  { 
    label: "Marketing", 
    icon: Palette,
    children: [
      { label: "Blog", href: "/portal/admin/blogs", icon: FileText },
      { label: "Branding", href: "/portal/admin/branding", icon: Palette },
    ]
  },
  { label: "Analytics", href: "/portal/super-admin/analytics", icon: BarChart3 },
  { label: "Schedule", href: "/portal/admin/schedule", icon: Calendar },
  { label: "Messages", href: "/chat", icon: MessageSquare },
];

const navItemsByRole: Record<UserRole, NavItem[]> = {
  student: studentNavItems,
  trainer: trainerNavItems,
  mentor: trainerNavItems,
  admin: adminNavItems,
  super_admin: superAdminNavItems,
};

const roleLabels: Record<UserRole, string> = {
  student: "Student Portal",
  trainer: "Trainer Portal",
  mentor: "Trainer Portal",
  admin: "Admin Dashboard",
  super_admin: "Super Admin",
};

interface PortalLayoutProps {
  children: ReactNode;
}

import { useBranding } from "@/components/BrandingProvider";
import { GET_NOTIFICATIONS, GET_ME } from "@/lib/graphql/queries";
import { MARK_NOTIFICATION_READ, MARK_ALL_NOTIFICATIONS_READ } from "@/lib/graphql/mutations";
import { formatDistanceToNow } from "date-fns";
import { usePresence } from "@/hooks/use-presence";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function PortalLayout({ children }: PortalLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pusher = usePusher();

  // Start presence tracking
  usePresence();

  const [trackActivity] = useMutation(TRACK_ACTIVITY);
  const { branding } = useBranding();

  const { data: notifData } = useQuery<{ notifications: any[] }>(GET_NOTIFICATIONS, {
    skip: !user,
    pollInterval: 60000,
  });

  const { data: meData } = useQuery(GET_ME, {
    skip: !user || user.role !== 'student',
  });

  const [isSidebarMinimized, setIsSidebarMinimized] = useState(() => {
    return localStorage.getItem('sidebar_minimized') === 'true';
  });

  const toggleSidebar = () => {
    const newState = !isSidebarMinimized;
    setIsSidebarMinimized(newState);
    localStorage.setItem('sidebar_minimized', String(newState));
  };

  const [notifications, setNotifications] = useState<any[]>([]);
  const [markRead] = useMutation(MARK_NOTIFICATION_READ);
  const [markAllRead] = useMutation(MARK_ALL_NOTIFICATIONS_READ, {
    onCompleted: () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  });

  useEffect(() => {
    if (notifData?.notifications) {
      setNotifications(notifData.notifications);
    }
  }, [notifData]);

  // Persist portal mode
  useEffect(() => {
    if (user?.role) {
      const savedMode = localStorage.getItem(`portal_mode_${user.id}`);
      if (!savedMode) {
        localStorage.setItem(`portal_mode_${user.id}`, user.role);
      }
    }
  }, [user]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.error("Audio play failed:", e));
    } catch (error) {
      console.error("Failed to play notification sound:", error);
    }
  };

  useEffect(() => {
    if (!pusher || !user) return;

    const channel = pusher.subscribe(`user-${user.id}`);

    const handleReceiveMessage = (msg: any) => {
      console.log("New message received:", msg);
      playNotificationSound();
    };

    const handleNewBooking = (booking: any) => {
      toast.info("New session request received!");
      playNotificationSound();
    };

    const handleBookingUpdate = (booking: any) => {
      toast.info(`Session status updated: ${booking.status}`);
      playNotificationSound();
    };

    const handleNotification = (data: any) => {
      console.log("Interactive notification received:", data);
      setNotifications(prev => [data, ...prev].slice(0, 50));

      if (user.role === 'trainer' || user.role === 'mentor' || user.role === 'admin') {
        playNotificationSound();
        if (data.message) toast.info(data.message);
      } else {
        // Students also get sound for important notifications
        playNotificationSound();
        if (data.message) toast(data.title || "New Notification", {
          description: data.message,
          action: data.link ? {
            label: "View",
            onClick: () => navigate(data.link)
          } : undefined
        });
      }
    };

    const handleStudentActivity = () => {
      if (user.role === 'trainer' || user.role === 'mentor') {
        playNotificationSound();
      }
    };

    channel.bind('receive_message', handleReceiveMessage);
    channel.bind('new_booking', handleNewBooking);
    channel.bind('booking_updated', handleBookingUpdate);
    channel.bind('notification', handleNotification);
    channel.bind('student_activity', handleStudentActivity);

    return () => {
      channel.unbind('receive_message', handleReceiveMessage);
      channel.unbind('new_booking', handleNewBooking);
      channel.unbind('booking_updated', handleBookingUpdate);
      channel.unbind('notification', handleNotification);
      channel.unbind('student_activity', handleStudentActivity);
    };
  }, [pusher, user]);

  useEffect(() => {
    if (user) {
      trackActivity({
        variables: {
          action: "view_page",
          details: location.pathname
        }
      }).catch(err => console.error("Tracking error:", err));
    }
  }, [location.pathname, user?.id, trackActivity]);

  if (!user) return null;

  const navItems = navItemsByRole[user.role] || studentNavItems;
  const roleLabel = roleLabels[user.role];

  const handleLogout = () => {
    localStorage.removeItem(`portal_mode_${user?.id}`);
    logout();
    navigate("/");
  };

  const getInitials = (name: string) => {
    return (name || "")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:flex lg:flex-col ${isSidebarMinimized ? 'lg:w-20' : 'lg:w-64'} bg-card border-r border-border/50 fixed h-full transition-all duration-300 z-40`}>
        {/* Sidebar Header & Search */}
        <div className="flex flex-col border-b border-border/50 shrink-0">
          <div className="h-16 flex items-center justify-between px-4">
            <Link to="/" className={`flex items-center gap-2 ${isSidebarMinimized ? 'justify-center w-full' : ''}`}>
              {branding.logoUrl && !isSidebarMinimized ? (
                <img src={branding.logoUrl} alt={branding.siteName} className="h-8 w-auto" />
              ) : (
                <span className="font-heading font-black text-2xl tracking-tighter text-card-foreground">
                  {isSidebarMinimized ? 'I' : 'Inzira '}<span className="text-accent">{isSidebarMinimized ? 'H' : 'HUB'}</span>
                </span>
              )}
            </Link>
          </div>

          {!isSidebarMinimized && (
            <div className="px-4 py-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search here..." 
                  className="h-10 pl-9 bg-background/50 border-border/50 focus-visible:ring-1 focus-visible:ring-accent rounded-xl text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Role Badge */}
        {!isSidebarMinimized && (
          <div className="px-4 py-2 border-b border-border/50">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              {roleLabel}
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto py-4 ${isSidebarMinimized ? 'px-2' : 'px-3'} custom-scrollbar`}>
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              if (item.children && !isSidebarMinimized) {
                const isAnyChildActive = item.children.some(child => location.pathname === child.href);
                return (
                  <li key={item.label}>
                    <Collapsible defaultOpen={isAnyChildActive}>
                      <CollapsibleTrigger asChild>
                        <button className={cn(
                          "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all group hover:bg-background/80",
                          isAnyChildActive ? "text-primary bg-primary/5" : "text-card-foreground/70"
                        )}>
                          <div className="flex items-center gap-3">
                            <item.icon className={cn("w-5 h-5 shrink-0", isAnyChildActive ? "text-primary" : "text-card-foreground/50")} strokeWidth={1.5} />
                            <span>{item.label}</span>
                          </div>
                          <ChevronDown className={cn("w-4 h-4 transition-transform duration-200 opacity-50", isAnyChildActive && "rotate-180 opacity-100")} />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-9 pr-2 space-y-1 mt-1">
                        {item.children.map((child) => {
                          const isChildActive = location.pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              to={child.href}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                                isChildActive 
                                  ? "text-primary bg-primary/5" 
                                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                              )}
                            >
                              {child.icon && <child.icon className="w-3.5 h-3.5" />}
                              {child.label}
                            </Link>
                          );
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  </li>
                );
              }

              const isActive = item.href ? location.pathname === item.href : false;
              return (
                <li key={item.label}>
                  <Link
                    to={item.href || '#'}
                    title={isSidebarMinimized ? item.label : undefined}
                    className={`flex items-center ${isSidebarMinimized ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-card-foreground/70 hover:bg-background/80 hover:text-card-foreground"
                      }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                    {!isSidebarMinimized && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-card z-50 lg:hidden flex flex-col"
            >
              {/* Close button */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 text-card-foreground/70 hover:text-card-foreground"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Logo Area */}
              <div className="h-16 flex items-center justify-between px-4 border-b border-border/50 shrink-0">
                <Link to="/" className="flex items-center gap-2">
                  {branding.logoUrl ? (
                    <img src={branding.logoUrl} alt={branding.siteName} className="h-8 w-auto" />
                  ) : (
                    <span className="font-heading font-black text-2xl tracking-tighter text-card-foreground">
                      Inzira <span className="text-accent">HUB</span>
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-2 hover:bg-background rounded-lg transition-colors text-card-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Role Badge */}
              <div className="px-4 py-3 border-b border-border/50 flex items-center justify-start">
                <span className="inline-block px-3 py-1 bg-accent/20 text-accent text-xs font-medium rounded-full">
                  {roleLabel}
                </span>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
                <ul className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-card-foreground/70 hover:bg-background/50 hover:text-card-foreground"
                            }`}
                        >
                          <item.icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${isSidebarMinimized ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Top Header */}
        <header className="h-16 bg-card border-b border-border/50 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-card-foreground/70 hover:text-card-foreground"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Desktop Minimize Sidebar Button */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-2 text-card-foreground/70 hover:text-card-foreground mr-4"
            title={isSidebarMinimized ? "Expand Sidebar" : "Minimize Sidebar"}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Page Title - Mobile */}
          <div className="lg:hidden flex-1 px-2">
            <span className="font-heading font-semibold text-card-foreground text-sm truncate block">
              {roleLabel}
            </span>
          </div>

          {/* Search - Desktop */}
          <div className="hidden lg:block flex-1 max-w-md">
            <div className="relative">
              <input
                type="search"
                placeholder="Search courses, projects..."
                className="w-full h-10 pl-4 pr-10 rounded-lg bg-background border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Student Stats - Live Tracking */}
          {user.role === 'student' && (
            <div className="hidden md:flex items-center gap-4 px-4 h-10 bg-background/50 border border-border/50 rounded-xl">
              <div className="flex items-center gap-1.5 pr-4 border-r border-border/50">
                <Star className="w-4 h-4 text-gold fill-current" />
                <span className="text-sm font-black text-gold">{(meData as any)?.me?.xp || 0} XP</span>
              </div>
              <div className="flex items-center gap-1.5 pr-4 border-r border-border/50">
                <Flame className="w-4 h-4 text-accent fill-current" />
                <span className="text-sm font-black text-accent">{(meData as any)?.me?.streak || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight">LVL {(meData as any)?.me?.level || 1}</span>
              </div>
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Theme Toggle */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-2 text-card-foreground/70 hover:text-card-foreground transition-colors">
                  <Bell className="w-5 h-5" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                      {notifications.filter(n => !n.read).length > 99 ? '99+' : notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
                  <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-accent hover:bg-transparent"
                    onClick={() => markAllRead()}
                  >
                    Mark all as read
                  </Button>
                </div>
                <ScrollArea className="max-h-[400px]">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id || notif._id}
                          className={`flex items-start gap-3 p-4 border-b border-border/30 last:border-0 cursor-pointer transition-colors hover:bg-accent/5 ${!notif.read ? 'bg-accent/5' : ''}`}
                          onClick={async () => {
                            if (!notif.read) {
                              markRead({ variables: { id: notif.id || notif._id } });
                              setNotifications(prev => prev.map(n =>
                                (n.id === notif.id || n._id === notif._id) ? { ...n, read: true } : n
                              ));
                            }
                            if (notif.link) navigate(notif.link);
                          }}
                        >
                          <div className={`mt-1 p-1.5 rounded-full ${!notif.read ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}>
                            {notif.type === 'message' ? <MessageSquare className="w-3.5 h-3.5" /> :
                              notif.type === 'booking' ? <Calendar className="w-3.5 h-3.5" /> :
                              notif.type.startsWith('ASSIGNMENT') ? <GraduationCap className="w-3.5 h-3.5" /> :
                              notif.type === 'CERTIFICATE_READY' ? <Award className="w-3.5 h-3.5" /> :
                                <Bell className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-tight ${!notif.read ? 'font-semibold text-card-foreground' : 'text-card-foreground/80'}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {formatDistanceToNow(new Date(parseInt(notif.createdAt) || notif.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          {!notif.read && (
                            <Circle className="w-2 h-2 fill-accent text-accent mt-2 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-accent" onClick={() => navigate('/portal/notifications')}>
                    View all notifications
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-background/50 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium text-card-foreground truncate max-w-[100px]">
                    {user.fullName}
                  </span>
                  <ChevronDown className="w-4 h-4 text-card-foreground/50 hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/portal/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/" className="flex items-center gap-2 cursor-pointer">
                    <Home className="w-4 h-4" />
                    Back to Website
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
      {!location.pathname.startsWith('/chat') && <FloatingChat />}
    </div>
  );
}
