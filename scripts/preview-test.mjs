// Production-file server for browser checks at both domain root and a Pages subpath.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(fileURLToPath(new URL("../dist/site/", import.meta.url)));
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
const server = createServer(async (request, response) => {
  try {
    let pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    if (pathname.startsWith("/broken-robots/"))
      pathname = pathname.slice("/broken-robots".length);
    let path = resolve(root, "." + pathname);
    if (path !== root && !path.startsWith(root + sep))
      throw new Error("Invalid path");
    if ((await stat(path)).isDirectory()) path = resolve(path, "index.html");
    const data = await readFile(path);
    response.writeHead(200, {
      "Content-Type": types[extname(path)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(data);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});
server.listen(4173, "127.0.0.1", () =>
  console.log("Artifact test server: http://127.0.0.1:4173"),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close());
