import { test, expect } from "@playwright/test";

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
  await expect(page.locator(".guide-card")).toHaveCount(3);
  await expect(page.locator(".wordmark img")).toHaveAttribute(
    "src",
    /media\/studio-logo.webp$/,
  );
  await expect(page.locator(".intro-game-logo")).toHaveAttribute(
    "src",
    /media\/brickhold-logo.webp$/,
  );
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await expect(page.locator(".contact-email")).toHaveAttribute(
    "href",
    "mailto:hello@brokenrobotstudio.co.za",
  );
  const images = page.locator("img");
  for (const img of await images.all()) {
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
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: "test-results/site-desktop.png",
    fullPage: true,
  });
  await page.screenshot({ path: "test-results/site-hero.png" });
});

test("field guide changes category and its dialog supports keyboard dismissal", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "The troublemakers" }).click();
  await expect(
    page.getByRole("button", { name: "Explore Gargoyle" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Explore Haymaker", exact: true }),
  ).toHaveCount(0);
  const card = page.getByRole("button", { name: "Explore Gargoyle" });
  await card.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "Gargoyle" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(card).toBeFocused();
  await page.getByRole("button", { name: "The traps" }).click();
  await expect(
    page.getByRole("button", { name: "Explore Haymaker", exact: true }),
  ).toBeVisible();
});

test("the illustrated layout fits narrow phones and tablets", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".guide-card")).toHaveCount(3);
  await page.evaluate(() => document.fonts.ready);
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    const fits = await page.evaluate(() => {
      const title = document.querySelector("h1")!.getBoundingClientRect();
      return (
        document.documentElement.scrollWidth <= window.innerWidth &&
        title.left >= 0 &&
        title.right <= window.innerWidth
      );
    });
    expect(fits, `Layout should fit at ${width}px`).toBe(true);
  }
});

test("all eight defenses and eleven enemies can be browsed from the roster", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".guide-card")).toHaveCount(3);
  for (const [category, filter, total] of [
    ["traps", "The traps", 8],
    ["enemies", "The troublemakers", 11],
  ] as const) {
    await page.getByRole("button", { name: filter, exact: true }).click();
    const names = new Set<string>();
    for (let index = 0; index < Math.ceil(total / 3); index++) {
      await expect(
        page.locator('.guide-pagination [role="status"]'),
      ).toContainText(`of ${total}`);
      for (const card of await page.locator(".guide-card").all()) {
        names.add((await card.getAttribute("aria-label"))!);
        await expect(card.locator("img")).toHaveAttribute(
          "src",
          /media\/catalog\/.+\.webp$/,
        );
      }
      const next = page.getByRole("button", {
        name: `Next ${category}`,
        exact: true,
      });
      if (index < Math.ceil(total / 3) - 1) {
        const previousFirst = await page
          .locator(".guide-card")
          .first()
          .getAttribute("aria-label");
        await next.click();
        await expect(page.locator(".guide-card").first()).not.toHaveAttribute(
          "aria-label",
          previousFirst!,
        );
      } else await expect(next).toBeDisabled();
    }
    expect(names.size).toBe(total);
    expect(
      names.has(
        category === "traps" ? "Explore Auto Ballista" : "Explore Shield Brute",
      ),
    ).toBe(true);
    if (category === "enemies")
      expect(names.has("Explore Bat Mage")).toBe(true);
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
  await expect(page.locator(".guide-card")).toHaveCount(3);
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
  await expect(page.locator(".guide-card")).toHaveCount(3);
});

test("the complete artifact works below a GitHub Pages repository path", async ({
  page,
}) => {
  const failures: string[] = [];
  page.on("response", (response) => {
    if (response.status() >= 400) failures.push(response.url());
  });
  await page.goto("/broken-robots/");
  await expect(page.locator(".guide-card")).toHaveCount(3);
  await expect(page.locator(".intro-world img")).toHaveAttribute(
    "src",
    /\/broken-robots\/media\/portal.webp$/,
  );
  await expect(page.locator(".intro-game-logo")).toHaveAttribute(
    "src",
    /\/broken-robots\/media\/brickhold-logo.webp$/,
  );
  await page.getByRole("button", { name: "The troublemakers" }).click();
  await page.getByRole("button", { name: "Explore Werewolf Hunter" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(failures).toEqual([]);
});

test.describe("small screens", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  test("menu, art and dialogs fit a phone", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".guide-card")).toHaveCount(3);
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
    await page.getByRole("button", { name: "Explore Spike Trap" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const box = await page.getByRole("dialog").boundingBox();
    expect(box!.width).toBeLessThanOrEqual(390);
    await page.getByRole("button", { name: "Close artwork details" }).click();
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
