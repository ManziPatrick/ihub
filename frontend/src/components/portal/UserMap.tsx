import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, AlertCircle, Clock, Phone, Maximize2, Minimize2, RefreshCw, ShieldCheck, ShieldX, Eye, EyeOff, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { MapErrorBoundary } from "@/components/portal/MapErrorBoundary";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_USERS_WITH_LOCATION } from "@/lib/graphql/queries";
import { SET_USER_LOCATION_DENIED, SET_USER_LOCATION_FORCE_ALLOWED, BATCH_FORCE_ALLOW_LOCATIONS } from "@/lib/graphql/mutations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";

/* ─── Custom animated DivIcons per role ─── */

const createRoleIcon = (color: string, size: number, isPulsing = false): L.DivIcon =>
  L.divIcon({
    className: "",
    html: `
      <div style="
        position: relative;
        width: ${size}px; height: ${size}px;
        display: flex; align-items: center; justify-content: center;
      ">
        <div style="
          width: ${size - 4}px; height: ${size - 4}px;
          background: ${color};
          border: 3px solid #fff;
          border-radius: 50%;
          box-shadow: 0 2px 12px ${color}60, 0 4px 12px rgba(0,0,0,0.25);
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.2s ease;
          ${isPulsing ? "animation: markerPulse 2s ease-in-out infinite;" : ""}
        ">
          <svg width="${Math.round(size * 0.4)}" height="${Math.round(size * 0.4)}" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });

const roleIcons: Record<string, L.DivIcon> = {
  super_admin: createRoleIcon("#ef4444", 34, true),
  admin:       createRoleIcon("#f59e0b", 30),
  trainer:     createRoleIcon("#8b5cf6", 28),
  student:     createRoleIcon("#3b82f6", 26),
};

const defaultRoleIcon = createRoleIcon("#6b7280", 26);

const ROLE_COLORS: Record<string, string> = {
  super_admin: "#ef4444",
  admin:       "#f59e0b",
  trainer:     "#8b5cf6",
  student:     "#3b82f6",
};

const DEFAULT_CENTER: [number, number] = [-1.9403, 29.8739]; // Rwanda
const DEFAULT_ZOOM = 8;

/* ─── Auto-fit bounds component ─── */

function FitBounds({ users }: { users: Array<{ latitude: number; longitude: number }> }) {
  const map = useMap();
  useEffect(() => {
    if (users.length === 0) return;
    const bounds = L.latLngBounds(users.map((u) => [u.latitude, u.longitude] as [number, number]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
    }
  }, [map, users]);
  return null;
}

/* ─── Types ─── */

export interface UserLocation {
  id: string;
  username: string;
  email: string;
  role: string;
  fullName?: string;
  avatar?: string;
  phone?: string;
  location?: string;
  latitude: number;
  longitude: number;
  locationUpdatedAt?: string;
  locationShared: boolean;
  locationDenied?: boolean;
  title?: string;
}

interface UserMapProps {
  /** Optional role filter */
  role?: string;
  /** Optional search query */
  search?: string;
  /** Custom height */
  height?: string;
  /** Called when a user is selected from the map */
  onSelectUser?: (user: UserLocation | null) => void;
  /** Currently selected user id */
  selectedUserId?: string | null;
  /** When true, clicking the map fires onMapClick instead of selecting users */
  editMode?: boolean;
  /** Called when the map is clicked in edit mode */
  onMapClick?: (lat: number, lng: number) => void;
  /** If set, renders a temporary marker at this position (for fix-location preview) */
  pendingMarker?: [number, number] | null;
}

/* ─── Component ─── */

/* ─── Map click handler (for edit mode) ─── */
function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

const pendingIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center">
      <div style="position:absolute;inset:0;border-radius:50%;background:#22c55e40;animation: rippleRing 1.5s ease-out infinite;"></div>
      <div style="width:36px;height:36px;background:#22c55e;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 16px #22c55e80,0 4px 20px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22],
});

export function UserMap({
  role,
  search,
  height = "600px",
  onSelectUser,
  selectedUserId,
  editMode = false,
  onMapClick,
  pendingMarker,
}: UserMapProps) {
  const { toast } = useToast();
  const [maximized, setMaximized] = useState(false);
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);
  const { data, loading, error, refetch } = useQuery(GET_USERS_WITH_LOCATION, {
    variables: role ? { role } : undefined,
  });

  const [setLocationDenied] = useMutation(SET_USER_LOCATION_DENIED, {
    onCompleted: () => {
      toast({ title: "Location updated", description: "User location status has been updated." });
      refetch();
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const [setLocationForceAllowed] = useMutation(SET_USER_LOCATION_FORCE_ALLOWED, {
    onCompleted: () => {
      toast({ title: "Location overridden", description: "User location is now force-allowed." });
      refetch();
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const [batchForceAllow, { loading: batchLoading }] = useMutation(BATCH_FORCE_ALLOW_LOCATIONS, {
    onCompleted: (data: any) => {
      const count = data?.batchForceAllowLocations ?? 0;
      toast({
        title: "Batch location override complete",
        description: `${count} user${count !== 1 ? 's' : ''} had their location force-allowed.`,
      });
      refetch();
      setBatchConfirmOpen(false);
    },
    onError: (err) => {
      toast({ title: "Batch operation failed", description: err.message, variant: "destructive" });
      setBatchConfirmOpen(false);
    },
  });

  // Refetch immediately on mount so newly-saved locations appear without delay
  const initialRefetchDone = useRef(false);
  useEffect(() => {
    if (!initialRefetchDone.current) {
      initialRefetchDone.current = true;
      refetch();
    }
  }, [refetch]);

  const allUsers: UserLocation[] = useMemo(
    () => (data as any)?.usersWithLocation || [],
    [data]
  );

  /* Filter by search query */
  const users = useMemo(() => {
    if (!search || search.trim() === "") return allUsers;
    const q = search.toLowerCase();
    return allUsers.filter(
      (u) =>
        (u.fullName || "").toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.location || "").toLowerCase().includes(q)
    );
  }, [allUsers, search]);

  /* Separate users with and without valid coordinates */
  const usersWithLocation = useMemo(
    () => users.filter(u => u.latitude != null && u.longitude != null),
    [users]
  );
  const usersWithoutLocation = users.length - usersWithLocation.length;

  const getIconForRole = useCallback(
    (userRole: string, userId: string) => {
      const icon = roleIcons[userRole] || defaultRoleIcon;
      // If selected, return a larger highlighted version
      if (userId === selectedUserId) {
        const color = ROLE_COLORS[userRole] || "#6b7280";
        return L.divIcon({
          className: "",
          html: `
            <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center">
              <div style="
                position:absolute;inset:0;border-radius:50%;
                background:${color}40;
                animation: rippleRing 1.5s ease-out infinite;
              "/>
              <div style="
                width:36px;height:36px;
                background:${color};
                border:3px solid #fff;
                border-radius:50%;
                box-shadow:0 2px 16px ${color}80,0 4px 20px rgba(0,0,0,0.3);
                display:flex;align-items:center;justify-content:center;
              ">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -22],
        });
      }
      return icon;
    },
    [selectedUserId]
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Unknown";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Unknown";
    }
  };

  const getRoleColor = (r: string) => ROLE_COLORS[r] || "#6b7280";

  /* ── Loading ── */
  if (loading) {
    return (
      <Card className="border-border/50 overflow-hidden">
        <div className="h-[600px] flex items-center justify-center bg-gradient-to-br from-accent/5 via-transparent to-background">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Loader2 className="w-10 h-10 animate-spin text-accent" />
              <div className="absolute inset-0 w-10 h-10 rounded-full bg-accent/10 animate-ping" />
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">Loading users on map...</p>
          </div>
        </div>
      </Card>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <Card className="border-border/50 overflow-hidden">
        <div className="h-[600px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-base font-semibold text-destructive">Failed to load locations</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`border-border/50 overflow-hidden relative group ${maximized ? "fixed inset-4 z-[9999] shadow-2xl" : ""}`}>
      {/* Maximize toggle */}
      <button
        onClick={() => setMaximized(!maximized)}
        className={
          `
          absolute top-3 right-3 z-[1001] p-2 rounded-lg
          bg-background/80 backdrop-blur-sm border border-border/40
          text-muted-foreground hover:text-foreground hover:bg-background
          transition-all duration-200 shadow-sm
          opacity-0 group-hover:opacity-100
        `
        }
        title={maximized ? "Minimize" : "Maximize"}
      >
        {maximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      {/* Refresh */}
      <button
        onClick={() => refetch()}
        disabled={loading}
        className={
          `
          absolute top-3 left-5 z-[1001] p-2 rounded-lg
          bg-background/80 backdrop-blur-sm border border-border/40
          text-muted-foreground hover:text-foreground hover:bg-background
          transition-all duration-200 shadow-sm
          opacity-0 group-hover:opacity-100
          disabled:opacity-50 disabled:cursor-not-allowed
        `
        }
        title="Refresh locations"
      >
        <RefreshCw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
      </button>

      {/* Force Allow All (batch) */}
      <button
        onClick={() => setBatchConfirmOpen(true)}
        className={
          `
          absolute top-3 left-[4.5rem] z-[1001] px-2.5 py-1.5 rounded-lg
          bg-green-500/15 backdrop-blur-sm border border-green-500/30
          text-green-400 hover:text-green-300 hover:bg-green-500/25
          transition-all duration-200 shadow-sm
          opacity-0 group-hover:opacity-100
          inline-flex items-center gap-1.5 text-xs font-semibold
        `
        }
        title="Force allow location for all users on the map"
      >
        <Users className="w-3.5 h-3.5" />
        Force Allow All
      </button>

      {/* Map */}
      <div style={{ height: maximized ? "100%" : height, width: "100%", position: "relative" }}>
        {/* Users without location overlay */}
        {users.length > 0 && usersWithoutLocation > 0 && (
          <div className="absolute top-14 left-3 z-[1000] flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border/40 shadow-sm text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span><strong className="text-foreground">{usersWithoutLocation}</strong> user{usersWithoutLocation !== 1 ? 's' : ''} without location data</span>
          </div>
        )}

        {/* Empty state overlay */}
        {users.length === 0 && !loading && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 text-center px-6">
              <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
                <MapPin className="w-10 h-10 text-accent/40" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">No users found on the map</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  {search
                    ? `No users matching "${search}" found.`
                    : "No users are registered in the system yet."}
                </p>
              </div>
              {!search && role && (
                <Badge variant="outline" className="text-xs">
                  Filtered by: {role.replace("_", " ")}
                </Badge>
              )}
            </div>
          </div>
        )}

        <MapErrorBoundary>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: "100%", width: "100%", zIndex: 1, background: "#b5d0d9", cursor: editMode ? "crosshair" : undefined }}
          zoomControl={true}
          worldCopyJump={true}
        >
          <FitBounds users={usersWithLocation} />
          {editMode && <MapClickHandler onMapClick={onMapClick} />}

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* MarkerClusterGroup handles clustering for dense areas */}
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={60}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            disableClusteringAtZoom={12}
          >
            {usersWithLocation.map((u) => (
              <Marker
                key={u.id}
                position={[u.latitude!, u.longitude!]}
                icon={getIconForRole(u.role, u.id)}
                eventHandlers={{
                  click: () => { if (!editMode) onSelectUser?.(u); },
                }}
              >
                {!editMode && (
                <Popup minWidth={260} maxWidth={320} className="user-map-popup">
                  <div className="px-0.5 py-1">
                    {/* Header with avatar */}
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ background: getRoleColor(u.role) }}
                      >
                        {(u.fullName || u.username || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm leading-tight text-foreground truncate">
                          {u.fullName || u.username}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>

                    {/* Role badge + place name */}
                    <div className="flex flex-col gap-2 mb-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge
                          className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5"
                          style={{
                            background: `${getRoleColor(u.role)}20`,
                            color: getRoleColor(u.role),
                            border: `1px solid ${getRoleColor(u.role)}40`,
                          }}
                        >
                          {u.role.replace("_", " ")}
                        </Badge>
                        {u.title && (
                          <span className="text-[10px] text-muted-foreground self-center">
                            {u.title}
                          </span>
                        )}
                      </div>
                      {u.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: getRoleColor(u.role) }} />
                          <span className="text-xs text-foreground font-medium truncate">{u.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Location source badge */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      {u.locationDenied ? (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            background: "#ef444420",
                            color: "#ef4444",
                            border: "1px solid #ef444440",
                          }}
                        >
                          <ShieldX className="w-3 h-3" />
                          Denied
                        </span>
                      ) : u.locationShared ? (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            background: "#22c55e20",
                            color: "#22c55e",
                            border: "1px solid #22c55e40",
                          }}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          Shared
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            background: "#f59e0b20",
                            color: "#f59e0b",
                            border: "1px solid #f59e0b40",
                          }}
                        >
                          <MapPin className="w-3 h-3" />
                          Estimated
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {u.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
                        <span>
                          Last updated: {formatDate(u.locationUpdatedAt)}
                        </span>
                      </div>

                      {/* Admin controls for location override */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-border/20 mt-1.5">
                        {u.locationDenied ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocationForceAllowed({ variables: { userId: u.id, forceAllowed: true } });
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30 transition-colors"
                            title="Force allow location"
                          >
                            <Eye className="w-3 h-3" />
                            Force Allow
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocationDenied({ variables: { userId: u.id, denied: true } });
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 transition-colors"
                            title="Mark as location denied"
                          >
                            <EyeOff className="w-3 h-3" />
                            Mark Denied
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Popup>
                )}
              </Marker>
            ))}
          </MarkerClusterGroup>

          {/* Pending marker for edit mode */}
          {pendingMarker && (
            <Marker position={pendingMarker} icon={pendingIcon}>
              <Popup>
                <div className="text-sm font-medium px-1">New location</div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
        </MapErrorBoundary>
      </div>
      {/* Batch Force Allow Confirmation Dialog */}
      <AlertDialog open={batchConfirmOpen} onOpenChange={setBatchConfirmOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              Force Allow All Locations?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground space-y-2">
              <p>
                This will override location preferences for <strong>all {usersWithLocation.length} user{usersWithLocation.length !== 1 ? 's' : ''}</strong> currently shown on the map.
              </p>
              <p>
                <strong className="text-foreground">What this does:</strong> Sets <code className="text-xs bg-accent/20 px-1 py-0.5 rounded">locationShared = true</code> and clears any <code className="text-xs bg-accent/20 px-1 py-0.5 rounded">locationDenied</code> flags. All users' locations will appear on the map regardless of their individual preference.
              </p>
              <p className="text-amber-500 font-medium text-xs flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                This action cannot be undone per-user. Users who force-share can still update their own location later.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={batchLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={batchLoading}
              onClick={(e) => {
                e.preventDefault();
                const userIds = usersWithLocation.map(u => u.id);
                if (userIds.length === 0) {
                  toast({ title: "No users", description: "No users found on the map to update.", variant: "destructive" });
                  setBatchConfirmOpen(false);
                  return;
                }
                batchForceAllow({ variables: { userIds } });
              }}
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              {batchLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                <><Eye className="w-4 h-4" /> Force Allow All ({usersWithLocation.length})</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
