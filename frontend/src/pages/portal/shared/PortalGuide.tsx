import { useTranslation } from "react-i18next";
import { useState } from "react";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { restartTour } from "@/components/portal/onboarding/PlatformTour";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  CreditCard,
  Calendar,
  Briefcase,
  MessageSquare,
  Settings,
  FolderOpen,
  ClipboardList,
  Award,
  Star,
  GraduationCap,
  UserCog,
  BarChart3,
  RotateCcw,
  Send,
  Shield,
  Cog,
  Percent,
  Tag,
  Bell,
  HelpCircle,
  PlayCircle,
  FileText,
  Search,
  Menu,
  LogOut,
  ExternalLink,
  DollarSign,
  AlertTriangle,
  Database,
  Camera,
  Palette,
  MapPin,
} from "lucide-react";

// ============================================================
// Feature data for each role — designed for video creator audience
// who needs clear, step-by-step explanations of each section.
// ============================================================

interface FeatureGuide {
  icon: React.ElementType;
  title: string;
  path: string;
  description: string;
  tips: string[];
  videoScript?: string;
}

interface RoleGuide {
  role: string;
  overview: string;
  sections: {
    title: string;
    icon: React.ElementType;
    features: FeatureGuide[];
  }[];
}

const studentGuide: RoleGuide = {
  role: "student",
  overview:
    "The Student Portal is your learning command center. Here you'll access courses, track progress, manage payments, apply for internships, and earn certificates. Everything you need to go from beginner to job-ready professional.",
  sections: [
    {
      title: "🎯 Core Navigation",
      icon: Menu,
      features: [
        {
          icon: LayoutDashboard,
          title: "Dashboard",
          path: "/portal/student",
          description:
            "Your main landing page showing XP points, streak count, current level, enrolled courses, recent activity, and upcoming deadlines.",
          tips: [
            "Your XP grows as you complete lessons — keep your streak alive for bonus points!",
            "The dashboard refreshes in real-time, so check back after completing lessons.",
            "Click any course card to jump directly into learning.",
          ],
          videoScript:
            "Start at the Dashboard. This is your home base. Notice the XP counter, streak flame, and your current level at the top. Below that are your enrolled courses — click any to continue learning. The activity feed shows recent progress.",
        },
        {
          icon: Search,
          title: "Sidebar Navigation",
          path: "#sidebar",
          description:
            "The left sidebar has all portal sections. Click any item to navigate. Sections with dropdown arrows have sub-menus for deeper features.",
          tips: [
            "Use the search bar at the top of the sidebar to find courses or projects quickly.",
            "The sidebar stays with you as you scroll — always one click away.",
            "You can minimize the sidebar with the menu icon in the top header for more screen space.",
          ],
          videoScript:
            "Let's look at the sidebar on the left. This is your navigation panel. Each icon represents a section — Dashboard, Projects, My Tasks, Academics, Internship, Schedule, Billing, Messages, and Profile. Sections with arrows expand to show sub-options like My Courses, Certificates, and Gradings.",
        },
      ],
    },
    {
      title: "📚 Academics & Learning",
      icon: GraduationCap,
      features: [
        {
          icon: BookOpen,
          title: "My Courses",
          path: "/portal/student/courses",
          description:
            "View all your enrolled courses, continue lessons, track completion percentage, and access course materials. Each course has modules with video lessons, text content, quizzes, and assignments.",
          tips: [
            "Complete at least 80% to qualify for internship placement.",
            "Each paid course offers 2 free lessons — try before you buy!",
            "Use the progress bar to see how far you are in each course.",
          ],
        },
        {
          icon: Award,
          title: "Certificates",
          path: "/portal/student/certificates",
          description:
            "Once you complete all course requirements (100% lessons, all challenges passed, final project approved), your certificate is automatically generated here. Download and share it anywhere.",
          tips: [
            "Certificates include your name, course title, and completion date.",
            "Share your certificate on LinkedIn to boost your professional profile.",
            "You can download certificates as PDF for printing.",
          ],
        },
        {
          icon: Star,
          title: "Gradings",
          path: "/portal/student/gradings",
          description:
            "View your grades for completed assignments, quizzes, and exams. Track your academic performance across all courses.",
          tips: [
            "Check gradings after submitting assignments to see trainer feedback.",
            "Use grading insights to identify areas for improvement.",
            "Grades contribute to your overall course completion status.",
          ],
        },
      ],
    },
    {
      title: "💼 Career & Projects",
      icon: Briefcase,
      features: [
        {
          icon: FolderOpen,
          title: "Projects",
          path: "/portal/student/projects",
          description:
            "Browse and apply for real-world projects posted by clients. Build your portfolio while earning practical experience. Projects range from web development to design and more.",
          tips: [
            "Complete your profile before applying to projects — clients review profiles.",
            "Projects are a great way to build your portfolio while learning.",
            "Successfully completed projects add to your experience level.",
          ],
        },
        {
          icon: ClipboardList,
          title: "My Tasks",
          path: "/portal/student/my-tasks",
          description:
            "View tasks assigned to you by trainers or project managers. Track deadlines, update status, and submit work for review.",
          tips: [
            "Use the Kanban view to drag tasks between status columns.",
            "Set task priorities to manage your workload effectively.",
            "Submit tasks early to get feedback and improve.",
          ],
        },
        {
          icon: Briefcase,
          title: "Program",
          path: "/portal/student/internship",
          description:
            "Apply for internship placement once you meet eligibility (80% course completion). Upload payment proof and wait for admin approval to start your internship.",
          tips: [
            "You need 80% course completion to be eligible for internships.",
            "There's a 20,000 RWF internship fee — upload payment proof after paying.",
            "Internships give you real work experience with actual companies.",
          ],
        },
      ],
    },
    {
      title: "💳 Billing & Account",
      icon: CreditCard,
      features: [
        {
          icon: CreditCard,
          title: "Billing",
          path: "/portal/student/billing",
          description:
            "Manage all your payments in one place. Enroll in paid courses, view your payment history, download receipts, and track billing status. Supports mobile money and card payments.",
          tips: [
            "Keep your receipts — you'll need them for program applications.",
            "Payments are processed securely via mobile money or credit/debit card.",
            "Contact support if you have billing questions or issues.",
          ],
        },
        {
          icon: Calendar,
          title: "Schedule",
          path: "/portal/student/schedule",
          description:
            "View your calendar of upcoming sessions, mentor calls, live classes, and deadlines. Stay organized and never miss an important event.",
          tips: [
            "Events are color-coded by type (class, mentor call, deadline, etc.).",
            "Click any event to see details and join links.",
            "Sync your schedule with Google Calendar or other apps.",
          ],
        },
        {
          icon: MessageSquare,
          title: "Messages",
          path: "/chat",
          description:
            "Chat with trainers, mentors, and fellow students. Get help, ask questions, and collaborate on projects in real-time.",
          tips: [
            "Use messages to ask trainers questions about lessons.",
            "Group chats are available for collaborative projects.",
            "Message notifications appear as badges on the chat icon.",
          ],
        },
        {
          icon: UserCog,
          title: "Profile & Settings",
          path: "/portal/settings",
          description:
            "Update your personal information, change password, manage notification preferences, and customize your profile. A complete profile helps you get better project and internship opportunities.",
          tips: [
            "Add a profile photo and bio — it helps trainers and clients know you.",
            "Keep your phone number and email up to date for important notifications.",
            "You can change your theme preference under Settings.",
          ],
        },
      ],
    },
  ],
};

