import { expect, test } from "@playwright/test";

const STOPS = [
  { name: "00-facade", p: 0 },
  { name: "25-approach", p: 0.25 },
  { name: "45-doors", p: 0.45 },
  { name: "65-threshold", p: 0.65 },
  { name: "100-lobby", p: 1 },
];

declare global {
  interface Window {
    __d2s: {
      frame: { settled: boolean; progress: number };
      store: { getState: () => { ready: boolean } };
    };
  }
}

test.describe("sequence 01 — façade → lobby", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?capture=1");
    await page.waitForFunction(() => window.__d2s?.store.getState().ready === true);
  });

  for (const stop of STOPS) {
    test(`scroll ${stop.name}`, async ({ page }) => {
      await page.evaluate((p) => {
        const track = document.getElementById("sequence-track")!;
        window.scrollTo(0, (track.offsetTop + track.offsetHeight - window.innerHeight) * p);
      }, stop.p);
      await page.waitForFunction(() => window.__d2s.frame.settled);
      await page.waitForTimeout(1500);
      await expect(page).toHaveScreenshot(`${stop.name}.png`);
    });
  }

  test("hero CTAs are real links and the lobby UI is inert at the façade", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("L’agence IA");
    await expect(page.getByRole("link", { name: "Démarrer un projet" })).toHaveAttribute("href", "/contact");
    await expect(page.locator("section[aria-labelledby='mission-title']")).toHaveAttribute("inert", "");
  });
});
