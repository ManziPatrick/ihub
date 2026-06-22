/* ─── Haversine Distance ──────────────────────────────────────────
 * Calculates the distance (in km) between two lat/lng coordinates.
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/* ─── Threshold ───────────────────────────────────────────────────
 * Distance in km above which a login is considered suspicious.
 */
export const SUSPICIOUS_LOGIN_THRESHOLD_KM = 100;

/* ─── Suspicious Login Detection ───────────────────────────────────
 * Compares the current login location against the user's last known
 * location. If the distance exceeds the threshold (default 100 km)
 * and the user has a previous known location, triggers an alert.
 * Returns true if an alert was sent, false otherwise.
 */
export interface UserLocationInfo {
  email: string;
  username?: string | null;
  fullName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location?: string | null;
  enrolledCourses?: any[];
}

export interface AlertSender {
  (email: string, userName: string, loginTime: string, newLocation: string,
   previousLocation: string, distanceKm: number, loginMethod: string, ipAddress: string): Promise<boolean>;
}

export async function checkSuspiciousLogin(
  user: UserLocationInfo,
  currentLat: number,
  currentLon: number,
  ip: string,
  loginMethod: string,
  ipCity?: string,
  ipCountry?: string,
  sendAlert?: AlertSender
): Promise<boolean> {
  try {
    // Only check users who have enrolled in at least one course
    if (!user.enrolledCourses || user.enrolledCourses.length === 0) return false;

    // Only check if the user has a previous location
    if (user.latitude == null || user.longitude == null) return false;

    const distance = haversineDistance(user.latitude, user.longitude, currentLat, currentLon);

    if (distance < SUSPICIOUS_LOGIN_THRESHOLD_KM) return false;

    // Distance exceeds threshold — build alert
    const timeOfDay = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    // Build new location string
    let newLocationStr = `${currentLat.toFixed(4)}, ${currentLon.toFixed(4)}`;
    if (ipCity && ipCountry) {
      newLocationStr = `${ipCity}, ${ipCountry}`;
    } else if (ipCountry) {
      newLocationStr = ipCountry;
    }

    // Build old location string
    let oldLocationStr = `${user.latitude.toFixed(4)}, ${user.longitude.toFixed(4)}`;
    if (user.location) {
      oldLocationStr = user.location;
    }

    if (sendAlert) {
      await sendAlert(
        user.email,
        user.username || user.fullName || user.email,
        timeOfDay,
        newLocationStr,
        oldLocationStr,
        distance,
        loginMethod,
        ip
      );
    }

    return true; // Alert triggered
  } catch (err) {
    console.debug('[SuspiciousLogin] Error (non-blocking):', err);
    return false;
  }
}
