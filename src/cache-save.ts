// Copyright 2023-2026 The MathWorks, Inc.

import * as core from "@actions/core";
import * as cache from "@actions/cache";
import { State } from "./cache-state.js";

export async function cacheMATLAB() {
    const matchedKey = core.getState(State.CacheMatchedKey);
    const primaryKey = core.getState(State.CachePrimaryKey);
    const matlabPath = core.getState(State.MatlabCachePath);
    const supportPackagesPath = core.getState(State.SupportPackagesCachePath);

    if (primaryKey === matchedKey) {
        core.info(`Cache hit occurred for key: ${primaryKey}, not saving cache.`);
        return;
    }

    try {
        await cache.saveCache([matlabPath, supportPackagesPath], primaryKey);
        core.info(`Cache saved with the key: ${primaryKey}`);
    } catch (e) {
        core.warning(`Failed to save MATLAB to cache: ${e}`);
    }
}
