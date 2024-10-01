// Copyright 2022-2024 The MathWorks, Inc.

import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as http from "@actions/http-client";
import * as io from "@actions/io";
import * as tc from "@actions/tool-cache";
import * as fs from "fs";
import { homedir } from "os";
import * as path from "path";
import properties from "./properties.json";
import * as script from "./script";

export interface Release {
    name: string;
    version: string;
    update: string;
    isPrerelease: boolean;
}

export async function getToolcacheDir(platform: string, release: Release): Promise<[string, boolean]> {
    let toolpath: string = tc.find("MATLAB", release.version);
    let alreadyExists = false;
    if (toolpath) {
        core.info(`Found MATLAB ${release.name} in cache at ${toolpath}.`);
        alreadyExists = true;
    } else {
        toolpath = await makeToolcacheDir(platform, release);
    }
    if (platform == "darwin") {
        toolpath = toolpath + "/MATLAB.app";
    }
    return [toolpath, alreadyExists]
}

async function makeToolcacheDir(platform: string, release: Release): Promise<string> {
    let toolcacheDir: string;
    if (platform === "win32") {
        toolcacheDir = await makeWindowsHostedToolpath(release)
            .catch(async () => await makeDefaultToolpath(release));
    } else {
        toolcacheDir = await makeDefaultToolpath(release);
    }
    return toolcacheDir;
}

async function makeWindowsHostedToolpath(release: Release): Promise<string> {
    // bail early if not on a github hosted runner
    if (process.env['RUNNER_ENVIRONMENT'] !== 'github-hosted' && process.env['AGENT_ISSELFHOSTED'] === '1') {
        return Promise.reject();
    }

    const defaultToolCacheRoot = process.env['RUNNER_TOOL_CACHE'];
    if (!defaultToolCacheRoot) {
        return Promise.reject();
    }

    // make sure runner has expected directory structure
    if (!fs.existsSync('d:\\') || !fs.existsSync('c:\\')) {
        return Promise.reject();
    }

    const actualToolCacheRoot = defaultToolCacheRoot.replace("C:", "D:").replace("c:", "d:");
    process.env['RUNNER_TOOL_CACHE'] = actualToolCacheRoot;

    try {
        // create install directory and link it to the toolcache directory
        fs.writeFileSync(".keep", "");
        let actualToolCacheDir = await tc.cacheFile(".keep", ".keep", "MATLAB", release.version);
        await io.rmRF(".keep");
        let defaultToolCacheDir = actualToolCacheDir.replace(actualToolCacheRoot, defaultToolCacheRoot);

        // remove cruft from incomplete installs
        await io.rmRF(defaultToolCacheDir);

        // link to actual tool cache directory
        fs.mkdirSync(path.dirname(defaultToolCacheDir), {recursive: true});
        fs.symlinkSync(actualToolCacheDir, defaultToolCacheDir, 'junction');

        // .complete file is required for github actions to make the cacheDir persistent
        const actualToolCacheCompleteFile = `${actualToolCacheDir}.complete`;
        const defaultToolCacheCompleteFile = `${defaultToolCacheDir}.complete`;
        await io.rmRF(defaultToolCacheCompleteFile);
        fs.symlinkSync(actualToolCacheCompleteFile, defaultToolCacheCompleteFile, 'file');

        return actualToolCacheDir;
    } finally {
        process.env['RUNNER_TOOL_CACHE'] = defaultToolCacheRoot;
    }
}

async function makeDefaultToolpath(release: Release): Promise<string> {
    fs.writeFileSync(".keep", "");
    let toolpath = await tc.cacheFile(".keep", ".keep", "MATLAB", release.version);
    await io.rmRF(".keep");
    return toolpath
}

export async function setupBatch(platform: string, architecture: string) {
    if (architecture != "x64" && !(platform == "darwin" && architecture == "arm64")) {
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
            if (architecture == "x64") {
                matlabBatchUrl = properties.matlabBatchRootUrl + "maci64/matlab-batch";
            } else {
                matlabBatchUrl = properties.matlabBatchRootUrl + "maca64/matlab-batch";
            }
            break;
        default:
            return Promise.reject(Error(`This action is not supported on ${platform} runners.`));
    }

    let matlabBatch: string = await tc.downloadTool(matlabBatchUrl);
    let cachedPath = await tc.cacheFile(matlabBatch, `matlab-batch${matlabBatchExt}`, "matlab-batch", "v1");
    core.addPath(cachedPath);
    if (platform !== "win32") {
        const exitCode = await exec.exec(`chmod +x ${path.join(cachedPath, 'matlab-batch'+matlabBatchExt)}`);
        if (exitCode !== 0) {
            return Promise.reject(Error("Unable to make matlab-batch executable."));
        }
    }
    return
}

export async function getReleaseInfo(release: string): Promise<Release> {
    // Get release name from input parameter
    let name: string;
    let isPrerelease: boolean = false;
    const trimmedRelease = release.toLowerCase().trim()
    if (trimmedRelease === "latest" || trimmedRelease === "latest-including-prerelease") {
        try {
            const client: http.HttpClient = new http.HttpClient(undefined, [], { allowRetries: true, maxRetries: 3 });
            const latestResp = await client.get(`${properties.matlabReleaseInfoUrl}${trimmedRelease}`);
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
        if (trimmedRelease !== name && trimmedRelease !== "latest" && trimmedRelease !== "latest-including-prerelease") {
            const invalidUpdate = trimmedRelease.replace(name, "");
            return Promise.reject(Error(`${invalidUpdate} is not a valid update release name.`));
        }
        update = "";
        version += ".999"
        if (name.includes("prerelease")) {
            name = name.replace("prerelease", "")
            version += "-prerelease";
            isPrerelease = true;
        }
    }

    return {
        name: name,
        version: version,
        update: update,
        isPrerelease: isPrerelease,
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
        case "darwin":
            supportPackagesDir = path.join(homedir(), "Documents", "MATLAB", "SupportPackages", capitalizedRelease);
            break;
        default:
            throw(`This action is not supported on ${platform} runners.`);
    }
    return supportPackagesDir;
}

export async function installSystemDependencies(platform: string, architecture: string, release: string) {
    if (platform === "linux") {
        return script.downloadAndRunScript(platform, properties.matlabDepsUrl, [release]);
    } else if (platform === "darwin" && architecture === "arm64") {
        if (release < "r2023b") {
            return installAppleSiliconRosetta();
        } else {
            return installAppleSiliconJdk();
        }
    }
}

async function installAppleSiliconRosetta() {
    const exitCode = await exec.exec(`sudo softwareupdate --install-rosetta --agree-to-license`);
    if (exitCode !== 0) {
        return Promise.reject(Error("Unable to install Rosetta 2."));
    }
}

async function installAppleSiliconJdk() {
    const jdkPath = path.join(process.env["RUNNER_TEMP"] ?? "", "jdk.pkg");
    await io.rmRF(jdkPath);
    const jdk = await tc.downloadTool(properties.appleSiliconJdkUrl, jdkPath);
    const exitCode = await exec.exec(`sudo installer -pkg "${jdk}" -target /`);
    if (exitCode !== 0) {
        return Promise.reject(Error("Unable to install Java runtime."));
    }
}
