import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserMap, UserLocation } from "@/components/portal/UserMap";
import { useQuery } from "@apollo/client/react";
import { GET_USERS_WITH_LOCATION } from "@/lib/graphql/queries";
import {
  MapPin,
  RefreshCw,
  Search,
  X,
  UserCog,
  Globe,
  Clock,
  Mail,
  Phone,
  Map as MapIcon,
} from "lucide-react";

type RoleKey = "all" | "student" | "trainer" | "admin" | "super_admin";

const roleFilterChips: { key: RoleKey; label: string; color: string }[] = [
  { key: "all",         label: "All",          color: "bg-foreground" },
  { key: "student",     label: "Students",     color: "bg-blue-500" },
  { key: "trainer",     label: "Trainers",     color: "bg-purple-500" },
  { key: "admin",       label: "Admins",       color: "bg-amber-500" },
  { key: "super_admin", label: "Super Admins", color: "bg-red-500" },
];

/* ─── Format helpers ─── */
function timeAgo(dateStr?: string): string {
  if (!dateStr) return "—";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ─── Page ─── */
export default function SuperAdminMap() {
  const [activeRole, setActiveRole] = useState<RoleKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserLocation | null>(null);
  const [mapKey, setMapKey] = useState(0);

  const { data, loading } = useQuery(GET_USERS_WITH_LOCATION);

  const allUsers: UserLocation[] = useMemo(
    () => (data as any)?.usersWithLocation || [],
    [data]
  );

  /* Stats */
  const stats = useMemo(() => {
    const total = allUsers.length;
    const roles: Record<string, number> = {};
    for (const u of allUsers) {
      roles[u.role] = (roles[u.role] || 0) + 1;
    }
    const lastUpdated = allUsers.reduce<string | null>((latest, u) => {
      if (!u.locationUpdatedAt) return latest;
      return !latest || u.locationUpdatedAt > latest ? u.locationUpdatedAt : latest;
    }, null);
    return { total, roles, lastUpdated };
  }, [allUsers]);

  const roleValue = activeRole !== "all" ? activeRole : undefined;
  const refreshMap = () => {
    setMapKey((k) => k + 1);
    setSelectedUser(null);
  };

  /* ── Render ── */
  return (
    <PortalLayout>
      <div className="space-y-5">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-end gap-4"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">
                  User Location Map
                </h1>
                <p className="text-sm text-muted-foreground">
                  Real-time geographic presence of your platform users
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-border/50 h-10 gap-2"
              onClick={refreshMap}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </motion.div>

        {/* ── Stat cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          <Card className="border-border/50 bg-gradient-to-br from-accent/10 to-transparent">
            <CardContent className="p-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-accent shrink-0" />
              <div>
                <p className="text-xl font-black text-foreground">{stats.total}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  Pinned
                </p>
              </div>
            </CardContent>
          </Card>

          {(["student", "trainer", "admin", "super_admin"] as const).map((role) => (
            <Card key={role} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{
                  background: role === "student" ? "#3b82f620" :
                    role === "trainer" ? "#8b5cf620" :
                    role === "admin" ? "#f59e0b20" : "#ef444420",
                }}>
                  <div className="w-3 h-3 rounded-full" style={{
                    background: role === "student" ? "#3b82f6" :
                      role === "trainer" ? "#8b5cf6" :
                      role === "admin" ? "#f59e0b" : "#ef4444",
                  }} />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{stats.roles[role] || 0}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    {role === "super_admin" ? "S.Admin" : role}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  {stats.lastUpdated ? timeAgo(stats.lastUpdated) : "—"}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  Updated
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Search + Filter chips ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-10 bg-card border-border/50 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter chips */}
          <div className="flex gap-1.5 flex-wrap">
            {roleFilterChips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => {
                  setActiveRole(chip.key);
                  setSelectedUser(null);
                }}
                className={`
                  relative px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider
                  transition-all duration-200 border
                  ${activeRole === chip.key
                    ? "bg-accent text-accent-foreground border-accent shadow-lg shadow-accent/20 scale-105"
                    : "bg-card text-muted-foreground border-border/50 hover:border-accent/50 hover:text-foreground hover:bg-accent/5"
                  }
                `}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Map + User detail sidebar ── */}
        <div className="flex gap-4">
          {/* Map */}
          <motion.div
            key={mapKey}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`transition-all duration-300 ${selectedUser ? "lg:w-[calc(100%-340px)]" : "w-full"}`}
          >
            <UserMap
              key={`${mapKey}-${activeRole}-${searchQuery}`}
              role={roleValue}
              search={searchQuery}
              height="580px"
              onSelectUser={setSelectedUser}
              selectedUserId={selectedUser?.id || null}
            />
          </motion.div>

          {/* ── User detail sidebar ── */}
          <AnimatePresence>
            {selectedUser && (
              <motion.div
                key={selectedUser.id}
                initial={{ opacity: 0, width: 0, x: 20 }}
                animate={{ opacity: 1, width: 320, x: 0 }}
                exit={{ opacity: 0, width: 0, x: 20 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="hidden lg:block overflow-hidden"
              >
                <Card className="border-border/50 h-full">
                  <CardContent className="p-0">
                    <div className="p-5">
                      {/* Close */}
                      <div className="flex justify-end mb-2">
                        <button
                          onClick={() => setSelectedUser(null)}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Avatar */}
                      <div className="flex flex-col items-center text-center mb-5">
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3 shadow-lg"
                          style={{
                            background: selectedUser.role === "super_admin" ? "#ef4444" :
                              selectedUser.role === "admin" ? "#f59e0b" :
                              selectedUser.role === "trainer" ? "#8b5cf6" : "#3b82f6",
                          }}
                        >
                          {(selectedUser.fullName || selectedUser.username || "U").charAt(0).toUpperCase()}
                        </div>
                        <h3 className="font-bold text-lg text-foreground leading-tight">
                          {selectedUser.fullName || selectedUser.username}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{selectedUser.email}</p>

                        {/* Role badge */}
                        <Badge
                          className="mt-2 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5"
                          style={{
                            background: selectedUser.role === "super_admin" ? "#ef444420" :
                              selectedUser.role === "admin" ? "#f59e0b20" :
                              selectedUser.role === "trainer" ? "#8b5cf620" : "#3b82f620",
                            color: selectedUser.role === "super_admin" ? "#ef4444" :
                              selectedUser.role === "admin" ? "#f59e0b" :
                              selectedUser.role === "trainer" ? "#8b5cf6" : "#3b82f6",
                            border: `1px solid ${
                              selectedUser.role === "super_admin" ? "#ef444440" :
                              selectedUser.role === "admin" ? "#f59e0b40" :
                              selectedUser.role === "trainer" ? "#8b5cf640" : "#3b82f640"
                            }`,
                          }}
                        >
                          {selectedUser.role.replace("_", " ")}
                        </Badge>
                      </div>

                      <Separator className="mb-4" />

                      {/* Details */}
                      <div className="space-y-3 text-sm">
                        {selectedUser.title && (
                          <div className="flex items-start gap-3">
                            <UserCog className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Title</p>
                              <p className="text-foreground">{selectedUser.title}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Email</p>
                            <p className="text-foreground break-all">{selectedUser.email}</p>
                          </div>
                        </div>

                        {selectedUser.phone && (
                          <div className="flex items-start gap-3">
                            <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Phone</p>
                              <p className="text-foreground">{selectedUser.phone}</p>
                            </div>
                          </div>
                        )}

                        {selectedUser.location && (
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Location</p>
                              <p className="text-foreground">{selectedUser.location}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          <MapIcon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Coordinates</p>
                            <p className="text-foreground font-mono text-xs">
                              {selectedUser.latitude.toFixed(4)}, {selectedUser.longitude.toFixed(4)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Last Updated</p>
                            <p className="text-foreground">
                              {selectedUser.locationUpdatedAt
                                ? new Date(selectedUser.locationUpdatedAt).toLocaleString()
                                : "Unknown"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Legend footer ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50 bg-gradient-to-r from-accent/[0.03] via-transparent to-accent/[0.03]">
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 flex-wrap text-xs">
                <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Legend</span>
                {([
                  { label: "Super Admin", color: "bg-red-500" },
                  { label: "Admin", color: "bg-amber-500" },
                  { label: "Trainer", color: "bg-purple-500" },
                  { label: "Student", color: "bg-blue-500" },
                ] as const).map((item) => (
                  <span key={item.label} className="flex items-center gap-1.5 text-muted-foreground">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color} ring-2 ring-background`} />
                    {item.label}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground/60">
                Click any marker to view user details &middot; Color-coded by role
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PortalLayout>
  );
}
