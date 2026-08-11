import { useEffect, useState } from "react";

/**
 * Tracks when a paginated list is fetching a new page.
 *
 * Apollo keeps the previous page's data on screen during a refetch and does
 * not flip `loading` to true, so callers use this hook to briefly fade the
 * existing items (and disable the pagination bar) until the new page lands.
 *
 * Usage:
 *   const { fetchingPage, startPageFetch } = usePageFetching(loading, data);
 *   ... onPageChange={(p) => { startPageFetch(); setPage(p); }}
 *
 * Note: `data` must be the raw `useQuery` result (a stable reference between
 * refetches). Passing a derived array that changes identity every render
 * would clear the fetching flag immediately and the fade would never show.
 */
export function usePageFetching(loading: boolean, data?: unknown) {
  const [fetchingPage, setFetchingPage] = useState(false);

  // When a fresh query result arrives (or the initial load finishes), clear the flag.
  useEffect(() => {
    if (!loading) setFetchingPage(false);
  }, [loading, data]);

  const startPageFetch = () => setFetchingPage(true);

  return { fetchingPage, startPageFetch };
}
