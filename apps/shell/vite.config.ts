import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { watch } from "node:fs";

const root = fileURLToPath(new URL("../../", import.meta.url));
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, root, ""), ...process.env };
  return {
    root: resolve(root, "apps/shell"),
    envDir: root,
    base: "./",
    plugins: [
      react(),
      {
        name: "local-micro-frontends",
        configureServer(server) {
          const remoteDirectory = resolve(root, "dist/mfe");
          const watcher = watch(
            remoteDirectory,
            { recursive: true },
            (_event, path) => {
              if (path && /\.(js|css)$/.test(path))
                server.ws.send({ type: "full-reload" });
            },
          );
          server.httpServer?.once("close", () => watcher.close());
          server.middlewares.use("/mfe", async (req, res, next) => {
            try {
              const path = resolve(
                remoteDirectory,
                "." + decodeURIComponent((req.url ?? "/").split("?")[0]),
              );
              if (!path.startsWith(remoteDirectory + sep)) {
                res.statusCode = 403;
                res.end();
                return;
              }
              const data = await readFile(path);
              res.setHeader(
                "Content-Type",
                path.endsWith(".css")
                  ? "text/css"
                  : path.endsWith(".map")
                    ? "application/json"
                    : "text/javascript",
              );
              res.setHeader("Cache-Control", "no-store");
              res.end(data);
            } catch {
              next();
            }
          });
        },
      },
    ],
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
      proxy: env.VITE_BFF_URL
        ? { "/api": { target: env.VITE_BFF_URL, changeOrigin: true } }
        : undefined,
    },
    build: { outDir: resolve(root, "dist/site"), emptyOutDir: true },
  };
});
