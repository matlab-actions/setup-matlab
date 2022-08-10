// Copyright 2022 The MathWorks, Inc.

import properties from "./properties.json";
import path from "path";
import * as core from "@actions/core";
import * as script from "./script";

export async function setup(platform: string) {
    const batchInstallDir = defaultInstallRoot(platform, "matlab-batch")
    script
        .downloadAndRunScript(platform, properties.matlabBatchInstallerUrl, [batchInstallDir])
        .then(() => core.addPath(batchInstallDir))
    
}

export function defaultInstallRoot(platform: string, programName: string) {
    let installRoot : string;
    if (platform === "win32") {
        installRoot = path.join("C:","Program Files", programName);
    } else {
        installRoot = path.join("/","opt",programName);
    }
    return installRoot
}