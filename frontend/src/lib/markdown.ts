/**
 * Convert basic markdown formatting to HTML.
 *
 * Supports:
 *   - **bold** → <strong>bold</strong>
 *   - ### heading → <h3>heading</h3>
 *
 * This is intentionally minimal — we don't need a full markdown parser,
 * just enough to render the bold and heading markers used in translations.
 */
export function mdToHtml(text: string): string {
  return (
    text
      // ### headings
      .replace(/^### (.+)$/gm, "<h3 class=\"text-base font-semibold mt-3 mb-1\">$1</h3>")
      // **bold**
      .replace(/\*\*(.+?)\*\*/g, "<strong class=\"font-semibold text-foreground\">$1</strong>")
  );
}
