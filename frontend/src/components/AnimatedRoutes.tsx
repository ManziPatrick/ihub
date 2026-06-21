import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./PageTransition";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { Chat } from "@/components/chat/Chat";
import { useBranding } from "./BrandingProvider";
import { useAuth } from "@/contexts/AuthContext";

// Public Pages
const Index = lazy(() => import("@/pages/Index"));
const About = lazy(() => import("@/pages/About"));
const Services = lazy(() => import("@/pages/Services"));
const Explore = lazy(() => import("@/pages/Explore"));
const Internships = lazy(() => import("@/pages/Internships"));
const Projects = lazy(() => import("@/pages/Projects"));
const Partners = lazy(() => import("@/pages/Partners"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogDetail = lazy(() => import("@/pages/BlogDetail"));
const Team = lazy(() => import("@/pages/Team"));
const CompanyProfile = lazy(() => import("@/pages/CompanyProfile"));
const CompanyProfileFR = lazy(() => import("@/pages/CompanyProfileFR"));
const Contact = lazy(() => import("@/pages/Contact"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Auth = lazy(() => import("@/pages/Auth"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const CoursePage = lazy(() => import("@/pages/CoursePage"));
const PaymentSuccess = lazy(() => import("@/pages/PaymentSuccess"));

// Student Portal
const StudentDashboard = lazy(() => import("@/pages/portal/student/StudentDashboard"));
const StudentCourses = lazy(() => import("@/pages/portal/student/StudentCourses"));
const CourseDetail = lazy(() => import("@/pages/portal/student/CourseDetail"));
const StudentProjects = lazy(() => import("@/pages/portal/student/StudentProjects"));
const StudentProjectDetail = lazy(() => import("@/pages/portal/student/StudentProjectDetail"));
const StudentCertificates = lazy(() => import("@/pages/portal/student/StudentCertificates"));
const StudentInternships = lazy(() => import("@/pages/portal/student/StudentInternships"));
const StudentSchedule = lazy(() => import("@/pages/portal/student/StudentSchedule"));
const StudentSupport = lazy(() => import("@/pages/portal/student/StudentSupport"));
const StudentPayments = lazy(() => import("@/pages/portal/student/StudentPayments"));
const StudentGrades = lazy(() => import("@/pages/portal/student/StudentGrades"));
const StudentTasks = lazy(() => import("@/pages/portal/student/StudentTasks"));
const ClientDashboard = lazy(() => import("@/pages/portal/client/ClientDashboard"));
const ClientApplications = lazy(() => import("@/pages/portal/client/ClientApplications"));
const ClientProjectWorkspace = lazy(() => import("@/pages/portal/client/ClientProjectWorkspace"));
const ClientFeedback = lazy(() => import("@/pages/portal/client/ClientFeedback"));

// Trainer Portal
const TrainerDashboard = lazy(() => import("@/pages/portal/trainer/TrainerDashboard"));
const TrainerStudents = lazy(() => import("@/pages/portal/trainer/TrainerStudents"));
const TrainerCourses = lazy(() => import("@/pages/portal/trainer/TrainerCourses"));
const TrainerAssignments = lazy(() => import("@/pages/portal/trainer/TrainerAssignments"));
const TrainerSchedule = lazy(() => import("@/pages/portal/trainer/TrainerSchedule"));
const TrainerMentorship = lazy(() => import("@/pages/portal/trainer/TrainerMentorship"));
const TrainerInternships = lazy(() => import("@/pages/portal/trainer/TrainerInternships"));
const TrainerProjects = lazy(() => import("@/pages/portal/trainer/TrainerProjects"));

// Admin Portal
const AdminDashboard = lazy(() => import("@/pages/portal/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("@/pages/portal/admin/AdminUsers"));
const AdminCourses = lazy(() => import("@/pages/portal/admin/AdminCourses"));
const AdminInternships = lazy(() => import("@/pages/portal/admin/AdminInternships"));
const AdminProjects = lazy(() => import("@/pages/portal/admin/AdminProjects"));
const AdminPayments = lazy(() => import("@/pages/portal/admin/AdminPayments"));
const AdminBadges = lazy(() => import("@/pages/portal/admin/AdminBadges"));
const AdminAnalytics = lazy(() => import("@/pages/portal/admin/AdminAnalytics"));
const AdminSchedule = lazy(() => import("../pages/portal/admin/AdminSchedule"));
const AdminBlogManager = lazy(() => import("@/pages/portal/admin/AdminBlogManager"));
const AdminTeamManager = lazy(() => import("@/pages/portal/admin/AdminTeamManager"));
const AdminApplications = lazy(() => import("@/pages/portal/admin/AdminApplications"));
const AdminProjectApplications = lazy(() => import("@/pages/portal/admin/AdminProjectApplications"));
const AdminProjectOnboarding = lazy(() => import("@/pages/portal/admin/AdminProjectOnboarding"));
const CreateCourse = lazy(() => import("@/pages/portal/admin/CreateCourse").then(m => ({ default: m.default })));

// Super Admin Portal
const SuperAdminDashboard = lazy(() => import("@/pages/portal/super-admin/SuperAdminDashboard"));
const SuperAdminAdmins = lazy(() => import("@/pages/portal/super-admin/SuperAdminAdmins"));
const SuperAdminUsers = lazy(() => import("@/pages/portal/super-admin/SuperAdminUsers").then(m => ({ default: m.default })));
const SuperAdminConfig = lazy(() => import("@/pages/portal/super-admin/SuperAdminConfig"));
const SuperAdminAnalytics = lazy(() => import("@/pages/portal/super-admin/SuperAdminAnalytics"));
const SystemAuditReport = lazy(() => import("@/pages/portal/super-admin/SystemAuditReport"));
const SuperAdminPerformance = lazy(() => import("@/pages/portal/super-admin/PerformanceReport"));
const SuperAdminUndoMetrics = lazy(() => import("@/pages/portal/super-admin/AdminUndoMetrics"));
const SuperAdminBranding = lazy(() => import("@/pages/portal/admin/AdminBranding"));
const SuperAdminTools = lazy(() => import("@/pages/portal/admin/AdminTools"));
const SuperAdminMap = lazy(() => import("@/pages/portal/super-admin/SuperAdminMap"));
const UserReportPage = lazy(() => import("@/pages/portal/super-admin/UserReportPage"));
const SuperAdminCommissionConfig = lazy(() => import("@/pages/portal/super-admin/SuperAdminCommissionConfig"));
const AdminCommissionDashboard = lazy(() => import("@/pages/portal/super-admin/AdminCommissionDashboard"));
const SuperAdminBroadcast = lazy(() => import("@/pages/portal/super-admin/SuperAdminBroadcast"));
const SuperAdminUploadLogs = lazy(() => import("@/pages/portal/super-admin/SuperAdminUploadLogs"));
const Maintenance = lazy(() => import("@/pages/Maintenance"));


const ModuleAccessDashboard = lazy(() => import("@/pages/portal/student/ModuleAccessDashboard"));
const TrainerModuleReviewPanel = lazy(() => import("@/pages/portal/trainer/TrainerModuleReviewPanel"));
const AdminModuleControlPanel = lazy(() => import("@/pages/portal/admin/AdminModuleControlPanel"));

// Shared Portal Pages
const PortalSettings = lazy(() => import("@/pages/portal/shared/PortalSettings"));
const CoursePreview = lazy(() => import("@/pages/portal/shared/CoursePreview"));
const InternshipMeetings = lazy(() => import("@/pages/portal/shared/InternshipMeetings"));
const PortalHelp = lazy(() => import("@/pages/portal/shared/PortalHelp"));
const NotificationsPage = lazy(() => import("@/pages/portal/shared/NotificationsPage"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

export function AnimatedRoutes() {
  const location = useLocation();
  const { branding, loading: brandingLoading } = useBranding();
  const { user, isLoading: authLoading } = useAuth();

  const isMaintenanceMode = branding.maintenanceMode;
  const isAdmin = user && (user.role === "admin" || user.role === "super_admin");
  const isPublicPath = ["/auth", "/maintenance", "/reset-password"].includes(location.pathname);

  // If in maintenance mode and not an admin, and not on an allowed public path
  // we restrict the UI.
  if (!brandingLoading && isMaintenanceMode && !isAdmin && !isPublicPath) {
    return (
      <AnimatePresence mode="wait">
        <Suspense fallback={<PageLoader />}>
          <Routes location={location} key="maintenance">
            <Route path="*" element={<Maintenance />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          {/* Public Routes */}
          <Route path="/" element={<PageTransition><Index /></PageTransition>} />
          <Route path="/about" element={<PageTransition><About /></PageTransition>} />
          <Route path="/services" element={<PageTransition><Services /></PageTransition>} />
          <Route path="/explore" element={<PageTransition><Explore /></PageTransition>} />
          <Route path="/internships" element={<PageTransition><Internships /></PageTransition>} />
          <Route path="/projects" element={<PageTransition><Projects /></PageTransition>} />
          <Route path="/partners" element={<PageTransition><Partners /></PageTransition>} />
          <Route path="/team" element={<PageTransition><Team /></PageTransition>} />
          <Route path="/company-profile" element={<PageTransition><CompanyProfile /></PageTransition>} />
          <Route path="/profil-entreprise" element={<PageTransition><CompanyProfileFR /></PageTransition>} />
          <Route path="/blog" element={<PageTransition><Blog /></PageTransition>} />
          <Route path="/blog/:slug" element={<PageTransition><BlogDetail /></PageTransition>} />
          <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/success" element={<PaymentSuccess />} />

          {/* Student Portal */}
          <Route path="/portal/student" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/portal/student/courses" element={<ProtectedRoute allowedRoles={["student"]}><StudentCourses /></ProtectedRoute>} />
          <Route path="/portal/student/courses/:courseId" element={<ProtectedRoute allowedRoles={["student"]}><CourseDetail /></ProtectedRoute>} />
          <Route path="/portal/student/projects" element={<ProtectedRoute allowedRoles={["student"]}><StudentProjects /></ProtectedRoute>} />
          <Route path="/portal/student/projects/:projectId" element={<ProtectedRoute allowedRoles={["student"]}><StudentProjectDetail /></ProtectedRoute>} />
          <Route path="/portal/student/my-tasks" element={<ProtectedRoute allowedRoles={["student"]}><StudentTasks /></ProtectedRoute>} />
          <Route path="/portal/student/certificates" element={<ProtectedRoute allowedRoles={["student"]}><StudentCertificates /></ProtectedRoute>} />
          <Route path="/portal/student/internship" element={<ProtectedRoute allowedRoles={["student"]}><StudentInternships /></ProtectedRoute>} />
          <Route path="/portal/student/schedule" element={<ProtectedRoute allowedRoles={["student"]}><StudentSchedule /></ProtectedRoute>} />
          <Route path="/portal/student/billing" element={<ProtectedRoute allowedRoles={["student"]}><StudentPayments /></ProtectedRoute>} />
          <Route path="/portal/student/gradings" element={<ProtectedRoute allowedRoles={["student"]}><StudentGrades /></ProtectedRoute>} />
          <Route path="/portal/student/profile" element={<ProtectedRoute allowedRoles={["student"]}><PortalSettings /></ProtectedRoute>} />
          <Route path="/portal/student/module-access" element={<ProtectedRoute allowedRoles={["student"]}><ModuleAccessDashboard /></ProtectedRoute>} />

          {/* Client Portal */}
          <Route path="/portal/client" element={<ProtectedRoute allowedRoles={["client"]}><ClientDashboard /></ProtectedRoute>} />
          <Route path="/portal/client/applications" element={<ProtectedRoute allowedRoles={["client"]}><ClientApplications /></ProtectedRoute>} />
          <Route path="/portal/client/workspace" element={<ProtectedRoute allowedRoles={["client"]}><ClientProjectWorkspace /></ProtectedRoute>} />
          <Route path="/portal/client/feedback" element={<ProtectedRoute allowedRoles={["client"]}><ClientFeedback /></ProtectedRoute>} />

          {/* Trainer Portal */}
          <Route path="/portal/trainer" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerDashboard /></ProtectedRoute>} />
          <Route path="/portal/trainer/students" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerStudents /></ProtectedRoute>} />
          <Route path="/portal/trainer/courses" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerCourses /></ProtectedRoute>} />
          <Route path="/portal/trainer/assignments" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerAssignments /></ProtectedRoute>} />
          <Route path="/portal/trainer/schedule" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerSchedule /></ProtectedRoute>} />
          <Route path="/portal/trainer/mentorship" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerMentorship /></ProtectedRoute>} />
          <Route path="/portal/trainer/internships" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerInternships /></ProtectedRoute>} />
          <Route path="/portal/trainer/projects" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerProjects /></ProtectedRoute>} />
          <Route path="/portal/trainer/module-reviews" element={<ProtectedRoute allowedRoles={["trainer"]}><TrainerModuleReviewPanel /></ProtectedRoute>} />

          {/* Admin Portal */}
          <Route path="/portal/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/portal/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
          <Route path="/portal/admin/courses" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCourses /></ProtectedRoute>} />
          <Route path="/portal/admin/courses/create" element={<ProtectedRoute allowedRoles={["admin"]}><CreateCourse /></ProtectedRoute>} />
          <Route path="/portal/admin/applications" element={<ProtectedRoute allowedRoles={["admin"]}><AdminApplications /></ProtectedRoute>} />
          <Route path="/portal/admin/internships" element={<ProtectedRoute allowedRoles={["admin"]}><AdminInternships /></ProtectedRoute>} />
          <Route path="/portal/admin/schedule" element={<ProtectedRoute allowedRoles={["admin", "super_admin"]}><AdminSchedule /></ProtectedRoute>} />
          <Route path="/portal/internship/meetings" element={<ProtectedRoute allowedRoles={["admin", "trainer", "student"]}><InternshipMeetings /></ProtectedRoute>} />
          <Route path="/portal/admin/projects" element={<ProtectedRoute allowedRoles={["admin"]}><AdminProjects /></ProtectedRoute>} />
          <Route path="/portal/admin/project-applications" element={<ProtectedRoute allowedRoles={["admin"]}><AdminProjectApplications /></ProtectedRoute>} />
          <Route path="/portal/admin/project-onboarding" element={<ProtectedRoute allowedRoles={["admin", "trainer"]}><AdminProjectOnboarding /></ProtectedRoute>} />
          <Route path="/portal/admin/assignment-reviews" element={<ProtectedRoute allowedRoles={["admin", "super_admin"]}><TrainerProjects /></ProtectedRoute>} />
          <Route path="/portal/admin/payments" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPayments /></ProtectedRoute>} />
          <Route path="/portal/admin/badges" element={<ProtectedRoute allowedRoles={["admin"]}><AdminBadges /></ProtectedRoute>} />
          <Route path="/portal/admin/analytics" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAnalytics /></ProtectedRoute>} />
          <Route path="/portal/admin/user-report/:userId" element={<ProtectedRoute allowedRoles={["admin", "super_admin"]}><UserReportPage /></ProtectedRoute>} />

          <Route path="/portal/admin/course-preview" element={<ProtectedRoute allowedRoles={["admin", "super_admin"]}><CoursePreview /></ProtectedRoute>} />
          <Route path="/portal/admin/course-preview/:courseId" element={<ProtectedRoute allowedRoles={["admin", "super_admin"]}><CoursePreview /></ProtectedRoute>} />

          <Route path="/portal/admin/blogs" element={<ProtectedRoute allowedRoles={["admin"]}><AdminBlogManager /></ProtectedRoute>} />
          <Route path="/portal/admin/team" element={<ProtectedRoute allowedRoles={["admin"]}><AdminTeamManager /></ProtectedRoute>} />


          <Route path="/portal/admin/module-controls" element={<ProtectedRoute allowedRoles={["admin", "super_admin"]}><AdminModuleControlPanel /></ProtectedRoute>} />

          {/* Super Admin Portal */}
          <Route path="/portal/super-admin" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/portal/super-admin/admins" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminAdmins /></ProtectedRoute>} />
          <Route path="/portal/super-admin/users" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminUsers /></ProtectedRoute>} />
          <Route path="/portal/super-admin/config" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminConfig /></ProtectedRoute>} />
          <Route path="/portal/super-admin/analytics" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminAnalytics /></ProtectedRoute>} />
          <Route path="/portal/super-admin/system-report" element={<ProtectedRoute allowedRoles={["super_admin"]}><SystemAuditReport /></ProtectedRoute>} />
          <Route path="/portal/super-admin/performance" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminPerformance /></ProtectedRoute>} />
          <Route path="/portal/super-admin/undo-metrics" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminUndoMetrics /></ProtectedRoute>} />
          <Route path="/portal/super-admin/branding" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminBranding /></ProtectedRoute>} />
          <Route path="/portal/super-admin/tools" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminTools /></ProtectedRoute>} />
          <Route path="/portal/super-admin/user-map" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminMap /></ProtectedRoute>} />
          <Route path="/portal/super-admin/user-report/:userId" element={<ProtectedRoute allowedRoles={["super_admin"]}><UserReportPage /></ProtectedRoute>} />
          <Route path="/portal/super-admin/commissions" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminCommissionConfig /></ProtectedRoute>} />
          <Route path="/portal/super-admin/my-commissions" element={<ProtectedRoute allowedRoles={["super_admin"]}><AdminCommissionDashboard /></ProtectedRoute>} />
          <Route path="/portal/super-admin/broadcast" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminBroadcast /></ProtectedRoute>} />
          <Route path="/portal/super-admin/upload-logs" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminUploadLogs /></ProtectedRoute>} />
          <Route path="/portal/admin/commissions" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCommissionDashboard /></ProtectedRoute>} />

          {/* Shared Portal Routes */}
          <Route path="/portal/settings" element={<ProtectedRoute allowedRoles={["student", "trainer", "admin", "super_admin"]}><PortalSettings /></ProtectedRoute>} />
          <Route path="/portal/help" element={<ProtectedRoute allowedRoles={["student", "trainer", "admin", "super_admin"]}><PortalHelp /></ProtectedRoute>} />
          <Route path="/portal/notifications" element={<ProtectedRoute allowedRoles={["student", "trainer", "admin", "super_admin"]}><NotificationsPage /></ProtectedRoute>} />

          {/* Experimental/Testing */}
          <Route path="/courses/:id" element={<PageTransition><CoursePage /></PageTransition>} />
          <Route path="/chat" element={<PageTransition><Chat /></PageTransition>} />
          <Route path="/maintenance" element={<Maintenance />} />

          {/* Catch-all */}
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}
