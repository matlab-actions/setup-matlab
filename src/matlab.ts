// Copyright 2022 The MathWorks, Inc.

import * as core from "@actions/core";
import * as http from "@actions/http-client";
import * as io from "@actions/io";
import * as tc from "@actions/tool-cache";
import * as fs from "fs";
import properties from "./properties.json";
import * as script from "./script";

export interface Release {
    name: string;
    version: string;
    update: string;
}

interface MATLABReleaseInfo {
    latest: string;
    version: {
        [release: string]: string | undefined
    }
}

export async function makeToolcacheDir(release: Release): Promise<[string, boolean]> {
    let toolpath: string = tc.find("MATLAB", release.version);
    let alreadyExists = false;
    if (toolpath) {
        core.info(`Found MATLAB ${release.name} in cache at ${toolpath}.`);
        alreadyExists = true;
    } else {
        fs.writeFileSync(".keep", "");
        toolpath = await tc.cacheFile(".keep", ".keep", "MATLAB", release.version);
        io.rmRF(".keep");
    }
    return [toolpath, alreadyExists]
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

export async function getReleaseInfo(release: string): Promise<Release> {
    const client: http.HttpClient = new http.HttpClient();
    const releaseInfo = await client.getJson<MATLABReleaseInfo>(properties.matlabReleaseInfoUrl);

    if (!releaseInfo.result) {
        return Promise.reject(Error(`Unable to retrieve the MATLAB release information. Contact MathWorks at continuous-integration@mathworks.com if the problem persists.`));
    }

    let name: string = release.toLowerCase().trim().substring(0,6);
    if (name === "latest") {
        name = releaseInfo.result.latest;
    }

    // Remove update version
    let version = releaseInfo.result.version[name];
    let update = release.toLowerCase().trim().substring(6,release.length);
    if (!update) {
        update = "latest"
    }
    if (!version) {
        return Promise.reject(Error(`${release} is invalid or unsupported. Specify the value as R2020a or a later release.`));
    }
    return {
        name: name,
        version: version,
        update: update,
    }
}
