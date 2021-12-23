// Copyright 2020 The MathWorks, Inc.

import * as core from "@actions/core";
import properties from "./properties.json";
import * as script from "./script";
import * as exec from "@actions/exec";
import * as toolCache from "@actions/tool-cache";
import * as cache from "@actions/cache";

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


    const matlabLocation = "/opt/matlab/";
    const key = platform + release + products.join("-");
    let cacheKey
 
    await core.group("Retrieving MATLAB from cache if available", async () => {
        cacheKey = await cache.restoreCache([matlabLocation], key);
    });

    if (cacheKey === undefined) {

        // Invoke mpm installer to setup a MATLAB on the runner
        await core.group("Setting up MATLAB using MPM", async () => {
            const scriptPath = await toolCache.downloadTool(properties.mpmUrl);
            await exec.exec(`chmod +x ${scriptPath}`);

            const exitCode = await exec.exec(scriptPath, [
                "install",
                "--release=" + release,
                "--destination=" + matlabLocation + release,
                "--products", products.join(" ")
            ]);

            if (exitCode !== 0) {
                return Promise.reject(Error(`MPM exited with non-zero code ${exitCode}`));
            }
            

        });

        core.addPath("/opt/matlab/" + release + "/bin");
        await script.downloadAndRunScript(platform, properties.matlabBatchInstallerUrl, []);

        await core.group("Saving MATLAB to cache", async () => {
            await cache.saveCache([matlabLocation], key);
        });
        

    }

    return;
}

async function retrieveFromCache(platform:string, release: string, products: string[] ) {
   

}
