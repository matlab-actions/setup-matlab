export declare function resolveInstallDependencies(input: string): boolean;
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
export declare function install(platform: string, architecture: string, release: string, products: string[], useCache: boolean, installSystemDeps: string): Promise<undefined>;
