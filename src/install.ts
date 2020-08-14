// Copyright 2020 The MathWorks, Inc.

import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as toolCache from "@actions/tool-cache";
import properties from "./properties.json";

export async function install(): Promise<void> {
    // Install runtime system dependencies for MATLAB
    await core.group("Preparing system for MATLAB", () =>
        downloadAndRunScript(properties.matlabDepsUrl)
    );

    // Invoke ephemeral installer to setup a MATLAB on the runner
    await core.group("Setting up MATLAB", () =>
        downloadAndRunScript(properties.ephemeralInstallerUrl)
    );

    return;
}

export async function downloadAndRunScript(url: string): Promise<void> {
    const scriptPath = await toolCache.downloadTool(url);
    const cmd = generateInstallCommand(process.platform, scriptPath);

    const exitCode = await exec.exec(cmd);

    if (exitCode !== 0) {
        return Promise.reject(Error(`Script exited with non-zero code ${exitCode}`));
    }
}

export function generateInstallCommand(platform: string, scriptPath: string): string {
    // Run the install script using bash
    let installCmd = `bash ${scriptPath}`;

    if (platform !== "win32") {
        installCmd = `sudo -E ${installCmd}`;
    }

    return installCmd;
}
