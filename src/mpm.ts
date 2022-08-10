// Copyright 2022 The MathWorks, Inc.

import properties from "./properties.json";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as toolCache from "@actions/tool-cache";
import * as script from "./script";
import * as matlabBatch from "./matlabBatch";

export async function setup(platform: string, release: string) {
    if (platform === "linux") {
        await core.group("Preparing system for MATLAB", () =>
            script.downloadAndRunScript(platform, properties.matlabDepsUrl, [release])
        );
    }

    await core.group("Setting up matlab-batch", async () =>
        await matlabBatch.setup(platform)
    );

    await core.group("Setting MPM", async () => {
        const downloadPath = await toolCache.downloadTool(properties.mpmUrl);
        const mpmDir = await toolCache.cacheFile(downloadPath, 'mpm', 'mpm', 'latest');
        core.addPath(mpmDir);
        // await exec.exec(`chmod +x ${mpmDir}/mpm`);
    });
    return;
}

export async function install(location: string, release: string, products: string[]) {
    await core.group("Setting up MATLAB using MPM", async () => {
        const exitCode = await exec.exec('mpm', [
            "install",
            "--release=" + release,
            "--destination=" + location,
            "--products", products.join(" ")
        ]);

        return
    });
}