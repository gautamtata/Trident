import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "proj_asbqfkmwsnmspsuxvwds",
  runtime: "node",
  logLevel: "log",
  maxDuration: 300, // 5 minutes max per task run
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      factor: 1.8,
      minTimeoutInMs: 500,
      maxTimeoutInMs: 30_000,
    },
  },
  dirs: ["./src/trigger"],
});
