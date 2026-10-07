import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Phone, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { GET_ME } from "@/lib/graphql/queries";
import { UPDATE_MY_PHONE } from "@/lib/graphql/mutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const COMMISSION_ROLES = new Set(["trainer", "admin", "super_admin"]);

function hasPhone(phone?: string | null) {
  return !!(phone && String(phone).replace(/\D/g, "").length >= 9);
}

export function needsPhoneHold(role?: string, phone?: string | null) {
  return !!role && COMMISSION_ROLES.has(role) && !hasPhone(phone);
}

/**
 * Blocks commission-eligible staff until a phone number is stored on the user
 * record. The number is saved on the logged-in account in the database so the
 * hold does not return on the next login.
 */
export function PhoneHoldGate() {
  const { user, updateUser, logout } = useAuth();
  const isCommissionRole = !!user?.role && COMMISSION_ROLES.has(user.role);
  const { data, loading: meLoading, error: meError } = useQuery(GET_ME, {
    skip: !isCommissionRole,
    fetchPolicy: "network-only",
  });
  const dbPhone = (data as any)?.me?.phone as string | undefined;
  const resolvedPhone = meError ? user?.phone : (dbPhone ?? user?.phone);
  const [phone, setPhone] = useState("");
  const [updateMyPhone, { loading }] = useMutation(UPDATE_MY_PHONE, {
    refetchQueries: [{ query: GET_ME }],
    awaitRefetchQueries: true,
  });

  useEffect(() => {
    if (hasPhone(dbPhone) && dbPhone !== user?.phone) {
      updateUser({ phone: dbPhone });
    }
  }, [dbPhone]);

  useEffect(() => {
    if (resolvedPhone) setPhone(resolvedPhone);
  }, [resolvedPhone]);

  if (!isCommissionRole) return null;
  if (meLoading) return null;
  if (!needsPhoneHold(user?.role, resolvedPhone)) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!hasPhone(trimmed)) {
      toast.error("Enter a valid phone number so commission payouts can be sent.");
      return;
    }
    try {
      const result = await updateMyPhone({ variables: { phone: trimmed } });
      const saved = (result.data as any)?.updateMyPhone?.phone;
      if (!hasPhone(saved)) {
        throw new Error("Phone number was not saved. Try again.");
      }
      updateUser({ phone: saved });
      toast.success("Phone saved. You can continue.");
    } catch (err: any) {
      toast.error(err?.graphQLErrors?.[0]?.message || err?.message || "Could not save phone number");
    }
  };

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-background/95 backdrop-blur-md p-4 print:hidden">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
            <Phone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Account on hold</h2>
            <p className="text-xs text-muted-foreground">Add a phone number to continue</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your account is on hold for commission payouts until you add a phone number.
          Courses can stay live; we cannot send commissions without a number.
        </p>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="hold-phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Phone number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="hold-phone"
                type="tel"
                autoFocus
                placeholder="+250 7XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11 pl-9"
              />
            </div>
          </div>
          <Button type="submit" variant="gold" className="w-full h-11 font-bold" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save number and continue"}
          </Button>
        </form>
        <Button type="button" variant="ghost" className="w-full gap-2 text-muted-foreground" onClick={logout}>
          <LogOut className="h-4 w-4" /> Log out
        </Button>
      </div>
    </div>
  );
}
