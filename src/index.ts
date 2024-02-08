// Copyright 2020-2023 The MathWorks, Inc.

import * as core from "@actions/core";
import * as install from "./install";

/**
 * Gather action inputs and then run action.
 */
export async function run() {
    const platform = process.platform;
    const architecture = process.arch;
    const release = core.getInput("release");
    const products = core.getMultilineInput("products");
    const cache = core.getBooleanInput("cache");
    core.warning("matlab-actions/setup-matlab@v2-beta is no longer supported. Update your workflow to use the most recent version of MATLAB actions (v2).");
    return install.install(platform, architecture, release, products, cache);
}

run().catch((e) => {
    core.setFailed(e);
});
