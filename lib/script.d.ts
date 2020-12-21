/**
 * Download and run a script on the runner.
 *
 * @param platform Operating system of the runner (e.g., "win32" or "linux").
 * @param url URL of the script to run.
 * @param args Arguments to pass to the script.
 */
export declare function downloadAndRunScript(platform: string, url: string, args?: string[]): Promise<undefined>;
/**
 * Generate platform-specific command to run a script.
 *
 * @param platform Operating system of the runner (e.g. "win32" or "linux").
 * @param scriptPath Path to the script (on runner's filesystem).
 */
export declare function generateExecCommand(platform: string, scriptPath: string): string;
