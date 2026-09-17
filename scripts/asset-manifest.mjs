// Lists the GLB files present in public/models so the scene can pick
// a real 3D model over the image fallback without runtime directory listing.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const modelsDir = path.join(root, "public/models");

const listGlb = (dir) =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.toLowerCase().endsWith(".glb"))
        .map((f) => f.replace(/\.glb$/i, ""))
        .sort()
    : [];

const manifest = {
  agents: listGlb(path.join(modelsDir, "agents")),
  plants: listGlb(path.join(modelsDir, "plants")),
};

mkdirSync(path.join(root, "lib/generated"), { recursive: true });
writeFileSync(path.join(root, "lib/generated/asset-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`asset manifest: ${manifest.agents.length} agent GLB, ${manifest.plants.length} plant GLB`);
