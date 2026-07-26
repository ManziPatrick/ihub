import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert a video URL (YouTube or direct) into an embed-friendly URL.
 * Returns the original URL for direct video files; converts YouTube
 * watch/shorts/you.be links to youtube.com/embed/… format.
 */
export function getVideoEmbedUrl(url: string | null | undefined): string {
  if (!url) return "";

  // Normalize protocol
  let normalized = url.trim();
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = "https://" + normalized;
  }

  // Helper: extract video ID from various YouTube URL patterns
  const extractYouTubeId = (u: string): string | null => {
    const patterns = [
      /(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|shorts\/|v\/|live\/|)([a-zA-Z0-9_-]{11})(?:[&?#]|$)/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})(?:[?&#]|$)/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:[?&#]|$)/,
    ];
    for (const pattern of patterns) {
      const match = u.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  };

  // YouTube: convert to embed URL
  if (normalized.includes("youtube.com") || normalized.includes("youtu.be")) {
    const id = extractYouTubeId(normalized);
    if (id) return `https://www.youtube.com/embed/${id}`;
  }

  // Vimeo: convert to embed URL
  const vimeoMatch = normalized.match(/(?:vimeo\.com)\/(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return normalized;
}

/**
 * Check whether a video URL is a YouTube link (embed-able via iframe).
 */
export function isYouTubeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("youtube.com/watch?v=") || url.includes("youtube.com/shorts/") || url.includes("youtu.be/");
}

/**
 * Normalize content that may contain literal `\n` (escaped newlines) from
 * seed data or database storage. Converts them to actual newlines so that
 * ReactMarkdown can interpret markdown syntax correctly.
 */
export function normalizeContent(content: string | null | undefined): string {
  if (!content) return "";
  // Replace literal \n (backslash + n) with actual newlines
  return content.replace(/\\n/g, '\n');
}

/**
 * Strip HTML tags from a string, returning clean text.
 * Useful when displaying HTML-rich descriptions as plain text
 * (e.g., in meta tags, search previews, or plain text contexts).
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalize a value that may be either a string ID or a populated MongoDB document.
 * This prevents "ID cannot represent value" GraphQL errors when a populated
 * object is passed where a scalar ID is expected.
 *
 * @param value - The raw value (string ID or populated object with `_id` or `id`)
 * @param fallback - Optional fallback string when extraction fails (default: undefined)
 * @returns The extracted string ID, or the fallback if neither is available
 *
 * @example
 * normalizeId("abc123")                    // "abc123"
 * normalizeId({ _id: "abc123", title: "..." })  // "abc123"
 * normalizeId({ id: "abc123" })                 // "abc123"
 * normalizeId(null, "unknown")                  // "unknown"
 * normalizeId(undefined)                         // undefined
 */
export function normalizeId(value: unknown, fallback?: string): string | undefined {
  if (!value) return fallback;
  if (typeof value === 'string') return value || fallback;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return (obj._id as string) || (obj.id as string) || fallback;
  }
  return fallback;
}
