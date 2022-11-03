// Copyright 2022 The MathWorks, Inc.

import properties from "./properties.json";
import * as script from "./script";
import * as fs from "fs";
import * as core from "@actions/core";
import * as io from "@actions/io"
import * as tc from "@actions/tool-cache";
import * as http from "@actions/http-client"

export interface Version {
    release: string;
    semantic: string;
}

interface MATLABVersionInfo {
    latest: string;
    semantic: {
        [release: string]: string | undefined
    }
}

export async function toolcacheLocation(version: Version): Promise<string> {
    let toolpath: string = tc.find("MATLAB", version.semantic);
    if (toolpath) {
        core.info(`Found MATLAB ${version.release} in cache at ${toolpath}`)
    } else {
        fs.writeFileSync(".cachematlab", "");
        toolpath = await tc.cacheFile(".cachematlab", ".cachematlab", "MATLAB", version.semantic)
        io.rmRF(".cachematlab")
    }
    return toolpath
}

export async function setupBatch(platform: string) {
    const batchInstallDir = script.defaultInstallRoot(platform, "matlab-batch")
    await script
        .downloadAndRunScript(platform, properties.matlabBatchInstallerUrl, [batchInstallDir])
        .then(() => {
            core.addPath(batchInstallDir);
        })
    return
}

export async function getVersion(release: string): Promise<Version> {
    const client: http.HttpClient = new http.HttpClient();
    const versionInfo = await client.getJson<MATLABVersionInfo>(properties.matlabReleaseInfoUrl);

    if (!versionInfo.result) {
        return Promise.reject(Error(`Could not retrieve version info. Contact ci@mathworks.com if this problem persists.`));
    }

    let parsedRelease: string = release.toLowerCase();
    if (parsedRelease === "latest") {
        parsedRelease = versionInfo.result.latest;
    }

    let parsedSemantic = versionInfo.result.semantic[parsedRelease];
    if (!parsedSemantic) {
        return Promise.reject(Error(`Could not find version corresponding to specified release ${release}.`));
    }
    return {
        semantic: parsedSemantic,
        release: parsedRelease,
    }
}
