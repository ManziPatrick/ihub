import { useEffect, useRef } from "react";
import { useMutation, useLazyQuery } from "@apollo/client/react";
import { UPDATE_USER_LOCATION } from "@/lib/graphql/mutations";
import { GET_MY_IP_GEOLOCATION } from "@/lib/graphql/queries";
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
 * - Requires a secure context (HTTPS / localhost). If GPS is unavailable or
 *   the user disabled location in their phone/browser, it falls back to
 *   IP-based geolocation so EVERYONE is still tracked automatically.
 * - Only writes to the DB when the user moved > 200 m, to avoid pointless writes.
 */
export function useAutoLocation() {
  const { user } = useAuth();
  const [updateLoc] = useMutation(UPDATE_USER_LOCATION);
  const [fetchIpGeo] = useLazyQuery(GET_MY_IP_GEOLOCATION);
  const lastSent = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const save = (lat: number, lng: number) => {
      if (cancelled) return;
      const last = lastSent.current;
      if (last && haversineMeters(last, [lat, lng]) < MOVE_THRESHOLD_M) return;
      lastSent.current = [lat, lng];
      updateLoc({ variables: { latitude: lat, longitude: lng } }).catch(() => {
        // Silent — login-time IP geolocation already seeded a fallback location
      });
    };

    // IP fallback — covers users who disabled GPS on their phone/browser.
    // getMyIpGeolocation also auto-saves the location on the backend; we save
    // again explicitly so tracking never depends on that side effect.
    const saveIpFallback = () => {
      if (cancelled) return;
      fetchIpGeo()
        .then((result) => {
          const data: any = (result as any)?.data;
          const ip = data?.getMyIpGeolocation;
          if (ip?.latitude != null && ip?.longitude != null) {
            lastSent.current = [ip.latitude, ip.longitude];
            updateLoc({
              variables: { latitude: ip.latitude, longitude: ip.longitude },
            }).catch(() => {
              /* silent */
            });
          }
        })
        .catch(() => {
          /* silent */
        });
    };

    const onSuccess = (pos: GeolocationPosition) => {
      save(pos.coords.latitude, pos.coords.longitude);
    };
    const onError = () => {
      // GPS denied/unavailable → track via IP instead
      saveIpFallback();
    };

    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
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
    } else {
      // No geolocation API → IP fallback once
      saveIpFallback();
      return () => {
        cancelled = true;
      };
    }
  }, [user?.id, updateLoc, fetchIpGeo]);
}