const trainerGuide: RoleGuide = {
  role: "trainer",
  overview:
    "The Trainer Portal gives you everything you need to manage courses, mentor students, grade assignments, and track your professional activities. Welcome to the teaching team!",
  sections: [
    {
      title: "🎯 Overview & Navigation",
      icon: Menu,
      features: [
        {
          icon: LayoutDashboard,
          title: "Dashboard",
          path: "/portal/trainer",
          description:
            "Your home screen showing total students, active courses, pending reviews, and recent activity at a glance.",
          tips: [
            "Check the pending reviews count daily — students are waiting for feedback!",
            "The dashboard highlights urgent items needing your attention.",
            "Use quick-action buttons to jump into common tasks.",
          ],
        },
        {
          icon: Search,
          title: "Sidebar Navigation",
          path: "#sidebar",
          description:
            "Access all trainer sections from the sidebar: Dashboard, Academics (Courses, Students, Assignments, Projects), Professional (Mentorship, Internships), Schedule, and Messages.",
          tips: [
            "Use the search bar at the top of the sidebar to find specific students or courses.",
            "Expand 'Academics' to see all teaching-related sections.",
            "Expand 'Professional' to access mentorship and internship management.",
          ],
        },
      ],
    },
    {
      title: "📚 Teaching & Academics",
      icon: GraduationCap,
      features: [
        {
          icon: BookOpen,
          title: "My Courses",
          path: "/portal/trainer/courses",
          description:
            "Manage the courses you teach. Create and organize lessons, upload materials, track student progress, and update course content.",
          tips: [
            "Organize courses into modules with clear learning objectives.",
            "Use quizzes and assignments to test student understanding.",
            "Track which students are falling behind and reach out to help.",
          ],
        },
        {
          icon: Users,
          title: "Students",
          path: "/portal/trainer/students",
          description:
            "View all students enrolled in your courses. Check their progress, grades, and contact information. Monitor individual student performance.",
          tips: [
            "Filter students by course or progress level for easier management.",
            "Click any student to view their detailed progress report.",
            "Reach out to struggling students through the messaging system.",
          ],
        },
        {
          icon: GraduationCap,
          title: "Assignments",
          path: "/portal/trainer/projects",
          description:
            "Review and grade student assignments. Provide feedback, assign scores, and track submission status.",
          tips: [
            "Provide constructive feedback — students learn from your comments.",
            "Set clear grading criteria so students know what's expected.",
            "Grade assignments promptly to keep students motivated.",
          ],
        },
        {
          icon: FolderOpen,
          title: "Projects",
          path: "/portal/trainer/assignments",
          description:
            "Manage student projects, review submissions, and provide feedback. Track project milestones and completion status.",
          tips: [
            "Use project milestones to break down large assignments.",
            "Review code/project submissions for quality and best practices.",
            "Provide feedback that helps students improve their work.",
          ],
        },
      ],
    },
    {
      title: "🤝 Professional Activities",
      icon: Briefcase,
      features: [
        {
          icon: GraduationCap,
          title: "Mentorship",
          path: "/portal/trainer/mentorship",
          description:
            "Schedule and manage 1-on-1 mentorship sessions with students. Track your mentoring hours and manage mentee relationships.",
          tips: [
            "Set regular office hours for student mentoring sessions.",
            "Use mentorship sessions to provide personalized guidance.",
            "Track your mentoring hours — they count toward your professional development.",
          ],
        },
        {
          icon: Calendar,
          title: "Schedule",
          path: "/portal/trainer/schedule",
          description:
            "Manage your calendar — view upcoming sessions, classes, and meetings. Plan your teaching time effectively.",
          tips: [
            "Block out time for grading and lesson preparation.",
            "Schedule recurring sessions for regular classes.",
            "Check the schedule daily to prepare for upcoming sessions.",
          ],
        },
        {
          icon: MessageSquare,
          title: "Messages",
          path: "/chat",
          description:
            "Communicate with students, admins, and other trainers. Get questions, provide support, and collaborate in real-time.",
          tips: [
            "Use messages to answer student questions quickly.",
            "Group chats are available for team discussions.",
            "Message notifications appear as badges on the chat icon.",
          ],
        },
      ],
    },
  ],
};

