// Downloads the CC0 Poly Haven sources used by the scene into .cache/polyhaven (not committed).
// Licence: CC0 (https://polyhaven.com/license). Record every asset in design/ASSETS.md.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const cache = path.join(root, ".cache/polyhaven");
const UA = { "User-Agent": "d2s-studio-asset-pipeline/1.0" };

export const SOURCES = {
  models: ["searsia_lucida", "shrub_04", "potted_plant_02", "pachira_aquatica_01", "potted_plant_01"],
  textures: {
    marble_01: ["Diffuse", "Rough", "nor_gl"],
    white_plaster_02: ["Diffuse", "Rough", "nor_gl"],
    // Pool coping (teak-toned oiled hardwood). 2k colour: the coping passes ~20 cm from the p=0 camera.
    oak_veneer_01: ["Diffuse", "Rough", "nor_gl"],
  },
  /** Textures also fetched at 2k (colour map only). */
  textures2k: { oak_veneer_01: ["Diffuse"] },
  hdris: ["borghese_gardens"],
};

async function save(url, dest) {
  if (existsSync(dest)) return;
  mkdirSync(path.dirname(dest), { recursive: true });
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}
const files = async (id) => (await fetch(`https://api.polyhaven.com/files/${id}`, { headers: UA })).json();

for (const id of SOURCES.models) {
  const g = (await files(id)).gltf["1k"].gltf;
  await save(g.url, path.join(cache, id, path.basename(g.url)));
  for (const [rel, info] of Object.entries(g.include)) await save(info.url, path.join(cache, id, rel));
  console.log("model", id);
}
for (const [id, maps] of Object.entries(SOURCES.textures)) {
  const d = await files(id);
  const label = { Diffuse: "diff", Rough: "rough", nor_gl: "nor" };
  for (const m of maps) await save(d[m]["1k"].jpg.url, path.join(cache, "tex", `${id}_${label[m]}_1k.jpg`));
  for (const m of SOURCES.textures2k[id] ?? []) await save(d[m]["2k"].jpg.url, path.join(cache, "tex", `${id}_${label[m]}_2k.jpg`));
  console.log("texture", id);
}
for (const id of SOURCES.hdris) {
  const d = await files(id);
  await save(d.hdri["1k"].hdr.url, path.join(cache, "hdri", `${id}_1k.hdr`));
  console.log("hdri", id);
}
