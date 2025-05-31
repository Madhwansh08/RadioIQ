import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { configDefaults } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  // Base URL for your deployed app (adjust if deployed under subdirectory)
  base: '/',

  // React plugin for JSX support
  plugins: [react()],

  // Build configuration for optimized output
  build: {
    outDir: 'dist',             // Output directory
    assetsDir: 'assets',        // Directory for static assets
    target: 'esnext',           // Use modern JS features
    sourcemap: false,           // Do not expose source maps in production
    rollupOptions: {
      output: {
        manualChunks: undefined, // Prevent excessive code splitting
      },
    },
  },

  // Module alias configuration
  resolve: {
    alias: {
      "@components": "/src/components",
      "@assets": "/src/assets",
      "@redux": "/src/redux",
      "@utils": "/src/utils",
    },
  },

  // Testing configuration (used during dev/test, ignored in production)
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    exclude: [...configDefaults.exclude, "dist/**", "node_modules/**"],
    coverage: {
      provider: "c8",
      reporter: ["text", "json", "html"],
    },
  },
});
