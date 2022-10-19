"use strict";
// Copyright 2022 The MathWorks, Inc.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.installDir = void 0;
const path_1 = __importDefault(require("path"));
function installDir(platform) {
    let batchInstallDir;
    if (platform === "win32") {
        batchInstallDir = path_1.default.join("C:", "Program Files", "matlab-batch");
    }
    else {
        batchInstallDir = path_1.default.join("/", "opt", "matlab-batch");
    }
    return batchInstallDir;
}
exports.installDir = installDir;
//# sourceMappingURL=matlabBatch.js.map