// Copyright 2020-2024 The MathWorks, Inc.

import * as core from "@actions/core";
import * as install from "./install";

/**
 * Gather action inputs and then run action.
 */
export async function run() {
    const platform = process.platform;
    const architecture = process.arch;
    const release = core.getInput("release");
    const source = core.getInput("source");
    const products = core.getMultilineInput("products");
    const cache = core.getBooleanInput("cache");

    if (source !== "") {
        return install.installFromSource(platform, architecture, source, products);
    }
    return install.install(platform, architecture, release, products, cache);
}

run().catch((e) => {
    core.setFailed(e);
});
