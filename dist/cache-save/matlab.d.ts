export interface Release {
    name: string;
    version: string;
    update: string;
    isPrerelease: boolean;
}
export declare function getToolcacheDir(platform: string, release: Release): Promise<[string, boolean]>;
export declare function setupBatch(platform: string, architecture: string): Promise<undefined>;
export declare function getReleaseInfo(release: string): Promise<Release>;
export declare function getSupportPackagesPath(platform: string, release: string): string | undefined;
export declare function installSystemDependencies(platform: string, architecture: string, release: string): Promise<undefined>;
