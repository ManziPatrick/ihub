import { useEffect, useRef } from "react";
import { useMutation, useLazyQuery } from "@apollo/client/react";
import { UPDATE_USER, UPDATE_USER_LOCATION } from "@/lib/graphql/mutations";
import { GET_MY_IP_GEOLOCATION } from "@/lib/graphql/queries";
import { useAuth } from "@/contexts/AuthContext";

interface LocationSetupDialogProps {
  onComplete: () => void;
}

/** Reverse-geocode coordinates into a short display name via Nominatim. */
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`,
      { headers: { "User-Agent": "BootskillsApp/1.0" } }
    );
    const data = await res.json();
    const addr = data?.address || {};
    const parts: string[] = [];
    if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
    if (addr.state) parts.push(addr.state);
    if (addr.country) parts.push(addr.country);
    return parts.length > 0 ? parts.join(", ") : null;
  } catch {
    return null;
  }
}

/**
 * Invisible location detector — runs silently on mount, detects the user's
 * REAL GPS location first (browser geolocation), falling back to IP-based
 * geolocation when GPS is unavailable or denied. Saves it to the user record
 * and immediately calls onComplete(). No blocking UI.
 *
 * The backend also logs IP geolocation during every login for security, and
 * useAutoLocation() (mounted in the portal) keeps GPS fresh afterwards.
 */
export function LocationSetupDialog({ onComplete }: LocationSetupDialogProps) {
  const { user, updateUser } = useAuth();
  const [updateUserMutation] = useMutation(UPDATE_USER);
  const [updateUserLocationMutation] = useMutation(UPDATE_USER_LOCATION);
  const fetchedRef = useRef(false);

  const [fetchIpGeo] = useLazyQuery(GET_MY_IP_GEOLOCATION);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    let settled = false;

    const saveLocation = async (latitude: number, longitude: number) => {
      try {
        const displayName =
          (await reverseGeocode(latitude, longitude)) ||
          `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        await updateUserLocationMutation({
          variables: { latitude, longitude },
        });
        await updateUserMutation({
          variables: { id: user?.id, location: displayName },
        });
        updateUser({ location: displayName });
      } catch (e) {
        console.debug("[LocationSetup] GPS save failed:", e);
      }
    };

    // 1) Try real GPS first — accurate auto-location
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (settled) return;
          settled = true;
          await saveLocation(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // 2) GPS unavailable/denied → fall back to IP-based geolocation
          if (settled) return;
          settled = true;
          fetchIpGeo()
            .then(async (result) => {
              const data: any = (result as any)?.data;
              const ip = data?.getMyIpGeolocation;
              if (ip?.latitude && ip?.longitude) {
                await saveLocation(ip.latitude, ip.longitude);
              }
            })
            .catch((e) => {
              console.debug("[LocationSetup] IP geolocation failed:", e);
            });
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    } else {
      // No geolocation API at all → IP fallback
      settled = true;
      fetchIpGeo()
        .then(async (result) => {
          const data: any = (result as any)?.data;
          const ip = data?.getMyIpGeolocation;
          if (ip?.latitude && ip?.longitude) {
            await saveLocation(ip.latitude, ip.longitude);
          }
        })
        .catch((e) => {
          console.debug("[LocationSetup] IP geolocation failed:", e);
        });
    }

    // Proceed immediately — don't block the user at all
    onComplete();
  }, [fetchIpGeo, updateUserLocationMutation, updateUserMutation, user, updateUser, onComplete]);

  // Invisible component — renders nothing, takes no space
  return null;
}
