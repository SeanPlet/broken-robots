import { build } from "vite";
import { cp, mkdir, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mfeConfig } from "./mfe-config.mjs";
import { remotes, runtimeManifest } from "./runtime-manifest.mjs";
import { emitSiteSeo } from "./site-seo.mjs";
import { prepareSnapshot, emitBootstrap } from "./cache-assets.mjs";

export const root = fileURLToPath(new URL("../", import.meta.url));
export { remotes };
export async function prepareContent(publicDirectory) {
  await mkdir(resolve(publicDirectory, "data"), { recursive: true });
  await cp(resolve(root, "content"), resolve(publicDirectory, "data"), {
    recursive: true,
  });
  await writeFile(
    resolve(publicDirectory, "mfe-manifest.json"),
    JSON.stringify(runtimeManifest(), null, 2),
  );
}
export async function buildRemotes(outputDirectory) {
  for (const name of remotes)
    await build({ ...mfeConfig(name, outputDirectory), configFile: false });
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const outputDirectory = resolve(
    root,
    process.argv.includes("--mfe") ? "dist/mfe" : "dist/production-mfe",
  );
  await buildRemotes(outputDirectory);
  if (!process.argv.includes("--mfe")) {
    const publicDirectory = resolve(root, "dist/production-public");
    const sourcePublic = resolve(root, "apps/shell/public");
    await mkdir(publicDirectory, { recursive: true });
    for (const entry of await readdir(sourcePublic, { withFileTypes: true })) {
      if (["data", "mfe-manifest.json"].includes(entry.name)) continue;
      await cp(
        resolve(sourcePublic, entry.name),
        resolve(publicDirectory, entry.name),
        { recursive: entry.isDirectory() },
      );
    }
    await prepareContent(publicDirectory);
    await build({
      configFile: resolve(root, "apps/shell/vite.config.ts"),
      publicDir: publicDirectory,
    });
    await cp(outputDirectory, resolve(root, "dist/site/mfe"), {
      recursive: true,
    });
    const snapshot = await prepareSnapshot(
      resolve(root, "dist/site"),
      sourcePublic,
      outputDirectory,
      remotes,
      resolve(root, "content"),
    );
    await emitBootstrap(resolve(root, "dist/site"), snapshot);
    await writeFile(resolve(root, "dist/site/.nojekyll"), "");
    await emitSiteSeo(resolve(root, "dist/site"));
    console.log("\nReady: dist/site (static GitHub Pages output).");
  }
}
