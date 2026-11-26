import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Run after import-assets.mjs. Pass an FFmpeg 9+ executable if it is not on PATH.
// Decode the committed animated WebP so the original Downloads are not needed.
const media = fileURLToPath(
  new URL("../apps/shell/public/media/", import.meta.url),
);
const result = spawnSync(
  process.argv[2] ?? "ffmpeg",
  [
    "-hide_banner",
    "-y",
    "-i",
    `${media}horde-loop.webp`,
    "-an",
    "-c:v",
    "libx264",
    "-crf",
    "18",
    "-preset",
    "slow",
    "-pix_fmt",
    "yuv420p",
    "-fps_mode",
    "vfr",
    "-movflags",
    "+faststart",
    `${media}horde-loop.mp4`,
  ],
  { stdio: "inherit" },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
