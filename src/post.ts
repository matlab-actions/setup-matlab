// Copyright 2023 The MathWorks, Inc.

import * as core from "@actions/core";
import { cacheMATLAB } from "./cache-save";

export async function run() {
    const useCache = core.getInput('use-cache');
    await cacheMATLAB(useCache);
}

run().catch((e) => {
    core.error(e);
});