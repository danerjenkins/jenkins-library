import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  // Base path for deployment - must match manifest scope and router basename for PWA to work
  base: "/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
          icons: ["lucide-react"],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["houselogo.png"],
      manifest: {
        name: "Jenkins Library",
        short_name: "Jenkins",
        description: "The Jenkins family library catalog progressive web app",
        // PWA start_url must match the base path (/) for installed app to launch correctly
        start_url: "/",
        // Scope must match base path to ensure PWA controls all app navigation
        scope: "/",
        display: "standalone",
        theme_color: "#2c3e50",
        background_color: "#2c3e50",
        icons: [
          {
            src: "houselogo.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "houselogo.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
});
