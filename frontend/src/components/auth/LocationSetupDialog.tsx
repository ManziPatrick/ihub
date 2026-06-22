import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useMutation, useLazyQuery } from "@apollo/client/react";
import { UPDATE_USER, UPDATE_USER_LOCATION } from "@/lib/graphql/mutations";
import { GET_MY_IP_GEOLOCATION } from "@/lib/graphql/queries";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, Loader2, LocateFixed, AlertCircle, RefreshCw } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMap, Popup, Circle } from "react-leaflet";
import L from "leaflet";

const DEFAULT_ZOOM = 14;

// Custom pulsing marker icon for detected location
const detectionIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center">
      <div style="position:absolute;inset:0;border-radius:50%;background:#3b82f640;animation: markerPulse 1.5s ease-out infinite;"></div>
      <div style="width:32px;height:32px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 12px #3b82f680,0 4px 12px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// Confirmed location icon
const confirmedIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center">
      <div style="width:28px;height:28px;background:#22c55e;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 12px #22c55e80,0 4px 12px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

// Fly-to animation component
function FlyTo({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [map, center, zoom]);
  return null;
}

interface LocationSetupDialogProps {
  onComplete: () => void;
}

type DetectionState = "detecting" | "found" | "denied" | "error" | "manual";

export function LocationSetupDialog({ onComplete }: LocationSetupDialogProps) {
  const { user, updateUser } = useAuth();
  const [updateUserMutation] = useMutation(UPDATE_USER);
  const [updateUserLocationMutation] = useMutation(UPDATE_USER_LOCATION);

  // Detection state
  const [detectionState, setDetectionState] = useState<DetectionState>("detecting");
  const [detectedCoords, setDetectedCoords] = useState<[number, number] | null>(null);
  const [detectedCity, setDetectedCity] = useState("");
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const [saving, setSaving] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const detectionAttempted = useRef(false);

  const [fetchIpGeo] = useLazyQuery(GET_MY_IP_GEOLOCATION);

  // Manual city input state (fallback)
  const [isCustom, setIsCustom] = useState(false);
  const [customCity, setCustomCity] = useState("");

  // Attempt geolocation on mount
  const detectLocation = useCallback(async () => {
    if (detectionAttempted.current) return;
    detectionAttempted.current = true;

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setDetectionState("denied");
      return;
    }

    setDetectionState("detecting");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setDetectedCoords(coords);

        // Reverse geocode to get city name
        setIsReverseGeocoding(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}&addressdetails=1&accept-language=en`,
            { headers: { "User-Agent": "BootskillsApp/1.0" } }
          );
          const data = await response.json();
          const addr = data?.address || {};
          const city = addr.city || addr.town || addr.village || addr.county || addr.state || "";
          const country = addr.country || "";
          const displayName = city ? `${city}${country ? `, ${country}` : ""}` : data?.display_name?.split(",")[0] || "Unknown location";
          setDetectedCity(displayName);
        } catch {
          setDetectedCity(`${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`);
        }
        setIsReverseGeocoding(false);
        setDetectionState("found");
      },
      async (err) => {
        console.debug("Geolocation error:", err.code, err.message, "— trying IP geolocation fallback");

        // Try IP geolocation fallback
          try {
            const result = await fetchIpGeo() as any;
            const data: any = result?.data;
            const ip = data?.getMyIpGeolocation;
            if (ip?.latitude && ip?.longitude) {
              const { latitude, longitude, city, country } = ip;
              const coords: [number, number] = [latitude, longitude];
              setDetectedCoords(coords);
              const displayName = [city, country].filter(Boolean).join(", ") || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
              setDetectedCity(displayName);
              setDetectionState("found");
              return;
            }
          } catch (ipErr) {
            console.debug("IP geolocation fallback failed:", ipErr);
          }

        // No fallback available — show manual input
        if (err.code === err.PERMISSION_DENIED) {
          setDetectionState("denied");
        } else {
          setDetectionState("error");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  }, [fetchIpGeo]);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  // Save location (coordinates + city name)
  const handleSaveDetected = async () => {
    if (!detectedCoords) return;

    setSaving(true);
    try {
      // Save coordinates
      await updateUserLocationMutation({
        variables: {
          latitude: detectedCoords[0],
          longitude: detectedCoords[1],
        },
      });

      // Save city/location name
      await updateUserMutation({
        variables: {
          id: user?.id,
          location: detectedCity || `${detectedCoords[0].toFixed(4)}, ${detectedCoords[1].toFixed(4)}`,
        },
      });

      updateUser({
        location: detectedCity || `${detectedCoords[0].toFixed(4)}, ${detectedCoords[1].toFixed(4)}`,
      });

      toast.success("Location detected and saved!");
      onComplete();
    } catch (error: any) {
      toast.error(error.message || "Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  // Manual city save (fallback)
  const handleSaveManual = async () => {
    const finalLocation = customCity?.trim();
    if (!finalLocation) {
      toast.error("Please enter your city");
      return;
    }

    setSaving(true);
    try {
      await updateUserMutation({
        variables: {
          id: user?.id,
          location: finalLocation,
        },
      });
      updateUser({ location: finalLocation });
      toast.success("Location saved!");
      onComplete();
    } catch (error: any) {
      toast.error(error.message || "Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  // ——— Render ———
  return (
    <div className="fixed inset-0 z-[999] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--accent-glow),transparent_50%)] opacity-20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg bg-card border border-border/50 shadow-2xl rounded-2xl p-6 sm:p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-10 -mt-10" />

        <div className="relative space-y-6">
          {/* ── Header ── */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto">
              <MapPin className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Set Your Location</h2>
            <p className="text-sm text-muted-foreground">
              {detectionState === "detecting"
                ? "Detecting your location..."
                : detectionState === "found"
                ? "We found your location! Confirm below to continue."
                : "Tell us where you're based so we can connect you with local opportunities."}
            </p>
          </div>

          {/* ── Detecting State ── */}
          {detectionState === "detecting" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-accent" />
                <div className="absolute inset-0 w-12 h-12 rounded-full bg-accent/10 animate-ping" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm font-medium text-foreground">Detecting your location...</p>
                <p className="text-xs text-muted-foreground">Please allow location access when prompted</p>
              </div>
            </div>
          )}

          {/* ── Location Found — Show Map ── */}
          {detectionState === "found" && detectedCoords && !showFallback && (
            <div className="space-y-4">
              {/* Mini Map */}
              <div className="rounded-xl overflow-hidden border border-border/50 h-[240px] relative">
                <MapContainer
                  center={detectedCoords}
                  zoom={DEFAULT_ZOOM}
                  style={{ height: "100%", width: "100%", zIndex: 1 }}
                  zoomControl={false}
                  dragging={true}
                  scrollWheelZoom={true}
                >
                  <FlyTo center={detectedCoords} zoom={14} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={detectedCoords} icon={confirmedIcon}>
                    <Popup>
                      <div className="text-sm font-medium px-1">
                        {isReverseGeocoding ? "Looking up address..." : detectedCity || "Your location"}
                      </div>
                    </Popup>
                  </Marker>
                  <Circle
                    center={detectedCoords}
                    radius={200}
                    pathOptions={{
                      color: "#3b82f6",
                      fillColor: "#3b82f6",
                      fillOpacity: 0.08,
                      weight: 1,
                      dashArray: "4 4",
                    }}
                  />
                </MapContainer>
              </div>

              {/* Detected Address */}
              <div className="bg-accent/5 border border-accent/10 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <LocateFixed className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Detected Location</p>
                    <p className="text-sm font-medium text-foreground">
                      {isReverseGeocoding ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Looking up address...
                        </span>
                      ) : (
                        detectedCity || `${detectedCoords[0].toFixed(4)}, ${detectedCoords[1].toFixed(4)}`
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {detectedCoords[0].toFixed(4)}°N, {detectedCoords[1].toFixed(4)}°E
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl"
                  onClick={() => setShowFallback(true)}
                  disabled={saving}
                >
                  Choose Manually
                </Button>
                <Button
                  variant="gold"
                  className="flex-[2] h-11 rounded-xl font-bold"
                  onClick={handleSaveDetected}
                  disabled={saving || isReverseGeocoding}
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Confirm Location"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ── Geolocation Denied / Error — Fallback to city picker ── */}
          {(detectionState === "denied" || detectionState === "error" || showFallback) && (
            <div className="space-y-4">
              {/* Info banner */}
              {(detectionState === "denied" || detectionState === "error") && !showFallback && (
                <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {detectionState === "denied" ? "Location Access Denied" : "Could Not Detect Location"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {detectionState === "denied"
                        ? "You denied location access. You can select your city manually below."
                        : "We couldn't detect your location. Please select your city below."}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      detectionAttempted.current = false;
                      setDetectionState("detecting");
                      detectLocation();
                    }}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {detectionState === "detecting" ? (
                <div className="flex flex-col items-center gap-4 py-10">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 animate-spin text-accent" />
                    <div className="absolute inset-0 w-12 h-12 rounded-full bg-accent/10 animate-ping" />
                  </div>
                  <p className="text-sm text-muted-foreground">Detecting your location...</p>
                </div>
              ) : (
                <>
                      {/* Free-text city input — works for any city in Africa & worldwide */}
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      Your City / Location
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g. Nairobi, Kenya | Lagos, Nigeria | Accra, Ghana"
                        value={isCustom ? customCity : ""}
                        onChange={(e) => {
                          setIsCustom(true);
                          setCustomCity(e.target.value);
                        }}
                        onFocus={() => setIsCustom(true)}
                        className="h-11 pl-10 bg-background/50 border-accent/10 rounded-xl"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed px-1">
                      Type your city and country so we can connect you with local opportunities across Africa.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-11 rounded-xl border-accent/20"
                      onClick={onComplete}
                      disabled={saving}
                    >
                      Skip
                    </Button>
                    <Button
                      variant="gold"
                      className="flex-[2] h-11 rounded-xl font-bold"
                      onClick={handleSaveManual}
                      disabled={saving || !customCity?.trim()}
                    >
                      {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Save Location"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Skip link (for found state) ── */}
          {detectionState === "found" && !showFallback && (
            <div className="text-center">
              <button
                type="button"
                onClick={onComplete}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
