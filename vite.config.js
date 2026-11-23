
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: "autoUpdate",

      pwaAssets: {
        image: "public/studyhive-icon.svg",
        preset: "minimal-2023",
        overrideManifestIcons: true,
      },

      manifest: {
        name: "StudyHive - Learn Together",
        short_name: "StudyHive",
        description:
          "A peer-learning platform where students help each other understand lecture slides.",

        theme_color: "#FBF6EA",
        background_color: "#FBF6EA",

        display: "standalone",
        start_url: "/",
        scope: "/",
      },

      workbox: {
        navigateFallback: "/index.html",
      },
    }),
  ],
});
