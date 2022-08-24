// Copyright 2022 The MathWorks, Inc.

import properties from "./properties.json";
import * as core from "@actions/core";
import * as matlabBatch from "./matlabBatch";
import * as mpm from "./mpm";
import * as script from "./script";

export async function install(platform: string, release: string, products: string[], location: string) {
    let matlabBatchSetup: Promise<void>;
    let systemDeps: Promise<void> = Promise.resolve();
    if (platform === "linux") {
        systemDeps = core.group("Preparing system for MATLAB", async () =>
            await script.downloadAndRunScript(platform, properties.matlabDepsUrl, [release])
        );
    } 

    await core.group("Setting up MATLAB using MPM", async () => {
        matlabBatchSetup = matlabBatch.setup(platform)
        const mpmPath: string = await mpm.setup(platform);
        await mpm.install(mpmPath, release, location, products);
    });

    await core.group("Finalizing Installation", async () => {
        await systemDeps;
        await matlabBatchSetup;
    })
    return;
}
