import { defineConfig } from "vite";

export default defineConfig({
  base: "/Minus/",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: "index.html",
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
  },
});
