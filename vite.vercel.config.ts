import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import { injectGaMeasurementId } from "./vite.inject-ga-plugin";

// Vercel-compatible Vite config (without Manus-specific dev plugins)
export default defineConfig({
  plugins: [react(), tailwindcss(), injectGaMeasurementId()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("recharts")) return "recharts";
          if (id.includes("lucide-react")) return "icons";
          if (
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react/") ||
            id.includes("node_modules/scheduler/")
          ) {
            return "react-vendor";
          }
          if (id.includes("@radix-ui")) return "radix";
          if (
            id.includes("@tanstack/react-query") ||
            id.includes("@trpc") ||
            id.includes("superjson")
          ) {
            return "data";
          }
          if (id.includes("@supabase")) return "supabase";
          return "vendor";
        },
      },
    },
  },
});
