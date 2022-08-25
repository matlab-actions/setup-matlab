// Copyright 2022 The MathWorks, Inc.
import properties from "./properties.json";
import * as script from "./script";
import * as fs from "fs";
import * as core from "@actions/core";
import * as io from "@actions/io"
import * as tc from "@actions/tool-cache";

export async function toolcacheLocation(release: string): Promise<string> {
    let toolpath: string = tc.find("MATLAB", release);
    if (toolpath) {
        core.info(`Found MATLAB ${release} in cache at ${toolpath}`)
    } else {
        fs.writeFileSync(".cachematlab", "");
        toolpath = await tc.cacheFile(".cachematlab", ".cachematlab", "MATLAB", release)
        io.rmRF(".cachematlab")
    }
    return toolpath
}

export async function setupBatch(platform: string) {
    const batchInstallDir = script.defaultInstallRoot(platform, "matlab-batch")
    await script
        .downloadAndRunScript(platform, properties.matlabBatchInstallerUrl, [batchInstallDir])
        .then(() => {
            core.addPath(batchInstallDir);
        })
    return
}

export function processRelease(releaseInput: string) {
    let release: string = releaseInput;
    if (releaseInput.toLowerCase() === "latest") {
        release = "R2022a";
    }
    return release.toLowerCase()
}