const adminGuide: RoleGuide = {
  role: "admin",
  overview:
    "The Admin Dashboard is your platform management center. Here you control users, courses, payments, projects, internships, and platform analytics. Everything runs through here.",
  sections: [
    {
      title: "🎯 Overview & Navigation",
      icon: Menu,
      features: [
        {
          icon: LayoutDashboard,
          title: "Dashboard",
          path: "/portal/admin",
          description:
            "Your command center showing key platform metrics — total users, students, courses, and revenue at a glance.",
          tips: [
            "The dashboard gives you a quick health check of the platform.",
            "Monitor user growth and course enrollment trends.",
            "Use the stats to identify which courses are most popular.",
          ],
        },
        {
          icon: Search,
          title: "Sidebar Navigation",
          path: "#sidebar",
          description:
            "Access all admin functions from the sidebar: Dashboard, Management (Users, Courses, Applications, Internships, etc.), Projects, Content (Assignments), Operations (Payments, Commissions, Refunds, Analytics), Schedule, and Messages.",
          tips: [
            "Expand 'Management' to access user, course, and application management.",
            "Expand 'Operations' for payment, commission, and refund management.",
            "Use the search bar to find specific users or courses quickly.",
          ],
        },
      ],
    },
    {
      title: "👥 Management",
      icon: Users,
      features: [
        {
          icon: Users,
          title: "Users",
          path: "/portal/admin/users",
          description:
            "Manage all platform users. View, edit profiles, assign roles (student/trainer/admin), track activity, and manage accounts.",
          tips: [
            "Use filters to find users by role, status, or enrollment.",
            "Click any user to view their full profile and activity history.",
            "You can send email notifications directly from user profiles.",
          ],
        },
        {
          icon: BookOpen,
          title: "Courses",
          path: "/portal/admin/courses",
          description:
            "Create, edit, publish, and organize courses. Assign trainers, set pricing, manage modules, lessons, quizzes, and course structure.",
          tips: [
            "Use the course builder to structure content into modules and lessons.",
            "Assign qualified trainers to each course for better student outcomes.",
            "Set pricing strategically — consider free trials for paid courses.",
          ],
        },
        {
          icon: ClipboardList,
          title: "Applications",
          path: "/portal/admin/applications",
          description:
            "Review and manage student applications for courses, internships, and programs. Approve or reject with feedback.",
          tips: [
            "Review applications promptly — students are waiting for responses.",
            "Use the status filters to track pending, approved, and rejected applications.",
            "Provide clear rejection reasons so students can improve.",
          ],
        },
        {
          icon: Briefcase,
          title: "Programs",
          path: "/portal/admin/internships",
          description:
            "Manage programs, track intern progress, assign supervisors, and oversee the entire program lifecycle.",
          tips: [
            "Create structured programs with clear milestones.",
            "Assign experienced trainers as intern supervisors.",
            "Track intern progress weekly to ensure they're on schedule.",
          ],
        },
      ],
    },
    {
      title: "⚙️ Operations",
      icon: Cog,
      features: [
        {
          icon: CreditCard,
          title: "Payments",
          path: "/portal/admin/payments",
          description:
            "View all platform transactions, track revenue, manage payment statuses, and handle student billing issues.",
          tips: [
            "Monitor payment failures and reach out to students to resolve them.",
            "Use payment data to track revenue trends and forecast growth.",
            "Verify manual payments before approving course enrollment.",
          ],
        },
        {
          icon: Percent,
          title: "Commissions",
          path: "/portal/admin/commissions",
          description:
            "Manage trainer commission payouts, view commission structures, and track earnings distribution.",
          tips: [
            "Review commission reports monthly for accurate trainer payouts.",
            "Commission structures can be adjusted per trainer or per course.",
            "Ensure commission data matches payment records before disbursement.",
          ],
        },
        {
          icon: RotateCcw,
          title: "Refunds",
          path: "/portal/admin/refunds",
          description:
            "Process student refund requests. Review disputes, approve or reject refunds, and manage the refund lifecycle.",
          tips: [
            "Review refund requests carefully — check the student's course progress.",
            "Process approved refunds promptly to maintain student satisfaction.",
            "Communicate refund decisions clearly to students.",
          ],
        },
        {
          icon: BarChart3,
          title: "Analytics",
          path: "/portal/admin/analytics",
          description:
            "Deep dive into platform metrics: student performance, course completion rates, revenue trends, and user engagement analytics.",
          tips: [
            "Use analytics to identify which courses need improvement.",
            "Track student retention rates to measure platform health.",
            "Generate reports for stakeholder meetings and planning.",
          ],
        },
      ],
    },
    {
      title: "📅 Schedule & Communication",
      icon: Calendar,
      features: [
        {
          icon: Calendar,
          title: "Schedule",
          path: "/portal/admin/schedule",
          description:
            "View the platform-wide calendar of sessions, classes, and events. Manage scheduling for trainers and students.",
          tips: [
            "Use the schedule to avoid conflicts in trainer and room bookings.",
            "Add important platform events and deadlines to the calendar.",
            "Check the schedule daily for any last-minute changes.",
          ],
        },
        {
          icon: MessageSquare,
          title: "Messages",
          path: "/chat",
          description:
            "Communicate with trainers, students, and other admins. Send announcements, respond to inquiries, and coordinate operations.",
          tips: [
            "Use group chats for team announcements and coordination.",
            "Respond to student messages promptly to maintain engagement.",
            "Save important conversations for future reference.",
          ],
        },
      ],
    },
  ],
};

