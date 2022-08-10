// Copyright 2022 The MathWorks, Inc.

import * as core from "@actions/core";
import * as mpm from "./mpm";

/**
 * Gather action inputs and then run action.
 */
export async function run() {
    const platform = process.platform;
    const matlabLocation = core.getInput("location");
    const release = core.getInput("release");
    const products = core.getMultilineInput("products");
    await mpm.setup(release, platform);
    return mpm.install(matlabLocation, release, products);
}

run().catch((e) => {
    core.setFailed(e);
});
