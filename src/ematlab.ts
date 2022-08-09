// Copyright 2022 The MathWorks, Inc.

import fs from "fs";
import path from "path";
import os from "os";
import * as core from "@actions/core";

export const rootFile = path.join(os.tmpdir(), "ephemeral_matlab_root");

export function addToPath() {
    let root: string;
    try {
        root = fs.readFileSync(rootFile).toString();
    } catch (err) {
        throw new Error(`Unable to read file containing MATLAB root: ${err.message}`);
    }
    core.addPath(path.join(root, "bin"));
}

export function skipActivationFlag(env: any): string {
    return (env.MATHWORKS_TOKEN !== undefined && env.MATHWORKS_ACCOUNT !== undefined)? "--skip-activation": "";
}