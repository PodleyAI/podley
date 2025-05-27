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
          podley: [
            "@podley/ai",
            "@podley/ai-provider",
            "@podley/job-queue",
            "@podley/storage",
            "@podley/task-graph",
            "@podley/tasks",
            "@podley/test",
            "@podley/util",
            "@podley/sqlite",
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
