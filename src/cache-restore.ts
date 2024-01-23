// Copyright 2023-2024 The MathWorks, Inc.

import * as cache from '@actions/cache';
import * as core from '@actions/core';
import * as crypto from "crypto";
import { State } from './cache-state';
import { Release } from './matlab';

export async function restoreMATLAB(release: Release, platform: string, architecture: string, products: string[], matlabPath: string, supportPackagesPath?: string): Promise<boolean> {
    const installHash = crypto.createHash('sha256').update(products.sort().join('|')).digest('hex');
    const keyPrefix = `matlab-cache-${platform}-${architecture}-${release.version}`;
    const primaryKey = `${keyPrefix}-${installHash}`;
    const cachePaths = [matlabPath];
    if (supportPackagesPath) {
        cachePaths.push(supportPackagesPath);
    }
    const cacheKey: string | undefined = await cache.restoreCache(cachePaths, primaryKey);

    core.saveState(State.CachePrimaryKey, primaryKey);
    core.saveState(State.MatlabCachePath, matlabPath);
    core.saveState(State.SupportPackagesCachePath, supportPackagesPath);

    if (!cacheKey) {
        core.info(`${keyPrefix} cache is not found`);
        return false;
    }

    core.saveState(State.CacheMatchedKey, cacheKey);
    core.info(`Cache restored from key: ${cacheKey}`);
    return true
}
