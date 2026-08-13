type NavigateFn = (to: string) => void;

let navigateFn: NavigateFn | null = null;

export function setGlobalNavigate(fn: NavigateFn) {
  navigateFn = fn;
}

/**
 * Client-side navigation usable outside the React tree (e.g. Apollo error
 * links). Falls back to a full page load only if the router hasn't registered
 * yet — a hard window.location.assign to a bare path can 404/ERR_FAILED on
 * hosts without an SPA fallback, so we always prefer router navigation.
 */
export function globalNavigate(to: string) {
  if (navigateFn) {
    navigateFn(to);
  } else {
    window.location.assign(to);
  }
}
