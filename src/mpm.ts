// Copyright 2022 The MathWorks, Inc.

import properties from "./properties.json";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";

export async function setup(platform: string) {
    const mpm = await tc.downloadTool(properties.mpmUrl);
    const exitCode = await exec.exec(`chmod +x ${mpm}`)
    if (exitCode != 0) {
        Promise.reject(Error("unable to setup mpm"))
    }
    return mpm
}

export async function install(mpmPath: string, release: string, products: string[], location: string) {
    const exitCode = await exec.exec(mpmPath, [
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
