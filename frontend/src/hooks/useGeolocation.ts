import { useCallback, useEffect, useRef } from 'react';
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { UPDATE_USER_LOCATION } from '@/lib/graphql/mutations';
import { GET_MY_IP_GEOLOCATION } from '@/lib/graphql/queries';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook that requests the user's geolocation once and persists it to the backend.
 * First attempts browser geolocation (precise). Falls back to IP geolocation
 * (approximate) if denied or unavailable.
 */
// Skip geolocation if we've already sent one within the last 5 minutes
const LOCATION_COOLDOWN_MS = 5 * 60 * 1000;

export function useGeolocation() {
  const { user } = useAuth();
  const [updateLocation] = useMutation(UPDATE_USER_LOCATION);
  const [fetchIpGeo] = useLazyQuery(GET_MY_IP_GEOLOCATION);
  const lastAttemptRef = useRef(0);
  const sentRef = useRef(false);

  const requestLocation = useCallback(() => {
    if (!user || sentRef.current || typeof navigator === 'undefined') {
      return;
    }
    // Skip geolocation API entirely if we attempted recently (even if denied)
    const now = Date.now();
    if (now - lastAttemptRef.current < LOCATION_COOLDOWN_MS) {
      return;
    }
    lastAttemptRef.current = now;

    // If browser geolocation is available, try it first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          sentRef.current = true;

          try {
            await updateLocation({
              variables: { latitude, longitude },
            });
          } catch (err) {
            console.debug('Failed to save location:', err);
          }
        },
        async (err) => {
          // Permission denied or unavailable — fall back to IP geolocation
          console.debug('Geolocation error:', err.code, err.message, '— falling back to IP geolocation');
          sentRef.current = true;
          try {
            const result = (await fetchIpGeo()) as any;
            const data: any = result?.data;
            const ip: any = data?.getMyIpGeolocation;
            if (ip?.latitude && ip?.longitude) {
              await updateLocation({
                variables: {
                  latitude: ip.latitude,
                  longitude: ip.longitude,
                },
              });
              console.debug('[Geolocation] IP fallback saved:', ip.city, ip.country);
            }
          } catch (ipErr) {
            console.debug('IP geolocation fallback also failed:', ipErr);
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 5 * 60 * 1000, // Cache up to 5 min
        }
      );
    } else {
      // No browser geolocation at all — go straight to IP fallback
      sentRef.current = true;
      fetchIpGeo().then(async (result) => {
        const data: any = (result as any)?.data;
        const ip: any = data?.getMyIpGeolocation;
        if (ip?.latitude && ip?.longitude) {
          try {
            await updateLocation({
              variables: {
                latitude: ip.latitude,
                longitude: ip.longitude,
              },
            });
            console.debug('[Geolocation] IP-only saved:', data.getMyIpGeolocation.city, data.getMyIpGeolocation.country);
          } catch (err) {
            console.debug('Failed to save IP location:', err);
          }
        }
      }).catch(err => console.debug('IP geolocation failed:', err));
    }
  }, [user, updateLocation, fetchIpGeo]);

  useEffect(() => {
    // Request location shortly after mount (give auth time to load)
    const timer = setTimeout(() => requestLocation(), 3000);
    return () => clearTimeout(timer);
  }, [requestLocation]);
}
