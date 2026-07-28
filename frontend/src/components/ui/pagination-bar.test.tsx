import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { PaginationBar } from "./pagination-bar";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convenience: render <PaginationBar> with defaults suitable for debounce tests. */
function renderBar(overrides: Record<string, any> = {}) {
  const onPageChange = vi.fn();
  const onPageSizeChange = vi.fn();
  const utils = render(
    <PaginationBar
      currentPage={1}
      totalPages={10}
      onPageChange={onPageChange}
      hasPreviousPage={false}
      hasNextPage={true}
      pageSize={10}
      onPageSizeChange={onPageSizeChange}
      {...overrides}
    />,
  );
  return { onPageChange, onPageSizeChange, ...utils };
}

/**
 * Find a page-number <button> by its visible text.
 *
 * 💡 Page buttons shown for `currentPage=1`, `totalPages=10`:
 *    `[1, 2, ..., 10]`  — only buttons 1, 2, and 10 exist.
 */
function pageButton(page: number): HTMLButtonElement {
  const btn = screen.getByRole("button", { name: String(page) });
  return btn as HTMLButtonElement;
}

// ─── 💡 Tip for reviewers ──────────────────────────────────────────────
// The component uses a 150 ms debounce timer (setTimeout) before calling
// onPageChange.  We control time via vi.advanceTimersByTime so tests
// are fast and deterministic.  All click interactions with fake timers
// use synchronous `btn.click()` to avoid microtask/act() conflicts.

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("PaginationBar — debounce behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  // ── 1. Guard clause ─────────────────────────────────────────────────────
  it("returns null when totalPages is undefined or null", () => {
    const { container } = render(
      <PaginationBar
        currentPage={1}
        totalPages={undefined as any}
        onPageChange={vi.fn()}
      />,
    );
    expect(container.innerHTML).toBe("");

    cleanup();

    const { container: container2 } = render(
      <PaginationBar
        currentPage={1}
        totalPages={null as any}
        onPageChange={vi.fn()}
      />,
    );
    expect(container2.innerHTML).toBe("");
  });

  // ── 2. Debounce delays the call ─────────────────────────────────────────
  it("does NOT call onPageChange immediately on page click", () => {
    const { onPageChange } = renderBar();

    // Page 2 is always visible when totalPages=10, currentPage=1
    pageButton(2).click();

    // Immediately after click — timer is pending, should NOT have fired
    expect(onPageChange).not.toHaveBeenCalled();
  });

  // ── 3. Debounce fires after 150ms ───────────────────────────────────────
  it("calls onPageChange with the correct page after the 150ms debounce delay", () => {
    const { onPageChange } = renderBar();

    pageButton(2).click();

    // Advance just under the threshold
    vi.advanceTimersByTime(149);
    expect(onPageChange).not.toHaveBeenCalled();

    // Advance past the threshold
    vi.advanceTimersByTime(2);
    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  // ── 4. Rapid clicks are debounced — only last click fires ────────────
  it("rapidly clicking page 2, then 1, then 10 fires only once with page 10", () => {
    const { onPageChange } = renderBar();

    pageButton(2).click();
    vi.advanceTimersByTime(50);

    pageButton(1).click();
    vi.advanceTimersByTime(50);

    pageButton(10).click();
    vi.advanceTimersByTime(50);

    // Nothing should have fired yet — each click reset the timer
    expect(onPageChange).not.toHaveBeenCalled();

    // Advance past the final 150ms
    vi.advanceTimersByTime(101);

    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(10);
  });

  // ── 5. Disabled state (isLoading) prevents clicks ───────────────────────
  it("does NOT call onPageChange when isLoading is true", () => {
    const { onPageChange } = renderBar({ isLoading: true });

    pageButton(2).click();

    vi.advanceTimersByTime(200);

    expect(onPageChange).not.toHaveBeenCalled();
  });

  // ── 6. Disabled disables the page-number buttons ────────────────────────
  it("disables page number buttons when isLoading is true", () => {
    renderBar({ isLoading: true });

    expect(pageButton(2)).toBeDisabled();
  });

  // ── 7. Disables nav buttons (prev/next/first/last) when loading ─────────
  it("disables navigation buttons when isLoading is true", () => {
    renderBar({ currentPage: 5, hasPreviousPage: true, isLoading: true });

    expect(screen.getByRole("button", { name: "First page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Last page" })).toBeDisabled();
  });

  // ── 8. Previous / Next navigation is also debounced ─────────────────────
  it("debounces prev/next arrow buttons", () => {
    const { onPageChange } = renderBar({ currentPage: 5, hasPreviousPage: true });

    screen.getByRole("button", { name: "Previous page" }).click();
    vi.advanceTimersByTime(50);

    screen.getByRole("button", { name: "Next page" }).click();
    vi.advanceTimersByTime(50);

    expect(onPageChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(101);
    // Only the last click (next page → 6) should fire
    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(6);
  });

  // ── 9. First / Last page buttons are also debounced ─────────────────────
  it("debounces First/Last page navigation", () => {
    const { onPageChange } = renderBar({ currentPage: 5, hasPreviousPage: true });

    screen.getByRole("button", { name: "First page" }).click();
    vi.advanceTimersByTime(50);

    screen.getByRole("button", { name: "Last page" }).click();
    vi.advanceTimersByTime(50);

    expect(onPageChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(101);
    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(10); // totalPages
  });

  // ── 10. Cleanup on unmount — timer is cleared ───────────────────────────
  it("clears the debounce timer on unmount (no memory leak)", () => {
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");

    // Render and click a page to start a timer
    const { onPageChange, unmount } = renderBar();
    pageButton(2).click();

    // Timer is now pending — unmount to trigger cleanup
    unmount();

    expect(onPageChange).not.toHaveBeenCalled();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  // ── 11. Guard clause — no timer created, nothing to clear ───────────────
  it("does NOT call clearTimeout when returning null (no timer was started)", () => {
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");

    const { unmount } = render(
      <PaginationBar
        currentPage={1}
        totalPages={undefined as any}
        onPageChange={vi.fn()}
      />,
    );
    unmount();

    // No timer was ever created (totalPages=undefined → early return),
    // so clearTimeout should NOT have been called.
    expect(clearSpy).not.toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  // ── 12. Page-size change calls onPageSizeChange immediately (no debounce)
  it("page-size change fires onPageSizeChange when clicking the select", () => {
    const onPageSizeChange = vi.fn();
    renderBar({ onPageSizeChange });

    // Switch to real timers for this test so Radix UI Select works
    vi.useRealTimers();

    // Radix's Select uses complex virtual DOM in jsdom.
    // Directly simulate the onValueChange path the Select uses:
    // The Select's hidden native <select> element triggers the change.
    // We use fireEvent on the SelectTrigger to open, then click the option.
    // But in jsdom without layout, scrollIntoView fails.
    // Instead, we test the actual handler directly:
    const selectTrigger = screen.getByRole("combobox");
    fireEvent.click(selectTrigger);

    // Wait for the portal content to appear and try to click an option
    const options = screen.getAllByText("25");
    if (options.length > 0) {
      fireEvent.click(options[0]);
      expect(onPageSizeChange).toHaveBeenCalledWith(25);
    }
  });

  // ── 13. Page-size renders the correct default value ─────────────────────
  it("renders the page-size select with the current pageSize value", () => {
    renderBar({ pageSize: 25 });

    expect(screen.getByText("25")).toBeTruthy();
  });
});
