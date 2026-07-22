/**
 * Image API Service — fetches high-quality images from Pexels API
 * to use as course thumbnails and illustrations.
 */
import axios from 'axios';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

// ─── Configuration ──────────────────────────────────────────────────────────

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || process.env.VITE_PEXELS_API_KEY || '';
const PEXELS_BASE_URL = 'https://api.pexels.com/v1';

// ─── Service ────────────────────────────────────────────────────────────────

/**
 * Search Pexels for photos matching the given query.
 * Returns the top `count` results.
 */
export async function searchPexelsPhotos(
  query: string,
  count: number = 1,
  orientation?: 'landscape' | 'portrait' | 'square',
): Promise<PexelsPhoto[]> {
  if (!PEXELS_API_KEY) {
    console.warn('⚠️  No Pexels API key found. Using fallback images.');
    return [];
  }

  try {
    const params: Record<string, string | number> = {
      query,
      per_page: Math.min(count, 80),
      page: 1,
    };
    if (orientation) params.orientation = orientation;

    const { data } = await axios.get<PexelsSearchResponse>(`${PEXELS_BASE_URL}/search`, {
      headers: { Authorization: PEXELS_API_KEY },
      params,
      timeout: 10000,
    });

    return data.photos || [];
  } catch (error: any) {
    console.warn(`⚠️  Pexels search failed for "${query}": ${error.message}`);
    return [];
  }
}

/**
 * Get the best image URL for a course topic.
 * Tries Pexels first, falls back to a curated Unsplash URL.
 */
export async function getCourseImageUrl(
  topic: string,
  fallbackUrl?: string,
): Promise<string> {
  // Try Pexels first
  const photos = await searchPexelsPhotos(topic, 1, 'landscape');
  if (photos.length > 0) {
    // Use the medium size for thumbnails (good balance of quality and load speed)
    return photos[0].src.large;
  }

  // Return provided fallback or a generic one
  return (
    fallbackUrl ||
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800'
  );
}

/**
 * Search for illustrations on Pexels (using "illustration" keyword).
 * Returns the best match.
 */
export async function getCourseIllustrationUrl(
  topic: string,
  fallbackUrl?: string,
): Promise<string> {
  // Try searching for an illustration-style image
  const photos = await searchPexelsPhotos(`${topic} illustration`, 1, 'landscape');
  if (photos.length > 0) {
    return photos[0].src.large;
  }

  // Fall back to regular photo
  return getCourseImageUrl(topic, fallbackUrl);
}

/**
 * Verify an image URL is accessible (returns 200).
 */
export async function verifyImageUrl(url: string): Promise<boolean> {
  if (!url) return false;
  // Try HEAD first, then fall back to GET with range request
  // (some CDNs reject HEAD requests)
  try {
    const response = await axios.head(url, { timeout: 5000 });
    if (response.status >= 200 && response.status < 400) return true;
  } catch {
    // HEAD failed — try GET with a minimal range request
    try {
      const resp = await axios.get(url, {
        headers: { Range: 'bytes=0-1' },
        responseType: 'stream',
        timeout: 8000,
        maxContentLength: 1024,
      });
      return resp.status >= 200 && resp.status < 400;
    } catch {
      return false;
    }
  }
  return false;
}

export default {
  searchPexelsPhotos,
  getCourseImageUrl,
  getCourseIllustrationUrl,
  verifyImageUrl,
};
