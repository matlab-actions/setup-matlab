import { Release } from "./matlab.js";
export declare function restoreMATLAB(release: Release, platform: string, architecture: string, products: string[], matlabPath: string, supportPackagesPath?: string): Promise<boolean>;
