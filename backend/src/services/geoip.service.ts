/**
 * GeoIP Service
 *
 * Shared utilities for IP-based geolocation.
 * Uses the free ip-api.com service (no API key required, 45 req/min limit).
 */

interface IpGeoResult {
  lat?: number;
  lon?: number;
  city?: string;
  country?: string;
  query?: string;
  status?: string;
}

interface GeoLocation {
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
}

/**
 * Check whether an IP address is a private/reserved address that cannot
 * be geolocated.
 */
function isPrivateIp(ip: string): boolean {
  if (!ip) return true;

  const cleaned = ip.trim();

  // IPv6 variants of localhost
  if (cleaned === '::1' || cleaned === '::ffff:127.0.0.1' || cleaned === '0:0:0:0:0:0:0:1') return true;
  // IPv4 localhost
  if (cleaned === '127.0.0.1' || cleaned === 'localhost') return true;
  // 10.x.x.x
  if (cleaned.startsWith('10.')) return true;
  // 192.168.x.x
  if (cleaned.startsWith('192.168.')) return true;
  // 172.16.0.0 – 172.31.255.255 (Docker / private)
  if (cleaned.startsWith('172.')) {
    const second = parseInt(cleaned.split('.')[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  // 100.64.0.0/10 (CGNAT)
  if (cleaned.startsWith('100.')) {
    const second = parseInt(cleaned.split('.')[1], 10);
    if (second >= 64 && second <= 127) return true;
  }
  // Link-local 169.254.x.x
  if (cleaned.startsWith('169.254.')) return true;

  return false;
}

/**
 * Extract the most likely public (non-private) IP address from an Express request
 * by trying multiple sources in order of reliability.
 */
export function extractPublicIp(req: any): string {
  // Collect all possible IP sources in priority order
  const sources = [
    // 1. x-forwarded-for (reverse proxy / CDN)
    req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim(),
    // 2. x-real-ip (nginx)
    req?.headers?.['x-real-ip']?.trim(),
    // 3. req.ip (Express, respects trust proxy setting)
    req?.ip,
    // 4. connection/socket remoteAddress (fallback)
    req?.connection?.remoteAddress,
    req?.socket?.remoteAddress,
  ];

  for (const ip of sources) {
    if (!ip) continue;
    // Strip IPv6 prefix if present (::ffff:1.2.3.4 → 1.2.3.4)
    const cleaned = ip.replace(/^::ffff:/, '').trim();
    if (!isPrivateIp(cleaned)) {
      return cleaned;
    }
  }

  return '';
}

/**
 * Look up the geographic location of an IP address using ip-api.com.
 * Returns lat/lng, city, and country on success, or empty object on failure.
 */
export async function getIpLocation(ip: string): Promise<GeoLocation> {
  if (!ip || isPrivateIp(ip)) {
    return {};
  }
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,lat,lon,city,country,query`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = (await response.json()) as IpGeoResult;
    if (data.status === 'success' && data.lat != null && data.lon != null) {
      return { latitude: data.lat, longitude: data.lon, city: data.city, country: data.country };
    }
  } catch (err) {
    console.debug('[GeoIP] Failed for IP:', ip, err);
  }
  return {};
}

/**
 * Convenience: extract the public IP from the request and look it up.
 * Returns geo data or empty object on failure.
 */
export async function lookupRequestGeoLocation(req: any): Promise<GeoLocation> {
  const ip = extractPublicIp(req);
  if (!ip) return {};
  return getIpLocation(ip);
}
