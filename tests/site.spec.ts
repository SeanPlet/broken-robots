import { test, expect } from "@playwright/test";

test("all four independent sections render, artwork loads and contact works", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Small studio. Big play." }),
  ).toBeVisible();
  await expect(page.locator("#brickhold")).toBeAttached();
  await expect(page.locator("#workshop")).toBeAttached();
  await expect(page.locator("#contact")).toBeAttached();
  await expect(page.locator(".guide-card")).toHaveCount(3);
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
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: "test-results/site-desktop.png",
    fullPage: true,
  });
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
    page.getByRole("button", { name: "Explore The Haymaker" }),
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
    page.getByRole("button", { name: "Explore The Haymaker" }),
  ).toBeVisible();
});

test("game showcase switches from concept art to real prototype capture", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "In the engine" }).click();
  await expect(page.locator(".game-visual img")).toHaveAttribute(
    "src",
    /gameplay.webp$/,
  );
  await expect(page.locator(".game-image-label")).toContainText(
    "Prototype gameplay",
  );
  await page.getByRole("button", { name: "The vision" }).click();
  await expect(page.locator(".game-image-label")).toContainText("Concept art");
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
    page.getByRole("heading", { name: "Small studio. Big play." }),
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
  await expect(page.locator(".intro img")).toHaveAttribute(
    "src",
    /\/broken-robots\/media\/portal.webp$/,
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
      .getByRole("link", { name: "The workshop" })
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
