// Copyright 2020 The MathWorks, Inc.

import * as exec from "@actions/exec";
import * as toolCache from "@actions/tool-cache";

export async function downloadAndRunScript(url: string, platform: string): Promise<void> {
    const scriptPath = await toolCache.downloadTool(url);
    const cmd = generateExecCommand(platform, scriptPath);

    const exitCode = await exec.exec(cmd);

    if (exitCode !== 0) {
        return Promise.reject(Error(`Script exited with non-zero code ${exitCode}`));
    }
}

export function generateExecCommand(platform: string, scriptPath: string): string {
    // Run the install script using bash
    let installCmd = `bash ${scriptPath}`;

    if (platform !== "win32") {
        installCmd = `sudo -E ${installCmd}`;
    }

    return installCmd;
}
