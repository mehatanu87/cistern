import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  plugins: [wasm(), topLevelAwait(), react()],
  test: { environment: "jsdom", globals: true },
  optimizeDeps: {
    exclude: [
      "@midnight-ntwrk/compact-runtime",
      "@midnight-ntwrk/ledger-v8",
      "@midnight-ntwrk/midnight-js-contracts",
      "@midnight-ntwrk/midnight-js-indexer-public-data-provider",
      "@midnight-ntwrk/midnight-js-fetch-zk-config-provider",
    ],
  },
  build: {
    target: "esnext",
  },
});