// Super Admin guide
const superAdminGuide: RoleGuide = {
  role: "super_admin",
  overview:
    "The Super Admin Panel gives you complete control over the entire platform. System configuration, financial operations, user management, marketing tools, and advanced analytics are all at your fingertips.",
  sections: [
    {
      title: "🎯 Overview & Navigation",
      icon: Menu,
      features: [
        {
          icon: LayoutDashboard,
          title: "Dashboard",
          path: "/portal/super-admin",
          description:
            "Your high-level command center showing total users, students, trainers, revenue, and overall platform health metrics.",
          tips: [
            "The dashboard gives you a real-time snapshot of platform health.",
            "Monitor key metrics daily to spot trends early.",
            "Use the quick stats in the header for at-a-glance numbers.",
          ],
        },
        {
          icon: Search,
          title: "Sidebar Navigation",
          path: "#sidebar",
          description:
            "Access all super admin functions from the sidebar: Dashboard, System (Admins, Users, Configuration, Commissions, Disbursements, IntouchPay, PawaPay, Broadcast, Undo Metrics, Discount Codes, Refunds, Scholarships, Error Reports, Code Answers, Backups), Marketing (Social Posts, Branding), Analytics, and User Map.",
          tips: [
            "The 'System' section is your main tool — it has everything for platform management.",
            "Expand 'Discount Codes' to see Manage Codes and Analytics sub-sections.",
            "Use the search bar to quickly find sections or users.",
          ],
        },
      ],
    },
    {
      title: "🔧 System Management",
      icon: Shield,
      features: [
        {
          icon: Users,
          title: "All Users",
          path: "/portal/super-admin/users",
          description:
            "Complete user management. View, search, filter, edit any user account. Assign roles, manage permissions, and track user activity across the platform.",
          tips: [
            "Use the export feature to download user data for reporting.",
            "Filter by role, status, or enrollment to find specific users.",
            "Click any user to view their complete profile and history.",
          ],
        },
        {
          icon: Shield,
          title: "Admins",
          path: "/portal/super-admin/admins",
          description:
            "Manage admin accounts — add new admins, set permissions, and monitor admin activity across the platform.",
          tips: [
            "Grant admin access carefully — admins have extensive platform control.",
            "Monitor admin activity logs for security auditing.",
            "Remove admin access promptly when no longer needed.",
          ],
        },
        {
          icon: Cog,
          title: "Configuration",
          path: "/portal/super-admin/config",
          description:
            "Set platform-wide settings: pricing, feature flags, global preferences, system configuration, and platform defaults.",
          tips: [
            "Test configuration changes in a staging environment first.",
            "Document all configuration changes for team reference.",
            "Review configuration regularly to ensure it matches current needs.",
          ],
        },
        {
          icon: Percent,
          title: "Commissions Config",
          path: "/portal/super-admin/commissions",
          description:
            "Set commission rates for trainers, referral bonuses, and payout structures across the platform.",
          tips: [
            "Review commission rates quarterly to ensure they're competitive.",
            "Different courses can have different commission structures.",
            "Ensure commission calculations are transparent to trainers.",
          ],
        },
      ],
    },
    {
      title: "💰 Financial Operations",
      icon: CreditCard,
      features: [
        {
          icon: Send,
          title: "Disbursements",
          path: "/portal/super-admin/disbursements",
          description:
            "Manage payouts to trainers and partners. Initiate transfers, view payment history, and track disbursement status.",
          tips: [
            "Verify recipient details before initiating disbursements.",
            "Track disbursement history for financial reporting.",
            "Contact support if disbursements fail or are delayed.",
          ],
        },
        {
          icon: DollarSign,
          title: "IntouchPay",
          path: "/portal/super-admin/intouch-pay",
          description:
            "Manage IntouchPay payment integration — view transactions, handle payment processing, and troubleshoot payment issues.",
          tips: [
            "Monitor IntouchPay transactions for successful payment processing.",
            "Check for failed transactions and retry as needed.",
            "Keep IntouchPay configuration up to date.",
          ],
        },
        {
          icon: Send,
          title: "Withdraw from Wallet (PawaPay)",
          path: "/portal/super-admin/pawapay",
          description:
            "Manage PawaPay wallet withdrawals, view wallet balance, and initiate withdrawals to bank accounts.",
          tips: [
            "Check wallet balance before initiating withdrawals.",
            "Withdrawal processing times may vary by payment method.",
            "Keep withdrawal records for financial reconciliation.",
          ],
        },
        {
          icon: RotateCcw,
          title: "Refunds",
          path: "/portal/super-admin/refunds",
          description:
            "Manage the full refund lifecycle. Review refund requests, process payouts, handle disputes, and track refund analytics.",
          tips: [
            "Review each refund request carefully before processing.",
            "Process approved refunds promptly to maintain platform trust.",
            "Use refund data to identify courses with high refund rates.",
          ],
        },
        {
          icon: Tag,
          title: "Discount Codes",
          path: "/portal/super-admin/discount-codes",
          description:
            "Create and manage promotional discount codes. Set discount percentages, usage limits, expiration dates, and track code performance.",
          tips: [
            "Use time-limited codes to create urgency for promotions.",
            "Track discount code analytics to measure campaign effectiveness.",
            "Set clear usage limits to prevent abuse.",
          ],
        },
        {
          icon: Award,
          title: "Scholarships",
          path: "/portal/super-admin/scholarships",
          description:
            "Manage scholarship programs — create scholarship opportunities, review applications, award scholarships, and track program impact.",
          tips: [
            "Define clear eligibility criteria for scholarship programs.",
            "Review scholarship applications thoroughly and fairly.",
            "Track scholarship outcomes to measure program effectiveness.",
          ],
        },
      ],
    },
    {
      title: "📊 Analytics & Monitoring",
      icon: BarChart3,
      features: [
        {
          icon: BarChart3,
          title: "Analytics",
          path: "/portal/super-admin/analytics",
          description:
            "Comprehensive platform analytics — user growth, revenue trends, course completion rates, engagement metrics, and custom reports.",
          tips: [
            "Use analytics to identify growth opportunities and bottlenecks.",
            "Generate custom date-range reports for specific analysis.",
            "Export analytics data for presentations and stakeholder updates.",
          ],
        },
        {
          icon: AlertTriangle,
          title: "Error Reports",
          path: "/portal/super-admin/error-reports",
          description:
            "Monitor platform errors and issues. View error logs, track resolution status, and manage bug reports from users.",
          tips: [
            "Prioritize critical errors for immediate resolution.",
            "Assign errors to team members for accountability.",
            "Track error resolution time to improve platform reliability.",
          ],
        },
        {
          icon: Database,
          title: "Database Backups",
          path: "/portal/super-admin/backups",
          description:
            "Manage database backups — view backup history, trigger manual backups, and manage backup retention policies.",
          tips: [
            "Schedule regular automated backups for data safety.",
            "Test backup restoration periodically to ensure data integrity.",
            "Keep backups in secure, off-site storage.",
          ],
        },
      ],
    },
    {
      title: "📢 Communication & Marketing",
      icon: MessageSquare,
      features: [
        {
          icon: Send,
          title: "Broadcast",
          path: "/portal/super-admin/broadcast",
          description:
            "Send broadcast notifications to all users or specific groups. Announce platform updates, promotions, or important information.",
          tips: [
            "Use targeted broadcasts to reach specific user segments.",
            "Keep broadcast messages concise and actionable.",
            "Schedule broadcasts during optimal engagement times.",
          ],
        },
        {
          icon: Camera,
          title: "Social Posts",
          path: "/portal/super-admin/social-posts",
          description:
            "Create and manage social media posts for the platform. Schedule posts, track engagement, and maintain your social media presence.",
          tips: [
            "Plan content calendars for consistent social media posting.",
            "Use engaging visuals to increase post reach.",
            "Track post performance to optimize your social strategy.",
          ],
        },
        {
          icon: Palette,
          title: "Branding",
          path: "/portal/admin/branding",
          description:
            "Manage platform branding — update logo, colors, site name, and visual identity across the entire platform.",
          tips: [
            "Keep branding consistent across all platform touchpoints.",
            "Test branding changes before applying them platform-wide.",
            "Branding updates take effect immediately after saving.",
          ],
        },
        {
          icon: MapPin,
          title: "User Map",
          path: "/portal/super-admin/user-map",
          description:
            "View a geographical map of your user base. See where students, trainers, and partners are located around the world.",
          tips: [
            "Use the user map to identify regions with high user density.",
            "Target marketing efforts to under-represented regions.",
            "The map updates in real-time as new users register.",
          ],
        },
      ],
    },
  ],
};

