import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/openapi/kasi-rise-set": {
        target: "http://apis.data.go.kr",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(
            /^\/openapi\/kasi-rise-set/,
            "/B090041/openapi/service/RiseSetInfoService",
          ),
      },
    },
  },
});
