// Copyright 2023 The MathWorks, Inc.

import * as core from "@actions/core";
import { cacheMATLAB } from "./cache-save";

export async function run() {
    const cache = core.getBooleanInput('cache');
    if (cache) {
        await cacheMATLAB();
    }
}

run().catch((e) => {
    core.error(e);
});