// Copyright 2020-2022 The MathWorks, Inc.

import * as core from "@actions/core";
import properties from "./properties.json";
import * as script from "./script";
import * as ematlab from "./ematlab";
import * as matlabBatch from "./matlabBatch";

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
export async function install(platform: string, release: string, skipActivationFlag: string) {
    // Install runtime system dependencies for MATLAB on Linux
    if (platform === "linux") {
        await core.group("Preparing system for MATLAB", () =>
            script.downloadAndRunScript(platform, properties.matlabDepsUrl, [release])
        );
    }

    // Invoke ephemeral installer to setup a MATLAB on the runner
    await core.group("Setting up MATLAB", () =>
        script
            .downloadAndRunScript(platform, properties.ephemeralInstallerUrl, [
                "--release",
                release,
                skipActivationFlag,
            ])
            .then(ematlab.addToPath)
    );

    const batchInstallDir = matlabBatch.installDir(platform);

    await core.group("Setting up matlab-batch", () =>
        script
            .downloadAndRunScript(platform, properties.matlabBatchInstallerUrl, [batchInstallDir])
            .then(() => core.addPath(batchInstallDir))
    )
    return;
}
