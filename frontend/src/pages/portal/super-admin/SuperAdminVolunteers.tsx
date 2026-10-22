import { useState } from "react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Handshake } from "lucide-react";

const GET_VOLUNTEERS = gql`
  query VolunteerApplications($status: String, $page: Int, $limit: Int) {
    volunteerApplications(status: $status, page: $page, limit: $limit) {
      items {
        id
        name
        email
        phone
        city
        wantedRole
        skills
        about
        linkedin
        status
        isProfilePublic
        assignedRole
        reviewNote
        createdAt
      }
      pagination { totalCount currentPage totalPages }
    }
  }
`;

const REVIEW_VOLUNTEER = gql`
  mutation ReviewVolunteerApplication($id: ID!, $approved: Boolean!, $assignedRole: String, $isProfilePublic: Boolean, $reviewNote: String) {
    reviewVolunteerApplication(id: $id, approved: $approved, assignedRole: $assignedRole, isProfilePublic: $isProfilePublic, reviewNote: $reviewNote) {
      loginEmail
      temporaryPassword
      application { id status assignedRole isProfilePublic }
    }
  }
`;

export default function SuperAdminVolunteers() {
  const [status, setStatus] = useState("pending");
  const [note, setNote] = useState("");
  const [role, setRole] = useState("trainer");
  const [pub, setPub] = useState(false);
  const { data, loading, refetch } = useQuery(GET_VOLUNTEERS, {
    variables: { status, page: 1, limit: 40 },
    fetchPolicy: "network-only",
  });
  const [review, { loading: saving }] = useMutation(REVIEW_VOLUNTEER);

  const items = (data as any)?.volunteerApplications?.items || [];

  const act = async (id: string, approved: boolean) => {
    try {
      const res: any = await review({
        variables: { id, approved, assignedRole: role, isProfilePublic: pub, reviewNote: note },
      });
      if (approved) {
        const r = res.data?.reviewVolunteerApplication;
        toast.success(`Approved. Login ${r?.loginEmail}. Password emailed (also shown once): ${r?.temporaryPassword}`);
      } else {
        toast.success("Rejected.");
      }
      setNote("");
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Could not review.");
    }
  };

  return (
    <PortalLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Handshake className="h-5 w-5 text-accent" />
          <h1 className="text-2xl font-heading font-semibold">Volunteer applications</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Approve to create a trainer or admin login. Public puts them on /team. Private keeps the account off the public site.
        </p>
        <div className="flex flex-wrap gap-2">
          {["pending", "approved", "rejected", "all"].map((s) => (
            <Button key={s} size="sm" variant={status === s ? "gold" : "outline"} onClick={() => setStatus(s)}>
              {s}
            </Button>
          ))}
        </div>
        <div className="grid sm:grid-cols-3 gap-3 bg-card border rounded-xl p-4">
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="trainer">Approve as trainer</option>
            <option value="admin">Approve as admin</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={pub} onChange={(e) => setPub(e.target.checked)} />
            Show on public team
          </label>
          <Input placeholder="Review note" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground">No applications in this list.</p>
        ) : (
          <div className="space-y-3">
            {items.map((a: any) => (
              <div key={a.id} className="border rounded-xl p-4 bg-card space-y-2">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-medium">{a.name} · {a.email}</p>
                    <p className="text-xs text-muted-foreground">{a.city} {a.phone} · asked {a.wantedRole}</p>
                  </div>
                  <Badge variant="outline">{a.status}</Badge>
                </div>
                <p className="text-sm">{a.about}</p>
                {a.skills && <p className="text-xs text-muted-foreground">Skills: {a.skills}</p>}
                {a.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="gold" disabled={saving} onClick={() => act(a.id, true)}>Approve</Button>
                    <Button size="sm" variant="outline" disabled={saving} onClick={() => act(a.id, false)}>Reject</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
