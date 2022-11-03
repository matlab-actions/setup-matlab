"use strict";
// Copyright 2022 The MathWorks, Inc.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.skipActivationFlag = exports.addToPath = exports.rootFile = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const core = __importStar(require("@actions/core"));
exports.rootFile = path_1.default.join(os_1.default.tmpdir(), "ephemeral_matlab_root");
function addToPath() {
    let root;
    try {
        root = fs_1.default.readFileSync(exports.rootFile).toString();
    }
    catch (err) {
        throw new Error(`Unable to read file containing MATLAB root: ${err.message}`);
    }
    core.addPath(path_1.default.join(root, "bin"));
}
exports.addToPath = addToPath;
function skipActivationFlag(env) {
    return (env.MATHWORKS_TOKEN !== undefined && env.MATHWORKS_ACCOUNT !== undefined) ? "--skip-activation" : "";
}
exports.skipActivationFlag = skipActivationFlag;
//# sourceMappingURL=ematlab.js.map