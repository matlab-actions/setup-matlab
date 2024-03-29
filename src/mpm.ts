// Copyright 2022-2024 The MathWorks, Inc.

import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";
import * as path from "path";
import * as matlab from "./matlab";
import properties from "./properties.json";

export async function setup(platform: string, architecture: string): Promise<string> {
    let mpmUrl: string;
    let ext = "";
    if (architecture != "x64" && !(platform == "darwin" && architecture == "arm64")) {
        return Promise.reject(Error(`This action is not supported on ${platform} runners using the ${architecture} architecture.`));
    }
    switch (platform) {
        case "win32":
            mpmUrl = properties.mpmRootUrl + "win64/mpm";
            ext = ".exe";
            break;
        case "linux":
            mpmUrl = properties.mpmRootUrl + "glnxa64/mpm";
            break;
        case "darwin":
            if (architecture == "x64") {
                mpmUrl = properties.mpmRootUrl + "maci64/mpm";
            } else {
                mpmUrl = properties.mpmRootUrl + "maca64/mpm";
            }
            await exec.exec(`sudo launchctl limit maxfiles 65536 200000`, undefined, {ignoreReturnCode: true}); // g3185941
            break;
        default:
            return Promise.reject(Error(`This action is not supported on ${platform} runners using the ${architecture} architecture.`));
    }

    let runner_temp = process.env["RUNNER_TEMP"]
    if (!runner_temp) {
        return Promise.reject(Error("Unable to find runner temporary directory."));
    }
    let mpmDest = path.join(runner_temp, `mpm${ext}`);
    let mpm: string = await tc.downloadTool(mpmUrl, mpmDest);

    const exitCode = await exec.exec(`chmod +x "${mpm}"`);
    if (exitCode !== 0) {
        return Promise.reject(Error("Unable to set up mpm."));
    }
    return mpm
}

export async function install(mpmPath: string, release: matlab.Release, products: string[], destination: string) {
    const mpmRelease = release.name + release.update
    // remove spaces and flatten product list
    let parsedProducts = products.flatMap(p => p.split(/[ ]+/));
    // Add MATLAB by default
    parsedProducts.push("MATLAB");
    // Remove duplicate products
    parsedProducts = [...new Set(parsedProducts)];

    let mpmArguments: string[] = [
        "install",
        `--release=${mpmRelease}`,    
        `--destination=${destination}`,
    ]
    if (release.isPrerelease) {
        mpmArguments = mpmArguments.concat(["--release-status=Prerelease"]);
    }
    mpmArguments = mpmArguments.concat("--products", ...parsedProducts);

    const exitCode = await exec.exec(mpmPath, mpmArguments);
    if (exitCode !== 0) {
        return Promise.reject(Error(`Script exited with non-zero code ${exitCode}`));
    }
    return
}
