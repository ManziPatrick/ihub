import { useEffect, useRef } from "react";
import { toast } from "sonner";

const SW_POLL_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes

/**
 * Shows a sonner toast prompting the user to refresh for the latest version.
 */
function showUpdateToast() {
  toast.info("🚀 App updated in background!", {
    description:
      "Refresh to see the latest features and fixes.",
    duration: 30_000,
    action: {
      label: "Refresh now",
      onClick: () => window.location.reload(),
    },
  });
}

/**
 * useServiceWorkerUpdate
 *
 * Detects when a new service worker has been installed and activated
 * (indicating a new deployment), then shows a toast asking the user
 * to refresh so they get the latest assets.
 *
 * How it works:
 * - Gets the existing SW registration (registered by vite-plugin-pwa)
 * - Listens for the `updatefound` event and tracks when the new SW activates
 * - Periodically calls `registration.update()` to force the browser to
 *   check for a newer `sw.js` (by default browsers check every ~24h)
 * - When a new SW successfully activates, shows the update toast
 */
export function useServiceWorkerUpdate() {
  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let checkInterval: ReturnType<typeof setInterval>;

    const setup = async () => {
      try {
        // Get the existing SW registration
        // (vite-plugin-pwa registers it automatically via inline script)
        const registration = await navigator.serviceWorker.ready;
        if (!registration) return;

        // Track when a new SW is detected and activated
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            // The new SW has activated (skipWaiting was called by autoUpdate).
            // The page still serves old assets until the user refreshes.
            if (
              newWorker.state === "activated" &&
              navigator.serviceWorker.controller
            ) {
              // Deduplicate: only show one toast per page session
              if (!hasNotifiedRef.current) {
                hasNotifiedRef.current = true;
                showUpdateToast();
              }
            }
          });
        });

        // Force-check for SW updates periodically
        // (browsers only check on navigation or every ~24h by default)
        checkInterval = setInterval(() => {
          registration.update();
        }, SW_POLL_INTERVAL_MS);
      } catch {
        // SW not supported or registration failed — silently ignore
      }
    };

    setup();

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);
}
