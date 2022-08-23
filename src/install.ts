// Copyright 2022 The MathWorks, Inc.

import properties from "./properties.json";
import * as core from "@actions/core";
import * as matlabBatch from "./matlabBatch";
import * as mpm from "./mpm";
import * as script from "./script";

export async function install(platform: string, release: string, products: string[], location: string) {
    let mpmPath: string;
    if (platform === "linux") {
        await core.group("Preparing system for MATLAB", () =>
            script.downloadAndRunScript(platform, properties.matlabDepsUrl, [release])
        );
    }

    await core.group("Setting up matlab-batch", async () =>
        await matlabBatch.setup(platform)
    );

    await core.group("Setting MPM", async () => {
        await mpm.setup(platform);
    });

    await core.group("Setting up MATLAB using MPM", async () => {
        await mpm.install(release, location, products);
    });
    return;
}
