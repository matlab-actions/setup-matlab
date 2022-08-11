// Copyright 2020-2022 The MathWorks, Inc.

import * as core from "@actions/core";
import * as ematlab from "./ematlab";
import * as install from "./install";

/**
 * Gather action inputs and then run action.
 */
export async function run() {
    const platform = process.platform;
    const release = core.getInput("release");
    const skipActivationFlag = ematlab.skipActivationFlag(process.env);
    return install.install(platform, release, skipActivationFlag);
}

run().catch((e) => {
    core.setFailed(e);
});
