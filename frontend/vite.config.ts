import path from "node:path";
import { fileURLToPath } from "node:url";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    // SSR module runner does not always honor vite-tsconfig-paths; keep ~ in sync with tsconfig "paths".
    alias: { "~": path.join(frontendRoot, "app") },
  },
  plugins: [
    reactRouter(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  optimizeDeps: {
    include: [
      "three",
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@x402/core/client",
      "@x402/stellar",
      "@x402/stellar/exact/client",
      "@stellar/stellar-sdk",
      "@creit-tech/stellar-wallets-kit/sdk",
      "@creit-tech/stellar-wallets-kit/modules/utils",
      "@creit-tech/stellar-wallets-kit/types",
    ],
  },
  // Use Vite's default resolution for React to prefer the ESM entry points.
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react/jsx-runtime') || id.includes('react/jsx-dev-runtime')) return 'react';
            if (id.includes('@react-three/fiber') || id.includes('@react-three/drei') || id.includes('@react-three/postprocessing')) return 'r3f';
            if (id.includes('three')) return 'three';
            if (id.includes('framer-motion')) return 'framer';
          }
        },
      },
    },
  },
});
