// Copyright 2020 The MathWorks, Inc.

import * as core from "@actions/core";
import * as install from "./install";

/**
 * Gather action inputs and then run action.
 */
export async function run() {
    const platform = process.platform;
    const release = core.getInput("release");

    return install.install(platform, release,["MATLAB", "Parallel_Computing_Toolbox", "MATLAB_Compiler", "MATLAB_Compiler_SDK"]);
}

run().catch((e) => {
    core.setFailed(e);
});
