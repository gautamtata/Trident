import {
  defineConfig
} from "../../../../chunk-R2V5A4WW.mjs";
import "../../../../chunk-P54PR2W2.mjs";
import {
  init_esm
} from "../../../../chunk-HJWMQVLU.mjs";

// trigger.config.ts
init_esm();
var trigger_config_default = defineConfig({
  project: "proj_asbqfkmwsnmspsuxvwds",
  runtime: "node",
  logLevel: "log",
  // 5 minutes max per task run
  maxDuration: 300,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      factor: 1.8,
      minTimeoutInMs: 500,
      maxTimeoutInMs: 3e4
    }
  },
  dirs: ["./src/trigger"],
  build: {}
});
var resolveEnvVars = void 0;
export {
  trigger_config_default as default,
  resolveEnvVars
};
//# sourceMappingURL=trigger.config.mjs.map
