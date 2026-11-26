import { build, createServer } from "vite";
import { watch } from "node:fs";
import { resolve } from "node:path";
import { root, remotes, buildRemotes } from "./build.mjs";
import { mfeConfig } from "./mfe-config.mjs";

await buildRemotes();
const server = await createServer({
  configFile: resolve(root, "apps/shell/vite.config.ts"),
});
const watchers = [];
for (const name of remotes) {
  watchers.push(
    await build({
      ...mfeConfig(name),
      configFile: false,
      build: { ...mfeConfig(name).build, watch: {} },
    }),
  );
}
const contentWatcher = watch(resolve(root, "content"), async () => {
  try {
    server.ws.send({ type: "full-reload" });
  } catch (error) {
    console.error("Content update failed:", error);
  }
});
await server.listen();
server.printUrls();
console.log(
  "Watching all four micro frontends. Content mode:",
  process.env.VITE_BFF_URL ? "local BFF" : "static JSON",
);
async function close() {
  contentWatcher.close();
  await Promise.all(watchers.map((watcher) => watcher.close()));
  await server.close();
  process.exit(0);
}
process.on("SIGINT", close);
process.on("SIGTERM", close);
