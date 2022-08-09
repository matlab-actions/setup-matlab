// Copyright 2022 The MathWorks, Inc.
import path from "path";

export function installDir(platform: string) {
    let batchInstallDir : string;
    if (platform === "win32") {
        let rootDrive = (process.env['GITHUB_WORKSPACE'] || 'C:').slice(0,2);
        batchInstallDir = path.join(rootDrive,"Program Files", "matlab-batch");
    } else {
        batchInstallDir = path.join("/","opt","matlab-batch");
    }
    return batchInstallDir
}