import assert from "node:assert/strict";
import { once } from "node:events";
import { test } from "node:test";
import { createBffServer } from "./server.mjs";

async function withServer(run, options) {
  const server = createBffServer(options);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

test("health responds without exposing environment or file system information", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      status: "ok",
      service: "broken-robots-bff",
    });
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.match(response.headers.get("content-type"), /application\/json/);
  });
});

test("site presents the actual studio identity and development status", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/site`);
    assert.equal(response.status, 200);
    const site = await response.json();
    assert.equal(site.studio.name, "Broken Robot");
    assert.equal(site.studio.email, "hello@brokenrobotstudio.co.za");
    assert.equal(site.game.status, "In development");
    assert.equal(site.maps.length, 2);
    assert.equal(site.maps[0].id, "playground");
    assert.equal(site.maps[0].name, "The Playground");
    assert.equal(site.maps[0].image, "media/playground.webp");
    assert.equal(site.maps[1].id, "windwhistle-mill");
    assert.equal(site.maps[1].name, "WindWhistle Mill");
    assert.equal(site.maps[1].image, "media/windwhistle-mill.webp");
  });
});

test("catalog filters categories without losing entries or crossing categories", async () => {
  await withServer(async (base) => {
    const all = await (await fetch(`${base}/api/catalog`)).json();
    const traps = await (
      await fetch(`${base}/api/catalog?category=traps`)
    ).json();
    const enemies = await (
      await fetch(`${base}/api/catalog?category=enemies`)
    ).json();
    const upgrades = await (
      await fetch(`${base}/api/catalog?category=upgrades`)
    ).json();
    assert.equal(all.length, 44);
    assert.equal(traps.length, 8);
    assert.equal(enemies.length, 11);
    assert.equal(upgrades.length, 25);
    assert.ok(traps.every((entry) => entry.category === "traps"));
    assert.ok(enemies.every((entry) => entry.category === "enemies"));
    assert.ok(upgrades.every((entry) => entry.category === "upgrades"));
    assert.deepEqual(
      new Set([...traps, ...enemies, ...upgrades].map((entry) => entry.id)),
      new Set(all.map((entry) => entry.id)),
    );
    const response = await fetch(`${base}/api/catalog?category=unknown`);
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /traps, enemies or upgrades/);
    assert.equal((await fetch(`${base}/api/catalog?category=`)).status, 400);
  });
});

test("unknown paths and writes return useful HTTP errors", async () => {
  await withServer(async (base) => {
    assert.equal((await fetch(`${base}/missing`)).status, 404);
    const response = await fetch(`${base}/api/site`, { method: "POST" });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "GET");
  });
});

test("a failed content read returns a generic error without leaking server details", async () => {
  const messages = [];
  await withServer(
    async (base) => {
      const response = await fetch(`${base}/api/site`);
      assert.equal(response.status, 500);
      assert.deepEqual(await response.json(), {
        error: "Content is temporarily unavailable.",
      });
      assert.equal(messages.length, 1);
    },
    {
      dataDirectory: new URL("./missing-content/", import.meta.url).pathname,
      logger: { error: (...args) => messages.push(args) },
    },
  );
});
