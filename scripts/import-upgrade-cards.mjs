import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

// Crop only the original icon medallions; card text is rendered accessibly in HTML.
// Usage: node scripts/import-upgrade-cards.mjs path/to/upgrade-cards.png
// Run again with upgrade-cards-extra.png to import the ten additional cards.
const source = resolve(
  process.argv[2] ?? resolve(homedir(), "Downloads/upgrade-cards.png"),
);
const output = fileURLToPath(
  new URL("../apps/shell/public/media/upgrades/", import.meta.url),
);
const originalIds = [
  "sharpened-studs",
  "floor-fury",
  "wall-whackers",
  "death-from-above",
  "quick-mechanisms",
  "giant-slayer",
  "stud-collector",
  "discount-day",
  "payday",
  "more-bricks",
  "knight-school",
  "crystal-insurance",
  "extra-padding",
  "pack-a-punch",
  "quick-feet",
];
const extraIds = [
  "lingering-lava",
  "extra-quiver",
  "double-sweep",
  "bigger-boulders",
  "free-recruits",
  "magnet-gloves",
  "lucky-clover",
  "treasure-hunter",
  "free-rebuild",
  "pawn-shop",
];
const metadata = await sharp(source).metadata();
if (metadata.width !== 1280 || ![1680, 1260].includes(metadata.height)) {
  throw new Error(
    "Expected a supplied 1280 x 1680 or 1280 x 1260 upgrade card sheet.",
  );
}
const ids = metadata.height === 1680 ? originalIds : extraIds;
await mkdir(output, { recursive: true });
for (const [index, id] of ids.entries()) {
  await sharp(source)
    .extract({
      left: 152 + (index % 4) * 290,
      top: 76 + Math.floor(index / 4) * 420,
      width: 116,
      height: 116,
    })
    .webp({ lossless: true, effort: 4 })
    .toFile(resolve(output, `${id}.webp`));
}
console.log(`Imported ${ids.length} upgrade icons from the supplied sheet.`);
