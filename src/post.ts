// Copyright 2023-2026 The MathWorks, Inc.

import * as core from "@actions/core";
import { cacheMATLAB } from "./cache-save.js";
import { State } from "./install-state.js";

export async function run() {
    const cache = core.getBooleanInput("cache");
    const installSuccessful = core.getState(State.InstallSuccessful);
    if (cache && installSuccessful === "true") {
        await cacheMATLAB();
    }
}

run().catch((e) => {
    core.error(e);
});
