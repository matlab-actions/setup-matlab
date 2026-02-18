// Copyright 2020-2024 The MathWorks, Inc.

import * as core from "@actions/core";
import * as install from "./install";

/**
 * Resolve installSysDep tri-state ("true" | "false" | "auto") to a boolean.
 * - "auto": true on GitHub-hosted, false on self-hosted.
 */
function resolveInstallSysDep(): boolean {
  const raw = (core.getInput("installSysDep") || "").trim().toLowerCase();
  const labels = (process.env.RUNNER_LABELS || "").toLowerCase(); // contains "self-hosted" on self-hosted

  if (raw === "true") return true;
  if (raw === "false") return false;

  if (raw === "auto" || raw === "") {
    // GitHub-hosted runners do NOT include "self-hosted" label.
    return !labels.includes("self-hosted");
  }

  core.setFailed(`installSysDep must be "true", "false", or "auto" (got: ${raw})`);
  throw new Error("Invalid installSysDep value");
}

/**
 * Gather action inputs and then run action.
 */
export async function run() {
    const platform = process.platform;
    const architecture = process.arch;
    const release = core.getInput("release");
    const products = core.getMultilineInput("products");
    const cache = core.getBooleanInput("cache");
    const installSysDeps = resolveInstallSysDep();
    return install.install(platform, architecture, release, products, cache, installSysDeps);
}

run().catch((e) => {
    core.setFailed(e);
});
