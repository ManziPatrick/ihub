import { PortalLayout } from "@/components/portal/PortalLayout";
import ApplicantManager from "@/components/portal/admin/applicants/ApplicantManager";

export default function AdminApplicantHub() {
  return (
    <PortalLayout>
      <div className="space-y-6">
        <ApplicantManager />
      </div>
    </PortalLayout>
  );
}
