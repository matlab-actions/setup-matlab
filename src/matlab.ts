// Copyright 2022-2023 The MathWorks, Inc.

import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as http from "@actions/http-client";
import * as io from "@actions/io";
import * as tc from "@actions/tool-cache";
import * as fs from "fs";
import { homedir } from "os";
import * as path from "path";
import properties from "./properties.json";

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
        if (process.platform == "win32") {
            const runnerTemp = process.env["RUNNER_TEMP"] || "";
            toolpath = path.join(runnerTemp, "MATLAB", release.name);
            await io.mkdirP(toolpath);
        }
        else {
            fs.writeFileSync(".keep", "");
            toolpath = await tc.cacheFile(".keep", ".keep", "MATLAB", release.version);
            io.rmRF(".keep");
        }
    }
    return [toolpath, alreadyExists]
}

export async function setupBatch(platform: string, architecture: string) {
    if (architecture != "x64") {
        return Promise.reject(Error(`This action is not supported on ${platform} runners using the ${architecture} architecture.`));
    }

    let matlabBatchUrl: string;
    let matlabBatchExt: string = "";
    switch (platform) {
        case "win32":
            matlabBatchExt = ".exe";
            matlabBatchUrl = properties.matlabBatchRootUrl + "win64/matlab-batch.exe";
            break;
        case "linux":
            matlabBatchUrl = properties.matlabBatchRootUrl + "glnxa64/matlab-batch";
            break;
        case "darwin":
            matlabBatchUrl = properties.matlabBatchRootUrl + "maci64/matlab-batch";
            break;
        default:
            return Promise.reject(Error(`This action is not supported on ${platform} runners.`));
    }

    let matlabBatch: string = await tc.downloadTool(matlabBatchUrl);
    let cachedPath = await tc.cacheFile(matlabBatch, `matlab-batch${matlabBatchExt}`, "matlab-batch", "v1");
    core.addPath(cachedPath);
    const exitCode = await exec.exec(`chmod +x ${path.join(cachedPath, 'matlab-batch'+matlabBatchExt)}`);
    if (exitCode !== 0) {
        return Promise.reject(Error("Unable to set up mpm."));
    }
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

export function getSupportPackagesPath(platform: string, release: string): string | undefined {
    let supportPackagesDir;
    let capitalizedRelease = release[0].toUpperCase() + release.slice(1, release.length);
    switch (platform) {
        case "win32":
            supportPackagesDir = path.join("C:", "ProgramData", "MATLAB", "SupportPackages", capitalizedRelease);
            break;
        case "linux":
            supportPackagesDir = path.join(homedir(), "Documents", "MATLAB", "SupportPackages", capitalizedRelease);
            break;
        case "darwin":
            supportPackagesDir = path.join(homedir(), "Documents", "MATLAB", "SupportPackages", capitalizedRelease);
            break;
        default:
            throw(`This action is not supported on ${platform} runners.`);
    }
    return supportPackagesDir;
}

