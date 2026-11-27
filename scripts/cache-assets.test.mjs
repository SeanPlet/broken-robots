import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fingerprint } from "./cache-assets.mjs";

test("unchanged bytes reuse a cache URL; changed bytes get a separate resource", async () => {
  const directory = await mkdtemp(join(tmpdir(), "brickhold-cache-test-"));
  try {
    const original = await fingerprint(
      directory,
      "media/image.webp",
      Buffer.from("first"),
    );
    assert.equal(
      await fingerprint(directory, "media/image.webp", Buffer.from("first")),
      original,
    );
    const replacement = await fingerprint(
      directory,
      "media/image.webp",
      Buffer.from("second"),
    );
    assert.notEqual(replacement, original);
    assert.equal(await readFile(join(directory, original), "utf8"), "first");
    assert.equal(
      await readFile(join(directory, replacement), "utf8"),
      "second",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
