"use strict";
// Copyright 2020 The MathWorks, Inc.
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateExecCommand = exports.downloadAndRunScript = void 0;
const exec = __importStar(require("@actions/exec"));
const toolCache = __importStar(require("@actions/tool-cache"));
/**
 * Download and run a script on the runner.
 *
 * @param platform Operating system of the runner (e.g., "win32" or "linux").
 * @param url URL of the script to run.
 * @param args Arguments to pass to the script.
 */
function downloadAndRunScript(platform, url, args) {
    return __awaiter(this, void 0, void 0, function* () {
        const scriptPath = yield toolCache.downloadTool(url);
        const cmd = generateExecCommand(platform, scriptPath);
        const exitCode = yield exec.exec(cmd, args);
        if (exitCode !== 0) {
            return Promise.reject(Error(`Script exited with non-zero code ${exitCode}`));
        }
    });
}
exports.downloadAndRunScript = downloadAndRunScript;
/**
 * Generate platform-specific command to run a script.
 *
 * @param platform Operating system of the runner (e.g. "win32" or "linux").
 * @param scriptPath Path to the script (on runner's filesystem).
 */
function generateExecCommand(platform, scriptPath) {
    // Run the install script using bash
    let installCmd = `bash ${scriptPath}`;
    if (platform !== "win32") {
        installCmd = `sudo -E ${installCmd}`;
    }
    return installCmd;
}
exports.generateExecCommand = generateExecCommand;
//# sourceMappingURL=script.js.map