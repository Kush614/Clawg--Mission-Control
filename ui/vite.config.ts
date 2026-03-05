import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/mission-control/",
  build: { outDir: "dist", emptyOutDir: true },
  server: {
    port: 5173,
    proxy: {
      "/mission-control/api":    { target: "http://localhost:18789", changeOrigin: true },
      "/mission-control/events": { target: "http://localhost:18789", changeOrigin: true },
      "/v1/clawg-ui":            { target: "http://localhost:18789", changeOrigin: true },
    },
  },
});
