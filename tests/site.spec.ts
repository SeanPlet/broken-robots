import { test, expect, type Page } from "@playwright/test";

const activeCollection = (page: Page) => page.getByRole("tabpanel");
const collectionScreenshotStyle =
  ".site-header, .skip-link { visibility: hidden; }";

async function loadCollectionImages(page: Page) {
  await expect(page.locator(".guide-panels")).not.toHaveAttribute(
    "data-transitioning",
    "true",
  );
  for (const image of await page.locator(".field-guide img:visible").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate(
          (element: HTMLImageElement) =>
            element.complete && element.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
}

async function waitForGuide(page: Page) {
  await expect(
    page.getByRole("tab", { name: "The traps", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(activeCollection(page).locator(".guide-card")).toHaveCount(8);
}

test("all four independent sections render, artwork loads and contact works", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Brickhold", exact: true }),
  ).toBeVisible();
  const heroLinks = page.locator(".intro-actions").getByRole("link");
  await expect(heroLinks).toHaveCount(1);
  await expect(heroLinks).toHaveAccessibleName("Playtest the game now");
  await expect(heroLinks).toHaveAttribute(
    "href",
    "https://brokenrobotstudio.itch.io/brickhold",
  );
  await expect(
    page.getByRole("navigation").getByRole("link", { name: "Contact us" }),
  ).toHaveAttribute("href", "#contact");
  await expect(page.locator("#brickhold")).toBeAttached();
  await expect(page.locator("#workshop")).toBeAttached();
  await expect(page.locator("#contact")).toBeAttached();
  await waitForGuide(page);
  await expect(page.locator(".wordmark img")).toHaveAttribute(
    "src",
    /media\/studio-logo.webp$/,
  );
  await expect(page.locator(".intro-game-logo")).toHaveAttribute(
    "src",
    /media\/brickhold-logo.webp$/,
  );
  await expect(page.locator(".contact-email")).toHaveAttribute(
    "href",
    "mailto:hello@brokenrobotstudio.co.za",
  );
  for (const img of await page.locator("img:visible").all()) {
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        img.evaluate(
          (element: HTMLImageElement) =>
            element.complete && element.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  expect(errors).toEqual([]);
  await page.evaluate(() => document.fonts.ready);
  await page.locator("#workshop").screenshot({
    path: "test-results/field-guide-traps.png",
    style: collectionScreenshotStyle,
  });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: "test-results/site-desktop.png",
    fullPage: true,
  });
  await page.screenshot({ path: "test-results/site-hero.png" });
});

test("production bootstraps content and reuses cached artwork on reload", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) =>
    requests.push(new URL(request.url()).pathname),
  );
  await page.goto("/");
  await waitForGuide(page);
  const hero = page.locator(".intro-world img");
  await expect(hero).toHaveAttribute(
    "src",
    /\/cache\/[a-f0-9]{16}\/media\/portal.webp$/,
  );
  await hero.evaluate((img: HTMLImageElement) => img.decode());
  expect(
    requests.filter((path) => /mfe-manifest\.json$|\/data\//.test(path)),
  ).toEqual([]);
  expect(requests.filter((path) => path.endsWith(".mp4"))).toEqual([]);
  await expect(
    page.locator('link[rel="modulepreload"][href*="/mfe/"]'),
  ).toHaveCount(4);
  await page.reload();
  await waitForGuide(page);
  await hero.evaluate((img: HTMLImageElement) => img.decode());
  const cached = await hero.evaluate((img: HTMLImageElement) =>
    performance.getEntriesByName(img.currentSrc).some((entry) => {
      const resource = entry as PerformanceResourceTiming;
      return resource.transferSize === 0 && resource.decodedBodySize > 0;
    }),
  );
  expect(cached).toBe(true);
});

test("copy feedback leaves the postcard and button size fixed", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        async writeText(text: string) {
          if (document.documentElement.hasAttribute("data-reject-copy")) {
            throw new Error("Clipboard unavailable");
          }
          document.documentElement.dataset.copiedEmail = text;
        },
      },
    });
  });
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/?copy-width=${width}#contact`);
    await page.evaluate(() => document.fonts.ready);
    const card = page.locator(".contact-postcard");
    const button = card.locator(".contact-copy");
    const dimensions = () =>
      card.evaluate((postcard) => {
        const action = postcard.querySelector(".contact-copy")!;
        return [postcard, action].map((element) => {
          const { width, height } = getComputedStyle(element);
          return [width, height];
        });
      });
    await expect(button).toHaveText("Copy email address", {
      useInnerText: true,
    });
    const before = await dimensions();
    await button.click();
    await expect(button).toHaveText("Email copied", { useInnerText: true });
    await expect(page.locator("html")).toHaveAttribute(
      "data-copied-email",
      "hello@brokenrobotstudio.co.za",
    );
    await expect(card.getByRole("status")).toHaveText("Email address copied.");
    expect(await dimensions()).toEqual(before);

    await page
      .locator("html")
      .evaluate((element) => element.setAttribute("data-reject-copy", ""));
    await button.click();
    await expect(button).toHaveText("Could not copy", { useInnerText: true });
    expect(await dimensions()).toEqual(before);
  }
  await expect(page.locator(".contact-copy")).toHaveText("Copy email address", {
    useInnerText: true,
  });
});

