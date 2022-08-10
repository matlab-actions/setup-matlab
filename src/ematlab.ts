// Copyright 2022 The MathWorks, Inc.

import fs from "fs";
import path from "path";
import os from "os";
import * as core from "@actions/core";

export const rootFile = path.join(os.tmpdir(), "ephemeral_matlab_root");

interface ProcessEnv {
    [key: string]: string | undefined
}

export function addToPath() {
    let root: string;
    try {
        root = fs.readFileSync(rootFile).toString();
    } catch (err) {
        throw new Error(`Unable to read file containing MATLAB root: ${err.message}`);
    }
    core.addPath(path.join(root, "bin"));
}

export function skipActivationFlag(env: ProcessEnv): string {
    return (env.MATHWORKS_TOKEN !== undefined && env.MATHWORKS_ACCOUNT !== undefined)? "--skip-activation": "";
}