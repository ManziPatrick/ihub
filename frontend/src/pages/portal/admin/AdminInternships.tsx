import { useState } from "react";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Briefcase,
  Users,
  FileText,
  Activity,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  LayoutGrid,
  BarChart3,
  Code,
  Trello
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ProgramList from "@/components/portal/admin/internship/ProgramList";
import ApplicationReview from "@/components/portal/admin/internship/ApplicationReview";
import TeamManagement from "@/components/portal/admin/internship/TeamManagement";
import InternshipProjectList from "@/components/portal/admin/internship/InternshipProjectList";
import InternshipActivityLogs from "@/components/portal/admin/internship/InternshipActivityLogs";
import EngagementDashboard from "@/components/portal/admin/internship/EngagementDashboard";
import WorkflowBoard from "@/components/portal/admin/internship/WorkflowBoard";

export default function AdminInternships() {
  const [activeTab, setActiveTab] = useState("programs");

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
              Program Command Center
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage programs, review applications, and track team progress across the academy.
            </p>
          </div>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1 border border-border/50">
            <TabsTrigger value="programs" className="gap-2">
              <Briefcase className="w-4 h-4" />
              Programs
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-2">
              <FileText className="w-4 h-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2">
              <LayoutGrid className="w-4 h-4" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2">
              <Code className="w-4 h-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Activity className="w-4 h-4" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="engagement" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Engagement
            </TabsTrigger>
            <TabsTrigger value="workflow" className="gap-2">
              <Trello className="w-4 h-4" />
              Workflow Board
            </TabsTrigger>
          </TabsList>

          <TabsContent value="programs">
            <ProgramList />
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationReview />
          </TabsContent>

          <TabsContent value="teams">
            <TeamManagement />
          </TabsContent>

          <TabsContent value="projects">
            <InternshipProjectList />
          </TabsContent>

          <TabsContent value="logs">
            <InternshipActivityLogs />
          </TabsContent>

          <TabsContent value="engagement">
            <EngagementDashboard />
          </TabsContent>

          <TabsContent value="workflow">
            <WorkflowBoard />
          </TabsContent>
        </Tabs>
      </div>
    </PortalLayout>
  );
}
