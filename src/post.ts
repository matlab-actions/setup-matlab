// Copyright 2023-2025 The MathWorks, Inc.

import * as core from "@actions/core";
import { cacheMATLAB } from "./cache-save";
import { State } from './install-state';

export async function run() {
    const cache = core.getBooleanInput('cache');
    const installSuccessful = core.getState(State.InstallSuccessful);
    if (cache && installSuccessful === 'true') {
        await cacheMATLAB();
    }
}

run().catch((e) => {
    core.error(e);
});