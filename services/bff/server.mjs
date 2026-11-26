import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const defaultDataDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../content",
);

/** A small BFF: a read-only presentation API over shared content. */
export function createBffServer({
  dataDirectory = defaultDataDirectory,
  logger = console,
} = {}) {
  return createServer(async (request, response) => {
    const send = (status, body, cache = "no-store") => {
      response.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": cache,
        "X-Content-Type-Options": "nosniff",
      });
      response.end(JSON.stringify(body));
    };

    try {
      const url = new URL(request.url, "http://localhost");
      if (request.method !== "GET") {
        response.setHeader("Allow", "GET");
        send(405, { error: "Method not allowed. This API is read-only." });
        return;
      }
      if (url.pathname === "/api/health") {
        send(200, { status: "ok", service: "broken-robots-bff" });
        return;
      }
      if (url.pathname === "/api/site") {
        const content = JSON.parse(
          await readFile(resolve(dataDirectory, "site.json"), "utf8"),
        );
        send(200, content, "public, max-age=60");
        return;
      }
      if (url.pathname === "/api/catalog") {
        const category = url.searchParams.get("category");
        if (category !== null && !["traps", "enemies"].includes(category)) {
          send(400, { error: "category must be traps or enemies." });
          return;
        }
        const entries = JSON.parse(
          await readFile(resolve(dataDirectory, "catalog.json"), "utf8"),
        );
        send(
          200,
          category
            ? entries.filter((entry) => entry.category === category)
            : entries,
          "public, max-age=60",
        );
        return;
      }
      send(404, { error: "Not found." });
    } catch (error) {
      logger.error("BFF request failed:", error.message);
      if (!response.headersSent)
        send(500, { error: "Content is temporarily unavailable." });
      else response.end();
    }
  });
}

const isMainModule =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMainModule) {
  const port = Number(process.env.PORT ?? 8787);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error("PORT must be an integer between 1 and 65535.");
    process.exitCode = 1;
  } else {
    const server = createBffServer();
    server.on("error", (error) => {
      console.error(
        error.code === "EADDRINUSE"
          ? `BFF port ${port} is already in use. Stop the other process or choose another PORT.`
          : `BFF could not start: ${error.message}`,
      );
      process.exitCode = 1;
    });
    server.listen(port, "127.0.0.1", () => {
      console.log(`Broken Robots BFF: http://127.0.0.1:${port}`);
    });
    for (const signal of ["SIGINT", "SIGTERM"]) {
      process.on(signal, () => server.close());
    }
  }
}
