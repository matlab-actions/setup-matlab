// Copyright 2023 The MathWorks, Inc.

import * as core from "@actions/core";
import { cacheMATLAB } from "./cache-save";

// Instead of failing this action, just log and warn.
process.on('uncaughtException', e => {
    const warningPrefix = '[warning]';
    core.info(`${warningPrefix}${e.message}`);
});

export async function run() {
    const useCache = core.getInput('use-cache');
    await cacheMATLAB(useCache);
}

run().catch((e) => {
    core.setFailed(e);
});