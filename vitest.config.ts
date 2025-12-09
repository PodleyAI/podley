import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 5000, // 5 second global timeout (PGlite initialization can be slow)
  },
});
