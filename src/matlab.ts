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
    updateVersion: string;
    semver: string;
}

export interface ToolcacheLocation {
    useExisting: boolean;
    path: string
}

interface MATLABReleaseInfo {
    latest: string;
    semver: {
        [release: string]: string | undefined
    }
}

export async function toolcacheLocation(version: Version): Promise<ToolcacheLocation> {
    let toolpath: string = tc.find("MATLAB", version.semver);
    let useExisting = false;
    if (toolpath) {
        core.info(`Found MATLAB ${version.release} in cache at ${toolpath}.`);
        useExisting = true;
    } else {
        fs.writeFileSync(".keep", "");
        toolpath = await tc.cacheFile(".keep", ".keep", "MATLAB", version.semver);
        io.rmRF(".keep");
    }
    return { path: toolpath, useExisting: useExisting }
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

    let parsedRelease: string = release.toLowerCase().trimStart().trimEnd();
    if (parsedRelease === "latest") {
        parsedRelease = releaseInfo.result.latest;
    }

    // Remove update version
    let parsedSemver = releaseInfo.result.semver[parsedRelease.substring(0,6)];
    let updateVersion = parsedRelease.trimStart().trimEnd().substring(6,parsedRelease.length);
    if ( !updateVersion ) {
        updateVersion = "Latest"
    }
    if (!parsedSemver) {
        return Promise.reject(Error(`${release} is invalid or unsupported. Specify the value as R2020a or a later release.`));
    }
    return {
        semver: parsedSemver,
        release: parsedRelease,
        updateVersion: updateVersion,
    }
}
