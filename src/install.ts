// Copyright 2022 The MathWorks, Inc.

import properties from "./properties.json";
import * as core from "@actions/core";
import * as matlabBatch from "./matlabBatch";
import * as mpm from "./mpm";
import * as script from "./script";

export async function install(platform: string, release: string, products: string[], location: string) {
    let systemDeps: Promise<undefined>;
    let mpmSetup: Promise<void>;
    let batchSetup: Promise<void>;

    if (platform === "linux") {
        await core.group("Preparing system for MATLAB", () =>
            systemDeps = script.downloadAndRunScript(platform, properties.matlabDepsUrl, [release])
        );
    }

    await core.group("Setting up matlab-batch", async () =>
        batchSetup = matlabBatch.setup(platform)
    );

    await core.group("Setting MPM", async () => {
        mpmSetup = mpm.setup(platform)
    });

    await core.group("Setting up MATLAB using MPM", async () => {
        await systemDeps;
        await mpmSetup;
        await mpm.install(release, products, location);
        await batchSetup;
    });
    return;
}
