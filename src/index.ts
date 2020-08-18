// Copyright 2020 The MathWorks, Inc.

import * as core from "@actions/core";
import * as install from "./install";

export async function run() {
    return install.install();
}

run().catch((e) => {
    core.setFailed(e);
});
