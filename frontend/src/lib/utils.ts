import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
