import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 15000, // 15 second global timeout (PgLite initialization can be slow)
  },
});
