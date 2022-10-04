// Copyright 2022 The MathWorks, Inc.

import properties from "./properties.json";
import * as script from "./script";
import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";
import * as path from "path";

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
    } else {
        const cmd: string = script.generateExecCommand(platform, `chmod +x ${mpm}`);
        const exitCode = await exec.exec(cmd);
        if (exitCode !== 0) {
            return Promise.reject(Error("unable to setup mpm"))
        }
    }
    return mpm
}

export async function install(platform: string, mpmPath: string, release: string, products: string[], destination: string = "") {
    let mpmArguments: string[] = [
        "install",
        `--release=${release}`,    
    ]
    if (destination) {
        mpmArguments.push(`--destination=${destination}`);
    }
    mpmArguments.push("--products", products.join(" "));

    const cmd: string = script.generateExecCommand(platform, mpmPath);

    const exitCode = await exec.exec(cmd, mpmArguments);
    if (exitCode !== 0) {
        return Promise.reject(Error(`Script exited with non-zero code ${exitCode}`));
    }
    return
}