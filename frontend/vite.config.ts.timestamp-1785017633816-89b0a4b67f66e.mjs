// vite.config.ts
import { defineConfig } from "file:///Users/andela/projects/ihub/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///Users/andela/projects/ihub/frontend/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import fs from "fs";
import viteCompression from "file:///Users/andela/projects/ihub/frontend/node_modules/vite-plugin-compression/dist/index.mjs";
import { ViteImageOptimizer } from "file:///Users/andela/projects/ihub/frontend/node_modules/vite-plugin-image-optimizer/dist/index.js";
import { VitePWA } from "file:///Users/andela/projects/ihub/frontend/node_modules/vite-plugin-pwa/dist/index.js";
import sharp from "file:///Users/andela/projects/ihub/frontend/node_modules/sharp/dist/index.mjs";
var __vite_injected_original_dirname = "/Users/andela/projects/ihub/frontend";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false
    },
    allowedHosts: true
  },
  preview: {
    allowedHosts: true
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
        palette: true
      },
      // JPEG compression (sharp)
      jpeg: {
        quality: 75,
        progressive: true,
        mozjpeg: true
      },
      jpg: {
        quality: 75,
        progressive: true,
        mozjpeg: true
      },
      // WebP optimization (sharp)
      webp: {
        quality: 75,
        lossless: false
      },
      // SVG optimization (svgo)
      svg: {
        multipass: true,
        plugins: [
          "preset-default",
          "sortAttrs"
        ]
      }
    }),
    // Pre-compress assets with gzip & brotli for faster downloads
    // Brotli typically yields 20-30% better compression than gzip
    // sw.js is excluded — nginx serves it raw (no gzip) so the browser
    // can verify its integrity and detect updates reliably.
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 1024,
      // only compress files > 1KB
      deleteOriginFile: false,
      filter: (file) => !file.endsWith("sw.js")
    }),
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 1024,
      deleteOriginFile: false,
      filter: (file) => !file.endsWith("sw.js")
    }),
    // Service worker with offline caching for the app shell and course content
    // Enables students to continue learning even with intermittent connectivity.
    // Uses generateSW strategy — Workbox auto-generates the SW with precaching
    // and runtime caching rules configured below.
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["pwa-192x192.png", "pwa-512x512.png"],
      manifest: {
        name: "Bootskills \u2014 Learn. Build. Grow.",
        short_name: "Bootskills",
        description: "Rwanda's leading practical training platform \u2014 tech, business & financial literacy courses with real-world projects and internships.",
        theme_color: "#D4AF37",
        background_color: "#0f172a",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" }
        ]
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
            // GraphQL API: network-first with 5s timeout
            // Falls back to cached response when offline
            urlPattern: ({ url }) => url.pathname === "/graphql",
            handler: "NetworkFirst",
            options: {
              cacheName: "graphql-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7
                // 1 week
              },
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Other API endpoints: network-first with 5s timeout
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
                // 1 day
              },
              networkTimeoutSeconds: 5
            }
          },
          {
            // Images: cache-first with background refresh
            urlPattern: /(?:\.(?:png|jpg|jpeg|svg|gif|webp|avif))$|\/images\//,
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
                // 30 days
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false,
        // disabled in dev by default (no need for SW during development)
        type: "module"
      }
    }),
    // Convert PNG/JPEG → WebP after build for smaller images
    // WebP provides 25-35% better compression than JPEG at same quality
    // closeBundle runs AFTER the compression plugins (registered earlier)
    // so .webp files are created BEFORE the .br/.gz compression runs.
    {
      name: "convert-to-webp",
      async closeBundle() {
        const distDir = path.resolve(__vite_injected_original_dirname, "dist");
        if (!fs.existsSync(distDir)) return;
        console.log("\n\u{1F5BC}\uFE0F  Converting images to WebP...");
        let converted = 0;
        let skipped = 0;
        const tasks = [];
        function walk(dir) {
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
            if (fs.existsSync(webpPath)) {
              skipped++;
              continue;
            }
            tasks.push(
              sharp(fullPath).webp({ quality: 75 }).toFile(webpPath).then(() => {
                converted++;
              }).catch((err) => {
                console.warn(`  \u26A0\uFE0F  Failed to convert ${entry}:`, err);
              })
            );
          }
        }
        walk(distDir);
        await Promise.all(tasks);
        console.log(`  \u2705 ${converted} images converted, ${skipped} already had WebP versions
`);
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
      "@shared": path.resolve(__vite_injected_original_dirname, "./src/shared")
    }
  },
  esbuild: {
    // Drop console.log and debugger in production builds to reduce bundle size
    // Note: this removes ALL console.* calls (warn, error, info, etc.)
    drop: mode === "production" ? ["console", "debugger"] : []
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
            "codemirror"
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
            "class-variance-authority"
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
          "auth-vendor": ["@react-oauth/google", "@supabase/supabase-js"]
        }
      }
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvYW5kZWxhL3Byb2plY3RzL2lodWIvZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9hbmRlbGEvcHJvamVjdHMvaWh1Yi9mcm9udGVuZC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvYW5kZWxhL3Byb2plY3RzL2lodWIvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgdml0ZUNvbXByZXNzaW9uIGZyb20gXCJ2aXRlLXBsdWdpbi1jb21wcmVzc2lvblwiO1xuaW1wb3J0IHsgVml0ZUltYWdlT3B0aW1pemVyIH0gZnJvbSBcInZpdGUtcGx1Z2luLWltYWdlLW9wdGltaXplclwiO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1wd2FcIjtcbmltcG9ydCBzaGFycCBmcm9tIFwic2hhcnBcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IFwiOjpcIixcbiAgICBwb3J0OiA4MDgwLFxuICAgIGhtcjoge1xuICAgICAgb3ZlcmxheTogZmFsc2UsXG4gICAgfSxcbiAgICBhbGxvd2VkSG9zdHM6IHRydWUsXG4gIH0sXG4gIHByZXZpZXc6IHtcbiAgICBhbGxvd2VkSG9zdHM6IHRydWUsXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIC8vIE9wdGltaXplIGFuZCBjb21wcmVzcyBpbWFnZXMgYXQgYnVpbGQgdGltZSB2aWEgc2hhcnAgKyBzdmdvXG4gICAgLy8gQ29udmVydHMgUE5HL0pQRUcgdG8gc21hbGxlciBzaXplcywgb3B0aW1pemVzIGV4aXN0aW5nIFdlYlAvU1ZHXG4gICAgVml0ZUltYWdlT3B0aW1pemVyKHtcbiAgICAgIGxvZ1N0YXRzOiB0cnVlLFxuICAgICAgaW5jbHVkZVB1YmxpYzogdHJ1ZSxcbiAgICAgIC8vIFBORyBjb21wcmVzc2lvbiAoc2hhcnApXG4gICAgICBwbmc6IHtcbiAgICAgICAgcXVhbGl0eTogNzUsXG4gICAgICAgIGNvbXByZXNzaW9uTGV2ZWw6IDksXG4gICAgICAgIHBhbGV0dGU6IHRydWUsXG4gICAgICB9LFxuICAgICAgLy8gSlBFRyBjb21wcmVzc2lvbiAoc2hhcnApXG4gICAgICBqcGVnOiB7XG4gICAgICAgIHF1YWxpdHk6IDc1LFxuICAgICAgICBwcm9ncmVzc2l2ZTogdHJ1ZSxcbiAgICAgICAgbW96anBlZzogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBqcGc6IHtcbiAgICAgICAgcXVhbGl0eTogNzUsXG4gICAgICAgIHByb2dyZXNzaXZlOiB0cnVlLFxuICAgICAgICBtb3pqcGVnOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIC8vIFdlYlAgb3B0aW1pemF0aW9uIChzaGFycClcbiAgICAgIHdlYnA6IHtcbiAgICAgICAgcXVhbGl0eTogNzUsXG4gICAgICAgIGxvc3NsZXNzOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICAvLyBTVkcgb3B0aW1pemF0aW9uIChzdmdvKVxuICAgICAgc3ZnOiB7XG4gICAgICAgIG11bHRpcGFzczogdHJ1ZSxcbiAgICAgICAgcGx1Z2luczogW1xuICAgICAgICAgIFwicHJlc2V0LWRlZmF1bHRcIixcbiAgICAgICAgICBcInNvcnRBdHRyc1wiLFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICB9KSxcbiAgICAvLyBQcmUtY29tcHJlc3MgYXNzZXRzIHdpdGggZ3ppcCAmIGJyb3RsaSBmb3IgZmFzdGVyIGRvd25sb2Fkc1xuICAgIC8vIEJyb3RsaSB0eXBpY2FsbHkgeWllbGRzIDIwLTMwJSBiZXR0ZXIgY29tcHJlc3Npb24gdGhhbiBnemlwXG4gICAgLy8gc3cuanMgaXMgZXhjbHVkZWQgXHUyMDE0IG5naW54IHNlcnZlcyBpdCByYXcgKG5vIGd6aXApIHNvIHRoZSBicm93c2VyXG4gICAgLy8gY2FuIHZlcmlmeSBpdHMgaW50ZWdyaXR5IGFuZCBkZXRlY3QgdXBkYXRlcyByZWxpYWJseS5cbiAgICB2aXRlQ29tcHJlc3Npb24oe1xuICAgICAgYWxnb3JpdGhtOiBcImJyb3RsaUNvbXByZXNzXCIsXG4gICAgICBleHQ6IFwiLmJyXCIsXG4gICAgICB0aHJlc2hvbGQ6IDEwMjQsIC8vIG9ubHkgY29tcHJlc3MgZmlsZXMgPiAxS0JcbiAgICAgIGRlbGV0ZU9yaWdpbkZpbGU6IGZhbHNlLFxuICAgICAgZmlsdGVyOiAoZmlsZSkgPT4gIWZpbGUuZW5kc1dpdGgoXCJzdy5qc1wiKSxcbiAgICB9KSxcbiAgICB2aXRlQ29tcHJlc3Npb24oe1xuICAgICAgYWxnb3JpdGhtOiBcImd6aXBcIixcbiAgICAgIGV4dDogXCIuZ3pcIixcbiAgICAgIHRocmVzaG9sZDogMTAyNCxcbiAgICAgIGRlbGV0ZU9yaWdpbkZpbGU6IGZhbHNlLFxuICAgICAgZmlsdGVyOiAoZmlsZSkgPT4gIWZpbGUuZW5kc1dpdGgoXCJzdy5qc1wiKSxcbiAgICB9KSxcbiAgICAvLyBTZXJ2aWNlIHdvcmtlciB3aXRoIG9mZmxpbmUgY2FjaGluZyBmb3IgdGhlIGFwcCBzaGVsbCBhbmQgY291cnNlIGNvbnRlbnRcbiAgICAvLyBFbmFibGVzIHN0dWRlbnRzIHRvIGNvbnRpbnVlIGxlYXJuaW5nIGV2ZW4gd2l0aCBpbnRlcm1pdHRlbnQgY29ubmVjdGl2aXR5LlxuICAgIC8vIFVzZXMgZ2VuZXJhdGVTVyBzdHJhdGVneSBcdTIwMTQgV29ya2JveCBhdXRvLWdlbmVyYXRlcyB0aGUgU1cgd2l0aCBwcmVjYWNoaW5nXG4gICAgLy8gYW5kIHJ1bnRpbWUgY2FjaGluZyBydWxlcyBjb25maWd1cmVkIGJlbG93LlxuICAgIFZpdGVQV0Eoe1xuICAgICAgcmVnaXN0ZXJUeXBlOiBcImF1dG9VcGRhdGVcIixcbiAgICAgIGluY2x1ZGVBc3NldHM6IFtcInB3YS0xOTJ4MTkyLnBuZ1wiLCBcInB3YS01MTJ4NTEyLnBuZ1wiXSxcbiAgICAgIG1hbmlmZXN0OiB7XG4gICAgICAgIG5hbWU6IFwiQm9vdHNraWxscyBcdTIwMTQgTGVhcm4uIEJ1aWxkLiBHcm93LlwiLFxuICAgICAgICBzaG9ydF9uYW1lOiBcIkJvb3Rza2lsbHNcIixcbiAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgXCJSd2FuZGEncyBsZWFkaW5nIHByYWN0aWNhbCB0cmFpbmluZyBwbGF0Zm9ybSBcdTIwMTQgdGVjaCwgYnVzaW5lc3MgJiBmaW5hbmNpYWwgbGl0ZXJhY3kgY291cnNlcyB3aXRoIHJlYWwtd29ybGQgcHJvamVjdHMgYW5kIGludGVybnNoaXBzLlwiLFxuICAgICAgICB0aGVtZV9jb2xvcjogXCIjRDRBRjM3XCIsXG4gICAgICAgIGJhY2tncm91bmRfY29sb3I6IFwiIzBmMTcyYVwiLFxuICAgICAgICBkaXNwbGF5OiBcInN0YW5kYWxvbmVcIixcbiAgICAgICAgc2NvcGU6IFwiL1wiLFxuICAgICAgICBzdGFydF91cmw6IFwiL1wiLFxuICAgICAgICBpY29uczogW1xuICAgICAgICAgIHsgc3JjOiBcIi9wd2EtMTkyeDE5Mi5wbmdcIiwgc2l6ZXM6IFwiMTkyeDE5MlwiLCB0eXBlOiBcImltYWdlL3BuZ1wiIH0sXG4gICAgICAgICAgeyBzcmM6IFwiL3B3YS01MTJ4NTEyLnBuZ1wiLCBzaXplczogXCI1MTJ4NTEyXCIsIHR5cGU6IFwiaW1hZ2UvcG5nXCIgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICB3b3JrYm94OiB7XG4gICAgICAgIC8vIFByZWNhY2hlIGFsbCBidWlsdCBKUy9DU1MvSFRNTCBhbmQgcHVibGljIGFzc2V0c1xuICAgICAgICBnbG9iUGF0dGVybnM6IFtcIioqLyoue2pzLGNzcyxodG1sLGljbyxwbmcsc3ZnLHdvZmYyLHdlYnB9XCJdLFxuICAgICAgICBnbG9iSWdub3JlczogW1wiKiovKi5iclwiLCBcIioqLyouZ3pcIiwgXCIqKi93b3JrYm94LSouanNcIl0sXG4gICAgICAgIC8vIFNQQSBmYWxsYmFjazogc2VydmUgY2FjaGVkIGluZGV4Lmh0bWwgZm9yIGFueSBuYXZpZ2F0aW9uIHJlcXVlc3RcbiAgICAgICAgbmF2aWdhdGVGYWxsYmFjazogXCIvaW5kZXguaHRtbFwiLFxuICAgICAgICBuYXZpZ2F0ZUZhbGxiYWNrRGVueWxpc3Q6IFsvXlxcL2FwaVxcLy8sIC9eXFwvZ3JhcGhxbC9dLFxuICAgICAgICBjbGVhbnVwT3V0ZGF0ZWRDYWNoZXM6IHRydWUsXG4gICAgICAgIHNvdXJjZW1hcDogZmFsc2UsXG4gICAgICAgIHJ1bnRpbWVDYWNoaW5nOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgLy8gR3JhcGhRTCBBUEk6IG5ldHdvcmstZmlyc3Qgd2l0aCA1cyB0aW1lb3V0XG4gICAgICAgICAgICAvLyBGYWxscyBiYWNrIHRvIGNhY2hlZCByZXNwb25zZSB3aGVuIG9mZmxpbmVcbiAgICAgICAgICAgIHVybFBhdHRlcm46ICh7IHVybCB9KSA9PiB1cmwucGF0aG5hbWUgPT09IFwiL2dyYXBocWxcIixcbiAgICAgICAgICAgIGhhbmRsZXI6IFwiTmV0d29ya0ZpcnN0XCIsXG4gICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogXCJncmFwaHFsLWNhY2hlXCIsXG4gICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcbiAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiAxMDAsXG4gICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogNjAgKiA2MCAqIDI0ICogNywgLy8gMSB3ZWVrXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIG5ldHdvcmtUaW1lb3V0U2Vjb25kczogNSxcbiAgICAgICAgICAgICAgY2FjaGVhYmxlUmVzcG9uc2U6IHtcbiAgICAgICAgICAgICAgICBzdGF0dXNlczogWzAsIDIwMF0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgLy8gT3RoZXIgQVBJIGVuZHBvaW50czogbmV0d29yay1maXJzdCB3aXRoIDVzIHRpbWVvdXRcbiAgICAgICAgICAgIHVybFBhdHRlcm46ICh7IHVybCB9KSA9PiB1cmwucGF0aG5hbWUuc3RhcnRzV2l0aChcIi9hcGkvXCIpLFxuICAgICAgICAgICAgaGFuZGxlcjogXCJOZXR3b3JrRmlyc3RcIixcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgY2FjaGVOYW1lOiBcImFwaS1jYWNoZVwiLFxuICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XG4gICAgICAgICAgICAgICAgbWF4RW50cmllczogNTAsXG4gICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogNjAgKiA2MCAqIDI0LCAvLyAxIGRheVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBuZXR3b3JrVGltZW91dFNlY29uZHM6IDUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgLy8gSW1hZ2VzOiBjYWNoZS1maXJzdCB3aXRoIGJhY2tncm91bmQgcmVmcmVzaFxuICAgICAgICAgICAgdXJsUGF0dGVybjogLyg/OlxcLig/OnBuZ3xqcGd8anBlZ3xzdmd8Z2lmfHdlYnB8YXZpZikpJHxcXC9pbWFnZXNcXC8vLFxuICAgICAgICAgICAgaGFuZGxlcjogXCJDYWNoZUZpcnN0XCIsXG4gICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogXCJpbWFnZS1jYWNoZVwiLFxuICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XG4gICAgICAgICAgICAgICAgbWF4RW50cmllczogMTAwLFxuICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCAqIDMwLCAvLyAzMCBkYXlzXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgZGV2T3B0aW9uczoge1xuICAgICAgICBlbmFibGVkOiBmYWxzZSwgLy8gZGlzYWJsZWQgaW4gZGV2IGJ5IGRlZmF1bHQgKG5vIG5lZWQgZm9yIFNXIGR1cmluZyBkZXZlbG9wbWVudClcbiAgICAgICAgdHlwZTogXCJtb2R1bGVcIixcbiAgICAgIH0sXG4gICAgfSksXG4gICAgLy8gQ29udmVydCBQTkcvSlBFRyBcdTIxOTIgV2ViUCBhZnRlciBidWlsZCBmb3Igc21hbGxlciBpbWFnZXNcbiAgICAvLyBXZWJQIHByb3ZpZGVzIDI1LTM1JSBiZXR0ZXIgY29tcHJlc3Npb24gdGhhbiBKUEVHIGF0IHNhbWUgcXVhbGl0eVxuICAgIC8vIGNsb3NlQnVuZGxlIHJ1bnMgQUZURVIgdGhlIGNvbXByZXNzaW9uIHBsdWdpbnMgKHJlZ2lzdGVyZWQgZWFybGllcilcbiAgICAvLyBzbyAud2VicCBmaWxlcyBhcmUgY3JlYXRlZCBCRUZPUkUgdGhlIC5ici8uZ3ogY29tcHJlc3Npb24gcnVucy5cbiAgICB7XG4gICAgICBuYW1lOiBcImNvbnZlcnQtdG8td2VicFwiLFxuICAgICAgYXN5bmMgY2xvc2VCdW5kbGUoKSB7XG4gICAgICAgIGNvbnN0IGRpc3REaXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcImRpc3RcIik7XG4gICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhkaXN0RGlyKSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKFwiXFxuXHVEODNEXHVEREJDXHVGRTBGICBDb252ZXJ0aW5nIGltYWdlcyB0byBXZWJQLi4uXCIpO1xuICAgICAgICBsZXQgY29udmVydGVkID0gMDtcbiAgICAgICAgbGV0IHNraXBwZWQgPSAwO1xuICAgICAgICBjb25zdCB0YXNrczogUHJvbWlzZTx2b2lkPltdID0gW107XG5cbiAgICAgICAgZnVuY3Rpb24gd2FsayhkaXI6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZnMucmVhZGRpclN5bmMoZGlyKSkge1xuICAgICAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4oZGlyLCBlbnRyeSk7XG4gICAgICAgICAgICBjb25zdCBzdGF0ID0gZnMuc3RhdFN5bmMoZnVsbFBhdGgpO1xuICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICB3YWxrKGZ1bGxQYXRoKTtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUoZW50cnkpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBpZiAoIVtcIi5wbmdcIiwgXCIuanBnXCIsIFwiLmpwZWdcIl0uaW5jbHVkZXMoZXh0KSkgY29udGludWU7XG5cbiAgICAgICAgICAgIGNvbnN0IHdlYnBQYXRoID0gcGF0aC5qb2luKGRpciwgcGF0aC5wYXJzZShlbnRyeSkubmFtZSArIFwiLndlYnBcIik7XG4gICAgICAgICAgICAvLyBTa2lwIGlmIFdlYlAgYWxyZWFkeSBleGlzdHNcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHdlYnBQYXRoKSkge1xuICAgICAgICAgICAgICBza2lwcGVkKys7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGFza3MucHVzaChcbiAgICAgICAgICAgICAgc2hhcnAoZnVsbFBhdGgpXG4gICAgICAgICAgICAgICAgLndlYnAoeyBxdWFsaXR5OiA3NSB9KVxuICAgICAgICAgICAgICAgIC50b0ZpbGUod2VicFBhdGgpXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4geyBjb252ZXJ0ZWQrKzsgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goKGVycjogdW5rbm93bikgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGAgIFx1MjZBMFx1RkUwRiAgRmFpbGVkIHRvIGNvbnZlcnQgJHtlbnRyeX06YCwgZXJyKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB3YWxrKGRpc3REaXIpO1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh0YXNrcyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgIFx1MjcwNSAke2NvbnZlcnRlZH0gaW1hZ2VzIGNvbnZlcnRlZCwgJHtza2lwcGVkfSBhbHJlYWR5IGhhZCBXZWJQIHZlcnNpb25zXFxuYCk7XG4gICAgICB9LFxuICAgIH0sXG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgICAgXCJAc2hhcmVkXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmMvc2hhcmVkXCIpLFxuICAgIH0sXG4gIH0sXG4gIGVzYnVpbGQ6IHtcbiAgICAvLyBEcm9wIGNvbnNvbGUubG9nIGFuZCBkZWJ1Z2dlciBpbiBwcm9kdWN0aW9uIGJ1aWxkcyB0byByZWR1Y2UgYnVuZGxlIHNpemVcbiAgICAvLyBOb3RlOiB0aGlzIHJlbW92ZXMgQUxMIGNvbnNvbGUuKiBjYWxscyAod2FybiwgZXJyb3IsIGluZm8sIGV0Yy4pXG4gICAgZHJvcDogbW9kZSA9PT0gXCJwcm9kdWN0aW9uXCIgPyBbXCJjb25zb2xlXCIsIFwiZGVidWdnZXJcIl0gOiBbXSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICAvLyBUYXJnZXQgbW9kZXJuIGJyb3dzZXJzIGZvciBzbWFsbGVyLCBtb3JlIGVmZmljaWVudCBvdXRwdXRcbiAgICB0YXJnZXQ6IFwiZXMyMDIwXCIsXG4gICAgLy8gRW5hYmxlIENTUyBjb2RlIHNwbGl0dGluZyBmb3IgcGVyLXBhZ2UgQ1NTIGluc3RlYWQgb2Ygb25lIG1vbm9saXRoaWMgZmlsZVxuICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcbiAgICAvLyBOb3RpZnkgY2h1bmsgc2l6ZSB3YXJuaW5ncyBmb3IgYnVuZGxlcyBvdmVyIDUwMEtCXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiA1MDAsXG4gICAgLy8gTWluaW1pemUgQ1NTIGlubGluaW5nIGZvciBzbWFsbGVyIEhUTUwgc2l6ZVxuICAgIC8vIGNzc0NvZGVTcGxpdDogdHJ1ZSBhbHJlYWR5IGhhbmRsZXMgcGVyLXBhZ2UgQ1NTIHNwbGl0dGluZ1xuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICBcInJlYWN0LXZlbmRvclwiOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiLCBcInJlYWN0LXJvdXRlci1kb21cIl0sXG4gICAgICAgICAgXCJhcG9sbG8tdmVuZG9yXCI6IFtcIkBhcG9sbG8vY2xpZW50XCIsIFwiZ3JhcGhxbFwiXSxcbiAgICAgICAgICBcImFuaW1hdGlvbi12ZW5kb3JcIjogW1wiZnJhbWVyLW1vdGlvblwiXSxcbiAgICAgICAgICBcImljb25zLXZlbmRvclwiOiBbXCJsdWNpZGUtcmVhY3RcIl0sXG4gICAgICAgICAgXCJjaGFydC12ZW5kb3JcIjogW1wicmVjaGFydHNcIl0sXG4gICAgICAgICAgXCJjb2RlLXZlbmRvclwiOiBbXG4gICAgICAgICAgICBcIkB1aXcvcmVhY3QtY29kZW1pcnJvclwiLFxuICAgICAgICAgICAgXCJAY29kZW1pcnJvci9sYW5nLWphdmFzY3JpcHRcIixcbiAgICAgICAgICAgIFwiQGNvZGVtaXJyb3IvbGFuZy1weXRob25cIixcbiAgICAgICAgICAgIFwiQGNvZGVtaXJyb3IvbGFuZy1odG1sXCIsXG4gICAgICAgICAgICBcIkBjb2RlbWlycm9yL2xhbmctY3NzXCIsXG4gICAgICAgICAgICBcIkBjb2RlbWlycm9yL2xhbmctY3BwXCIsXG4gICAgICAgICAgICBcIkBjb2RlbWlycm9yL2xhbmctamF2YVwiLFxuICAgICAgICAgICAgXCJAY29kZW1pcnJvci9sYW5nLXBocFwiLFxuICAgICAgICAgICAgXCJAY29kZW1pcnJvci9sYW5nLXJ1c3RcIixcbiAgICAgICAgICAgIFwiQGNvZGVtaXJyb3IvbGFuZy1zcWxcIixcbiAgICAgICAgICAgIFwiQGNvZGVtaXJyb3IvbGFuZy14bWxcIixcbiAgICAgICAgICAgIFwiQGNvZGVtaXJyb3IvbGFuZy1qc29uXCIsXG4gICAgICAgICAgICBcIkBjb2RlbWlycm9yL2xhbmctbWFya2Rvd25cIixcbiAgICAgICAgICAgIFwiQGNvZGVtaXJyb3IvdGhlbWUtb25lLWRhcmtcIixcbiAgICAgICAgICAgIFwiQGNvZGVtaXJyb3Ivdmlld1wiLFxuICAgICAgICAgICAgXCJAY29kZW1pcnJvci9hdXRvY29tcGxldGVcIixcbiAgICAgICAgICAgIFwiQGNvZGVtaXJyb3IvY29tbWFuZHNcIixcbiAgICAgICAgICAgIFwiQGNvZGVtaXJyb3IvbGFuZ3VhZ2VcIixcbiAgICAgICAgICAgIFwiQGNvZGVtaXJyb3IvbGludFwiLFxuICAgICAgICAgICAgXCJAY29kZW1pcnJvci9zZWFyY2hcIixcbiAgICAgICAgICAgIFwiQGNvZGVtaXJyb3Ivc3RhdGVcIixcbiAgICAgICAgICAgIFwiY29kZW1pcnJvclwiLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgXCJ1aS12ZW5kb3JcIjogW1xuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtYWNjb3JkaW9uXCIsXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1hbGVydC1kaWFsb2dcIixcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWFzcGVjdC1yYXRpb1wiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtYXZhdGFyXCIsXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1jaGVja2JveFwiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtY29sbGFwc2libGVcIixcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWNvbnRleHQtbWVudVwiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtZGlhbG9nXCIsXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1kcm9wZG93bi1tZW51XCIsXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1ob3Zlci1jYXJkXCIsXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1sYWJlbFwiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtbWVudWJhclwiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtbmF2aWdhdGlvbi1tZW51XCIsXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1wb3BvdmVyXCIsXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1wcm9ncmVzc1wiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtcmFkaW8tZ3JvdXBcIixcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXNjcm9sbC1hcmVhXCIsXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1zZWxlY3RcIixcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXNlcGFyYXRvclwiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3Qtc2xpZGVyXCIsXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1zbG90XCIsXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1zd2l0Y2hcIixcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXRhYnNcIixcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXRvYXN0XCIsXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC10b2dnbGVcIixcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXRvZ2dsZS1ncm91cFwiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtdG9vbHRpcFwiLFxuICAgICAgICAgICAgXCJjbHN4XCIsXG4gICAgICAgICAgICBcInRhaWx3aW5kLW1lcmdlXCIsXG4gICAgICAgICAgICBcImNsYXNzLXZhcmlhbmNlLWF1dGhvcml0eVwiLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgLy8gSGVhdnkgcGFnZS1zcGVjaWZpYyB2ZW5kb3JzIFx1MjAxNCBvbmx5IGxvYWRlZCB3aGVuIHRoYXQgcGFnZSBpcyB2aXNpdGVkXG4gICAgICAgICAgXCJtYXAtdmVuZG9yXCI6IFtcImxlYWZsZXRcIiwgXCJyZWFjdC1sZWFmbGV0XCJdLFxuICAgICAgICAgIFwicGRmLXZlbmRvclwiOiBbXCJyZWFjdC1wZGZcIiwgXCJwZGZqcy1kaXN0XCJdLFxuICAgICAgICAgIFwicmljaC10ZXh0LXZlbmRvclwiOiBbXCJyZWFjdC1xdWlsbFwiXSxcbiAgICAgICAgICBcInN0cmlwZS12ZW5kb3JcIjogW1wiQHN0cmlwZS9yZWFjdC1zdHJpcGUtanNcIiwgXCJAc3RyaXBlL3N0cmlwZS1qc1wiXSxcbiAgICAgICAgICBcImRvYy12ZW5kb3JcIjogW1wibWFtbW90aFwiXSxcbiAgICAgICAgICBcInV0aWxzLXZlbmRvclwiOiBbXCJkYXRlLWZuc1wiLCBcInpvZFwiLCBcInNvbm5lclwiLCBcInJlYWN0LWhvb2stZm9ybVwiLCBcIkBob29rZm9ybS9yZXNvbHZlcnNcIiwgXCJyZWFjdC1oZWxtZXQtYXN5bmNcIl0sXG4gICAgICAgICAgXCJxdWVyeS12ZW5kb3JcIjogW1wiQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5XCJdLFxuICAgICAgICAgIFwicmVhbHRpbWUtdmVuZG9yXCI6IFtcInB1c2hlci1qc1wiLCBcInNvY2tldC5pby1jbGllbnRcIiwgXCJncmFwaHFsLXdzXCJdLFxuICAgICAgICAgIFwiYXV0aC12ZW5kb3JcIjogW1wiQHJlYWN0LW9hdXRoL2dvb2dsZVwiLCBcIkBzdXBhYmFzZS9zdXBhYmFzZS1qc1wiXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0pKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBOFIsU0FBUyxvQkFBb0I7QUFDM1QsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixPQUFPLFFBQVE7QUFDZixPQUFPLHFCQUFxQjtBQUM1QixTQUFTLDBCQUEwQjtBQUNuQyxTQUFTLGVBQWU7QUFDeEIsT0FBTyxXQUFXO0FBUGxCLElBQU0sbUNBQW1DO0FBVXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBLE1BQ0gsU0FBUztBQUFBLElBQ1g7QUFBQSxJQUNBLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsY0FBYztBQUFBLEVBQ2hCO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUE7QUFBQTtBQUFBLElBR04sbUJBQW1CO0FBQUEsTUFDakIsVUFBVTtBQUFBLE1BQ1YsZUFBZTtBQUFBO0FBQUEsTUFFZixLQUFLO0FBQUEsUUFDSCxTQUFTO0FBQUEsUUFDVCxrQkFBa0I7QUFBQSxRQUNsQixTQUFTO0FBQUEsTUFDWDtBQUFBO0FBQUEsTUFFQSxNQUFNO0FBQUEsUUFDSixTQUFTO0FBQUEsUUFDVCxhQUFhO0FBQUEsUUFDYixTQUFTO0FBQUEsTUFDWDtBQUFBLE1BQ0EsS0FBSztBQUFBLFFBQ0gsU0FBUztBQUFBLFFBQ1QsYUFBYTtBQUFBLFFBQ2IsU0FBUztBQUFBLE1BQ1g7QUFBQTtBQUFBLE1BRUEsTUFBTTtBQUFBLFFBQ0osU0FBUztBQUFBLFFBQ1QsVUFBVTtBQUFBLE1BQ1o7QUFBQTtBQUFBLE1BRUEsS0FBSztBQUFBLFFBQ0gsV0FBVztBQUFBLFFBQ1gsU0FBUztBQUFBLFVBQ1A7QUFBQSxVQUNBO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBS0QsZ0JBQWdCO0FBQUEsTUFDZCxXQUFXO0FBQUEsTUFDWCxLQUFLO0FBQUEsTUFDTCxXQUFXO0FBQUE7QUFBQSxNQUNYLGtCQUFrQjtBQUFBLE1BQ2xCLFFBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxTQUFTLE9BQU87QUFBQSxJQUMxQyxDQUFDO0FBQUEsSUFDRCxnQkFBZ0I7QUFBQSxNQUNkLFdBQVc7QUFBQSxNQUNYLEtBQUs7QUFBQSxNQUNMLFdBQVc7QUFBQSxNQUNYLGtCQUFrQjtBQUFBLE1BQ2xCLFFBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxTQUFTLE9BQU87QUFBQSxJQUMxQyxDQUFDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUtELFFBQVE7QUFBQSxNQUNOLGNBQWM7QUFBQSxNQUNkLGVBQWUsQ0FBQyxtQkFBbUIsaUJBQWlCO0FBQUEsTUFDcEQsVUFBVTtBQUFBLFFBQ1IsTUFBTTtBQUFBLFFBQ04sWUFBWTtBQUFBLFFBQ1osYUFDRTtBQUFBLFFBQ0YsYUFBYTtBQUFBLFFBQ2Isa0JBQWtCO0FBQUEsUUFDbEIsU0FBUztBQUFBLFFBQ1QsT0FBTztBQUFBLFFBQ1AsV0FBVztBQUFBLFFBQ1gsT0FBTztBQUFBLFVBQ0wsRUFBRSxLQUFLLG9CQUFvQixPQUFPLFdBQVcsTUFBTSxZQUFZO0FBQUEsVUFDL0QsRUFBRSxLQUFLLG9CQUFvQixPQUFPLFdBQVcsTUFBTSxZQUFZO0FBQUEsUUFDakU7QUFBQSxNQUNGO0FBQUEsTUFDQSxTQUFTO0FBQUE7QUFBQSxRQUVQLGNBQWMsQ0FBQywyQ0FBMkM7QUFBQSxRQUMxRCxhQUFhLENBQUMsV0FBVyxXQUFXLGlCQUFpQjtBQUFBO0FBQUEsUUFFckQsa0JBQWtCO0FBQUEsUUFDbEIsMEJBQTBCLENBQUMsWUFBWSxZQUFZO0FBQUEsUUFDbkQsdUJBQXVCO0FBQUEsUUFDdkIsV0FBVztBQUFBLFFBQ1gsZ0JBQWdCO0FBQUEsVUFDZDtBQUFBO0FBQUE7QUFBQSxZQUdFLFlBQVksQ0FBQyxFQUFFLElBQUksTUFBTSxJQUFJLGFBQWE7QUFBQSxZQUMxQyxTQUFTO0FBQUEsWUFDVCxTQUFTO0FBQUEsY0FDUCxXQUFXO0FBQUEsY0FDWCxZQUFZO0FBQUEsZ0JBQ1YsWUFBWTtBQUFBLGdCQUNaLGVBQWUsS0FBSyxLQUFLLEtBQUs7QUFBQTtBQUFBLGNBQ2hDO0FBQUEsY0FDQSx1QkFBdUI7QUFBQSxjQUN2QixtQkFBbUI7QUFBQSxnQkFDakIsVUFBVSxDQUFDLEdBQUcsR0FBRztBQUFBLGNBQ25CO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxVQUNBO0FBQUE7QUFBQSxZQUVFLFlBQVksQ0FBQyxFQUFFLElBQUksTUFBTSxJQUFJLFNBQVMsV0FBVyxPQUFPO0FBQUEsWUFDeEQsU0FBUztBQUFBLFlBQ1QsU0FBUztBQUFBLGNBQ1AsV0FBVztBQUFBLGNBQ1gsWUFBWTtBQUFBLGdCQUNWLFlBQVk7QUFBQSxnQkFDWixlQUFlLEtBQUssS0FBSztBQUFBO0FBQUEsY0FDM0I7QUFBQSxjQUNBLHVCQUF1QjtBQUFBLFlBQ3pCO0FBQUEsVUFDRjtBQUFBLFVBQ0E7QUFBQTtBQUFBLFlBRUUsWUFBWTtBQUFBLFlBQ1osU0FBUztBQUFBLFlBQ1QsU0FBUztBQUFBLGNBQ1AsV0FBVztBQUFBLGNBQ1gsWUFBWTtBQUFBLGdCQUNWLFlBQVk7QUFBQSxnQkFDWixlQUFlLEtBQUssS0FBSyxLQUFLO0FBQUE7QUFBQSxjQUNoQztBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFlBQVk7QUFBQSxRQUNWLFNBQVM7QUFBQTtBQUFBLFFBQ1QsTUFBTTtBQUFBLE1BQ1I7QUFBQSxJQUNGLENBQUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBS0Q7QUFBQSxNQUNFLE1BQU07QUFBQSxNQUNOLE1BQU0sY0FBYztBQUNsQixjQUFNLFVBQVUsS0FBSyxRQUFRLGtDQUFXLE1BQU07QUFDOUMsWUFBSSxDQUFDLEdBQUcsV0FBVyxPQUFPLEVBQUc7QUFFN0IsZ0JBQVEsSUFBSSxpREFBcUM7QUFDakQsWUFBSSxZQUFZO0FBQ2hCLFlBQUksVUFBVTtBQUNkLGNBQU0sUUFBeUIsQ0FBQztBQUVoQyxpQkFBUyxLQUFLLEtBQW1CO0FBQy9CLHFCQUFXLFNBQVMsR0FBRyxZQUFZLEdBQUcsR0FBRztBQUN2QyxrQkFBTSxXQUFXLEtBQUssS0FBSyxLQUFLLEtBQUs7QUFDckMsa0JBQU0sT0FBTyxHQUFHLFNBQVMsUUFBUTtBQUNqQyxnQkFBSSxLQUFLLFlBQVksR0FBRztBQUN0QixtQkFBSyxRQUFRO0FBQ2I7QUFBQSxZQUNGO0FBQ0Esa0JBQU0sTUFBTSxLQUFLLFFBQVEsS0FBSyxFQUFFLFlBQVk7QUFDNUMsZ0JBQUksQ0FBQyxDQUFDLFFBQVEsUUFBUSxPQUFPLEVBQUUsU0FBUyxHQUFHLEVBQUc7QUFFOUMsa0JBQU0sV0FBVyxLQUFLLEtBQUssS0FBSyxLQUFLLE1BQU0sS0FBSyxFQUFFLE9BQU8sT0FBTztBQUVoRSxnQkFBSSxHQUFHLFdBQVcsUUFBUSxHQUFHO0FBQzNCO0FBQ0E7QUFBQSxZQUNGO0FBQ0Esa0JBQU07QUFBQSxjQUNKLE1BQU0sUUFBUSxFQUNYLEtBQUssRUFBRSxTQUFTLEdBQUcsQ0FBQyxFQUNwQixPQUFPLFFBQVEsRUFDZixLQUFLLE1BQU07QUFBRTtBQUFBLGNBQWEsQ0FBQyxFQUMzQixNQUFNLENBQUMsUUFBaUI7QUFDdkIsd0JBQVEsS0FBSyxxQ0FBMkIsS0FBSyxLQUFLLEdBQUc7QUFBQSxjQUN2RCxDQUFDO0FBQUEsWUFDTDtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBRUEsYUFBSyxPQUFPO0FBQ1osY0FBTSxRQUFRLElBQUksS0FBSztBQUN2QixnQkFBUSxJQUFJLFlBQU8sU0FBUyxzQkFBc0IsT0FBTztBQUFBLENBQThCO0FBQUEsTUFDekY7QUFBQSxJQUNGO0FBQUEsRUFDRixFQUFFLE9BQU8sT0FBTztBQUFBLEVBQ2hCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUNwQyxXQUFXLEtBQUssUUFBUSxrQ0FBVyxjQUFjO0FBQUEsSUFDbkQ7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUE7QUFBQTtBQUFBLElBR1AsTUFBTSxTQUFTLGVBQWUsQ0FBQyxXQUFXLFVBQVUsSUFBSSxDQUFDO0FBQUEsRUFDM0Q7QUFBQSxFQUNBLE9BQU87QUFBQTtBQUFBLElBRUwsUUFBUTtBQUFBO0FBQUEsSUFFUixjQUFjO0FBQUE7QUFBQSxJQUVkLHVCQUF1QjtBQUFBO0FBQUE7QUFBQSxJQUd2QixlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixnQkFBZ0IsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUEsVUFDekQsaUJBQWlCLENBQUMsa0JBQWtCLFNBQVM7QUFBQSxVQUM3QyxvQkFBb0IsQ0FBQyxlQUFlO0FBQUEsVUFDcEMsZ0JBQWdCLENBQUMsY0FBYztBQUFBLFVBQy9CLGdCQUFnQixDQUFDLFVBQVU7QUFBQSxVQUMzQixlQUFlO0FBQUEsWUFDYjtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxVQUNBLGFBQWE7QUFBQSxZQUNYO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUE7QUFBQSxVQUVBLGNBQWMsQ0FBQyxXQUFXLGVBQWU7QUFBQSxVQUN6QyxjQUFjLENBQUMsYUFBYSxZQUFZO0FBQUEsVUFDeEMsb0JBQW9CLENBQUMsYUFBYTtBQUFBLFVBQ2xDLGlCQUFpQixDQUFDLDJCQUEyQixtQkFBbUI7QUFBQSxVQUNoRSxjQUFjLENBQUMsU0FBUztBQUFBLFVBQ3hCLGdCQUFnQixDQUFDLFlBQVksT0FBTyxVQUFVLG1CQUFtQix1QkFBdUIsb0JBQW9CO0FBQUEsVUFDNUcsZ0JBQWdCLENBQUMsdUJBQXVCO0FBQUEsVUFDeEMsbUJBQW1CLENBQUMsYUFBYSxvQkFBb0IsWUFBWTtBQUFBLFVBQ2pFLGVBQWUsQ0FBQyx1QkFBdUIsdUJBQXVCO0FBQUEsUUFDaEU7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
