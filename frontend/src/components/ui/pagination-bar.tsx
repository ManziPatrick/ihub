import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export interface PaginationBarProps {
  /** Current active page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items (optional, for showing "X-Y of Z") */
  totalCount?: number;
  /** Called when the user clicks a page button */
  onPageChange: (page: number) => void;
  /** Whether there is a previous page (used for disabling Prev/First) */
  hasPreviousPage?: boolean;
  /** Whether there is a next page (used for disabling Next/Last) */
  hasNextPage?: boolean;

  // ── Items-per-page selector ──
  /** Current items-per-page value. If omitted, the selector is hidden. */
  pageSize?: number;
  /** Called when the user changes items-per-page. Receives the raw number. */
  onPageSizeChange?: (value: number) => void;
  /** Options for the items-per-page dropdown. Default: [10, 25, 50, 100] */
  pageSizeOptions?: number[];

  // ── Visual flags ──
  /** Show full page-number buttons with ellipsis (default: true) */
  showPageNumbers?: boolean;
  /** Show first/last page buttons (default: true) */
  showFirstLast?: boolean;
  /** Show the "Showing X-Y of Z" range text (default: true) */
  showRange?: boolean;
  /** Label for the page-size selector. Default: "Show" */
  pageSizeLabel?: string;

  /** Loading state — disables all buttons */
  isLoading?: boolean;
  /** Optional: custom start/end values for the range display. Overrides default pageSize-based calculation. */
  rangeStart?: number;
  rangeEnd?: number;
}

export function PaginationBar({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  hasPreviousPage,
  hasNextPage,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageNumbers = true,
  showFirstLast = true,
  showRange = true,
  pageSizeLabel = "Show",
  isLoading = false,
  rangeStart,
  rangeEnd,
}: PaginationBarProps) {
  const disabled = isLoading;
  const prevDisabled = disabled || !hasPreviousPage;
  const nextDisabled = disabled || !hasNextPage;
  const firstDisabled = disabled || !hasPreviousPage;
  const lastDisabled = disabled || !hasNextPage;

  // Generate page numbers with ellipsis for compact display
  const pageNumbers = (() => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  })();

  const handlePageSizeChange = (value: string) => {
    onPageSizeChange?.(Number(value));
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border/30">
      {/* Left: items-per-page selector + range text */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {pageSize !== undefined && onPageSizeChange && (
          <>
            <span>{pageSizeLabel}</span>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-8 w-[70px] text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[9999]">
                {pageSizeOptions.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
        {showRange && totalCount !== undefined && pageSize !== undefined && (
          <span>
            Showing{" "}
            <span className="font-semibold text-foreground">
              {rangeStart ?? (currentPage - 1) * pageSize + 1}
            </span>
            –
            <span className="font-semibold text-foreground">
              {rangeEnd ?? Math.min(currentPage * pageSize, totalCount)}
            </span>
            of{" "}
            <span className="font-semibold text-foreground">{totalCount}</span>
          </span>
        )}
      </div>

      {/* Right: navigation buttons — hidden when only 1 page */}
      {totalPages > 1 && (
      <div className="flex items-center gap-1.5">
        {showFirstLast && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => onPageChange(1)}
            disabled={firstDisabled}
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={prevDisabled}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {showPageNumbers && (
          <div className="flex items-center gap-1">
            {pageNumbers.map((p, i) =>
              p === "ellipsis" ? (
                <span key={`e-${i}`} className="px-1 text-xs text-muted-foreground">
                  ...
                </span>
              ) : (
                <Button
                  key={p}
                  variant={currentPage === p ? "gold" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0 rounded-lg text-xs font-semibold"
                  onClick={() => onPageChange(p)}
                  disabled={disabled}
                >
                  {p}
                </Button>
              ),
            )}
          </div>
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={nextDisabled}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {showFirstLast && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => onPageChange(totalPages)}
            disabled={lastDisabled}
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        )}
      </div>
      )}
    </div>
  );
}
