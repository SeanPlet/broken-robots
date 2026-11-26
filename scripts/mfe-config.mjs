import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
export function mfeConfig(name) {
  return defineConfig({
    plugins: [react()],
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    build: {
      outDir: resolve(root, "dist/mfe", name),
      emptyOutDir: true,
      lib: {
        entry: resolve(root, "apps", name, "src/entry.tsx"),
        formats: ["es"],
        fileName: () => "entry.js",
        cssFileName: "style",
      },
      minify: "esbuild",
      sourcemap: true,
    },
  });
}
