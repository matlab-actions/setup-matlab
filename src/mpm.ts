// Copyright 2022 The MathWorks, Inc.

import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";
import * as path from "path";
import properties from "./properties.json";

export async function setup(platform: string, architecture: string): Promise<string> {
    let mpmUrl: string;
    if (architecture != "x64") {
        return Promise.reject(Error(`This action is not supported on ${platform} runners using the ${architecture} architecture.`));
    }
    switch (platform) {
        case "win32":
            mpmUrl = properties.mpmRootUrl + "win64/mpm";
            break;
        case "linux":
            mpmUrl = properties.mpmRootUrl + "glnxa64/mpm";
            break;
        default:
            return Promise.reject(Error(`This action is not supported on ${platform} runners using the ${architecture} architecture.`));
    }

    let mpm: string = await tc.downloadTool(mpmUrl);
    if (platform === "win32") {
       let mpmExtractedPath: string = await tc.extractZip(mpm);
       mpm = path.join(mpmExtractedPath, "bin", "win64",  "mpm.exe");
    }

    const exitCode = await exec.exec(`chmod +x ${mpm}`);
    if (exitCode !== 0) {
        return Promise.reject(Error("Unable to set up mpm."));
    }
    return mpm
}

export async function install(mpmPath: string, release: string, products: string[], destination: string) {
    // Add MATLAB and PCT by default
    products.push("MATLAB", "Parallel_Computing_Toolbox")
    let mpmArguments: string[] = [
        "install",
        `--release=${release}`,    
        `--destination=${destination}`,
        "--products",
    ]
    mpmArguments = mpmArguments.concat(products);

    const exitCode = await exec.exec(mpmPath, mpmArguments);
    if (exitCode !== 0) {
        return Promise.reject(Error(`Script exited with non-zero code ${exitCode}`));
    }
    core.addPath(path.join(destination, "bin"));
    return
}
