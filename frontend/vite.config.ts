/// <reference lib="webworker" />
// Provides Service Worker globals (caches, Response, fetch) used by the
// offline-only runtime caching handlers below.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import viteCompression from "vite-plugin-compression";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { VitePWA } from "vite-plugin-pwa";
import sharp from "sharp";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  optimizeDeps: {
    // Avoid pre-bundling lucide-react to prevent barrel export conflicts with Star icon
    exclude: ["lucide-react"],
    // Only scan src/ files for dependencies — avoids esbuild crashing on public/ HTML files
    entries: ["src/**/*.{tsx,ts,jsx,js}"],
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    allowedHosts: true,
  },
  preview: {
    allowedHosts: true,
  },
  plugins: [
    react(),
    // Optimize and compress images at build time via sharp + svgo
    // Converts PNG/JPEG to smaller sizes, optimizes existing WebP/SVG
    ViteImageOptimizer({
      logStats: true,
      includePublic: true,
      // PNG compression (sharp)
      png: {
        quality: 75,
        compressionLevel: 9,
        palette: true,
      },
      // JPEG compression (sharp)
      jpeg: {
        quality: 75,
        progressive: true,
        mozjpeg: true,
      },
      jpg: {
        quality: 75,
        progressive: true,
        mozjpeg: true,
      },
      // WebP optimization (sharp)
      webp: {
        quality: 75,
        lossless: false,
      },
      // SVG optimization (svgo)
      svg: {
        multipass: true,
        plugins: [
          "preset-default",
          "sortAttrs",
        ],
      },
    }),
    // Pre-compress assets with gzip & brotli for faster downloads
    // Brotli typically yields 20-30% better compression than gzip
    // sw.js is excluded — nginx serves it raw (no gzip) so the browser
    // can verify its integrity and detect updates reliably.
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 1024, // only compress files > 1KB
      deleteOriginFile: false,
      filter: (file) => !file.endsWith("sw.js"),
    }),
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 1024,
      deleteOriginFile: false,
      filter: (file) => !file.endsWith("sw.js"),
    }),
    // Service worker with offline caching for the app shell and course content
    // Enables students to continue learning even with intermittent connectivity.
    // Uses generateSW strategy — Workbox auto-generates the SW with precaching
    // and runtime caching rules configured below.
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["pwa-icon.svg"],
      manifest: {
        name: "Bootskills — Learn. Build. Grow.",
        short_name: "Bootskills",
        description:
          "Rwanda's leading practical training platform — tech, business & financial literacy courses with real-world projects and internships.",
        theme_color: "#D4AF37",
        background_color: "#0f172a",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/pwa-icon.svg", sizes: "192x192", type: "image/svg+xml" },
          { src: "/pwa-icon.svg", sizes: "512x512", type: "image/svg+xml" },
        ],
      },
      workbox: {
        // Precache all built JS/CSS/HTML and public assets
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webp}"],
        globIgnores: ["**/*.br", "**/*.gz", "**/workbox-*.js"],
        // SPA fallback: serve cached index.html for any navigation request
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/graphql/],
        cleanupOutdatedCaches: true,
        sourcemap: false,
        runtimeCaching: [
          {
            // GraphQL API: offline-only caching.
            // While ONLINE we always hit the network — no stale, laggy course data
            // from previous sessions (Apollo also sends POST, which we never cache).
            // Cached responses are only served when the network is actually down.
            urlPattern: ({ url }) => url.pathname === "/graphql",
            handler: async ({ request }) => {
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
          },
          {
            // Other API endpoints: same offline-only policy — fresh data while
            // online, cached fallback only when the network is unavailable.
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: async ({ request }) => {
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
          },
          {
            // Images: stale-while-revalidate — course thumbnails show instantly
            // from cache but refresh in the background, so updated images appear
            // without waiting for a long-lived cache to expire.
            urlPattern: /(?:\.(?:png|jpg|jpeg|svg|gif|webp|avif))$|\/images\//,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "image-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // disabled in dev by default (no need for SW during development)
        type: "module",
      },
    }),
    // Convert PNG/JPEG → WebP after build for smaller images
    // WebP provides 25-35% better compression than JPEG at same quality
    // closeBundle runs AFTER the compression plugins (registered earlier)
    // so .webp files are created BEFORE the .br/.gz compression runs.
    {
      name: "convert-to-webp",
      async closeBundle() {
        const distDir = path.resolve(__dirname, "dist");
        if (!fs.existsSync(distDir)) return;

        console.log("\n🖼️  Converting images to WebP...");
        let converted = 0;
        let skipped = 0;
        const tasks: Promise<void>[] = [];

        function walk(dir: string): void {
          for (const entry of fs.readdirSync(dir)) {
            const fullPath = path.join(dir, entry);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              walk(fullPath);
              continue;
            }
            const ext = path.extname(entry).toLowerCase();
            if (![".png", ".jpg", ".jpeg"].includes(ext)) continue;

            const webpPath = path.join(dir, path.parse(entry).name + ".webp");
            // Skip if WebP already exists
            if (fs.existsSync(webpPath)) {
              skipped++;
              continue;
            }
            tasks.push(
              sharp(fullPath)
                .webp({ quality: 75 })
                .toFile(webpPath)
                .then(() => { converted++; })
                .catch((err: unknown) => {
                  console.warn(`  ⚠️  Failed to convert ${entry}:`, err);
                })
            );
          }
        }

        walk(distDir);
        await Promise.all(tasks);
        console.log(`  ✅ ${converted} images converted, ${skipped} already had WebP versions\n`);
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },
  esbuild: {
    // Drop console.log and debugger in production builds to reduce bundle size
    // Note: this removes ALL console.* calls (warn, error, info, etc.)
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
  build: {
    // Target modern browsers for smaller, more efficient output
    target: "es2020",
    // Enable CSS code splitting for per-page CSS instead of one monolithic file
    cssCodeSplit: true,
    // Notify chunk size warnings for bundles over 500KB
    chunkSizeWarningLimit: 500,
    // Minimize CSS inlining for smaller HTML size
    // cssCodeSplit: true already handles per-page CSS splitting
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "apollo-vendor": ["@apollo/client", "graphql"],
          "animation-vendor": ["framer-motion"],
          "icons-vendor": ["lucide-react"],
          "chart-vendor": ["recharts"],
          "code-vendor": [
            "@uiw/react-codemirror",
            "@codemirror/lang-javascript",
            "@codemirror/lang-python",
            "@codemirror/lang-html",
            "@codemirror/lang-css",
            "@codemirror/lang-cpp",
            "@codemirror/lang-java",
            "@codemirror/lang-php",
            "@codemirror/lang-rust",
            "@codemirror/lang-sql",
            "@codemirror/lang-xml",
            "@codemirror/lang-json",
            "@codemirror/lang-markdown",
            "@codemirror/theme-one-dark",
            "@codemirror/view",
            "@codemirror/autocomplete",
            "@codemirror/commands",
            "@codemirror/language",
            "@codemirror/lint",
            "@codemirror/search",
            "@codemirror/state",
            "codemirror",
          ],
          "ui-vendor": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-aspect-ratio",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-context-menu",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-hover-card",
            "@radix-ui/react-label",
            "@radix-ui/react-menubar",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-progress",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slider",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-toggle",
            "@radix-ui/react-toggle-group",
            "@radix-ui/react-tooltip",
            "clsx",
            "tailwind-merge",
            "class-variance-authority",
          ],
          // Heavy page-specific vendors — only loaded when that page is visited
          "map-vendor": ["leaflet", "react-leaflet"],
          "pdf-vendor": ["react-pdf", "pdfjs-dist"],
          "rich-text-vendor": ["react-quill"],
          "stripe-vendor": ["@stripe/react-stripe-js", "@stripe/stripe-js"],
          "doc-vendor": ["mammoth"],
          "utils-vendor": ["date-fns", "zod", "sonner", "react-hook-form", "@hookform/resolvers", "react-helmet-async"],
          "query-vendor": ["@tanstack/react-query"],
          "realtime-vendor": ["pusher-js", "socket.io-client", "graphql-ws"],
          "auth-vendor": ["@react-oauth/google", "@supabase/supabase-js"],
        },
      },
    },
  },
}));
