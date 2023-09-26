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
    // Get release name from input parameter
    let name: string;
    const trimmedRelease = release.toLowerCase().trim()
    if (trimmedRelease === "latest") {
        try {
            const client: http.HttpClient = new http.HttpClient();
            const latestResp = await client.get(properties.matlabLatestReleaseUrl);
            name = await latestResp.readBody();    
        }
        catch {
            return Promise.reject(Error(`Unable to retrieve the MATLAB release information. Contact MathWorks at continuous-integration@mathworks.com if the problem persists.`));
        }
    } else {
        const nameMatch = trimmedRelease.match(/r[0-9]{4}[a-b]/);
        if (!nameMatch) {
            return Promise.reject(Error(`${release} is invalid or unsupported. Specify the value as R2020a or a later release.`));
        }
        name = nameMatch[0];
    }

    // create semantic version of format year.semiannual.update from release
    const year = name.slice(1,5);
    const semiannual = name[5] === "a"? "1": "2";
    const updateMatch = release.toLowerCase().match(/u[0-9]+/);
    let version = `${year}.${semiannual}`;
    let update: string;
    if (updateMatch) {
        update = updateMatch[0]
        version += `.${update[1]}`;
    } else {
        // Notify user if Update version format is invalid
        if (trimmedRelease !== name && trimmedRelease !== "latest") {
            const invalidUpdate = trimmedRelease.replace(name, "");
            return Promise.reject(Error(`${invalidUpdate} is not a valid update release name.`));
        }
        update = "";
        version += ".999"
    }

    return {
        name: name,
        version: version,
        update: update,
    }
}
