import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/visual",
  timeout: 90_000,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: "disabled" } },
  use: {
    baseURL: process.env.D2S_BASE_URL ?? "http://localhost:3217",
    launchOptions: { args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] },
  },
  webServer: {
    command: "npm run dev -- --port 3217",
    url: "http://localhost:3217",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1672, height: 861 } } },
    { name: "mobile", use: { ...devices["iPhone 13"] } },
  ],
});
