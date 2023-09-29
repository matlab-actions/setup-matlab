// Copyright 2023 The MathWorks, Inc.

import * as cache from '@actions/cache';
import * as core from '@actions/core';
import * as crypto from "crypto";
import { State } from './cache-state';
import { Release } from './matlab';

export async function restoreMATLAB(release: Release, platform: string, products: string[], matlabPath: string): Promise<boolean> {
    const installHash = crypto.createHash('sha256').update(products.join('|')).digest('hex')
    const keyPrefix = `matlab-cache-${platform}-${release.version}`;
    const primaryKey = `${keyPrefix}-${installHash}`;
    const cacheKey: string | undefined = await cache.restoreCache([matlabPath], primaryKey);

    core.saveState(State.CachePrimaryKey, primaryKey);
    core.saveState(State.MatlabCachePath, [matlabPath]);

    if (!cacheKey) {
        core.info(`${keyPrefix} cache is not found`);
        return false;
    }

    core.saveState(State.CacheMatchedKey, cacheKey);
    core.info(`Cache restored from key: ${cacheKey}`);
    return true
}
