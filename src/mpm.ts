// Copyright 2022-2024 The MathWorks, Inc.

import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";
import {rmRF} from "@actions/io";
import * as path from "path";
import * as fs from 'fs';
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
            break;
        default:
            return Promise.reject(Error(`This action is not supported on ${platform} runners using the ${architecture} architecture.`));
    }

    let runner_temp = process.env["RUNNER_TEMP"]
    if (!runner_temp) {
        return Promise.reject(Error("Unable to find runner temporary directory."));
    }
    let mpmDest = path.join(runner_temp, `mpm${ext}`);

    // Delete mpm file if it exists
    if (fs.existsSync(mpmDest)) {
        try {
            fs.unlinkSync(mpmDest);
        } catch (err) {
            return Promise.reject(Error(`Failed to delete existing mpm file: ${err}`));
        }
    }

    let mpm: string = await tc.downloadTool(mpmUrl, mpmDest);

    if (platform !== "win32") {
        const exitCode = await exec.exec(`chmod +x "${mpm}"`);
        if (exitCode !== 0) {
            return Promise.reject(Error("Unable to set up mpm."));
        }
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

    const exitCode = await exec.exec(mpmPath, mpmArguments).catch(async e => {
        // Fully remove failed MATLAB installation for self-hosted runners
        await rmRF(destination);
        throw e;
    });
    if (exitCode !== 0) {
        await rmRF(destination);
        return Promise.reject(Error(`Script exited with non-zero code ${exitCode}`));
    }
    return
}
