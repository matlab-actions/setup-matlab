// Copyright 2020 The MathWorks, Inc.

import * as core from "@actions/core";
import * as install from "./install";

/**
 * Gather action inputs and then run action.
 */
export async function run() {
    const platform = process.platform;
    const release = core.getInput("release");

    return install.install(platform, release);
}

run().catch((e) => {
    core.setFailed(e);
});
