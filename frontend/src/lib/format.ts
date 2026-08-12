/**
 * Shared formatting helpers.
 */

/**
 * Safely format a date for display — never renders "Invalid Date".
 * Falls back to "Recently" when the value is missing or malformed
 * (legacy/seed records sometimes have no timestamp).
 */
export function formatDate(value: any): string {
  if (!value) return "Recently";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Strip empty and literal "N/A" values so role · company lines never show them.
 */
export function cleanLabelParts(...values: any[]): string[] {
  return values.filter(
    (v) => v && v.trim() && v.trim().toLowerCase() !== "n/a"
  );
}