test("complete trap and enemy collections are static cards with visible descriptions", async ({
  page,
}) => {
  await page.goto("/");
  await waitForGuide(page);
  for (const [tab, total, names] of [
    [
      "The traps",
      8,
      [
        "Haymaker",
        "Spike Trap",
        "Arrow Wall",
        "Barricade",
        "Brimstone",
        "Ripsaw",
        "Bouncing Boulder",
        "Auto Ballista",
      ],
    ],
    [
      "The troublemakers",
      11,
      [
        "Gargoyle",
        "Werewolf Hunter",
        "Bat Mage",
        "Skeleton",
        "Medium Skeleton",
        "Armoured Skeleton",
        "Skeleton Archer",
        "Wargling",
        "Ghost",
        "Troll",
        "Shield Brute",
      ],
    ],
  ] as const) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    const panel = activeCollection(page);
    await expect(panel.locator(".guide-card")).toHaveCount(total);
    for (const name of names) {
      const card = panel.getByRole("article", { name, exact: true });
      await expect(card).toBeVisible();
      await expect(card.locator(".guide-card-description")).toBeVisible();
      await expect(card.locator(".guide-card-description")).not.toBeEmpty();
      await expect(card.locator("button, a, [tabindex]")).toHaveCount(0);
      await expect(card.locator("img")).toHaveAttribute(
        "src",
        /media\/catalog\/.+\.webp$/,
      );
    }
    await panel.getByRole("article").first().click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator(".guide-pagination")).toHaveCount(0);
  }
  await page.evaluate(() => document.fonts.ready);
  await loadCollectionImages(page);
  await page.locator("#workshop").screenshot({
    path: "test-results/field-guide-enemies.png",
    style: collectionScreenshotStyle,
  });
});

