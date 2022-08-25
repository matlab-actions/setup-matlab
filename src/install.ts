// Copyright 2022 The MathWorks, Inc.

import properties from "./properties.json";
import * as core from "@actions/core";
import * as matlabBatch from "./matlabBatch";
import * as mpm from "./mpm";
import * as script from "./script";

export async function install(platform: string, release: string, products: string[]) {
    let matlabBatchSetup: Promise<void>;
    let systemDeps: Promise<void> = Promise.resolve();

    await core.group("Setting up MATLAB and system dependencies", async () => {
        if (platform === "linux") {
            systemDeps = script.downloadAndRunScript(platform, properties.matlabDepsUrl, [release])
        }     
        matlabBatchSetup = matlabBatch.setup(platform)
        const mpmPath: string = await mpm.setup(platform);
        await mpm.install(mpmPath, release, products);
    });

    await core.group("Finalizing Installation", async () => {
        await systemDeps;
        await matlabBatchSetup;
    })
    return;
}
