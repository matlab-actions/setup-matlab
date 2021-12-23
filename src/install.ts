// Copyright 2020 The MathWorks, Inc.

import * as core from "@actions/core";
import properties from "./properties.json";
import * as script from "./script";
import * as exec from "@actions/exec";
import * as toolCache from "@actions/tool-cache";

export default install;

/**
 * Set up an instance of MATLAB on the runner.
 *
 * First, system dependencies are installed. Then the ephemeral installer script
 * is invoked.
 *
 * @param platform Operating system of the runner (e.g., "win32" or "linux").
 * @param release Release of MATLAB to be set up (e.g., "latest" or "R2020a").
 * @param products Array of products to install (e.g. [MATLAB Simulink Simulink_Test])
 */
export async function install(platform: string, release: string, products: string[]) {
    // Install runtime system dependencies for MATLAB
    await core.group("Preparing system for MATLAB", () =>
        script.downloadAndRunScript(platform, properties.matlabDepsUrl, [release])
    );

    // Invoke mpm installer to setup a MATLAB on the runner
    await core.group("Setting up MATLAB using MPM", async () => {
        const scriptPath = await toolCache.downloadTool(properties.mpmUrl);
        await exec.exec(`chmod +x ${scriptPath}`);

        const exitCode = await exec.exec(scriptPath, [
            "install",
            "--release=" + release,
            "--destination=/opt/matlab/" + release,
            "--products", products.join(" ")
        ]);

        if (exitCode !== 0) {
            return Promise.reject(Error(`MPM exited with non-zero code ${exitCode}`));
        }
        core.addPath("/opt/matlab/" + release + "/bin");
        
        await script.downloadAndRunScript(platform, properties.matlabBatchInstallerUrl, []);
    });

    return;
}

async function retrieveFromCache(platform:string, release: string, products: string[] ) {

}