test("upgrade cards show the supplied effects, categories and rarities", async ({
  page,
}) => {
  await page.goto("/");
  await waitForGuide(page);
  await expect(page.getByRole("tab")).toHaveText([
    "Shardkeepers",
    "The traps08",
    "The troublemakers11",
    "Upgrade Cards25",
    "Kingdoms02",
  ]);
  await page.getByRole("tab", { name: "Upgrade Cards", exact: true }).click();
  const panel = activeCollection(page);
  await expect(panel.locator(".guide-collection-intro")).toContainText(
    "between waves",
  );
  await expect(panel.getByRole("article")).toHaveCount(25);
  for (const [name, effect] of [
    ["Sharpened Studs", "Every trap deals 15% more damage."],
    ["Floor Fury", "Floor traps deal 20% more damage."],
    ["Wall Whackers", "Wall traps deal 20% more damage."],
    ["Death from Above", "Ceiling traps deal 20% more damage."],
    ["Quick Mechanisms", "Traps reset 12% faster."],
    ["Giant Slayer", "Traps deal 20% more to Trolls and Shield Brutes."],
    ["Stud Collector", "Defeated enemies drop 15% more studs."],
    ["Discount Day", "New traps cost 10% less."],
    ["Payday", "Wave rewards pay 20% more studs."],
    ["More Bricks!", "Build 2 more free barricades."],
    ["Knight School", "Guard post archers deal 20% more damage."],
    ["Crystal Insurance", "Restore 1 Crystal Heart."],
    ["Extra Padding", "Heroes get 20% more hearts."],
    ["Pack a Punch", "Sword swings deal 12% more damage."],
    ["Quick Feet", "Heroes run 10% faster."],
    ["Lingering Lava", "Brimstone burns last twice as long."],
    ["Extra Quiver", "Arrow walls fire 4 volleys, not 3."],
    ["Double Sweep", "The Ripsaw blade sweeps twice."],
    ["Bigger Boulders", "Boulders are bigger and bounce for longer."],
    ["Free Recruits", "Guard posts cost nothing to recruit."],
    ["Magnet Gloves", "Studs fly to you from much further away."],
    ["Lucky Clover", "Enemies drop hearts twice as often."],
    ["Treasure Hunter", "The treasure chest costs half."],
    ["Free Rebuild", "Each hero's first knock-out costs no Crystal Heart."],
    ["Pawn Shop", "Gain 8,000 studs, lose 2 Crystal Hearts."],
  ]) {
    const card = panel.getByRole("article", { name, exact: true });
    await expect(card.locator(".guide-card-description")).toHaveText(effect);
    await expect(card.locator("button, a, [tabindex]")).toHaveCount(0);
    await expect(card.locator("img")).toHaveAttribute(
      "src",
      /media\/upgrades\/.+\.webp$/,
    );
  }
  await expect(panel.locator(".guide-card-rarity")).toHaveCount(6);
  for (const name of [
    "Sharpened Studs",
    "Quick Mechanisms",
    "Crystal Insurance",
    "Free Recruits",
    "Free Rebuild",
    "Pawn Shop",
  ]) {
    await expect(
      panel
        .getByRole("article", { name, exact: true })
        .locator(".guide-card-rarity"),
    ).toContainText("Rare");
  }
  for (const [category, count] of [
    ["trap", 10],
    ["economy", 6],
    ["defence", 4],
    ["hero", 4],
    ["gamble", 1],
  ] as const) {
    await expect(
      panel.locator(`[data-upgrade-type="${category}"]`),
    ).toHaveCount(count);
  }
  await loadCollectionImages(page);
  await page.locator("#workshop").screenshot({
    path: "test-results/field-guide-upgrades.png",
    style: collectionScreenshotStyle,
  });
});

test("collection tabs support keyboard navigation, Shardkeepers and both kingdoms", async ({
  page,
}) => {
  await page.goto("/");
  await waitForGuide(page);
  const shardkeepers = page.getByRole("tab", { name: "Shardkeepers", exact: true });
  const traps = page.getByRole("tab", { name: "The traps", exact: true });
  const enemies = page.getByRole("tab", {
    name: "The troublemakers",
    exact: true,
  });
  const kingdoms = page.getByRole("tab", { name: "Kingdoms", exact: true });
  const upgrades = page.getByRole("tab", {
    name: "Upgrade Cards",
    exact: true,
  });
  await traps.focus();
  await page.keyboard.press("ArrowRight");
  await expect(enemies).toBeFocused();
  await expect(enemies).toHaveAttribute("aria-selected", "true");
  await expect(activeCollection(page).locator(".guide-card")).toHaveCount(11);
  await page.keyboard.press("ArrowRight");
  await expect(upgrades).toBeFocused();
  await expect(upgrades).toHaveAttribute("aria-selected", "true");
  await expect(activeCollection(page).locator(".guide-card")).toHaveCount(25);
  await page.keyboard.press("End");
  await expect(kingdoms).toBeFocused();
  await expect(kingdoms).toHaveAttribute("aria-selected", "true");
  const map = activeCollection(page).getByRole("article", {
    name: "The Playground",
    exact: true,
  });
  await expect(map).toBeVisible();
  await expect(map.locator("img")).toHaveAttribute(
    "src",
    /media\/playground.webp$/,
  );
  const mill = activeCollection(page).getByRole("article", {
    name: "WindWhistle Mill",
    exact: true,
  });
  await expect(mill).toBeVisible();
  await expect(mill.locator("img")).toHaveAttribute(
    "src",
    /media\/windwhistle-mill.webp$/,
  );
  await expect(mill.locator(".guide-map-note")).toHaveText(
    "Map artwork · In development",
  );
  await expect(kingdoms.locator("span")).toHaveText("02");
  await expect(activeCollection(page).getByRole("article")).toHaveCount(2);
  await expect(
    page.getByRole("heading", {
      name: "Choose your Shardkeeper.",
      exact: true,
    }),
  ).toBeHidden();
  await loadCollectionImages(page);
  await page.locator("#workshop").screenshot({
    path: "test-results/field-guide-kingdoms.png",
    style: collectionScreenshotStyle,
  });
  await page.keyboard.press("Home");
  await expect(shardkeepers).toBeFocused();
  await expect(shardkeepers).toHaveAttribute("aria-selected", "true");
  await expect(activeCollection(page)).toHaveAccessibleName("Shardkeepers");
  await expect(activeCollection(page).getByRole("heading", { name: "Choose your Shardkeeper.", exact: true })).toBeVisible();
  await expect(activeCollection(page).locator(".guide-hero-portrait")).toHaveAttribute("src", /media\/hero.webp$/);
  await expect(page.locator(".guide-heroes")).toHaveCount(1);
  await expect(page.locator(".guide-heroes button, .guide-heroes a")).toHaveCount(0);
  await loadCollectionImages(page);
  await page.locator("#workshop").screenshot({
    path: "test-results/field-guide-shardkeepers.png",
    style: collectionScreenshotStyle,
  });
  await page.keyboard.press("ArrowRight");
  await expect(traps).toBeFocused();
  await expect(activeCollection(page).locator(".guide-card")).toHaveCount(8);
  await page.keyboard.press("ArrowLeft");
  await expect(shardkeepers).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(kingdoms).toBeFocused();
  await expect(kingdoms).toHaveAttribute("aria-selected", "true");
});

