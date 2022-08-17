// Copyright 2022 The MathWorks, Inc.

import properties from "./properties.json";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";

export async function setup(platform: string) {
    const mpm = await tc.downloadTool(properties.mpmUrl);
    core.addPath(mpm);
    const exitCode = await exec.exec(`chmod +x ${mpm}`);
    if (exitCode !== 0) {
        return Promise.reject(Error(`Script exited with non-zero code ${exitCode}`));
    }
    return
}

export async function install(release: string, products: string[], location: string) {
    const exitCode = await exec.exec('mpm', [
        "install",
        "--release=" + release,
        "--destination=" + location,
        "--products", products.join(" ")
    ]);

    if (exitCode !== 0) {
        return Promise.reject(Error(`Script exited with non-zero code ${exitCode}`));
    }
    return
}