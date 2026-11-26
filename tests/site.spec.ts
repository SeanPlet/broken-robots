import { test, expect, type Page } from "@playwright/test";

const activeCollection = (page: Page) => page.getByRole("tabpanel");
const collectionScreenshotStyle =
  ".site-header, .skip-link { visibility: hidden; }";

async function loadCollectionImages(page: Page) {
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

test("collection tabs support keyboard navigation and show the current kingdom", async ({
  page,
}) => {
  await page.goto("/");
  await waitForGuide(page);
  const traps = page.getByRole("tab", { name: "The traps", exact: true });
  const enemies = page.getByRole("tab", {
    name: "The troublemakers",
    exact: true,
  });
  const kingdoms = page.getByRole("tab", { name: "Kingdoms", exact: true });
  await traps.focus();
  await page.keyboard.press("ArrowRight");
  await expect(enemies).toBeFocused();
  await expect(enemies).toHaveAttribute("aria-selected", "true");
  await expect(activeCollection(page).locator(".guide-card")).toHaveCount(11);
  await page.keyboard.press("End");
  await expect(kingdoms).toBeFocused();
  await expect(kingdoms).toHaveAttribute("aria-selected", "true");
  const map = activeCollection(page).getByRole("article", {
    name: "The Playground",
    exact: true,
  });
  await expect(map).toBeVisible();
  await expect(map.locator("img")).toHaveAttribute("src", /media\/world.webp$/);
  await expect(activeCollection(page).getByRole("article")).toHaveCount(1);
  await expect(
    page.getByRole("heading", {
      name: "Choose your Shardkeeper.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator(".guide-heroes button, .guide-heroes a"),
  ).toHaveCount(0);
  await loadCollectionImages(page);
  await page.locator("#workshop").screenshot({
    path: "test-results/field-guide-kingdoms.png",
    style: collectionScreenshotStyle,
  });
  await page.keyboard.press("Home");
  await expect(traps).toBeFocused();
  await expect(activeCollection(page).locator(".guide-card")).toHaveCount(8);
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
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    for (const tab of ["The traps", "The troublemakers", "Kingdoms"]) {
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

test("reduced-motion visitors receive still images until they choose to play", async ({
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
  await expect(page.locator(".game-visual img")).toHaveAttribute(
    "src",
    /battle.webp$/,
  );
  expect(animatedRequests).toEqual([]);
  await page.getByRole("button", { name: "Fight", exact: true }).click();
  await expect(page.locator(".game-visual img")).toHaveAttribute(
    "src",
    /gameplay-poster.webp$/,
  );
  expect(animatedRequests).toEqual([]);
});

test("game showcase browses actual screenshots and plays clips on request", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Build", exact: true }).click();
  await expect(page.locator(".game-visual img")).toHaveAttribute(
    "src",
    /gameplay.webp$/,
  );
  await expect(page.locator(".game-image-label")).toContainText(
    "In-game screenshot",
  );
  await page.getByRole("button", { name: "The world", exact: true }).click();
  await expect(page.locator(".game-visual img")).toHaveAttribute(
    "src",
    /world.webp$/,
  );
  await page.getByRole("button", { name: "Defend", exact: true }).click();
  await page
    .getByRole("button", { name: "Play gameplay", exact: true })
    .click();
  await expect(page.locator(".game-visual img")).toHaveAttribute(
    "src",
    /horde-loop.webp$/,
  );
  await expect
    .poll(() =>
      page
        .locator(".game-visual img")
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "Stop animation", exact: true })
    .click();
  await expect(page.locator(".game-visual img")).toHaveAttribute(
    "src",
    /battle.webp$/,
  );
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
    /\/broken-robots\/media\/portal.webp$/,
  );
  await expect(page.locator(".intro-game-logo")).toHaveAttribute(
    "src",
    /\/broken-robots\/media\/brickhold-logo.webp$/,
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
  await page.getByRole("tab", { name: "Kingdoms", exact: true }).click();
  await expect(
    activeCollection(page)
      .getByRole("article", { name: "The Playground", exact: true })
      .locator("img"),
  ).toHaveAttribute("src", /\/broken-robots\/media\/world.webp$/);
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
    await page.getByRole("tab", { name: "Kingdoms", exact: true }).click();
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
