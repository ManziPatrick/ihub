/**
 * In-memory TTL cache for user report data.
 *
 * Reduces database load when the same user's report is viewed multiple times
 * within a short window (e.g., admin browsing through student reports).
 *
 * Cache entries are keyed by userId and automatically evicted after TTL expires
 * or when the cache exceeds maxSize (LRU eviction).
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class ReportCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly ttlMs: number;
  private readonly maxSize: number;
  private hitCount = 0;
  private missCount = 0;

  constructor(options?: { ttlSeconds?: number; maxSize?: number }) {
    this.ttlMs = (options?.ttlSeconds ?? 60) * 1000;
    this.maxSize = options?.maxSize ?? 500;
  }

  /** Get a cached value. Returns null if missing or expired. */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.missCount++;
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }
    this.hitCount++;
    // Move to end (most recently used) by re-inserting
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data as T;
  }

  /** Store a value in the cache. */
  set<T>(key: string, data: T): void {
    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, { data, expiresAt: Date.now() + this.ttlMs });
  }

  /** Explicitly remove a single entry (e.g., after data mutation). */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /** Remove ALL entries. */
  clear(): void {
    this.cache.clear();
  }

  /** Number of entries currently in the cache. */
  get size(): number {
    return this.cache.size;
  }

  /** Hit-to-miss ratio stats. */
  get stats(): { hitCount: number; missCount: number; hitRate: number; size: number } {
    const total = this.hitCount + this.missCount;
    return {
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: total > 0 ? Math.round((this.hitCount / total) * 100) : 0,
      size: this.cache.size,
    };
  }
}

/** Singleton shared across all resolvers. */
export const reportCache = new ReportCache({ ttlSeconds: 120, maxSize: 500 });
