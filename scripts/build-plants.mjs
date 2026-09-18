// Builds web-ready vegetation GLBs from the Poly Haven sources in .cache/polyhaven.
// One GLB per variant, pivot at the base, alpha-tested leaves, meshopt + WebP.
// Usage: node scripts/fetch-polyhaven.mjs && node scripts/build-plants.mjs
import { mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { center, dedup, meshopt, prune, quantize, simplify, textureCompress, weld } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const cache = path.join(root, ".cache/polyhaven");
const out = path.join(root, "public/models/plants");
mkdirSync(out, { recursive: true });

await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });

/**
 * name → source, nodes kept (by name), primitives dropped by material name, simplify ratio.
 * Exterior: searsia (olive-like small-leaf trees), shrub_04 (low shrubs).
 * Interior: potted_plant_02 (large tropical leaves), pachira (indoor trees), potted_plant_01 (ficus-like).
 */
const BUILDS = [
  { name: "olive_a", src: "searsia_lucida", keep: ["searsia_lucida_a_LOD0"], ratio: 0.45 },
  { name: "olive_b", src: "searsia_lucida", keep: ["searsia_lucida_b_LOD0"], ratio: 0.5 },
  { name: "olive_c", src: "searsia_lucida", keep: ["searsia_lucida_d_LOD0"], ratio: 0.55 },
  { name: "shrub", src: "shrub_04", keep: ["shrub_04"], ratio: 0.8 },
  { name: "tropical", src: "potted_plant_02", keep: ["potted_plant_02_leaves", "potted_plant_02_dirt"], dropMaterials: [/_pot$/], ratio: 0.6 },
  { name: "ficus", src: "potted_plant_01", keep: ["potted_plant_01_stem", "potted_plant_01_leaves"], dropMaterials: [/_pot$/], ratio: 0.35 },
  { name: "pachira_a", src: "pachira_aquatica_01", keep: ["pachira_aquatica_01_bark_c", "pachira_aquatica_01_leaves_c"], ratio: 0.6 },
  { name: "pachira_b", src: "pachira_aquatica_01", keep: ["pachira_aquatica_01_bark_d", "pachira_aquatica_01_leaves_d"], ratio: 0.55 },
];

for (const b of BUILDS) {
  const gltf = path.join(cache, b.src, `${b.src}_1k.gltf`);
  const doc = await io.read(gltf);
  const scene = doc.getRoot().getDefaultScene();

  for (const node of scene.listChildren()) {
    if (!b.keep.includes(node.getName())) {
      node.dispose();
      continue;
    }
    // Variants are laid out side by side in the source: bring each to the origin.
    const [, y] = node.getTranslation();
    node.setTranslation([0, y, 0]);
  }

  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const mat = prim.getMaterial();
      if (mat && b.dropMaterials?.some((re) => re.test(mat.getName()))) prim.dispose();
    }
  }

  for (const mat of doc.getRoot().listMaterials()) {
    if (/leaves|twigs/i.test(mat.getName())) {
      mat.setAlphaMode("MASK").setAlphaCutoff(0.45).setDoubleSided(true);
    }
  }

  await doc.transform(
    prune(),
    center({ pivot: "below" }),
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: b.ratio, error: 0.004 }),
    dedup(),
    textureCompress({ encoder: sharp, targetFormat: "webp", slots: /^(baseColor)/, resize: [1024, 1024], quality: 86 }),
    textureCompress({ encoder: sharp, targetFormat: "webp", slots: /^(normal|metallicRoughness|occlusion)/, resize: [512, 512], quality: 82 }),
    prune(),
    quantize(),
    meshopt({ encoder: MeshoptEncoder, level: "medium" }),
  );

  const file = path.join(out, `${b.name}.glb`);
  await io.write(file, doc);
  const tris = doc
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((n, p) => n + (p.getIndices()?.getCount() ?? 0) / 3, 0);
  console.log(`${b.name.padEnd(10)} ${(statSync(file).size / 1024).toFixed(0).padStart(5)} KB  ${Math.round(tris)} tris`);
}
