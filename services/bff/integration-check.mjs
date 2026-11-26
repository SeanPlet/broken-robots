import assert from "node:assert/strict";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { createBffServer } from "./server.mjs";

// Optional local integration check. Uses the actual shell proxy and browser.
// The BFF uses an ephemeral port; the temporary frontend uses strict port 5174.
const root = fileURLToPath(new URL("../../", import.meta.url));
const previousBffUrl = process.env.VITE_BFF_URL;
const bff = createBffServer();
const requests = [];
bff.on("request", (request) => requests.push(request.url));
let frontend;
let browser;

try {
  bff.listen(0, "127.0.0.1");
  await once(bff, "listening");
  process.env.VITE_BFF_URL = `http://127.0.0.1:${bff.address().port}`;
  const { createServer } = await import("vite");
  frontend = await createServer({
    configFile: `${root}/apps/shell/vite.config.ts`,
    server: { host: "127.0.0.1", port: 5174, strictPort: true },
    logLevel: "error",
  });
  await frontend.listen();
  const base = "http://127.0.0.1:5174";
  const siteResponse = await fetch(`${base}/api/site`);
  assert.equal(siteResponse.status, 200);
  assert.equal((await siteResponse.json()).studio.name, "Broken Robot");
  const catalogResponse = await fetch(`${base}/api/catalog?category=enemies`);
  assert.equal(catalogResponse.status, 200);
  const enemies = await catalogResponse.json();
  assert.equal(enemies.length, 11);
  assert.ok(enemies.every((entry) => entry.category === "enemies"));
  console.log(
    "PASS: actual Vite /api proxy returns BFF site and filtered catalog.",
  );

  const { chromium } = await import("@playwright/test");
  browser = await chromium.launch({
    channel: process.platform === "win32" ? "msedge" : undefined,
    headless: true,
  });
  const page = await browser.newPage();
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  const start = requests.length;
  await page.goto(base);
  await page
    .getByRole("button", { name: "Explore Haymaker", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "The troublemakers" }).click();
  await page
    .getByRole("button", { name: "Explore Gargoyle", exact: true })
    .waitFor();
  assert.ok(
    requests.slice(start).includes("/api/catalog"),
    "Browser catalog request must reach the real BFF.",
  );
  assert.ok(
    requests.slice(start).includes("/api/site"),
    "Browser site request must reach the real BFF.",
  );
  assert.deepEqual(browserErrors, []);
  console.log(
    "PASS: Edge renders the MFEs with live BFF content; guide switches to enemies without errors.",
  );
} finally {
  await browser?.close();
  await frontend?.close();
  bff.closeAllConnections();
  await new Promise((resolve) => bff.close(resolve));
  if (previousBffUrl === undefined) delete process.env.VITE_BFF_URL;
  else process.env.VITE_BFF_URL = previousBffUrl;
}
