import sharp from "sharp";
import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = process.argv[2];
if (!source)
  throw new Error("Usage: node scripts/import-assets.mjs C:/Code/brickhold");
const images = {
  portal:
    "art/approved_assets/references/approved/lego_castle_portal_skeletons_emerge.png",
  "guard-post":
    "art/approved_assets/references/approved/blue_knight_archer_guard_post.png",
  haymaker: "art/approved_assets/references/approved/09_haymaker_APPROVED.png",
  spikes: "art/approved_assets/references/approved/02_spike_trap_APPROVED.png",
  "arrow-wall":
    "art/approved_assets/references/approved/05_arrow_wall_APPROVED_NO_RED_MOUNTS.png",
  gargoyle: "art/approved_assets/references/approved/gargoyle_reference.png",
  werewolf: "art/approved_assets/references/approved/werewolf_reference.png",
  gameplay: "art/review/portal_D6_wave_match_angle.png",
};
await mkdir(resolve(root, "apps/shell/public/media"), { recursive: true });
for (const [name, path] of Object.entries(images)) {
  const output = resolve(root, "apps/shell/public/media", `${name}.webp`);
  const result = await sharp(resolve(source, path))
    .resize({
      width: name === "portal" ? 1448 : 1000,
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toFile(output);
  console.log(`${name}.webp: ${Math.round(result.size / 1024)} KB`);
}
for (const [font, output] of [["dm-sans", "dm-sans"]]) {
  const fontRoot = resolve(root, "node_modules/@fontsource-variable", font);
  await cp(
    resolve(fontRoot, "files", `${font}-latin-wght-normal.woff2`),
    resolve(root, "apps/shell/public/fonts", `${output}-latin.woff2`),
  );
  await cp(
    resolve(fontRoot, "LICENSE"),
    resolve(root, "apps/shell/public/fonts", `${output}-LICENSE.txt`),
  );
}
await cp(
  resolve(
    root,
    "node_modules/@fontsource/bungee/files/bungee-latin-400-normal.woff2",
  ),
  resolve(root, "apps/shell/public/fonts/bungee-latin.woff2"),
);
await cp(
  resolve(root, "node_modules/@fontsource/bungee/LICENSE"),
  resolve(root, "apps/shell/public/fonts/bungee-LICENSE.txt"),
);
