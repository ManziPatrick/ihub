import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "leaflet/dist/leaflet.css";

import { ApolloProvider } from "@apollo/client/react";
import client from "./lib/apolloClient";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { env } from "./lib/env";

// Initialize i18n
import "./lib/i18n";

// Initialize automatic error capture (GraphQL errors, runtime errors, unhandled rejections)
import { initErrorCapture, setReportClient } from "./lib/errorCapture";
setReportClient(client);
initErrorCapture();

// Reset any zoom preference — CSS zoom on <html> breaks fixed-position overlays
// (dialogs, popovers, Google One Tap) on mobile browsers. It also causes
// layout reflow bugs when opening/closing modals.
// Users who need magnification should use browser zoom (Ctrl/Cmd +/+/-).
if (typeof window !== 'undefined') {
  // Clear any previously saved zoom (from before this fix)
  localStorage.removeItem('app_zoom');
  // Remove inline zoom style if present
  document.documentElement.style.removeProperty('zoom');
}

// ---- Stale Service Worker cleanup ----
// If a Service Worker from a previous build/vite-run cached old pre-bundled
// chunks (like the lucide-react barrel-export bug in chunk-CMM6OKGN.js),
// it will keep serving those stale files even after cache clears.
// Unregister any existing SW + purge its caches so the server sends fresh assets.
(async function cleanupServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith("bootskills") || name.startsWith("workbox") || name.startsWith("offline"))
          .map((name) => caches.delete(name))
      );
      await reg.unregister();
      console.log("[SW Cleanup] Unregistered stale Service Worker and cleared caches");
    }
  } catch {
    // Silently ignore — not critical
  }
})();

createRoot(document.getElementById("root")!).render(
  <ApolloProvider client={client}>
    <GoogleOAuthProvider clientId={env.GOOGLE_CLIENT_ID || ""}>
      <App />
    </GoogleOAuthProvider>
  </ApolloProvider>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