test("the illustrated layout fits narrow phones and tablets", async ({
  page,
}) => {
  await page.goto("/");
  await waitForGuide(page);
  await page.evaluate(() => document.fonts.ready);
  for (const width of [320, 768, 900, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    for (const tab of [
      "Shardkeepers",
      "The traps",
      "The troublemakers",
      "Upgrade Cards",
      "Kingdoms",
    ]) {
      await page.getByRole("tab", { name: tab, exact: true }).click();
      const fits = await page.evaluate(() => {
        const title = document.querySelector("h1")!.getBoundingClientRect();
        return (
          document.documentElement.scrollWidth <= window.innerWidth &&
          title.left >= 0 &&
          title.right <= window.innerWidth
        );
      });
      expect(fits, `${tab} layout should fit at ${width}px`).toBe(true);
    }
  }
});

test("intro motion runs gently, pauses on request or offscreen, and respects reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const intro = page.locator(".intro");
  const animations = () =>
    intro.evaluate((element) =>
      element
        .getAnimations({ subtree: true })
        .filter(
          (animation): animation is CSSAnimation =>
            animation instanceof CSSAnimation &&
            animation.animationName.startsWith("intro-"),
        )
        .map((animation) => ({
          name: animation.animationName,
          state: animation.playState,
          time: Number(animation.currentTime),
        })),
    );
  const offsets = () =>
    intro.evaluate((element: HTMLElement) => [
      element.style.getPropertyValue("--scene-x"),
      element.style.getPropertyValue("--scene-y"),
    ]);
  await expect
    .poll(async () =>
      [...new Set((await animations()).map(({ name }) => name))].sort(),
    )
    .toEqual([
      "intro-particle-drift",
      "intro-portal-bloom",
      "intro-scroll-wheel",
      "intro-spark-trail",
      "intro-status-pulse",
    ]);
  const initial = await animations();
  const expectState = async (state: "running" | "paused") => {
    await expect
      .poll(async () =>
        (await animations()).map((animation) => animation.state),
      )
      .toEqual(initial.map(() => state));
  };
  await expectState("running");
  await expect
    .poll(async () =>
      (await animations()).every(
        (animation, index) => animation.time > initial[index].time,
      ),
    )
    .toBe(true);
  const initialOffsets = await offsets();
  await page.mouse.move(200, 250);
  await expect.poll(offsets).not.toEqual(initialOffsets);

  await page.getByRole("button", { name: "Pause decorative motion" }).focus();
  await page.keyboard.press("Enter");
  await expectState("paused");
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const pausedOffsets = await offsets();
  const pausedAnimations = await animations();
  await page.mouse.move(1200, 350);
  await page.mouse.move(1438, 40);
  await page.evaluate(async () => {
    for (let frame = 0; frame < 4; frame++)
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
  });
  expect(await offsets()).toEqual(pausedOffsets);
  expect(await animations()).toEqual(pausedAnimations);

  await page.locator("#contact").scrollIntoViewIfNeeded();
  await expect(intro).not.toBeInViewport();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(intro).toBeInViewport();
  await expectState("paused");
  await page.getByRole("button", { name: "Resume decorative motion" }).click();
  await expectState("running");
  await page.mouse.move(1000, 200);
  await expect.poll(offsets).not.toEqual(pausedOffsets);

  await page.locator("#contact").scrollIntoViewIfNeeded();
  await expect(intro).not.toBeInViewport();
  await expectState("paused");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expectState("running");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".intro-motion-toggle")).toBeHidden();
  await expect.poll(animations).toEqual([]);
  await expect(page.locator(".intro-world")).toHaveCSS("transform", "none");
  const reducedOffsets = await offsets();
  await page.mouse.move(300, 300);
  expect(await offsets()).toEqual(reducedOffsets);
});

