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
          "huggingface-transformers": ["@huggingface/transformers"],
          "tf-mediapipe": ["@mediapipe/tasks-text"],
          ellmers: [
            "@ellmers/ai",
            "@ellmers/ai-provider/hf-transformers",
            "@ellmers/ai-provider/tf-mediapipe",
            "@ellmers/job-queue",
            "@ellmers/storage",
            "@ellmers/task-graph",
            "@ellmers/tasks",
            "@ellmers/test",
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
