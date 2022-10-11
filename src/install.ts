// Copyright 2022 The MathWorks, Inc.

import properties from "./properties.json";
import * as core from "@actions/core";
import * as matlab from "./matlab";
import * as mpm from "./mpm";
import * as script from "./script";

export async function install(platform: string, architecture: string, release: string, products: string[]) {
    const version = await matlab.getVersion(release);

    // Install runtime system dependencies for MATLAB on Linux
    if (platform === "linux") {
        await core.group("Preparing system for MATLAB", () =>
            script.downloadAndRunScript(platform, properties.matlabDepsUrl, [version.release])
        );
    }

    await core.group("Setting up MATLAB", async () => {
        const mpmPath: string = await mpm.setup(platform, architecture);
        const destination: string = await matlab.toolcacheLocation(version);

        await mpm.install(mpmPath, version.release, products, destination);
        await matlab.setupBatch(platform)
    });

    return;
}
