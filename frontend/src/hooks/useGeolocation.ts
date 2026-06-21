import { useCallback, useEffect, useRef } from 'react';
import { useMutation } from '@apollo/client/react';
import { UPDATE_USER_LOCATION } from '@/lib/graphql/mutations';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook that requests the user's geolocation once and persists it to the backend.
 * Prompts the user for permission. If denied, silently stops.
 */
// Skip geolocation if we've already sent one within the last 5 minutes
const LOCATION_COOLDOWN_MS = 5 * 60 * 1000;

export function useGeolocation() {
  const { user } = useAuth();
  const [updateLocation] = useMutation(UPDATE_USER_LOCATION);
  const lastAttemptRef = useRef(0);
  const sentRef = useRef(false);

  const requestLocation = useCallback(() => {
    if (!user || sentRef.current || typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }
    // Skip geolocation API entirely if we attempted recently (even if denied)
    const now = Date.now();
    if (now - lastAttemptRef.current < LOCATION_COOLDOWN_MS) {
      return;
    }
    lastAttemptRef.current = now;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        sentRef.current = true;

        try {
          await updateLocation({
            variables: { latitude, longitude },
          });
        } catch (err) {
          // Silently fail — location is optional
          console.debug('Failed to save location:', err);
        }
      },
      (err) => {
        // Permission denied or unavailable — silently handle
        console.debug('Geolocation error:', err.code, err.message);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000, // Cache up to 5 min
      }
    );
  }, [user, updateLocation]);

  useEffect(() => {
    // Request location shortly after mount (give auth time to load)
    const timer = setTimeout(() => requestLocation(), 3000);
    return () => clearTimeout(timer);
  }, [requestLocation]);
}
