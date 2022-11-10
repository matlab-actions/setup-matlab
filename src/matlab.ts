// Copyright 2022 The MathWorks, Inc.

import * as core from "@actions/core";
import * as http from "@actions/http-client";
import * as io from "@actions/io";
import * as tc from "@actions/tool-cache";
import * as fs from "fs";
import properties from "./properties.json";
import * as script from "./script";

export interface Version {
    release: string;
    semantic: string;
}

interface MATLABReleaseInfo {
    latest: string;
    semantic: {
        [release: string]: string | undefined
    }
}

export async function toolcacheLocation(version: Version): Promise<string> {
    let toolpath: string = tc.find("MATLAB", version.semantic);
    if (toolpath) {
        core.info(`Found MATLAB ${version.release} in cache at ${toolpath}`);
    } else {
        fs.writeFileSync(".keep", "");
        toolpath = await tc.cacheFile(".keep", ".keep", "MATLAB", version.semantic);
        io.rmRF(".keep");
    }
    return toolpath
}

export async function setupBatch(platform: string) {
    const batchInstallDir = script.defaultInstallRoot(platform, "matlab-batch")
    await script
        .downloadAndRunScript(platform, properties.matlabBatchUrl, [batchInstallDir])
        .then(() => {
            core.addPath(batchInstallDir);
        });
    return
}

export async function getVersion(release: string): Promise<Version> {
    const client: http.HttpClient = new http.HttpClient();
    const releaseInfo = await client.getJson<MATLABReleaseInfo>(properties.matlabReleaseInfoUrl);

    if (!releaseInfo.result) {
        return Promise.reject(Error(`Unable to retrieve the MATLAB release information. Contact MathWorks at continuous-integration@mathworks.com if the problem persists.`));
    }

    let parsedRelease: string = release.toLowerCase();
    if (parsedRelease === "latest") {
        parsedRelease = releaseInfo.result.latest;
    }

    let parsedSemantic = releaseInfo.result.semantic[parsedRelease];
    if (!parsedSemantic) {
        return Promise.reject(Error(`${release} is invalid or unsupported. Specify the value as R2020a or a later release.`));
    }
    return {
        semantic: parsedSemantic,
        release: parsedRelease,
    }
}
