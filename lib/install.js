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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.install = void 0;
const core = __importStar(require("@actions/core"));
const properties_json_1 = __importDefault(require("./properties.json"));
const script = __importStar(require("./script"));
const exec = __importStar(require("@actions/exec"));
const toolCache = __importStar(require("@actions/tool-cache"));
const cache = __importStar(require("@actions/cache"));
exports.default = install;
/**
 * Set up an instance of MATLAB on the runner.
 *
 * First, system dependencies are installed. Then the ephemeral installer script
 * is invoked.
 *
 * @param platform Operating system of the runner (e.g., "win32" or "linux").
 * @param release Release of MATLAB to be set up (e.g., "latest" or "R2020a").
 * @param products Array of products to install (e.g. [MATLAB Simulink Simulink_Test])
 */
function install(platform, release, products) {
    return __awaiter(this, void 0, void 0, function* () {
        // Install runtime system dependencies for MATLAB
        yield core.group("Preparing system for MATLAB", () => script.downloadAndRunScript(platform, properties_json_1.default.matlabDepsUrl, [release]));
        const matlabLocation = "/opt/matlab/";
        const productHash = products.sort().join("-"); // TODO: Make a real hash
        const key = [platform, release, productHash].join("-");
        let cacheKey;
        yield core.group("Retrieving MATLAB from cache if available", () => __awaiter(this, void 0, void 0, function* () {
            console.log("Cache key: " + key);
            cacheKey = yield cache.restoreCache([matlabLocation], key);
        }));
        if (cacheKey === undefined) {
            // Invoke mpm installer to setup a MATLAB on the runner
            yield core.group("Setting up MATLAB using MPM", () => __awaiter(this, void 0, void 0, function* () {
                const scriptPath = yield toolCache.downloadTool(properties_json_1.default.mpmUrl);
                yield exec.exec(`chmod +x ${scriptPath}`);
                const exitCode = yield exec.exec(scriptPath, [
                    "install",
                    "--release=" + release,
                    "--destination=" + matlabLocation + release,
                    "--products", products.join(" ")
                ]);
                if (exitCode !== 0) {
                    return Promise.reject(Error(`MPM exited with non-zero code ${exitCode}`));
                }
            }));
            yield core.group("Saving MATLAB to cache", () => __awaiter(this, void 0, void 0, function* () {
                yield cache.saveCache([matlabLocation], key);
            }));
        }
        yield core.group("Adding MATLAB to path", () => __awaiter(this, void 0, void 0, function* () {
            core.addPath(matlabLocation + release + "/bin");
        }));
        yield core.group("Fetching matlab-batch", () => __awaiter(this, void 0, void 0, function* () {
            yield script.downloadAndRunScript(platform, properties_json_1.default.matlabBatchInstallerUrl, []);
        }));
        return;
    });
}
exports.install = install;
function retrieveFromCache(platform, release, products) {
    return __awaiter(this, void 0, void 0, function* () {
    });
}
//# sourceMappingURL=install.js.map