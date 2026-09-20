import { test, expect, type Page } from "@playwright/test";
import { CHAPTERS } from "../../lib/animation/journey";
import { DEPTHS } from "../../types/ocean";

async function openJourney(page: Page) {
  await page.goto("/");
  await expect(page.locator(".expedition")).toHaveAttribute(
    "data-renderer",
    "ready",
  );
}
async function progress(page: Page) {
  return page
    .locator(".expedition")
    .evaluate((element) =>
      Number(
        (element as HTMLElement).style.getPropertyValue("--journey-progress"),
      ),
    );
}
async function scrollToProgress(page: Page, p: number) {
  await page.evaluate((value) => {
    const root = document.querySelector<HTMLElement>(".expedition")!;
    window.scrollTo({
      top: root.offsetTop + (root.offsetHeight - innerHeight) * value,
      behavior: "instant",
    });
  }, p);
  await expect.poll(() => progress(page)).toBeCloseTo(p, 2);
}

for (const [width, height] of [
  [1024, 768],
  [1280, 600],
  [1280, 720],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
]) {
  test(`desktop composition ${width}×${height}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    await openJourney(page);
    const layout = await page.evaluate(() => {
      const copy = document
          .querySelector(".hero-copy")!
          .getBoundingClientRect(),
        facts = document.querySelector(".hero-facts")!.getBoundingClientRect();
      const button = document
          .querySelector(".journey-button")!
          .getBoundingClientRect(),
        footer = document
          .querySelector(".expedition-footer")!
          .getBoundingClientRect();
      return {
        overlap: copy.bottom > facts.top,
        buttonClipped: button.bottom > facts.top,
        footerClipped: footer.bottom > innerHeight,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(layout).toEqual({
      overlap: false,
      buttonClipped: false,
      footerClipped: false,
      overflow: false,
    });
    await expect(page.locator(".space-fallback")).toHaveCSS(
      "visibility",
      "hidden",
    );
    await page.screenshot({
      path: info.outputPath(`hero-${width}-${height}.png`),
    });
    await page.goto("/explore");
    await expect(
      page.getByRole("button", { name: "Download mock profile" }),
    ).toBeEnabled();
    expect(
      await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        clipped:
          document.querySelector(".depth-control")!.getBoundingClientRect()
            .bottom > innerHeight,
        exportClipped:
          document.querySelector(".profile-download")!.getBoundingClientRect()
            .bottom > innerHeight,
      })),
    ).toEqual({ overflow: false, clipped: false, exportClipped: false });
    await page.screenshot({
      path: info.outputPath(`explorer-${width}-${height}.png`),
    });
  });
}

test("chapter navigation lands on visible narrative", async ({ page }) => {
  await openJourney(page);
  await page.getByRole("button", { name: "Begin the descent" }).click();
  await expect(page.locator(".approach-panel")).toHaveCSS("opacity", "1");
  for (const chapter of CHAPTERS) {
    await page
      .getByRole("button", { name: `Go to ${chapter.name}`, exact: true })
      .click();
    await expect(page.locator(".story-panel").nth(chapter.panel)).toHaveCSS(
      "opacity",
      "1",
    );
    await expect(page.locator("[data-chapter]")).toHaveText(chapter.name);
  }
});

test("marine scenes render through the descent without shader errors or fallback Earth", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await openJourney(page);
  for (const p of [0.36, 0.47, 0.55, 0.62, 0.7, 0.78, 0.85, 0.96]) {
    await scrollToProgress(page, p);
    await expect(page.locator(".space-fallback")).toHaveCSS(
      "visibility",
      "hidden",
    );
    if (p >= 0.44)
      await expect(page.locator(".expedition")).toHaveAttribute(
        "data-environment",
        "ocean",
      );
    await page.waitForTimeout(300);
    await page.screenshot({ path: info.outputPath(`scene-${p}.png`) });
  }
  expect(errors).toEqual([]);
  await scrollToProgress(page, 0);
  await expect(page.locator(".opening-panel")).toHaveCSS("opacity", "1");
  await expect(page.locator(".space-fallback")).toHaveCSS(
    "visibility",
    "hidden",
  );
});

test("wheel, resize, refresh, and history keep scroll and depth synchronized", async ({
  page,
}) => {
  await openJourney(page);
  await page.mouse.wheel(0, 1000);
  await expect.poll(() => progress(page)).toBeGreaterThan(0.1);
  await page.mouse.wheel(0, -1000);
  await expect.poll(() => progress(page)).toBeCloseTo(0, 2);
  await scrollToProgress(page, 0.6);
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.waitForTimeout(650);
  await expect.poll(() => progress(page)).toBeCloseTo(0.6, 2);
  await page.reload();
  await expect.poll(() => progress(page)).toBeCloseTo(0.6, 2);
  await scrollToProgress(page, 0.96);
  await page.getByRole("link", { name: "Explore beneath the surface" }).click();
  await page.waitForURL("**/explore");
  await expect(page.locator(".ocean-map")).toBeVisible();
  await page.goBack();
  await page.waitForURL("http://127.0.0.1:3100/");
  await expect.poll(() => progress(page)).toBeCloseTo(0.96, 2);
});

test("reduced motion exposes the whole narrative to assistive technology", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".expedition")).toHaveClass(/reduced-experience/);
  await expect(page.locator(".story-panel[aria-hidden=true]")).toHaveCount(0);
  await expect(page.locator(".experience-canvas canvas")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Explore beneath the surface" }),
  ).toBeVisible();
});

test("WebGL unavailable keeps a usable fallback without renderer errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (/webgl/i.test(type)) return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator(".space-fallback")).toHaveCSS(
    "visibility",
    "visible",
  );
  await scrollToProgress(page, 0.62);
  await expect(page.locator(".space-fallback")).toHaveCSS(
    "visibility",
    "hidden",
  );
  await page.getByRole("link", { name: "Skip to explorer" }).click();
  await page.waitForURL("**/explore");
  expect(errors).toEqual([]);
});

test("explorer depth, location, date, export, and dialog work", async ({
  page,
}) => {
  await page.goto("/explore");
  await expect(
    page.getByRole("button", { name: "Download mock profile" }),
  ).toBeEnabled();
  await expect(page.locator(".explorer-toolbar .layer-control")).toHaveCount(0);
  await expect(page.locator(".explorer-toolbar")).not.toContainText(
    "Observability",
  );
  await expect(page.locator(".explorer-toolbar")).not.toContainText(
    "Uncertainty",
  );
  const depthSelect = page.getByLabel("Choose depth level");
  await expect(depthSelect).toBeVisible();
  for (const depth of DEPTHS) await depthSelect.selectOption(String(depth));
  await expect(page.getByTestId("temperature-output")).toContainText("°C");
  await expect(page.getByTestId("confidence-output")).toContainText("%");
  const profilePoints = page.getByTestId("temperature-profile-point");
  await expect(profilePoints).toHaveCount(15);
  await profilePoints.nth(7).hover();
  const profileTooltip = page.getByTestId("temperature-profile-tooltip");
  await expect(profileTooltip).toBeVisible();
  await expect(profileTooltip).toContainText("Depth:");
  await expect(profileTooltip).toContainText("Temperature:");
  await expect(page.locator(".map-caption")).toContainText("1000 m");
  await page.locator(".ocean-map").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("profile-coordinates")).toContainText(
    "72.25° E",
  );
  await page.getByLabel("Observation date").fill("2026-08-01");
  await expect(
    page.getByRole("button", { name: "Download mock profile" }),
  ).toBeEnabled();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download mock profile" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toContain("2026-08-01");
  const stream = await file.createReadStream();
  let csv = "";
  for await (const chunk of stream!) csv += chunk.toString();
  expect(csv.split("\n")).toHaveLength(16);
  expect(csv).toContain("mock,2026-08-01,12,72.25");
  await page.getByRole("button", { name: "The science", exact: true }).click();
  await expect(page.locator("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).not.toBeVisible();
});
