// Copyright 2020-2023 The MathWorks, Inc.

import * as core from "@actions/core";
import * as matlab from "./matlab";
import * as mpm from "./mpm";
import properties from "./properties.json";
import * as script from "./script";
import * as path from "path";
import * as cache from './cache-restore';

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
export async function install(platform: string, architecture: string, release: string, products: string[], useCache: string) {
    const releaseInfo = await matlab.getReleaseInfo(release);
    if (releaseInfo.name < "r2020b") {
        return Promise.reject(Error(`Release '${releaseInfo.name}' is not supported. Use 'R2020b' or a later release.`));
    }

    // Install runtime system dependencies for MATLAB on Linux
    if (platform === "linux") {
        await core.group("Preparing system for MATLAB", () =>
            script.downloadAndRunScript(platform, properties.matlabDepsUrl, [releaseInfo.name])
        );
    }

    await core.group("Setting up MATLAB", async () => {
        let [destination, alreadyExists]: [string, boolean] = await matlab.makeToolcacheDir(releaseInfo);
        let cacheHit = false;
        if (platform === "darwin") {
            destination = destination + "/MATLAB.app";
        }

        if (useCache.toLowerCase() === "true") {
            cacheHit = await cache.restoreMATLAB(releaseInfo, platform, products, destination);
        }

        if (!alreadyExists && !cacheHit) {
            const mpmPath: string = await mpm.setup(platform, architecture);
            await mpm.install(mpmPath, releaseInfo, products, destination);
        }
        core.addPath(path.join(destination, "bin"));
        core.setOutput('matlabroot', destination);

        await matlab.setupBatch(platform);
    });

    return;
}
