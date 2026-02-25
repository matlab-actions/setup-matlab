// Copyright 2020-2024 The MathWorks, Inc.

import * as core from "@actions/core";
import * as install from "./install";

//function resolving whether to install dependencies based on the input and runner type
export function resolveInstallDependencies(input: string): boolean {
    if (input.toLowerCase() === 'true') {
        core.info(`install-system-dependencies explicitly set to true`);
        return true;
    }
    if (input.toLowerCase() === 'false') {
        core.info(`install-system-dependencies explicitly set to false`);
        return false;
    }
    
    // when expliciatlly not set to true or false then detecting based on the runner type
    if (input.toLowerCase() === 'auto' || input === '') {
        //using the same detection method for github hosted runner as in install.ts
        const runnerEnvironment = process.env["RUNNER_ENVIRONMENT"];
        const agentIsSelfHosted = process.env["AGENT_ISSELFHOSTED"];
        
        const isGitHubHosted = runnerEnvironment === "github-hosted" && agentIsSelfHosted !== "1";
      
        // shouldInstall will return true for github-hosted and false for self-hosted
        const shouldInstall = isGitHubHosted;
        
        core.info(`Auto-detected runner type: ${isGitHubHosted ? 'GitHub-hosted' : 'self-hosted'}`);
        core.info(`System dependencies will ${shouldInstall ? 'be' : 'not be'} installed (auto mode)`);
        
        return shouldInstall;
    }
    
    // default set to false for invalid input type
    core.warning(`Invalid value for install-system-dependencies: ${input}. Defaulting to false.`);
    return false;
}

/**
 * Gather action inputs and then run action.
 */
export async function run() {
    const platform = process.platform;
    const architecture = process.arch;
    const release = core.getInput("release");
    const products = core.getMultilineInput("products");
    const cache = core.getBooleanInput("cache");
    const installDepsInput = core.getInput("install-system-dependencies") || 'auto';
    const installSystemDependencies = resolveInstallDependencies(installDepsInput);
    
    return install.install(platform, architecture, release, products, cache, installSystemDependencies);
}

run().catch((e) => {
    core.setFailed(e);
});