// Map roles to their guides
const guideByRole: Record<string, RoleGuide> = {
  student: studentGuide,
  trainer: trainerGuide,
  mentor: trainerGuide,
  admin: adminGuide,
  super_admin: superAdminGuide,
  client: adminGuide,
};

export default function PortalGuide() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const role = user?.role || "student";
  const guide = guideByRole[role];

  if (!guide) return null;

  // Use i18n for role label — fall back to English from the guide data
  const roleLabel =
    role === "super_admin"
      ? "Super Admin"
      : role.charAt(0).toUpperCase() + role.slice(1);

  // Translate overview using i18n keys (with fallback to English data)
  const translatedOverview = t(`guide.${role}.overview`, { defaultValue: guide.overview });

  // Translate section titles
  const sectionTitles = t(`guide.${role}.sections`, {
    returnObjects: true,
    defaultValue: {}
  }) as Record<string, string>;

  return (
    <PortalLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
                📖 {roleLabel} Platform Guide
              </h1>
              <p className="text-muted-foreground mt-1 max-w-2xl">
                {translatedOverview}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => restartTour()}
            >
              <PlayCircle className="w-4 h-4" />
              Start Interactive Tour
            </Button>
          </div>
        </motion.div>

        {/* Tabs for each section */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-lg px-4 py-2"
            >
              🏠 Overview
            </TabsTrigger>
            {guide.sections.map((section) => {
              const translatedTitle = sectionTitles[section.title] ?? section.title;
              return (
                <TabsTrigger
                  key={section.title}
                  value={section.title}
                  className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-lg px-4 py-2"
                >
                  {translatedTitle}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-accent" />
                  Quick Start Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {guide.sections.map((section) => {
                    const translatedTitle = sectionTitles[section.title] ?? section.title;
                    return (
                      <button
                        key={section.title}
                        onClick={() => setActiveTab(section.title)}
                        className="flex items-start gap-4 p-4 rounded-xl bg-background/50 hover:bg-background border border-border/30 hover:border-accent/30 transition-all text-left group"
                      >
                        <div className="p-2.5 rounded-lg bg-accent/10 text-accent shrink-0 group-hover:scale-110 transition-transform">
                          <section.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">
                            {translatedTitle}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {section.features.length} features
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Section Tabs */}
          {guide.sections.map((section) => {
            const translatedTitle = sectionTitles[section.title] ?? section.title;
            return (
            <TabsContent
              key={section.title}
              value={section.title}
              className="mt-6 space-y-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-accent/10 text-accent">
                  <section.icon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-heading font-semibold text-foreground">
                  {translatedTitle}
                </h2>
              </div>

              <div className="space-y-4">
                {section.features.map((feature) => (
                  <Card
                    key={feature.title}
                    className="border-border/50 overflow-hidden"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/5 text-primary">
                            <feature.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base font-heading">
                              {feature.title}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                              {feature.path}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-[10px] shrink-0"
                        >
                          Feature
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-card-foreground/80 leading-relaxed">
                        {feature.description}
                      </p>

                      {feature.tips.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                            <Star className="w-3 h-3" />
                            Pro Tips
                          </h4>
                          <ul className="space-y-1.5">
                            {feature.tips.map((tip, i) => (
                              <li
                                key={i}
                                className="text-xs text-card-foreground/70 flex items-start gap-2"
                              >
                                <span className="text-accent mt-0.5 shrink-0">
                                  •
                                </span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {feature.videoScript && (
                        <Accordion
                          type="single"
                          collapsible
                          className="border border-border/30 rounded-lg"
                        >
                          <AccordionItem value="script" className="border-0">
                            <AccordionTrigger className="px-3 py-2 text-xs font-semibold hover:no-underline">
                              🎬 Video Script for Creators
                            </AccordionTrigger>
                            <AccordionContent className="px-3 pb-3">
                              <p className="text-xs text-muted-foreground leading-relaxed italic">
                                {feature.videoScript}
                              </p>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            );
          })}
        </Tabs>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Need more help?{" "}
            <Button
              variant="link"
              className="text-accent p-0 h-auto text-sm"
              onClick={() => restartTour()}
            >
              Restart the interactive tour
            </Button>{" "}
            or visit the{" "}
            <Button
              variant="link"
              asChild
              className="text-accent p-0 h-auto text-sm"
            >
              <a href="/portal/help">Help Center</a>
            </Button>
          </p>
        </div>
      </div>
    </PortalLayout>
  );
}
