import { useState } from "react";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Briefcase,
    Users,
    FileText,
    LayoutGrid,
    Layers,
    CheckSquare
} from "lucide-react";
import ApplicationReview from "@/components/portal/admin/internship/ApplicationReview";
import TeamManagement from "@/components/portal/admin/internship/TeamManagement";
import InternshipSubmissionReview from "@/components/portal/admin/internship/InternshipSubmissionReview";
import ProgramList from "@/components/portal/admin/internship/ProgramList";
import WorkflowBoard from "@/components/portal/admin/internship/WorkflowBoard";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TrainerInternships() {
    const [activeTab, setActiveTab] = useState("workflow");
    const { user } = useAuth();

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
                            Program Management
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Review applications, manage your teams, and track intern progress.
                        </p>
                    </div>
                </motion.div>

                {/* Main Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-muted/50 p-1 border border-border/50">
                        <TabsTrigger value="workflow" className="gap-2">
                            <Layers className="w-4 h-4" />
                            Workflow Board
                        </TabsTrigger>
                        <TabsTrigger value="applications" className="gap-2">
                            <FileText className="w-4 h-4" />
                            Applications
                        </TabsTrigger>
                        <TabsTrigger value="teams" className="gap-2">
                            <LayoutGrid className="w-4 h-4" />
                            My Teams & Projects
                        </TabsTrigger>
                        <TabsTrigger value="submissions" className="gap-2">
                            <CheckSquare className="w-4 h-4" />
                            Work Submissions
                        </TabsTrigger>
                        <TabsTrigger value="programs" className="gap-2">
                            <Briefcase className="w-4 h-4" />
                            Programs Directory
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="workflow">
                        <div className="space-y-4">
                            <div className="bg-indigo-50/50 border border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/50 p-4 rounded-lg">
                                <h3 className="font-medium text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                                    <Layers className="w-4 h-4" />
                                    Workflow Management
                                </h3>
                                <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
                                    Drag and drop interns across different stages of their internship to update their progression.
                                </p>
                            </div>
                            <WorkflowBoard />
                        </div>
                    </TabsContent>

                    <TabsContent value="applications">
                        <div className="space-y-4">
                            <div className="bg-blue-50/50 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/50 p-4 rounded-lg">
                                <h3 className="font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Trainer View
                                </h3>
                                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                                    You can review applications for internship programs you are assigned to.
                                    Approving an application will create an internship record for the student.
                                </p>
                            </div>
                            <ApplicationReview />
                        </div>
                    </TabsContent>

                    <TabsContent value="teams">
                        <div className="space-y-4">
                            <div className="bg-amber-50/50 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/50 p-4 rounded-lg">
                                <h3 className="font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                    <LayoutGrid className="w-4 h-4" />
                                    Team Management
                                </h3>
                                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                                    Manage teams you are mentoring. You can update team status, view members, and track project progress.
                                </p>
                            </div>
                            <TeamManagement />
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="submissions">
                        <div className="space-y-4">
                            <div className="bg-emerald-50/50 border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/50 p-4 rounded-lg">
                                <h3 className="font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4" />
                                    Submission Review
                                </h3>
                                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                                    Review work submitted by your teams. You can provide feedback and update the status of each milestone.
                                </p>
                            </div>
                            <InternshipSubmissionReview />
                        </div>
                    </TabsContent>

                    <TabsContent value="programs">
                        <div className="space-y-4">
                            <div className="bg-green-50/50 border border-green-100 dark:bg-green-900/10 dark:border-green-900/50 p-4 rounded-lg">
                                <h3 className="font-medium text-green-800 dark:text-green-300 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" />
                                    Programs Directory
                                </h3>
                                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                    View available internship programs. Only administrators can create or edit program details.
                                </p>
                            </div>
                            {/* Pass readOnly prop if ProgramList supports it, or it will just show programs and edit buttons might be disabled by backend auth */}
                            <ProgramList />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </PortalLayout>
    );
}
