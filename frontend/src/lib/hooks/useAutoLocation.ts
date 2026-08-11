import { useEffect, useRef } from "react";
import { useMutation } from "@apollo/client/react";
import { UPDATE_USER_LOCATION } from "@/lib/graphql/mutations";
import { useAuth } from "@/contexts/AuthContext";

const REFRESH_MS = 10 * 60 * 1000; // re-acquire GPS every 10 minutes
const MOVE_THRESHOLD_M = 200; // only save when the user moved > 200 m since last save

function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * Silently auto-tracks the signed-in user's real GPS position and pushes it to
 * the backend (`updateUserLocation`), which stamps `locationShared: true` and
 * `locationUpdatedAt`. Runs on mount and re-acquires every 10 minutes so the
 * "latest location" stays fresh for admins on the User Location Map.
 *
 * - Requires a secure context (HTTPS / localhost). If unavailable or denied,
 *   it stays silent — the login-time IP geolocation already provides a fallback.
 * - Only writes to the DB when the user moved > 200 m, to avoid pointless writes.
 */
export function useAutoLocation() {
  const { user } = useAuth();
  const [updateLoc] = useMutation(UPDATE_USER_LOCATION);
  const lastSent = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (!user) return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;

    let cancelled = false;
    const save = (lat: number, lng: number) => {
      if (cancelled) return;
      const last = lastSent.current;
      if (last && haversineMeters(last, [lat, lng]) < MOVE_THRESHOLD_M) return;
      lastSent.current = [lat, lng];
      updateLoc({ variables: { latitude: lat, longitude: lng } }).catch(() => {
        // Silent — IP fallback already covered the initial location
      });
    };

    const onSuccess = (pos: GeolocationPosition) => {
      save(pos.coords.latitude, pos.coords.longitude);
    };
    const onError = () => {
      /* no-op — keep the IP-based location from login */
    };
    const opts: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    };

    // Acquire immediately, then refresh on an interval so "latest location" stays live
    navigator.geolocation.getCurrentPosition(onSuccess, onError, opts);
    const id = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        ...opts,
        maximumAge: 300000,
      });
    }, REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user?.id, updateLoc]);
}
