import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  optimizeDeps: {
    exclude: ["@undecaf/zbar-wasm"],
  },
  build: {
    target: "es2022",
  },
});
