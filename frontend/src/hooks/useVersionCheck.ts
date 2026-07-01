import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

interface VersionInfo {
  hash: string;
  timestamp: number;
  buildTime: string;
}

const POLL_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes
const VERSION_CACHE_KEY = "app_version_hash";

/**
 * Reads the local version from the `version.json` file embedded at build time.
 * In production this is a static file served alongside the SPA.
 */
async function fetchLocalVersion(): Promise<VersionInfo | null> {
  try {
    const res = await fetch("/version.json?cachebust=" + Date.now());
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Compares two version hashes and returns true if they differ.
 */
function hasVersionChanged(current: VersionInfo, remote: VersionInfo): boolean {
  return current.hash !== remote.hash;
}

/**
 * useVersionCheck
 *
 * Periodically polls the deployed `version.json` and compares it against
 * the version that was loaded when the app first booted. If a newer build
 * is detected, it shows a sonner toast with an "Update & Refresh" action.
 *
 * The first version seen is cached in localStorage so the toast doesn't
 * reappear for the same version after a manual refresh.
 */
export function useVersionCheck() {
  const localVersionRef = useRef<VersionInfo | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showUpdateToast = useCallback((remote: VersionInfo) => {
    toast.info("🚀 A new version is available!", {
      description: `Build ${remote.hash} — ${new Date(
        remote.timestamp
      ).toLocaleString()}`,
      duration: 30_000, // 30s so it's visible
      action: {
        label: "Update & Refresh",
        onClick: () => {
          // Cache the new hash so we don't immediately notify again
          localStorage.setItem(VERSION_CACHE_KEY, remote.hash);
          window.location.reload();
        },
      },
    });
  }, []);

  const checkForUpdate = useCallback(
    async (initialVersion: VersionInfo) => {
      const remote = await fetchLocalVersion();
      if (!remote) return;

      // Skip if we've already notified for this remote version
      const notifiedHash = localStorage.getItem(VERSION_CACHE_KEY);
      if (remote.hash === notifiedHash) return;

      if (hasVersionChanged(initialVersion, remote)) {
        showUpdateToast(remote);
      }
    },
    [showUpdateToast]
  );

  useEffect(() => {
    // On mount, read the currently deployed version (this is the "old" version
    // that was current when the user loaded the page).
    fetchLocalVersion().then((version) => {
      if (!version) return;
      localVersionRef.current = version;

      // Check on initial load (with a small delay to not interrupt first render)
      setTimeout(() => checkForUpdate(version), 5_000);

      // Then poll periodically
      intervalRef.current = setInterval(() => {
        checkForUpdate(version);
      }, POLL_INTERVAL_MS);
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkForUpdate]);
}
