import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_MY_INTERNSHIP_TEAM, GET_MY_INTERNSHIP_APPLICATIONS } from "@/lib/graphql/queries";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  Briefcase,
  ClipboardList,
  Target,
} from "lucide-react";
import { ProgramCatalog } from "@/components/portal/student/internship/ProgramCatalog";
import { MyInternshipDashboard } from "@/components/portal/student/internship/MyInternshipDashboard";
import { MyApplications } from "@/components/portal/student/internship/MyApplications";

export default function StudentInternships() {
  const { data: teamData, loading: loadingTeam } = useQuery<any>(GET_MY_INTERNSHIP_TEAM);
  const { data: appData } = useQuery<any>(GET_MY_INTERNSHIP_APPLICATIONS);
  const [activeTab, setActiveTab] = useState("catalog");

  const hasTeam = !!teamData?.myInternshipTeam;
  const applications = appData?.myInternshipApplications || [];
  const enrolledCount = applications.filter(
    (a: any) => a.status === "approved" && a.payment?.status === "paid"
  ).length;
  const pendingPaymentCount = applications.filter(
    (a: any) => a.status === "approved" && a.payment?.status === "pending" && !a.payment?.paymentProofUrl
  ).length;

  return (
    <PortalLayout>
      <div className="space-y-6 pb-10">
        <div className="pt-4">
          <h1 className="text-3xl font-heading font-black text-foreground tracking-tight">Opportunities Portal</h1>
          <p className="text-muted-foreground mt-2 text-sm">Manage your track, applications, and team collaborations.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1 border border-border/50">
            <TabsTrigger value="catalog" className="gap-2">
              <Briefcase className="w-4 h-4" />
              Available Tracks
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2 relative">
              <Target className="w-4 h-4" />
              My Opportunity
              {hasTeam && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-2 relative">
              <ClipboardList className="w-4 h-4" />
              Applications
              {/* Badge for pending payment action needed */}
              {pendingPaymentCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-accent text-accent-foreground text-[9px] font-black rounded-full">
                  {pendingPaymentCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog">
            <ProgramCatalog />
          </TabsContent>

          <TabsContent value="dashboard">
            <MyInternshipDashboard
              team={teamData?.myInternshipTeam}
              loading={loadingTeam}
              enrolledCount={enrolledCount}
              onBrowseClick={() => setActiveTab("catalog")}
            />
          </TabsContent>

          <TabsContent value="applications">
            <MyApplications onGoToDashboard={() => setActiveTab("dashboard")} />
          </TabsContent>
        </Tabs>
      </div>
    </PortalLayout>
  );
}
