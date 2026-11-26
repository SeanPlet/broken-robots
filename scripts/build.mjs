import { build } from "vite";
import { cp, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mfeConfig } from "./mfe-config.mjs";

export const root = fileURLToPath(new URL("../", import.meta.url));
export const remotes = ["intro", "brickhold", "field-guide", "studio"];
export async function prepareContent() {
  await mkdir(resolve(root, "apps/shell/public/data"), { recursive: true });
  await cp(resolve(root, "content"), resolve(root, "apps/shell/public/data"), {
    recursive: true,
  });
  const manifest = Object.fromEntries(
    remotes.map((name) => [
      name,
      { module: `mfe/${name}/entry.js`, stylesheet: `mfe/${name}/style.css` },
    ]),
  );
  await writeFile(
    resolve(root, "apps/shell/public/mfe-manifest.json"),
    JSON.stringify(manifest, null, 2),
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
  await prepareContent();
  const outputDirectory = resolve(
    root,
    process.argv.includes("--mfe") ? "dist/mfe" : "dist/production-mfe",
  );
  await buildRemotes(outputDirectory);
  if (!process.argv.includes("--mfe")) {
    await build({ configFile: resolve(root, "apps/shell/vite.config.ts") });
    await cp(outputDirectory, resolve(root, "dist/site/mfe"), {
      recursive: true,
    });
    await writeFile(resolve(root, "dist/site/.nojekyll"), "");
    console.log("\nReady: dist/site (static GitHub Pages output).");
  }
}
