// Copyright 2020 The MathWorks, Inc.

import * as core from "@actions/core";
import * as script from "./script";
import properties from "./properties.json";

export async function install(platform: string, release: string) {
    // Install runtime system dependencies for MATLAB
    await core.group("Preparing system for MATLAB", () =>
        script.downloadAndRunScript(platform, properties.matlabDepsUrl, [release])
    );

    // Invoke ephemeral installer to setup a MATLAB on the runner
    await core.group("Setting up MATLAB", () =>
        script.downloadAndRunScript(platform, properties.ephemeralInstallerUrl, [
            "--release",
            release,
        ])
    );

    return;
}
