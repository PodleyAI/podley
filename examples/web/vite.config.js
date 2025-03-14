import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    mainFields: ["browser", "import", "module", "main"],
  },
  esbuild: {
    target: "esnext",
  },
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: {
          "huggingface-transformers": ["@sroussey/transformers"],
          "tf-mediapipe": ["@mediapipe/tasks-text"],
          ellmers: [
            "@ellmers/ai",
            "@ellmers/ai-provider",
            "@ellmers/job-queue",
            "@ellmers/storage",
            "@ellmers/task-graph",
            "@ellmers/tasks",
            "@ellmers/test",
            "@ellmers/util",
            "@ellmers/sqlite",
          ],
          react: [
            "react",
            "react-dom",
            "@xyflow/react",
            "react-hotkeys-hook",
            "react-icons",
            "react-resizable-panels",
          ],
        },
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
});
