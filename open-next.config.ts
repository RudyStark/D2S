import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

/*
 * Cloudflare Workers adapter (OpenNext).
 * Every page is prerendered and nothing revalidates, so the prerendered HTML is served from the Worker's
 * static assets (read-only cache, no KV / R2 / queue to provision).
 * `npm run build` runs the OpenNext build, which calls `build:next` (the plain Next.js build) itself.
 */
export default {
  ...defineCloudflareConfig({
    incrementalCache: staticAssetsIncrementalCache,
  }),
  buildCommand: "npm run build:next",
};
