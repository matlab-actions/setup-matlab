// Copyright 2020-2022 The MathWorks, Inc.

import * as core from "@actions/core";
import * as matlab from "./matlab";
import * as mpm from "./mpm";
import properties from "./properties.json";
import * as script from "./script";

/**
 * Set up an instance of MATLAB on the runner.
 *
 * First, system dependencies are installed. Then the ephemeral installer script
 * is invoked.
 *
 * @param platform Operating system of the runner (e.g. "win32" or "linux").
 * @param architecture Architecture of the runner (e.g. "x64", or "x86").
 * @param release Release of MATLAB to be set up (e.g. "latest" or "R2020a").
 * @param products A list of products to install (e.g. ["MATLAB", "Simulink"]).
 */
export async function install(platform: string, architecture: string, release: string, products: string[]) {
    const version = await matlab.getVersion(release);

    // Install runtime system dependencies for MATLAB on Linux
    if (platform === "linux") {
        await core.group("Preparing system for MATLAB", () =>
            script.downloadAndRunScript(platform, properties.matlabDepsUrl, [version.release.substring(0,6)])
        );
    }

    await core.group("Setting up MATLAB", async () => {
        const mpmPath: string = await mpm.setup(platform, architecture);
        const destination: matlab.ToolcacheLocation = await matlab.toolcacheLocation(version);

        await mpm.install(mpmPath, version.release, products, destination);
        await matlab.setupBatch(platform);
    });

    return;
}
