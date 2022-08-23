// Copyright 2022 The MathWorks, Inc.

import properties from "./properties.json";
import * as script from "./script";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";
import path from "path";

export async function setup(platform: string) {
    const mpmInstallDir: string = process.env.RUNNER_TEMP? process.env.RUNNER_TEMP : script.defaultInstallRoot(platform, "mpm");
    const mpmInstallPath: string = path.join(mpmInstallDir, "mpm");
    const mpm = await tc.downloadTool(properties.mpmUrl, mpmInstallPath);
    const exitCode = await exec.exec(`chmod +x ${mpm}`)
    if (exitCode !== 0) {
        return Promise.reject(Error("unable to setup mpm"))
    }
    await core.addPath(mpm);
    return
}

export async function install(release: string, destination: string, products: string[]) {
    const exitCode = await exec.exec("mpm", [
        "install",
        "--release=" + release,
        "--destination=" + destination,
        "--products", products.join(" ")
    ]);

    if (exitCode !== 0) {
        return Promise.reject(Error(`Script exited with non-zero code ${exitCode}`));
    }
    return
}
