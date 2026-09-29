import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  plugins: [wasm(), react()],
  test: { environment: "jsdom", globals: true },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    exclude: [
      "@midnight-ntwrk/compact-runtime"
    ],
  },
  build: {
    target: "esnext",
  },
});
