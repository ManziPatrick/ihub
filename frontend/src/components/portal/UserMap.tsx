import { useEffect, useMemo, useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, AlertCircle, Clock, Phone, Maximize2, Minimize2 } from "lucide-react";
import { MapErrorBoundary } from "@/components/portal/MapErrorBoundary";
import { useQuery } from "@apollo/client/react";
import { GET_USERS_WITH_LOCATION } from "@/lib/graphql/queries";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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
}

/* ─── Component ─── */

export function UserMap({
  role,
  search,
  height = "600px",
  onSelectUser,
  selectedUserId,
}: UserMapProps) {
  const [maximized, setMaximized] = useState(false);
  const { data, loading, error } = useQuery(GET_USERS_WITH_LOCATION, {
    variables: role ? { role } : undefined,
  });

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
        className={`
          absolute top-3 right-3 z-[1001] p-2 rounded-lg
          bg-background/80 backdrop-blur-sm border border-border/40
          text-muted-foreground hover:text-foreground hover:bg-background
          transition-all duration-200 shadow-sm
          opacity-0 group-hover:opacity-100
        `}
        title={maximized ? "Minimize" : "Maximize"}
      >
        {maximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      {/* Map */}
      <div style={{ height: maximized ? "100%" : height, width: "100%", position: "relative" }}>
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
                    ? `No users matching "${search}" have shared their location.`
                    : "Users need to grant location permission for their pins to appear here."}
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
          style={{ height: "100%", width: "100%", zIndex: 1 }}
          zoomControl={true}
        >
          <FitBounds users={users} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {users.map((u) => (
            <Marker
              key={u.id}
              position={[u.latitude, u.longitude]}
              icon={getIconForRole(u.role, u.id)}
              eventHandlers={{
                click: () => onSelectUser?.(u),
              }}
            >
              <Popup
                minWidth={260}
                maxWidth={320}
                className="user-map-popup"
              >
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

                  {/* Role badge */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
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

                  {/* Details */}
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {u.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: getRoleColor(u.role) }} />
                        <span>{u.location}</span>
                      </div>
                    )}
                    {u.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
                        <span>{u.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
                      <span>Last updated: {formatDate(u.locationUpdatedAt)}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        </MapErrorBoundary>
      </div>
    </Card>
  );
}
