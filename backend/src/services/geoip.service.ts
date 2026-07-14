/**
 * GeoIP Service
 *
 * Shared utilities for IP-based geolocation.
 * Uses ip-api.com free tier (45 req/min limit from a single IP).
 *
 * Caching strategy:
 * - In-memory cache with 24-hour TTL (IP geolocation changes rarely)
 * - Rate-limit tracker keeps us under the 45 req/min limit (threshold: 40/min)
 * - On rate-limit hit or API failure: returns stale cached data if available,
 *   otherwise returns empty (callers handle empty gracefully)
 * - Private IPs (localhost, Docker, 10.x, 192.168.x, etc.) are skipped immediately
 */

interface IpGeoResult {
  lat?: number;
  lon?: number;
  city?: string;
  country?: string;
  query?: string;
  status?: string;
}

export interface GeoLocation {
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
}

// ─── In-Memory Cache ──────────────────────────────────────────────────────────

interface CacheEntry {
  /** Cached result */
  result: GeoLocation;
  /** When this entry was cached (ms since epoch) */
  cachedAt: number;
}

const geoCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getFromCache(ip: string): GeoLocation | undefined {
  const entry = geoCache.get(ip);
  if (!entry) return undefined;
  // Only return if fresh (within TTL)
  if (Date.now() - entry.cachedAt < CACHE_TTL_MS) {
    return entry.result;
  }
  // Expired — don't delete, will be overwritten on next successful lookup
  return undefined;
}

/** Return cached result even if expired (for fallback when API unavailable) */
function getStaleFromCache(ip: string): GeoLocation | undefined {
  return geoCache.get(ip)?.result;
}

function setCache(ip: string, result: GeoLocation): void {
  geoCache.set(ip, { result, cachedAt: Date.now() });

  // Evict oldest entries if cache grows too large (>10k entries)
  if (geoCache.size > 10_000) {
    const oldestKey = geoCache.keys().next().value;
    if (oldestKey) geoCache.delete(oldestKey);
  }
}

// ─── Rate-Limit Tracker ───────────────────────────────────────────────────────

const MAX_REQUESTS_PER_MINUTE = 40; // Keep cushion below ip-api's 45/min limit
let requestsThisMinute = 0;
let minuteStart = Date.now();

/**
 * Returns true if we can make another external API call this minute.
 * Resets the counter every 60 seconds.
 */
function allowExternalRequest(): boolean {
  const now = Date.now();
  if (now - minuteStart > 60_000) {
    requestsThisMinute = 0;
    minuteStart = now;
  }
  if (requestsThisMinute >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  requestsThisMinute++;
  return true;
}

// ─── IP Validation ────────────────────────────────────────────────────────────

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

// ─── IP Extraction ────────────────────────────────────────────────────────────

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

// ─── API Lookup ───────────────────────────────────────────────────────────────

/**
 * Look up the geographic location of an IP address using ip-api.com.
 *
 * Caching & rate-limit behavior:
 * 1. Check in-memory cache → return fresh cached result immediately (0 external calls)
 * 2. Check rate-limit → if exceeded, return stale cache or fall back gracefully
 * 3. Call ip-api.com → cache on success, return on failure
 * 4. On API error → return stale cache if available, else empty object
 *
 * Returns lat/lng, city, and country on success, or empty object on failure.
 */
export async function getIpLocation(ip: string): Promise<GeoLocation> {
  if (!ip || isPrivateIp(ip)) {
    return {};
  }

  // ── Step 1: Fresh cache hit → return immediately (0 external calls) ──
  const cached = getFromCache(ip);
  if (cached) {
    return cached;
  }

  // ── Step 2: Rate-limit check → fall back to stale cache ──
  if (!allowExternalRequest()) {
    console.warn(`[GeoIP] Rate limit reached (${MAX_REQUESTS_PER_MINUTE}/min). Using stale cache for ${ip}.`);
    const stale = getStaleFromCache(ip);
    if (stale) return stale;
    return {};
  }

  // ── Step 3: External API call ──
  try {
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,lat,lon,city,country,query`,
      { signal: AbortSignal.timeout(3000) }
    );
    const data = (await response.json()) as IpGeoResult;

    if (data.status === 'success' && data.lat != null && data.lon != null) {
      const result: GeoLocation = {
        latitude: data.lat,
        longitude: data.lon,
        city: data.city,
        country: data.country,
      };
      // Cache the successful result
      setCache(ip, result);
      return result;
    }

    // API returned error (e.g., invalid IP, rate-limited)
    console.debug(`[GeoIP] ip-api.com returned non-success for ${ip}: ${data.status}`);
  } catch (err) {
    console.debug(`[GeoIP] Request failed for ${ip}:`, err);
  }

  // ── Step 4: API failed — return stale cache if available ──
  const stale = getStaleFromCache(ip);
  if (stale) {
    console.debug(`[GeoIP] Falling back to stale cache for ${ip}: ${stale.city}, ${stale.country}`);
    // Re-cache stale data with updated timestamp to avoid hammering the API on retry
    setCache(ip, stale);
    return stale;
  }

  return {};
}

// ─── Convenience ──────────────────────────────────────────────────────────────

/**
 * Convenience: extract the public IP from the request and look it up.
 * Returns geo data or empty object on failure.
 */
export async function lookupRequestGeoLocation(req: any): Promise<GeoLocation> {
  const ip = extractPublicIp(req);
  if (!ip) return {};
  return getIpLocation(ip);
}
