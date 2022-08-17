// Copyright 2022 The MathWorks, Inc.

import * as core from "@actions/core";
import * as install from "./install";

/**
 * Gather action inputs and then run action.
 */
export async function run() {
    const platform = process.platform;
    const location = core.getInput("location");
    const release = core.getInput("release");
    const products = core.getMultilineInput("products");
    return install.install(platform, release, products, location);
}

run().catch((e) => {
    core.setFailed(e);
});
