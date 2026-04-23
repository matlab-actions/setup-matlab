// Copyright 2020-2026 The MathWorks, Inc.

import * as core from "@actions/core";
import * as matlab from "./matlab.js";
import * as mpm from "./mpm.js";
import * as path from "path";
import * as cache from "./cache-restore.js";
import { State } from "./install-state.js";

export function resolveInstallDependencies(input: string): boolean {
    const normalized = (input ?? "").trim().toLowerCase();

    if (normalized === "true") {
        return true;
    }

    if (normalized === "false") {
        return false;
    }

    if (normalized === "auto") {
        // detect runner type and provide value accordingly
        const runnerEnvironment = process.env["RUNNER_ENVIRONMENT"];
        const agentIsSelfHosted = process.env["AGENT_ISSELFHOSTED"];

        const isGitHubHosted = runnerEnvironment === "github-hosted" && agentIsSelfHosted !== "1";

        core.info(`Auto-detected runner type: ${isGitHubHosted ? "GitHub-hosted" : "self-hosted"}`);
        core.info(
            `System dependencies will ${isGitHubHosted ? "be" : "not be"} installed (auto mode)`,
        );

        return isGitHubHosted;
    }
    throw new Error(
        `Invalid value for install-system-dependencies: "${input}". Must be "auto", "true", or "false".`,
    );
}

/**
 * Set up an instance of MATLAB on the runner.
 *
 * First, system dependencies are installed (if enabled). Then the ephemeral installer script
 * is invoked.
 *
 * @param platform Operating system of the runner (e.g. "win32" or "linux").
 * @param architecture Architecture of the runner (e.g. "x64", or "x86").
 * @param release Release of MATLAB to be set up (e.g. "latest" or "R2020a").
 * @param products A list of products to install (e.g. ["MATLAB", "Simulink"]).
 * @param useCache whether to use the cache to restore & save the MATLAB installation
 * @param installSystemDeps Input value for install-system-dependencies ("auto" | "true" | "false")
 */

export async function install(
    platform: string,
    architecture: string,
    release: string,
    products: string[],
    useCache: boolean,
    installSystemDeps: string,
) {
    const releaseInfo = await matlab.getReleaseInfo(release);
    if (releaseInfo.name < "r2020b") {
        return Promise.reject(
            Error(
                `Release '${releaseInfo.name}' is not supported. Use 'R2020b' or a later release.`,
            ),
        );
    }

    // resolve system-dependencies based on input and runner type
    const installSystemDependencies = resolveInstallDependencies(installSystemDeps);

    if (installSystemDependencies) {
        await core.group("Preparing system for MATLAB", async () => {
            await matlab.installSystemDependencies(platform, architecture, releaseInfo.name);
        });
    }

    await core.group("Setting up MATLAB", async () => {
        let matlabArch = architecture;
        if (platform === "darwin" && architecture === "arm64" && releaseInfo.name < "r2023b") {
            matlabArch = "x64";
        }

        let [destination]: [string, boolean] = await matlab.getToolcacheDir(platform, releaseInfo);
        let cacheHit = false;

        if (useCache) {
            const supportFilesDir = matlab.getSupportPackagesPath(platform, releaseInfo.name);
            cacheHit = await cache.restoreMATLAB(
                releaseInfo,
                platform,
                matlabArch,
                products,
                destination,
                supportFilesDir,
            );
        }

        if (!cacheHit) {
            const mpmPath: string = await mpm.setup(platform, matlabArch);
            // Workaround: When a new General Release ships, there is a lag
            // before latest-including-prerelease is updated. During this
            // window the prerelease install fails because the prerelease is
            // pulled. Fall back to the General Release so the job can still
            // succeed. Remove this once the release procss eliminates the
            // lag.
            try {
                await mpm.install(mpmPath, releaseInfo, products, destination);
            } catch (e) {
                if (releaseInfo.isPrerelease) {
                    core.info("Install failed, retrying...");
                    const grRelease: matlab.Release = {
                        ...releaseInfo,
                        isPrerelease: false,
                        version: releaseInfo.version.replace("-prerelease", ""),
                    };
                    destination = (await matlab.getToolcacheDir(platform, grRelease))[0];
                    await mpm.install(mpmPath, grRelease, products, destination);
                } else {
                    throw e;
                }
            }

            core.saveState(State.InstallSuccessful, "true");
        }

        core.addPath(path.join(destination, "bin"));
        core.setOutput("matlabroot", destination);

        await matlab.setupBatch(platform, matlabArch);

        if (platform === "win32") {
            if (matlabArch === "x86") {
                core.addPath(path.join(destination, "runtime", "win32"));
            } else {
                core.addPath(path.join(destination, "runtime", "win64"));
            }
        }
    });

    return;
}
