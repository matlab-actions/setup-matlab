// Copyright 2020-2024 The MathWorks, Inc.

import * as core from "@actions/core";
import * as matlab from "./matlab";
import * as mpm from "./mpm";
import * as path from "path";
import * as cache from "./cache-restore";

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
 * @param useCache whether to use the cache to restore & save the MATLAB installation
 */
export async function install(platform: string, architecture: string, release: string, products: string[], useCache: boolean) {
    const releaseInfo = await matlab.getReleaseInfo(release);
    if (releaseInfo.name < "r2020b") {
        return Promise.reject(Error(`Release '${releaseInfo.name}' is not supported. Use 'R2020b' or a later release.`));
    }

    // Install system dependencies if cloud-hosted
    if (process.env["RUNNER_ENVIRONMENT"] === "github-hosted" && process.env["AGENT_ISSELFHOSTED"] !== "1") {
        await core.group("Preparing system for MATLAB", async () => {
            await matlab.installSystemDependencies(platform, architecture, releaseInfo.name);
        });
    }

    await core.group("Setting up MATLAB", async () => {
        let matlabArch = architecture;
        if (platform === "darwin" && architecture === "arm64" && releaseInfo.name < "r2023b") {
            matlabArch = "x64";
        }

        let [destination, alreadyExists]: [string, boolean] = await matlab.getToolcacheDir(platform, releaseInfo);
        let cacheHit = false;

        if (useCache) {
            const supportFilesDir = matlab.getSupportPackagesPath(platform, releaseInfo.name);
            cacheHit = await cache.restoreMATLAB(releaseInfo, platform, matlabArch, products, destination, supportFilesDir);
        }

        if (!alreadyExists && !cacheHit) {
            const mpmPath: string = await mpm.setup(platform, matlabArch);
            await mpm.install(mpmPath, releaseInfo, products, destination);
        }

        core.addPath(path.join(destination, "bin"));
        core.setOutput('matlabroot', destination);

        await matlab.setupBatch(platform, matlabArch);
    });

    return;
}
