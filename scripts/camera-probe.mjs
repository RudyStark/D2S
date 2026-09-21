// Camera probe for composition work: back-projects page points of a frozen view onto world planes
// and projects world points to the page. Needs the dev server (capture mode exposes the camera).
// Usage: node scripts/camera-probe.mjs '{"p":0,"hits":[["name",px,py,"y",0]],"proj":[["name",x,y,z]]}'
import { chromium } from "@playwright/test";
const spec = JSON.parse(process.argv[2]);
const browser = await chromium.launch({ args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await (await browser.newContext({ viewport: { width: 1672, height: 861 } })).newPage();
await page.goto(`http://localhost:3217/?capture=1&p=${spec.p ?? 0}&debugMaterials=1`, { waitUntil: "load" });
await page.waitForFunction(() => window.__d2s?.store?.getState().ready === true && !!window.__d2s.three?.camera, null, { timeout: 90000 });
await new Promise((r) => setTimeout(r, 2500));
const res = await page.evaluate((spec) => {
  const cam = window.__d2s.three.camera;
  cam.updateMatrixWorld();
  const V = cam.position.constructor;
  const W = window.innerWidth, H = window.innerHeight;
  const out = { camera: cam.position.toArray().map((v) => +v.toFixed(3)), fov: cam.fov, hits: {}, proj: {} };
  for (const [name, px, py, axis, value] of spec.hits ?? []) {
    const p = new V((px / W) * 2 - 1, -(py / H) * 2 + 1, 0.5).unproject(cam);
    const d = p.sub(cam.position).normalize();
    const t = (value - cam.position[axis]) / d[axis];
    const w = cam.position.clone().add(d.multiplyScalar(t));
    out.hits[name] = w.toArray().map((v) => +v.toFixed(3));
  }
  for (const [name, x, y, z] of spec.proj ?? []) {
    const v = new V(x, y, z).project(cam);
    out.proj[name] = [+(((v.x + 1) / 2) * W).toFixed(1), +(((1 - v.y) / 2) * H).toFixed(1)];
  }
  return out;
}, spec);
await browser.close();
console.log(JSON.stringify(res));
