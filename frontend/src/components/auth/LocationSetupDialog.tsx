import { useEffect, useRef } from "react";
import { useMutation, useLazyQuery } from "@apollo/client/react";
import { UPDATE_USER, UPDATE_USER_LOCATION } from "@/lib/graphql/mutations";
import { GET_MY_IP_GEOLOCATION } from "@/lib/graphql/queries";
import { useAuth } from "@/contexts/AuthContext";

interface LocationSetupDialogProps {
  onComplete: () => void;
}

/**
 * Invisible location detector — runs silently on mount, detects IP-based
 * location, saves it to the user record, and immediately calls onComplete().
 * No UI, no consent prompt, no blocking — completely transparent to the user.
 * The backend also logs IP geolocation during every login for security.
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

    // Silently detect IP location and save it in the background
    fetchIpGeo()
      .then(async (result) => {
        const data: any = (result as any)?.data;
        const ip = data?.getMyIpGeolocation;
        if (ip?.latitude && ip?.longitude) {
          const displayName =
            [ip.city, ip.country].filter(Boolean).join(", ") ||
            `${ip.latitude.toFixed(4)}, ${ip.longitude.toFixed(4)}`;
          try {
            await updateUserLocationMutation({
              variables: { latitude: ip.latitude, longitude: ip.longitude },
            });
            await updateUserMutation({
              variables: { id: user?.id, location: displayName },
            });
            updateUser({ location: displayName });
          } catch (e) {
            console.debug("[LocationSetup] Silent save failed:", e);
          }
        }
      })
      .catch((e) => {
        console.debug("[LocationSetup] IP geolocation failed:", e);
      });

    // Proceed immediately — don't block the user at all
    onComplete();
  }, [fetchIpGeo, updateUserLocationMutation, updateUserMutation, user, updateUser, onComplete]);

  // Invisible component — renders nothing, takes no space
  return null;
}
