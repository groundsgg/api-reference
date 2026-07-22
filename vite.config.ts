import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

import { API_REFERENCE_BASE_PATH } from "./api-reference.config";

export default defineConfig({
  base: API_REFERENCE_BASE_PATH,
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2_500,
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
