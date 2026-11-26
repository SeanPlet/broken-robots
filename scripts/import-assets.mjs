import sharp from "sharp";
import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

// Import only the named game assets. Downloads is read-only to this script.
// Example: node scripts/import-assets.mjs C:/Users/your-name/Downloads
const root = fileURLToPath(new URL("../", import.meta.url));
const source = resolve(process.argv[2] ?? resolve(homedir(), "Downloads"));
const output = resolve(root, "apps/shell/public/media");
await mkdir(resolve(output, "catalog"), { recursive: true });
sharp.cache({ memory: 64 });
sharp.concurrency(2);

export const screenshotSources = {
  "world.webp": { source: "05_the_playground.jpg", width: 1920 },
  "portal.webp": { source: "04_out_of_the_portal.jpg", width: 1920 },
  "guard-post.webp": { source: "guard_post.jpg", width: 1280 },
  "guardians.webp": { source: "06_guard_post.jpg", width: 1600 },
  "gameplay.webp": { source: "03_build_mode.jpg", width: 1600 },
  "funnel.webp": { source: "07_barricade_funnel.jpg", width: 1600 },
  "battle.webp": { source: "01_horde_through_traps.jpg", width: 1600 },
  "hero.webp": { source: "hero.jpg", width: 800 },
  "cover.webp": { source: "cover_1260x1000.png", width: 1260 },
  "banner.webp": { source: "banner_1920x480.png", width: 1920 },
  "trap-roster.webp": { source: "trap_roster.png", width: 1920 },
  "enemy-roster.webp": { source: "enemy_roster.png", width: 1920 },
};

// The sheets have four columns. These bounds contain the screenshot pixels
// only, excluding the title, baked labels, descriptions and sheet margins.
const columns = [60, 517, 974, 1431];
export const rosterCrops = [
  ...[
    "barricade",
    "spikes",
    "brimstone",
    "arrow-wall",
    "ripsaw",
    "bouncing-boulder",
    "auto-ballista",
    "haymaker",
  ].map((id, index) => ({
    id,
    source: "trap_roster.png",
    left: columns[index % 4],
    top: [196, 588][Math.floor(index / 4)],
    width: 427,
    height: 241,
  })),
  ...[
    "skeleton",
    "medium-skeleton",
    "armoured-skeleton",
    "skeleton-archer",
    "wargling",
    "ghost",
    "bat-mage",
    "gargoyle",
    "werewolf",
    "troll",
    "shield-brute",
  ].map((id, index) => ({
    id,
    source: "enemy_roster.png",
    left: columns[index % 4],
    top: [196, 739, 1282][Math.floor(index / 4)],
    width: 427,
    height: 427,
  })),
];

async function report(filename) {
  const meta = await sharp(resolve(output, filename), {
    animated: true,
  }).metadata();
  const { size } = await import("node:fs/promises").then(({ stat }) =>
    stat(resolve(output, filename)),
  );
  console.log(
    `${filename}: ${meta.width}×${meta.pageHeight ?? meta.height}, ${meta.pages ?? 1} frame(s), ${Math.round(size / 1024)} KB`,
  );
}

for (const [filename, asset] of Object.entries(screenshotSources)) {
  await sharp(resolve(source, asset.source))
    .resize({ width: asset.width, withoutEnlargement: true })
    .webp({ quality: 85, effort: 4 })
    .toFile(resolve(output, filename));
  await report(filename);
}
for (const [filename, original, width] of [
  ["studio-logo.webp", "broken_robot.png", 1200],
  ["brickhold-logo.webp", "brickhold_logo.png", 1756],
]) {
  await sharp(resolve(source, original))
    .resize({ width, withoutEnlargement: true })
    .webp({ lossless: true, effort: 4 })
    .toFile(resolve(output, filename));
  await report(filename);
}
for (const { id, source: sheet, ...bounds } of rosterCrops) {
  const filename = `catalog/${id}.webp`;
  await sharp(resolve(source, sheet))
    .extract(bounds)
    .webp({ quality: 88, effort: 4 })
    .toFile(resolve(output, filename));
  await report(filename);
}
for (const [name, filename, width] of [
  ["gameplay", "brickhold_gameplay.gif", 640],
  ["horde", "horde_through_traps.gif", 900],
]) {
  const metadata = await sharp(resolve(source, filename), {
    animated: true,
  }).metadata();
  await sharp(resolve(source, filename), { animated: true })
    .resize({ width, withoutEnlargement: true })
    .webp({
      quality: 75,
      effort: 3,
      loop: metadata.loop,
      delay: metadata.delay,
    })
    .toFile(resolve(output, `${name}-loop.webp`));
  await report(`${name}-loop.webp`);
  await sharp(resolve(source, filename), { page: 0, pages: 1 })
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(resolve(output, `${name}-poster.webp`));
  await report(`${name}-poster.webp`);
}
// The robot's head stays separate from the lettering in this crop. Using the
// complete left-side character rectangle would also include part of "BROKEN".
export const faviconCrop = { left: 120, top: 0, width: 450, height: 620 };
await sharp(resolve(source, "broken_robot.png"))
  .extract(faviconCrop)
  .resize({
    width: 64,
    height: 64,
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toFile(resolve(root, "apps/shell/public/favicon.png"));

// Keep the repository self-contained, including existing self-hosted fonts.
await mkdir(resolve(root, "apps/shell/public/fonts"), { recursive: true });
for (const [original, filename] of [
  [
    "node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2",
    "dm-sans-latin.woff2",
  ],
  ["node_modules/@fontsource-variable/dm-sans/LICENSE", "dm-sans-LICENSE.txt"],
  [
    "node_modules/@fontsource/bungee/files/bungee-latin-400-normal.woff2",
    "bungee-latin.woff2",
  ],
  ["node_modules/@fontsource/bungee/LICENSE", "bungee-LICENSE.txt"],
]) {
  await cp(
    resolve(root, original),
    resolve(root, "apps/shell/public/fonts", filename),
  );
}
