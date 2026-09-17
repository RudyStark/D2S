import { chromium } from "@playwright/test";
const out = process.argv[2] ?? "design/captures/reduced-motion-cut.png";
const browser = await chromium.launch({ headless: true, args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("http://localhost:3217/?capture=1", { waitUntil: "load" });
await page.waitForFunction(() => window.__d2s?.store?.getState().ready === true, null, { timeout: 60000 });
const profile = await page.evaluate(() => window.__d2s.store.getState().profile);
const trackH = await page.evaluate(() => document.getElementById("sequence-track").offsetHeight / window.innerHeight);
// Mid-cut: veil should be opaque around p≈0.43
await page.evaluate(() => { const t = document.getElementById("sequence-track"); window.scrollTo(0, (t.offsetHeight - innerHeight) * 0.43); });
await page.waitForFunction(() => window.__d2s.frame.settled, null, { timeout: 20000 });
await new Promise((r) => setTimeout(r, 600));
const veil = await page.evaluate(() => window.__d2s.frame.camera.veil);
await page.screenshot({ path: out });
// Keyboard: first tabbable elements
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise((r) => setTimeout(r, 800));
const tabs = [];
for (let i = 0; i < 12; i++) {
  await page.keyboard.press("Tab");
  tabs.push(await page.evaluate(() => { const a = document.activeElement; return (a?.getAttribute("aria-label") || a?.textContent || a?.tagName || "").trim().slice(0, 40); }));
}
console.log(JSON.stringify({ profile, trackVh: Math.round(trackH * 100), veil, tabs, errors }, null, 1));
await browser.close();
