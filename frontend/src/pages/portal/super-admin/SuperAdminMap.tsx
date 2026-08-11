import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserMap, UserLocation } from "@/components/portal/UserMap";
import { useQuery, useMutation } from "@apollo/client/react";
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
  Navigation,
  Loader2,
  AlertTriangle,
  Crosshair,
  Check,
  BookOpen,
  GraduationCap,
  Users,
} from "lucide-react";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { cn } from "@/lib/utils";
import { ADMIN_UPDATE_USER_LOCATION } from "@/lib/graphql/mutations";
import { toast } from "sonner";

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

/* ─── Reverse-Geocode Row Component ─── */
function ReverseGeocodeRow({ user }: { user: UserLocation }) {
  const { address, loading, error } = useReverseGeocode(user.latitude, user.longitude);

  const locationMismatch = user.location && address &&
    !address.toLowerCase().includes(user.location.toLowerCase().split(",")[0].trim()) &&
    !user.location.toLowerCase().includes(address.toLowerCase().split(",")[0].trim());

  return (
    <div className="space-y-1">
      <div className="flex items-start gap-3">
        <MapIcon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            Coordinates
          </p>
          <p className="text-foreground font-mono text-xs">
            {user.latitude.toFixed(4)}, {user.longitude.toFixed(4)}
          </p>

          {/* Reverse-geocoded address */}
          {loading && (
            <div className="flex items-center gap-1.5 mt-1">
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground italic">Looking up address...</span>
            </div>
          )}
          {!loading && address && (
            <div className="flex items-start gap-1.5 mt-1.5">
              <Navigation className="w-3 h-3 text-muted-foreground/60 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-muted-foreground italic block truncate" title={address}>
                  {address}
                </span>
              </div>
            </div>
          )}
          {!loading && error && (
            <p className="text-[10px] text-muted-foreground italic mt-1">
              Address lookup unavailable
            </p>
          )}
        </div>
      </div>

      {/* Mismatch warning */}
      {locationMismatch && (
        <div className="flex items-start gap-2 ml-7 pl-0.5">
          <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-relaxed">
            The stored location text "{user.location}" differs from the coordinates&apos; actual mapped address.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Reverse geocode helper ─── */
function useReverseGeocode(lat: number | null, lon: number | null) {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lat == null || lon == null) {
      setAddress(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=en`,
      { headers: { "User-Agent": "BootskillsApp/1.0" } }
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const addr = data?.address || {};
        const parts: string[] = [];
        if (addr.road) parts.push(addr.road);
        if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
        if (addr.state) parts.push(addr.state);
        if (addr.country) parts.push(addr.country);
        setAddress(parts.length > 0 ? parts.join(", ") : data?.display_name?.split(",")[0] || "Unknown location");
      })
      .catch((err) => {
        if (cancelled) return;
        setError("Failed to look up address");
        console.debug("Reverse geocode error:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [lat, lon]);

  return { address, loading, error };
}

/* ─── Page ─── */
export default function SuperAdminMap() {
  const { user } = useAuth();
  const [activeRole, setActiveRole] = useState<RoleKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserLocation | null>(null);
  const [mapKey, setMapKey] = useState(0);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<[number, number] | null>(null);
  const [pendingAddress, setPendingAddress] = useState<string | null>(null);
  const [savingLocation, setSavingLocation] = useState(false);

  // Users table state
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);
  const [activeTab, setActiveTab] = useState<"map" | "users">("map");

  const { data, loading, refetch } = useQuery(GET_USERS_WITH_LOCATION);
  const [adminUpdateLocation] = useMutation(ADMIN_UPDATE_USER_LOCATION);

  const allUsers: UserLocation[] = useMemo(
    () => (data as any)?.usersWithLocation || [],
    [data]
  );

  /* Users table — respects the same role filter + search as the map */
  const filteredUsers = useMemo(() => {
    let list = allUsers;
    if (activeRole !== "all") list = list.filter((u) => u.role === activeRole);
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (u) =>
          (u.fullName || "").toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.location || "").toLowerCase().includes(q) ||
          (u.enrolledCourses || []).some((c) => (c.title || "").toLowerCase().includes(q))
      );
    }
    return list;
  }, [allUsers, activeRole, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / tablePageSize));
  const safePage = Math.min(tablePage, totalPages);
  const pagedUsers = filteredUsers.slice((safePage - 1) * tablePageSize, safePage * tablePageSize);

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
    setEditMode(false);
    setPendingCoords(null);
    setPendingAddress(null);
  };

  /* ── Handle map click in edit mode ── */
  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    if (!editMode || !selectedUser) return;
    setPendingCoords([lat, lng]);
    setPendingAddress(null);

    // Reverse geocode the clicked location
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`,
        { headers: { "User-Agent": "BootskillsApp/1.0" } }
      );
      const data = await res.json();
      const addr = data?.address || {};
      const parts: string[] = [];
      if (addr.road) parts.push(addr.road);
      if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
      if (addr.state) parts.push(addr.state);
      if (addr.country) parts.push(addr.country);
      setPendingAddress(parts.length > 0 ? parts.join(", ") : data?.display_name?.split(",")[0] || "");
    } catch {
      setPendingAddress(null);
    }
  }, [editMode, selectedUser]);

  /* ── Save new location ── */
  const handleSaveLocation = async () => {
    if (!pendingCoords || !selectedUser) return;
    setSavingLocation(true);
    try {
      await adminUpdateLocation({
        variables: {
          userId: selectedUser.id,
          latitude: pendingCoords[0],
          longitude: pendingCoords[1],
        },
      });
      toast.success("Location updated successfully!");
      setEditMode(false);
      setPendingCoords(null);
      setPendingAddress(null);
      // Refresh the map
      refetch();
      // Update local state so sidebar reflects new coords immediately
      setSelectedUser((prev) =>
        prev ? { ...prev, latitude: pendingCoords[0], longitude: pendingCoords[1], locationUpdatedAt: new Date().toISOString(), locationShared: true } : null
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update location");
    } finally {
      setSavingLocation(false);
    }
  };

  /* ── Cancel edit mode ── */
  const handleCancelEdit = () => {
    setEditMode(false);
    setPendingCoords(null);
    setPendingAddress(null);
  };

  /* ── Enter edit mode ── */
  const handleStartFix = () => {
    setEditMode(true);
    setPendingCoords(null);
    setPendingAddress(null);
  };

  /* ── Select a user from the table → highlight + fly on the map ── */
  const handleSelectUser = (u: UserLocation) => {
    setSelectedUser(u);
    setEditMode(false);
    setPendingCoords(null);
    setPendingAddress(null);
    // Switch to the Map tab so the user flies into view
    setActiveTab("map");
    // FlyToUser (inside UserMap) flies the map to the selection automatically
  };

  /* Role colors used in the table */
  const roleColor = (role: string) =>
    role === "super_admin" ? "#ef4444" :
    role === "admin" ? "#f59e0b" :
    role === "trainer" ? "#8b5cf6" :
    "#3b82f6";

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
                  Real-time geographic presence of every platform user
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

        {/* ── Map / Users tabs ── */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "map" | "users")}>
          <TabsList className="h-10">
            <TabsTrigger value="map" className="gap-1.5">
              <MapIcon className="w-4 h-4" /> Map View
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="w-4 h-4" /> Users List
              <span className="text-[10px] font-bold bg-foreground/10 rounded-full px-1.5 py-0.5">
                {filteredUsers.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Map View */}
          <TabsContent value="map" className="mt-3">
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
              onSelectUser={editMode ? undefined : setSelectedUser}
              selectedUserId={selectedUser?.id || null}
              editMode={editMode}
              onMapClick={handleMapClick}
              pendingMarker={pendingCoords}
              focusUser={selectedUser}
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

                        <ReverseGeocodeRow user={selectedUser} />

                        {/* Fix Location button */}
                        <div className="pt-1">
                          {editMode ? (
                            <div className="space-y-2 bg-accent/5 border border-accent/20 rounded-lg p-3">
                              <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">
                                <Crosshair className="w-3 h-3 inline mr-1" />
                                Click on the map to set new location
                              </p>
                              {pendingCoords && (
                                <div className="space-y-1">
                                  <p className="text-[10px] text-muted-foreground font-mono">
                                    {pendingCoords[0].toFixed(4)}, {pendingCoords[1].toFixed(4)}
                                  </p>
                                  {pendingAddress && (
                                    <p className="text-[10px] text-muted-foreground italic truncate">
                                      {pendingAddress}
                                    </p>
                                  )}
                                </div>
                              )}
                              <div className="flex gap-2 pt-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 h-8 text-xs"
                                  onClick={handleCancelEdit}
                                  disabled={savingLocation}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="gold"
                                  size="sm"
                                  className="flex-1 h-8 text-xs gap-1"
                                  onClick={handleSaveLocation}
                                  disabled={!pendingCoords || savingLocation}
                                >
                                  {savingLocation ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={handleStartFix}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                                bg-accent/5 hover:bg-accent/10 border border-accent/20 hover:border-accent/40
                                text-accent hover:text-accent-foreground transition-all duration-200"
                            >
                              <Crosshair className="w-3.5 h-3.5" />
                              Fix Location
                            </button>
                          )}
                        </div>

                        <Separator className="my-3" />

                        <div className="flex items-start gap-3">
                          <div className="w-4 h-4 shrink-0 mt-0.5 flex items-center justify-center">
                            {selectedUser.locationShared ? (
                              <span
                                className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                                style={{ background: "#22c55e" }}
                              >
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                            ) : (
                              <span
                                className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                                style={{ background: "#f59e0b" }}
                              >
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="12" y1="8" x2="12" y2="12" />
                                  <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Location Source</p>
                            <p className="text-foreground" style={{
                              color: selectedUser.locationShared ? "#22c55e" : "#f59e0b",
                            }}>
                              {selectedUser.locationShared ? "Verified" : "Estimated"}
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
          </TabsContent>

          {/* Users List */}
          <TabsContent value="users" className="mt-3">
        {/* ── All Users Table — click a row to view on the map ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3 flex-wrap">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-accent" />
                    All Users
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} — click a row to locate them on the map
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground border-border/40">
                  {filteredUsers.filter((u) => u.latitude != null).length} with coordinates
                </Badge>
              </div>

              {loading ? (
                <div className="p-4"><ListSkeleton count={4} className="lg:grid-cols-1" /></div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <BookOpen className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-bold">No users match the current filters.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-y border-border/40 bg-muted/20 text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                          <th className="px-5 py-3">User</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Latest Location</th>
                          <th className="px-4 py-3">Course(s)</th>
                          <th className="px-4 py-3">Last Updated</th>
                          <th className="px-4 py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedUsers.map((u) => (
                          <tr
                            key={u.id}
                            onClick={() => handleSelectUser(u)}
                            className={cn(
                              "border-b border-border/20 last:border-0 cursor-pointer transition-colors",
                              selectedUser?.id === u.id ? "bg-accent/5" : "hover:bg-muted/10"
                            )}
                          >
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3 min-w-[200px]">
                                <div
                                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                                  style={{ background: roleColor(u.role) }}
                                >
                                  {(u.fullName || u.username || "U").charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-foreground text-xs truncate">
                                    {u.fullName || u.username}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5"
                                style={{
                                  background: `${roleColor(u.role)}20`,
                                  color: roleColor(u.role),
                                  border: `1px solid ${roleColor(u.role)}40`,
                                }}
                              >
                                {u.role.replace("_", " ")}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 max-w-[240px]">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: roleColor(u.role) }} />
                                <div className="min-w-0">
                                  <p className="text-xs text-foreground font-medium truncate">
                                    {u.location || "—"}
                                  </p>
                                  {u.latitude != null && (
                                    <p className="text-[9px] text-muted-foreground font-mono">
                                      {u.latitude.toFixed(4)}, {u.longitude?.toFixed(4)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 max-w-[200px]">
                              {(u.enrolledCourses || []).length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {(u.enrolledCourses || []).slice(0, 2).map((c) => (
                                    <span
                                      key={c.id || c.title}
                                      className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 truncate max-w-[160px]"
                                      title={c.title}
                                    >
                                      {c.title}
                                    </span>
                                  ))}
                                  {(u.enrolledCourses?.length || 0) > 2 && (
                                    <span className="text-[9px] text-muted-foreground">
                                      +{(u.enrolledCourses?.length || 0) - 2}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">No courses</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-xs text-muted-foreground">{timeAgo(u.locationUpdatedAt)}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {u.isOnline && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-green-500 uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Online
                                  </span>
                                )}
                                <Navigation className="w-3.5 h-3.5 text-accent" />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-4 pb-4">
                    <PaginationBar
                      currentPage={safePage}
                      totalPages={totalPages}
                      totalCount={filteredUsers.length}
                      onPageChange={setTablePage}
                      hasPreviousPage={safePage > 1}
                      hasNextPage={safePage < totalPages}
                      pageSize={tablePageSize}
                      onPageSizeChange={(n) => {
                        setTablePageSize(n);
                        setTablePage(1);
                      }}
                      pageSizeOptions={[10, 25, 50, 100]}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
          </TabsContent>
        </Tabs>

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
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                  Verified
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-background" />
                  Estimated
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground/60">
                Click any marker to view user details &middot; Color-coded by role &middot; Dots cluster by density
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PortalLayout>
  );
}
