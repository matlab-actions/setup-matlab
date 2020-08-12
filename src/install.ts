import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as toolCache from "@actions/tool-cache";
import properties from "./properties.json";

export async function install(): Promise<void> {
    // Download the install script
    let installScriptPath = await downloadInstaller();

    // Get the appropriate command to run for the platform
    let cmd = generateInstallCommand(process.platform, installScriptPath);

    // Run the command
    return core.group("Setting up MATLAB", async () => {
        let exitCode = await exec.exec(cmd);

        if (exitCode !== 0) {
            return Promise.reject(Error(`MATLAB setup failed with exit code ${exitCode}`));
        }
    });
}

export async function downloadInstaller(): Promise<string> {
    return toolCache.downloadTool(properties.ephemeralInstallerUrl).catch((e) => {
        return Promise.reject(Error(`Failed to download install script: ${e.message}`));
    });
}

export function generateInstallCommand(platform: string, scriptPath: string): string {
    // Run the install script using bash
    let installCmd = `bash ${scriptPath}`;

    if (platform !== "win32") {
        installCmd = `sudo -E ${installCmd}`;
    }

    return installCmd;
}
