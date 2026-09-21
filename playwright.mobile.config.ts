import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/mobile",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://127.0.0.1:3217",
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: process.env.D2S_QA_BROWSER
      ? {
          executablePath: process.env.D2S_QA_BROWSER,
          args: [
            "--no-sandbox",
            "--no-zygote",
            "--use-gl=angle",
            "--use-angle=swiftshader",
            "--enable-unsafe-swiftshader",
          ],
        }
      : {},
  },
  webServer: {
    command: `npm run dev -- ${process.env.D2S_QA_WEBPACK ? "--webpack " : ""}--hostname 127.0.0.1 --port 3217`,
    url: "http://127.0.0.1:3217/images/brand/d2s-aigency.svg",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { NEXT_TELEMETRY_DISABLED: "1" },
  },
});
