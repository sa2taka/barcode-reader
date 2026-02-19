import { defineConfig } from "vite";

export default defineConfig({
  base: "/barcode-reader/",
  optimizeDeps: {
    exclude: ["@undecaf/zbar-wasm"],
  },
  build: {
    target: "es2022",
  },
});
