// Copyright 2023 The MathWorks, Inc.

import * as core from '@actions/core';
import * as cache from '@actions/cache';
import {State} from './cache-state';

export async function cacheMATLAB(useCache: string) {
    if (useCache.toLowerCase() !== "true") {
        return;
    }

    const matchedKey = core.getState(State.CacheMatchedKey);
    const primaryKey = core.getState(State.CachePrimaryKey);
    const matlabPath: string[] = JSON.parse(
        core.getState(State.MatlabCachePath) || '[]'
    );

    if (primaryKey === matchedKey) {
        core.info(`Cache hit occurred for key: ${primaryKey}, not saving cache.`);
        return;
    }

    await cache.saveCache(matlabPath, primaryKey);
    core.info(`Cache saved with the key: ${primaryKey}`); 
}
