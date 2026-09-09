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
    // Force the correct NODE_ENV for the dependency optimizer. Some machines/shells
    // export NODE_ENV=production globally, which makes esbuild bundle React's
    // PRODUCTION jsx-dev-runtime (where jsxDEV is intentionally undefined) and breaks
    // dev mode with "jsxDEV is not a function".
    esbuildOptions: {
      define: {
        "process.env.NODE_ENV":
          mode === "development" ? '"development"' : '"production"',
      },
    },
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
    // Brotli typically yields 20-30% better compression than gzip.
    // level 5 instead of the default 11: ~5-10x less CPU on the build
    // server for only ~5% larger output (the Dokploy VPS is CPU-bound
    // and deployments were timing out at 100% CPU).
    // sw.js is excluded — nginx serves it raw (no gzip) so the browser
    // can verify its integrity and detect updates reliably.
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      compressionOptions: { level: 5 },
      threshold: 2048, // only compress files > 2KB
      deleteOriginFile: false,
      filter: (file) => !file.endsWith("sw.js"),
    }),
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      compressionOptions: { level: 6 },
      threshold: 2048,
      deleteOriginFile: false,
      filter: (file) => !file.endsWith("sw.js"),
    }),
    // Service worker with offline caching for the app shell and course content
    // Enables students to continue learning even with intermittent connectivity.
    // Uses injectManifest with a custom worker (public/sw.js): the default
    // generateSW output serves navigations from the precached index.html
    // (cache-first), so a stale SW from an old build can keep serving a dead
    // shell whose chunks no longer exist — refreshes/deep links then fail in
    // the browser (ERR_FAILED) and the app can never boot to clean itself up.
    // Our custom worker is network-first for navigations: every refresh fetches
    // the fresh index.html, and only falls back to a cached shell offline.
    VitePWA({
      // main.tsx registers /sw.js manually, so the plugin's auto-registration
      // is unused; "prompt" is the valid non-autoUpdate value ("none" is not).
      registerType: "prompt",
      includeAssets: ["pwa-icon.svg"],
      strategies: "injectManifest",
      injectManifest: {
        // Source worker at public/sw.js (plugin default layout); swDest
        // defaults to "sw.js" in dist root.
        swSrc: "public/sw.js",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webp}"],
        globIgnores: ["**/*.br", "**/*.gz", "**/workbox-*.js", "sw.js"],
      },
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
        const pending: string[] = [];

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
            pending.push(fullPath);
          }
        }

        walk(distDir);

        // Convert with bounded concurrency (2 at a time) so sharp doesn't
        // spawn a worker per image and spike memory on the deploy VPS.
        const CONCURRENCY = 2;
        const workers: Promise<void>[] = [];
        const next = async () => {
          while (pending.length > 0) {
            const fullPath = pending.shift()!;
            const webpPath = path.join(path.dirname(fullPath), path.parse(fullPath).name + ".webp");
            try {
              await sharp(fullPath).webp({ quality: 75 }).toFile(webpPath);
              converted++;
            } catch (err: unknown) {
              console.warn(`  ⚠️  Failed to convert ${path.basename(fullPath)}:`, err);
            }
          }
        };
        for (let i = 0; i < CONCURRENCY; i++) workers.push(next());
        await Promise.all(workers);
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
    sourcemap: true,
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
