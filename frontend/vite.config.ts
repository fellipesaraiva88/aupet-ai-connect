import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: false, // We use our own manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/auzap-backend-api\.onrender\.com\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 5 * 60, // 5 minutes
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|gif|svg|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              }
            }
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false,
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: mode === "development",
    minify: mode === "production" ? "esbuild" : false,
    target: "esnext",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for stable dependencies
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "@tanstack/react-query",
          ],
          // UI library chunk
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
          ],
          // Charts and data visualization
          charts: ["recharts"],
          // Supabase and auth
          supabase: ["@supabase/supabase-js"],
          // Socket.io for real-time features
          socket: ["socket.io-client"],
          // Form handling
          forms: ["react-hook-form", "@hookform/resolvers", "zod"],
          // Animation and motion
          motion: ["framer-motion"],
          // Utilities
          utils: ["clsx", "class-variance-authority", "tailwind-merge", "date-fns"],
        },
        chunkFileNames: "chunks/[name]-[hash].js",
        entryFileNames: "entries/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    // Performance optimizations
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096,
  },
  // Performance optimizations
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "@supabase/supabase-js",
      "socket.io-client",
    ],
    exclude: ["@vitejs/plugin-react-swc"],
  },
  // CSS optimization
  css: {
    devSourcemap: mode === "development",
    modules: {
      localsConvention: "camelCase",
    },
  },
}));