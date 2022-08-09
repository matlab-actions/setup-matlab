// Copyright 2022 The MathWorks, Inc.
import path from "path";

export function installDir(platform: string) {
    let batchInstallDir : string;
    if (platform === "win32") {
        batchInstallDir = path.join("C:","Program Files", "matlab-batch");
    } else {
        batchInstallDir = path.join("/","opt","matlab-batch");
    }
    return batchInstallDir
}