test("ambient effects run as their sections enter view and respect the site motion control", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const decorations = [
    ".game-particles i:first-child",
    ".guide-particles i:first-child",
    ".guide-hero-particles i:first-child",
    ".studio-particles i:first-child",
    ".contact-raven",
    ".footer-to-top span",
  ].map((selector) => page.locator(selector));
  await expect(decorations[1]).toHaveCSS("animation-play-state", "paused");

  for (const effect of decorations) {
    await effect.evaluate((element) =>
      element.scrollIntoView({ block: "center", behavior: "instant" }),
    );
    await expect(effect).toHaveCSS("animation-play-state", "running");
  }
  await expect(decorations[1]).toHaveCSS("animation-play-state", "paused");

  await page.getByRole("button", { name: "Pause decorative motion" }).click();
  const raven = page.locator(".contact-raven");
  await raven.evaluate((element) =>
    element.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  await expect(page.locator(".contact-postcard")).toHaveAttribute(
    "data-decoration-in-view",
    "",
  );
  await expect(raven).toHaveCSS("animation-play-state", "paused");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(raven).toHaveCSS("animation-name", "none");
});

test("reduced-motion visitors receive a paused preview until they choose to play", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const animatedRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("-loop.webp"))
      animatedRequests.push(request.url());
  });
  await page.goto("/");
  await waitForGuide(page);
  await page.getByRole("button", { name: "Defend", exact: true }).click();
  const video = page.locator(".game-visual video");
  await expect(video).toHaveAttribute("src", /horde-loop.mp4$/);
  await expect(video).toHaveJSProperty("paused", true);
  await expect(video).toHaveJSProperty("currentTime", 0);
  await page
    .getByRole("button", { name: "Play gameplay", exact: true })
    .click();
  await expect(video).toHaveJSProperty("paused", false);
  await expect
    .poll(() => video.evaluate((clip: HTMLVideoElement) => clip.currentTime))
    .toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(video).toHaveJSProperty("paused", true);
  await expect(
    page.getByRole("button", { name: "Play gameplay", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  expect(animatedRequests).toEqual([]);
  await page.getByRole("button", { name: "Fight", exact: true }).click();
  await expect(
    page.locator('.game-shot[aria-hidden="false"] img'),
  ).toHaveAttribute("src", /hero-fight-07.webp$/);
  await expect(
    page.getByRole("button", { name: "Play gameplay", exact: true }),
  ).toHaveCount(0);
  await expect
    .poll(() =>
      page
        .locator('.game-shot[aria-hidden="false"] img')
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
    )
    .toBe(true);
  expect(animatedRequests).toEqual([]);
});

test("game showcase browses actual screenshots and plays clips on request", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Build", exact: true }).click();
  await expect(
    page.locator('.game-shot[aria-hidden="false"] img'),
  ).toHaveAttribute("src", /gameplay.webp$/);
  await expect(page.locator(".game-image-label")).toContainText(
    "In-game screenshot",
  );
  await page.getByRole("button", { name: "The world", exact: true }).click();
  await expect(
    page.locator('.game-shot[aria-hidden="false"] img'),
  ).toHaveAttribute("src", /world.webp$/);
  await page.getByRole("button", { name: "Defend", exact: true }).click();
  const video = page.locator(".game-visual video");
  await expect(video).toHaveJSProperty("paused", true);
  await expect(video).toHaveAttribute("preload", "none");
  const preview = await video.elementHandle();
  const source = await video.getAttribute("src");
  await page
    .locator(".game-media")
    .screenshot({ path: "test-results/defend-paused.png" });
  await page
    .getByRole("button", { name: "Play gameplay", exact: true })
    .click();
  await expect(video).toHaveJSProperty("paused", false);
  await expect
    .poll(() => video.evaluate((clip: HTMLVideoElement) => clip.currentTime))
    .toBeGreaterThan(0.3);
  expect(
    await video.evaluate((clip, original) => clip === original, preview),
  ).toBe(true);
  await expect(video).toHaveAttribute("src", source!);
  await page
    .getByRole("button", { name: "Pause gameplay", exact: true })
    .click();
  await expect(video).toHaveJSProperty("paused", true);
  const pausedAt = await video.evaluate(
    (clip: HTMLVideoElement) => clip.currentTime,
  );
  expect(pausedAt).toBeGreaterThan(0);
  await page
    .locator(".game-media")
    .screenshot({ path: "test-results/defend-paused-midplay.png" });
  await expect(video).toHaveJSProperty("currentTime", pausedAt);
  await expect(video).toHaveAttribute("src", source!);
  await page
    .getByRole("button", { name: "Play gameplay", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(video).toHaveJSProperty("paused", false);
  await expect
    .poll(() => video.evaluate((clip: HTMLVideoElement) => clip.currentTime))
    .toBeGreaterThan(pausedAt);
  await page.getByRole("button", { name: "Fight", exact: true }).click();
  expect(await preview!.evaluate((clip: HTMLVideoElement) => clip.paused)).toBe(
    true,
  );
  await expect(
    page.locator('.game-shot[aria-hidden="false"] img'),
  ).toHaveAttribute("src", /hero-fight-07.webp$/);
  await expect(
    page.getByRole("button", { name: "Play gameplay", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Defend", exact: true }).click();
  await expect(video).toHaveJSProperty("paused", true);
  await expect(video).toHaveJSProperty("currentTime", 0);
});

test("showcase rotates every 15 seconds from The world and resets on selection", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install({ time: new Date("2026-11-27T10:00:00Z") });
  await page.goto("/");
  await waitForGuide(page);
  await expect(
    page.getByRole("button", { name: "The world", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /slideshow/i })).toHaveCount(0);
  await page.clock.pauseAt(new Date("2026-11-27T10:01:00Z"));
  const tab = (name: string) => page.getByRole("button", { name, exact: true });
  const selected = (name: string) =>
    expect(tab(name)).toHaveAttribute("aria-pressed", "true");

  await tab("The world").click();
  await page.clock.fastForward(14_999);
  await selected("The world");
  await page.clock.fastForward(1);
  await selected("Build");
  for (const name of ["Funnel", "Defend", "Fight", "Guardians", "The world"]) {
    await page.clock.fastForward(15_000);
    await selected(name);
  }

  // Manual changes and reselecting the active tab both restart the timer.
  await page.clock.fastForward(7_000);
  await tab("Funnel").click();
  await page.clock.fastForward(14_999);
  await selected("Funnel");
  await page.clock.fastForward(1);
  await selected("Defend");
  await page.clock.fastForward(7_000);
  await tab("Defend").click();
  await page.clock.fastForward(14_999);
  await selected("Defend");
  await page.clock.fastForward(1);
  await selected("Fight");

  // Automatic navigation uses the same video cleanup as a manual change.
  await tab("Defend").click();
  const video = page.locator(".game-visual video");
  await tab("Play gameplay").click();
  await expect(video).toHaveJSProperty("paused", false);
  await page.clock.fastForward(15_000);
  await selected("Fight");
  await expect(video).toHaveJSProperty("paused", true);
  for (const name of ["Guardians", "The world", "Build", "Funnel", "Defend"]) {
    await page.clock.fastForward(15_000);
    await selected(name);
  }
  await expect(video).toHaveJSProperty("paused", true);
  await expect(video).toHaveJSProperty("currentTime", 0);
});

test("gallery and collection changes blend, resize, and handle rapid selections", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await waitForGuide(page);
  await page.evaluate(() => document.fonts.ready);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const slides = page.locator(".game-slides");
    await page.getByRole("button", { name: "Defend", exact: true }).click();
    await expect(slides).not.toHaveAttribute("data-transitioning", "true");
    await page.getByRole("button", { name: "Build", exact: true }).click();
    const blend = await slides.evaluate((container) => {
      for (const animation of container.getAnimations({ subtree: true })) {
        animation.pause();
        animation.currentTime = 240;
      }
      const opacity = (key: string) =>
        Number(
          getComputedStyle(
            container.querySelector(`[data-panel-key="${key}"]`)!,
          ).opacity,
        );
      return { build: opacity("build"), defend: opacity("defend") };
    });
    expect(blend.build).toBeCloseTo(0.5);
    expect(blend.defend).toBe(1);
    await page
      .locator(".game-media")
      .screenshot({ path: `test-results/gallery-blend-${width}.png` });
    await page.getByRole("button", { name: "Funnel", exact: true }).click();
    const restarted = await slides.evaluate((container) => {
      for (const animation of container.getAnimations({ subtree: true })) {
        animation.pause();
        animation.currentTime = 0;
      }
      const opacity = (key: string) =>
        Number(
          getComputedStyle(
            container.querySelector(`[data-panel-key="${key}"]`)!,
          ).opacity,
        );
      return {
        build: opacity("build"),
        defend: opacity("defend"),
        funnel: opacity("funnel"),
      };
    });
    expect(restarted).toEqual({ ...blend, funnel: 0 });
    await page.getByRole("button", { name: "Guardians", exact: true }).click();
    await expect(slides).not.toHaveAttribute("data-transitioning", "true");
    await expect(
      slides.locator(".game-shot:not([hidden]) img"),
    ).toHaveAttribute("src", /guard-post.webp$/);
    await page.getByRole("button", { name: "Defend", exact: true }).click();
    await expect(slides).not.toHaveAttribute("data-transitioning", "true");
    await expect(slides.locator("video")).toHaveJSProperty("paused", true);

    const panels = page.locator(".guide-panels");
    await page.getByRole("tab", { name: "The traps", exact: true }).click();
    await expect(panels).not.toHaveAttribute("data-transitioning", "true");
    const before = await panels.evaluate(
      (container) => container.getBoundingClientRect().height,
    );
    await page.getByRole("tab", { name: "Kingdoms", exact: true }).click();
    const sizes = await panels.evaluate((container) => {
      for (const animation of container.getAnimations({ subtree: true })) {
        animation.pause();
        animation.currentTime = 240;
      }
      return {
        current: container.getBoundingClientRect().height,
        target: container
          .querySelector('[aria-hidden="false"]')!
          .getBoundingClientRect().height,
      };
    });
    expect(sizes.current).toBeGreaterThan(Math.min(before, sizes.target));
    expect(sizes.current).toBeLessThan(Math.max(before, sizes.target));
    await expect(page.getByRole("tabpanel")).toHaveCount(1);
    await panels.evaluate((container) =>
      container
        .getAnimations({ subtree: true })
        .forEach((animation) => animation.play()),
    );
    await page
      .getByRole("tab", { name: "The troublemakers", exact: true })
      .click();
    await page.getByRole("tab", { name: "The traps", exact: true }).click();
    await expect(panels).not.toHaveAttribute("data-transitioning", "true");
    await expect(activeCollection(page).locator(".guide-card")).toHaveCount(8);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Fight", exact: true }).click();
  await page.getByRole("tab", { name: "Kingdoms", exact: true }).click();
  for (const selector of [".game-slides", ".guide-panels"]) {
    const container = page.locator(selector);
    await expect(container).not.toHaveAttribute("data-transitioning", "true");
    expect(
      await container.evaluate((element) => element.getAnimations().length),
    ).toBe(0);
    await expect(container.locator(":scope > :not([hidden])")).toHaveCount(1);
  }
});

test("a failed remote leaves other sections usable and can retry", async ({
  page,
}) => {
  await page.route("**/mfe/field-guide/entry.js", (route) => route.abort());
  await page.goto("/");
  await expect(
    page.locator('[data-mfe="field-guide"] [role="alert"]'),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Brickhold", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#contact")).toBeAttached();
  await page.unroute("**/mfe/field-guide/entry.js");
  await page
    .locator('[data-mfe="field-guide"]')
    .getByRole("button", { name: "Try again" })
    .click();
  await waitForGuide(page);
});

test("the complete artifact works below a GitHub Pages repository path", async ({
  page,
}) => {
  const failures: string[] = [];
  page.on("response", (response) => {
    if (response.status() >= 400) failures.push(response.url());
  });
  await page.goto("/broken-robots/");
  await waitForGuide(page);
  await expect(page.locator(".intro-world img")).toHaveAttribute(
    "src",
    /\/broken-robots\/cache\/[a-f0-9]{16}\/media\/portal.webp$/,
  );
  await expect(page.locator(".intro-game-logo")).toHaveAttribute(
    "src",
    /\/broken-robots\/cache\/[a-f0-9]{16}\/media\/brickhold-logo.webp$/,
  );
  await expect(page.locator(".game-particles i").first()).toHaveCSS(
    "background-image",
    /\/broken-robots\/cache\/[a-f0-9]{16}\/media\/particle-brick-teal\.png/,
  );
  await page
    .getByRole("tab", { name: "The troublemakers", exact: true })
    .click();
  await expect(activeCollection(page).locator(".guide-card")).toHaveCount(11);
  await expect(
    activeCollection(page).getByRole("article", {
      name: "Werewolf Hunter",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Upgrade Cards", exact: true }).click();
  await expect(activeCollection(page).getByRole("article")).toHaveCount(25);
  await expect(
    activeCollection(page)
      .getByRole("article", { name: "Sharpened Studs", exact: true })
      .locator("img"),
  ).toHaveAttribute(
    "src",
    /\/broken-robots\/cache\/[a-f0-9]{16}\/media\/upgrades\/sharpened-studs.webp$/,
  );
  await loadCollectionImages(page);
  await page.getByRole("tab", { name: "Kingdoms", exact: true }).click();
  await expect(
    activeCollection(page)
      .getByRole("article", { name: "The Playground", exact: true })
      .locator("img"),
  ).toHaveAttribute(
    "src",
    /\/broken-robots\/cache\/[a-f0-9]{16}\/media\/playground.webp$/,
  );
  await expect(
    activeCollection(page)
      .getByRole("article", { name: "WindWhistle Mill", exact: true })
      .locator("img"),
  ).toHaveAttribute(
    "src",
    /\/broken-robots\/cache\/[a-f0-9]{16}\/media\/windwhistle-mill.webp$/,
  );
  await loadCollectionImages(page);
  expect(failures).toEqual([]);
});

test.describe("small screens", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  test("menu, full collections and maps fit a phone", async ({ page }) => {
    await page.goto("/");
    await waitForGuide(page);
    const toggle = page.getByRole("button", { name: /^(Menu|Close)$/ });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Field guide" })
      .click();
    await expect(page.getByRole("button", { name: "Menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(activeCollection(page).locator(".guide-card")).toHaveCount(8);
    await expect(
      activeCollection(page).getByRole("article", {
        name: "Spike Trap",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("tab", { name: "The troublemakers", exact: true })
      .click();
    await expect(activeCollection(page).locator(".guide-card")).toHaveCount(11);
    await page.getByRole("tab", { name: "Upgrade Cards", exact: true }).click();
    await expect(activeCollection(page).getByRole("article")).toHaveCount(25);
    await loadCollectionImages(page);
    await page.locator(".guide-toolbar").screenshot({
      path: "test-results/field-guide-mobile-tabs.png",
      style: collectionScreenshotStyle,
    });
    await activeCollection(page)
      .getByRole("article", { name: "Sharpened Studs", exact: true })
      .screenshot({
        path: "test-results/field-guide-mobile-upgrade.png",
        style: collectionScreenshotStyle,
      });
    await page.getByRole("tab", { name: "Kingdoms", exact: true }).click();
    await expect(activeCollection(page).getByRole("article")).toHaveCount(2);
    await expect(
      activeCollection(page).getByRole("article", {
        name: "WindWhistle Mill",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      activeCollection(page).getByRole("article", {
        name: "The Playground",
        exact: true,
      }),
    ).toBeVisible();
    await loadCollectionImages(page);
    await page.locator("#workshop").screenshot({
      path: "test-results/field-guide-mobile-kingdoms.png",
      style: collectionScreenshotStyle,
    });
    await page.getByRole("tab", { name: "The traps", exact: true }).click();
    await loadCollectionImages(page);
    await page.locator("#contact").scrollIntoViewIfNeeded();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: "test-results/site-mobile.png",
      fullPage: true,
    });
  });
});
