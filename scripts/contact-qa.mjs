// Contact ("Parlons de votre projet") QA, desktop: arrival from the header CTA (veiled jump from the façade),
// from an agent window, from the diagnostic; validation errors; sending and confirmation.
// Usage: node scripts/contact-qa.mjs [--tag X]
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const tag = args.includes("--tag") ? args[args.indexOf("--tag") + 1] : "current";
const out = path.join(root, "design/captures/contact-qa", tag);
mkdirSync(out, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await (await browser.newContext({ viewport: { width: 1672, height: 861 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
const shot = (name) => page.screenshot({ path: path.join(out, `${name}.png`) });
const panelTop = () => page.evaluate(() => Math.round(document.querySelector("#contact [data-status]").getBoundingClientRect().top));

await page.goto("http://localhost:3217/?capture=1", { waitUntil: "load" });
await page.waitForFunction(() => window.__d2s?.store?.getState().ready === true, null, { timeout: 90000 });
await wait(1500);

// 1. Header CTA from the façade: veiled jump.
await page.locator("header").getByRole("link", { name: "Parlons de votre projet" }).click();
await wait(450);
await shot("1-veil");
await wait(2600);
await shot("1-header-arrival");
console.log("header → contact panel top:", await panelTop());

// 2. Empty submit: errors.
await page.evaluate(() => {
  const p = document.querySelector("#contact [data-status]");
  window.scrollTo(0, p.getBoundingClientRect().top + window.scrollY - 90);
});
await wait(2000);
await page.locator("#contact button[type=submit]").click();
await wait(700);
await shot("2-errors");

// 3. From an agent window (Recruter May).
await page.evaluate(() => {
  const el = document.getElementById("nos-agents-ia");
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
});
await wait(2400);
await page.locator("#nos-agents-ia li button").nth(2).click();
await wait(1400);
await page.getByRole("link", { name: /Recruter/ }).click();
await wait(3800);
await shot("3-agent-arrival");

// 4. From the diagnostic (custom agent).
await page.evaluate(() => {
  const p = document.querySelector("#comment-choisir [data-phase]");
  window.scrollTo(0, p.getBoundingClientRect().top + window.scrollY - 150);
});
await wait(2400);
for (const v of ["other", "high"]) {
  await page.locator(`#comment-choisir input[value="${v}"]`).click();
  await wait(900);
}
for (const v of ["software", "sheet"]) await page.locator(`#comment-choisir input[value="${v}"]`).click();
await page.locator("#comment-choisir button[type=submit]").click();
await wait(900);
await page.locator('#comment-choisir input[value="unique"]').click();
await wait(1500);
await page.getByRole("link", { name: "Concevoir mon agent" }).click();
await wait(3800);
await shot("4-diagnostic-arrival");

// 5. Fill and send.
await page.getByLabel("Prénom et nom").fill("Claire Moreau");
await page.getByLabel("E-mail professionnel").fill("claire@ateliernova.fr");
await page.getByLabel("Entreprise").fill("Atelier Nova");
await page.getByLabel("Parlez-nous de votre projet").click();
await wait(400);
await shot("5-typing-hint");
await page.getByLabel("Parlez-nous de votre projet").fill("Nous voulons automatiser le traitement de nos devis dans notre ERP.");
await page.locator("#contact label", { hasText: "Appel" }).click();
await page.locator("#contact input[type=checkbox]").check({ force: true });
await wait(300);
await shot("5-filled");
await page.locator("#contact button[type=submit]").click();
await wait(250);
await shot("6-sending");
await wait(2200);
await shot("7-sent");

await browser.close();
console.log(errors.length ? errors : "no errors", "→", path.relative(root, out));
