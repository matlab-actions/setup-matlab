// Copyright 2023 The MathWorks, Inc.

import * as cache from '@actions/cache';
import * as core from '@actions/core';
import * as tc from "@actions/tool-cache";
import * as crypto from 'crypto'
import { Release } from './matlab';

import {State} from './cache-state';

export async function restoreMATLABFromCache(release: Release, platform: string, products: string[]) {
    let matlabPath: string = tc.find("MATLAB", release.version);
    const installHash = crypto.createHash('sha256').update(products.join('|')).digest('hex')
    const keyPrefix = `matlab-cache-${platform}-${release}`;
    const primaryKey = `${keyPrefix}-${installHash}`;
    const cacheKey: string | undefined = await cache.restoreCache([matlabPath], primaryKey);

    core.saveState(State.CachePrimaryKey, primaryKey);
    core.saveState(State.MatlabCachePath, [matlabPath]);

    if (!cacheKey) {
        core.info(`${keyPrefix} cache is not found`);
        return;
    }

    core.saveState(State.CacheMatchedKey, cacheKey);
    core.info(`Cache restored from key: ${cacheKey}`);
}
