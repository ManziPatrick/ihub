/**
 * Bootskills service worker (injectManifest).
 *
 * Why a custom worker instead of the default generateSW output:
 * the generated worker serves navigations from the PRECACHED index.html
 * (cache-first). If a stale service worker from an old build keeps serving
 * an old cached shell whose chunk files no longer exist, refreshes and
 * deep links (e.g. /portal/student) fail in the browser (blank page or
 * net::ERR_FAILED) — and the app can never boot to clean itself up.
 *
 * This worker is network-first for navigations: every refresh/deep link
 * fetches the FRESH index.html from the server, so a new deploy is picked
 * up immediately. A cached shell is only used when the network is
 * unavailable.
 */
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { clientsClaim, skipWaiting } from "workbox-core";

// Activate as soon as a new deploy is detected (autoUpdate behavior).
skipWaiting();
clientsClaim();

// Precache every built asset (hashed → immutable) plus index.html as the
// last-resort offline shell. Navigations do NOT use this precached shell
// while online — they go through the network-first handler below.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ─── Navigations: network-first ──────────────────────────────────────────
// Always try the network so refreshes/deep links get the latest shell.
// Fall back to the last known shell (and finally the precached one) only
// when offline or the network stalls.
const PAGE_CACHE = "bootskills-pages";
const NAV_TIMEOUT_MS = 4000;

const navigationHandler = async ({ event, request }) => {
  const cache = await caches.open(PAGE_CACHE);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NAV_TIMEOUT_MS);
  try {
    const response = await fetch(request, { signal: controller.signal });
    // Keep a single cached copy of the shell so ANY offline navigation can
    // be served, regardless of the URL that was originally requested.
    if (response && (response.status === 200 || response.type === "opaque")) {
      try {
        await cache.put("/index.html", response.clone());
      } catch {
        // a cache write failure must never block the network response
      }
    }
    return response;
  } catch {
    // Offline / timeout — serve the last known shell, then the precached one.
    const cached = await cache.match("/index.html");
    if (cached) return cached;
    // Last resort: the precached shell (first install, never been online).
    return createHandlerBoundToURL("/index.html")({
      event,
      request,
      url: new URL(request.url),
    });
  } finally {
    clearTimeout(timeout);
  }
};

registerRoute(
  new NavigationRoute(navigationHandler, {
    denylist: [/^\/api\//, /^\/graphql/],
  })
);

// ─── GraphQL API: offline-only caching ───────────────────────────────────
// While ONLINE we always hit the network — no stale, laggy course data from
// previous sessions (Apollo also sends POST, which we never cache). Cached
// responses are only served when the network is actually down.
registerRoute(
  ({ url }) => url.pathname === "/graphql",
  async ({ request }) => {
    const cacheName = "graphql-cache";
    const offlineResponse = () =>
      new Response(JSON.stringify({ errors: [{ message: "You are offline" }] }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    // POST (Apollo's default): never cache; fail fast when offline.
    if (request.method !== "GET") {
      return fetch(request).catch(offlineResponse);
    }
    let response;
    try {
      response = await fetch(request);
    } catch {
      // Offline / network failure — fall back to the last known good response.
      const cache = await caches.open(cacheName);
      const cached = await cache.match(request);
      return cached || offlineResponse();
    }
    // Best-effort offline backup only — never let cache failures (e.g. quota
    // exceeded) block or replace the fresh network response.
    if (response && (response.status === 200 || response.type === "basic" || response.type === "cors")) {
      try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        if (keys.length >= 40) await cache.delete(keys[0]);
        cache.put(request, response.clone());
      } catch {
        // ignore cache errors — the network response still wins
      }
    }
    return response;
  },
  "GET"
);

// ─── Other API endpoints: same offline-only policy ───────────────────────
// Fresh data while online, cached fallback only when the network is down.
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  async ({ request }) => {
    const cacheName = "api-cache";
    if (request.method !== "GET") {
      return fetch(request).catch(() => new Response("", { status: 503 }));
    }
    let response;
    try {
      response = await fetch(request);
    } catch {
      // Offline / network failure — fall back to the last known good response.
      const cache = await caches.open(cacheName);
      const cached = await cache.match(request);
      return cached || new Response("", { status: 503 });
    }
    // Best-effort offline backup only.
    if (response && response.ok) {
      try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        if (keys.length >= 30) await cache.delete(keys[0]);
        cache.put(request, response.clone());
      } catch {
        // ignore cache errors — the network response still wins
      }
    }
    return response;
  },
  "GET"
);

// ─── Images: stale-while-revalidate ──────────────────────────────────────
// Course thumbnails show instantly from cache but refresh in the background,
// so updated images appear without waiting for a long-lived cache to expire.
registerRoute(
  /(?:\.(?:png|jpg|jpeg|svg|gif|webp|avif))$|\/images\//,
  new StaleWhileRevalidate({
    cacheName: "image-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  }),
  "GET"
);
