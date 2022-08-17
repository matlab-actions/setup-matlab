// Copyright 2022 The MathWorks, Inc.

import properties from "./properties.json";
import * as core from "@actions/core";
import * as script from "./script";

export async function setup(platform: string) {
    const batchInstallDir = script.defaultInstallRoot(platform, "matlab-batch")
    await script
        .downloadAndRunScript(platform, properties.matlabBatchInstallerUrl, [batchInstallDir])
        .then(() => {
            core.addPath(batchInstallDir);
        })
    return
}

