// Copyright 2020 The MathWorks, Inc.

import * as core from "@actions/core";
import properties from "./properties.json";
import * as script from "./script";

export default install;

/**
 * Set up an instance of MATLAB on the runner.
 *
 * First, system dependencies are installed. Then the ephemeral installer script
 * is invoked.
 *
 * @param platform Operating system of the runner (e.g., "win32" or "linux").
 * @param release Release of MATLAB to be set up (e.g., "latest" or "R2020a").
 */
export async function install(platform: string, release: string) {
    // Install runtime system dependencies for MATLAB
    await core.group("Preparing system for MATLAB", () =>
        script.downloadAndRunScript(platform, properties.matlabDepsUrl, [release])
    );

    // Invoke ephemeral installer to setup a MATLAB on the runner
    await core.group("Setting up MATLAB using MPM", async () => {
        await script.downloadAndRunScript(platform, properties.ephemeralInstallerUrl, [
            "--release",
            release,
        ]);

        await script.downloadAndRunScript(platform, properties.matlabBatchInstallerUrl, []);
    });

    return;
}
