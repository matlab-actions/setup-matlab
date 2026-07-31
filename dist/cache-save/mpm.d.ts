import * as matlab from "./matlab.js";
export declare function setup(platform: string, architecture: string): Promise<string>;
export declare function install(mpmPath: string, release: matlab.Release, products: string[], destination: string): Promise<undefined>;
