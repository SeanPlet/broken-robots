import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

// Each resource keeps its URL until its own bytes change. No service worker
// intercepts navigation, so a newly deployed HTML document selects fresh assets.
export async function fingerprint(directory, logicalPath, bytes) {
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const url = `cache/${hash}/${logicalPath}`;
  await mkdir(dirname(join(directory, url)), { recursive: true });
  await writeFile(join(directory, url), bytes);
  return url;
}

export async function prepareSnapshot(
  directory,
  publicSource,
  remoteDirectory,
  remotes,
  contentDirectory,
) {
  const snapshot = { manifest: {}, assets: {}, content: {} };
  async function mediaFiles(relative = "media") {
    for (const entry of await readdir(join(publicSource, relative), {
      withFileTypes: true,
    })) {
      const logical = `${relative}/${entry.name}`;
      if (entry.isDirectory()) await mediaFiles(logical);
      else
        snapshot.assets[logical] = await fingerprint(
          directory,
          logical,
          await readFile(join(publicSource, logical)),
        );
    }
  }
  await mediaFiles();
  for (const name of remotes) {
    snapshot.manifest[name] = {};
    for (const [key, filename] of [
      ["module", "entry.js"],
      ["stylesheet", "style.css"],
    ]) {
      const bytes = await readFile(join(remoteDirectory, name, filename));
      snapshot.manifest[name][key] = await fingerprint(
        directory,
        `mfe/${name}/${filename}`,
        bytes,
      );
      if (key === "module") {
        await writeFile(
          join(directory, snapshot.manifest[name][key] + ".map"),
          await readFile(join(remoteDirectory, name, filename + ".map")),
        );
      }
    }
  }
  for (const name of ["site", "catalog"]) {
    snapshot.content[name] = JSON.parse(
      await readFile(join(contentDirectory, `${name}.json`), "utf8"),
    );
  }
  return snapshot;
}

export async function emitBootstrap(directory, snapshot) {
  const hints = Object.entries(snapshot.manifest).flatMap(([name, entry]) => [
    `<link rel="stylesheet" data-mfe="${name}" href="./${entry.stylesheet}">`,
    `<link rel="modulepreload" href="./${entry.module}">`,
  ]);
  for (const image of ["portal.webp", "brickhold-logo.webp"]) {
    hints.push(
      `<link rel="preload" as="image" fetchpriority="high" href="./${snapshot.assets[`media/${image}`]}">`,
    );
  }
  for (const font of await readdir(join(directory, "assets"))) {
    if (font.endsWith(".woff2"))
      hints.push(
        `<link rel="preload" as="font" type="font/woff2" crossorigin href="./assets/${font}">`,
      );
  }
  hints.push(
    `<script id="site-bootstrap" type="application/json">${JSON.stringify(snapshot).replaceAll("<", "\\u003c")}</script>`,
  );
  const file = join(directory, "index.html");
  const html = await readFile(file, "utf8");
  if (!html.includes("<!-- site-bootstrap -->"))
    throw new Error("Missing bootstrap marker");
  await writeFile(
    file,
    html.replace("<!-- site-bootstrap -->", () => hints.join("\n")),
  );
}
