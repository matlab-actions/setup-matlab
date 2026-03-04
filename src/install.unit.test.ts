// Copyright 2020-2025 The MathWorks, Inc.

import * as core from "@actions/core";
import * as cache from "./cache-restore";
import * as install from "./install";
import * as matlab from "./matlab";
import * as mpm from "./mpm";
import { State } from "./install-state";

jest.mock("@actions/core");
jest.mock("./matlab");
jest.mock("./mpm");
jest.mock("./cache-restore");

afterEach(() => {
    jest.resetAllMocks();
    delete process.env["RUNNER_ENVIRONMENT"];
    delete process.env["AGENT_ISSELFHOSTED"];
});

describe("resolveInstallDependencies function", () => {
    let coreInfoMock: jest.Mock;
    let coreWarningMock: jest.Mock;

    beforeEach(() => {
        coreInfoMock = core.info as jest.Mock;
        coreWarningMock = core.warning as jest.Mock;
    });

    // for explicit 'true' should return true
    it("returns true when input is explicitly 'true'", () => {
        const result = install.resolveInstallDependencies("true");
        expect(result).toBe(true);
        expect(coreInfoMock).not.toHaveBeenCalled();
        expect(coreWarningMock).not.toHaveBeenCalled();
    });

    // for explicit 'false' should return false
    it("returns false when input is explicitly 'false'", () => {
        const result = install.resolveInstallDependencies("false");
        expect(result).toBe(false);
        expect(coreInfoMock).not.toHaveBeenCalled();
        expect(coreWarningMock).not.toHaveBeenCalled();
    });

    // for 'auto' mode on GitHub-hosted runner should return true
    it("returns true for 'auto' on GitHub-hosted runner", () => {
        process.env["RUNNER_ENVIRONMENT"] = "github-hosted";
        process.env["AGENT_ISSELFHOSTED"] = "0";

        const result = install.resolveInstallDependencies("auto");
        expect(result).toBe(true);
        expect(coreInfoMock).toHaveBeenCalledWith("Auto-detected runner type: GitHub-hosted");
        expect(coreInfoMock).toHaveBeenCalledWith(
            "System dependencies will be installed (auto mode)",
        );
        expect(coreWarningMock).not.toHaveBeenCalled();
    });

    // for 'auto' mode on self-hosted runner should return false
    it("returns false for 'auto' on self-hosted runner", () => {
        process.env["RUNNER_ENVIRONMENT"] = "self-hosted";
        process.env["AGENT_ISSELFHOSTED"] = "1";

        const result = install.resolveInstallDependencies("auto");
        expect(result).toBe(false);
        expect(coreInfoMock).toHaveBeenCalledWith("Auto-detected runner type: self-hosted");
        expect(coreInfoMock).toHaveBeenCalledWith(
            "System dependencies will not be installed (auto mode)",
        );
        expect(coreWarningMock).not.toHaveBeenCalled();
    });

    // for empty string should behave like 'auto' on GitHub-hosted
    it("returns true for empty string on GitHub-hosted runner (defaults to auto)", () => {
        process.env["RUNNER_ENVIRONMENT"] = "github-hosted";
        process.env["AGENT_ISSELFHOSTED"] = "0";

        expect(() => {
            install.resolveInstallDependencies("");
        }).toThrow('Invalid value for install-system-dependencies: "". Must be "auto", "true", or "false".');
    });  

    // for empty string should behave like 'auto' on self-hosted
    it("returns false for empty string on self-hosted runner (defaults to auto)", () => {
        process.env["RUNNER_ENVIRONMENT"] = "self-hosted";
        process.env["AGENT_ISSELFHOSTED"] = "1";

        expect(() => {
            install.resolveInstallDependencies("");
        }).toThrow('Invalid value for install-system-dependencies: "". Must be "auto", "true", or "false".');
    });  

    // for any invalid input should return false with warning
    it("returns false for invalid input and logs warning", () => {
        expect(() => {
            install.resolveInstallDependencies("invalid-value");
        }).toThrow('Invalid value for install-system-dependencies: "invalid-value". Must be "auto", "true", or "false".');
    });

    // numeric invalid input test
    it("returns false for numeric input", () => {
        expect(() => {
            install.resolveInstallDependencies("123");
        }).toThrow('Invalid value for install-system-dependencies: "123". Must be "auto", "true", or "false".');
    });
});



describe("install procedure", () => {
    let matlabInstallSystemDependenciesMock: jest.Mock;
    let matlabGetReleaseInfoMock: jest.Mock;
    let matlabGetToolcacheDirMock: jest.Mock;
    let matlabSetupBatchMock: jest.Mock;
    let mpmSetupMock: jest.Mock;
    let mpmInstallMock: jest.Mock;
    let saveStateMock: jest.Mock;
    let addPathMock: jest.Mock;
    let setOutputMock: jest.Mock;
    let restoreMATLABMock: jest.Mock;

    const runnerEnv = "github-hosted";
    const agentIsSelfHosted = "0";

    const platform = "linux";
    const arch = "x64";
    const release = "latest";
    const releaseInfo = {
        name: "r2022b",
        version: "9.13.0",
        updateNumber: "latest",
    };
    const products = ["MATLAB", "Parallel_Computing_Toolbox"];
    const useCache = false;
    const installSystemDependencies = "true";

    const doInstall = () =>
        install.install(platform, arch, release, products, useCache, installSystemDependencies);

    beforeEach(() => {
        matlabInstallSystemDependenciesMock = matlab.installSystemDependencies as jest.Mock;
        matlabGetReleaseInfoMock = matlab.getReleaseInfo as jest.Mock;
        matlabGetToolcacheDirMock = matlab.getToolcacheDir as jest.Mock;
        matlabSetupBatchMock = matlab.setupBatch as jest.Mock;
        mpmSetupMock = mpm.setup as jest.Mock;
        mpmInstallMock = mpm.install as jest.Mock;
        saveStateMock = core.saveState as jest.Mock;
        addPathMock = core.addPath as jest.Mock;
        setOutputMock = core.setOutput as jest.Mock;
        restoreMATLABMock = cache.restoreMATLAB as jest.Mock;

        // Mock core.group to simply return the output of the func it gets from
        // the caller
        (core.group as jest.Mock).mockImplementation(async (_, func) => {
            return func();
        });
        matlabGetReleaseInfoMock.mockResolvedValue(releaseInfo);
        matlabGetToolcacheDirMock.mockResolvedValue([
            "/opt/hostedtoolcache/MATLAB/9.13.0/x64",
            false,
        ]);

        process.env["RUNNER_ENVIRONMENT"] = runnerEnv;
        process.env["AGENT_ISSELFHOSTED"] = agentIsSelfHosted;
    });

    it("ideally works", async () => {
        await expect(doInstall()).resolves.toBeUndefined();
        expect(matlabInstallSystemDependenciesMock).toHaveBeenCalledTimes(1);
        expect(matlabSetupBatchMock).toHaveBeenCalledTimes(1);
        expect(mpmSetupMock).toHaveBeenCalledTimes(1);
        expect(mpmInstallMock).toHaveBeenCalledTimes(1);
        expect(saveStateMock).toHaveBeenCalledWith(State.InstallSuccessful, "true");
        expect(addPathMock).toHaveBeenCalledTimes(1);
        expect(setOutputMock).toHaveBeenCalledTimes(1);
    });

    it("re-calls MPM install even if MATLAB already exists in toolcache", async () => {
        matlabGetToolcacheDirMock.mockResolvedValue([
            "/opt/hostedtoolcache/MATLAB/9.13.0/x64",
            true,
        ]);
        await expect(doInstall()).resolves.toBeUndefined();
        expect(mpmInstallMock).toHaveBeenCalledTimes(1);
        expect(saveStateMock).toHaveBeenCalledTimes(1);
        expect(addPathMock).toHaveBeenCalledTimes(1);
        expect(setOutputMock).toHaveBeenCalledTimes(1);
    });

    it("rejects for unsupported MATLAB release", async () => {
        matlabGetReleaseInfoMock.mockResolvedValue({
            name: "r2020a",
            version: "9.8.0",
            updateNumber: "latest",
        });
        await expect(
            install.install(
                platform,
                arch,
                "r2020a",
                products,
                useCache,
                "true",
            ),
        ).rejects.toBeDefined();
    });

    it("rejects for invalid MATLAB version", async () => {
        matlabGetReleaseInfoMock.mockRejectedValue(Error("oof"));
        await expect(doInstall()).rejects.toBeDefined();
    });

    it("sets up dependencies for github-hosted runners ", async () => {
        await doInstall();
        expect(matlabInstallSystemDependenciesMock).toHaveBeenCalled();
    });

    //for installSystemDependencies = false
    it("does not set up dependencies for self-hosted runners", async () => {
        process.env["RUNNER_ENVIRONMENT"] = "self-hosted";
        await expect(
            install.install(platform, arch, release, products, useCache, "false"),
        ).resolves.toBeUndefined();
        expect(matlabInstallSystemDependenciesMock).not.toHaveBeenCalled();
    });

    //install for self hosted if installSystemDependencies = true
    it("sets up dependencies for self-hosted runners when installSystemDependencies is true", async () => {
        process.env["RUNNER_ENVIRONMENT"] = "self-hosted";
        await expect(
            install.install(platform, arch, release, products, useCache, "true"),
        ).resolves.toBeUndefined();
        expect(matlabInstallSystemDependenciesMock).toHaveBeenCalled();
    });

    //does not install for github hosted if installSystemDependencies = false
    it("does not set up dependencies for github-hosted runners when installSystemDependencies is false", async () => {
        await expect(
            install.install(platform, arch, release, products, useCache, "false"),
        ).resolves.toBeUndefined();
        expect(matlabInstallSystemDependenciesMock).not.toHaveBeenCalled();
    });

    it("rejects when the setup deps fails", async () => {
        matlabInstallSystemDependenciesMock.mockRejectedValueOnce(Error("oof"));
        await expect(doInstall()).rejects.toBeDefined();
    });

    it("rejects when the mpm install fails", async () => {
        mpmInstallMock.mockRejectedValue(Error("oof"));
        await expect(doInstall()).rejects.toBeDefined();
        expect(saveStateMock).toHaveBeenCalledTimes(0);
    });

    it("rejects when the matlab-batch install fails", async () => {
        matlabSetupBatchMock.mockRejectedValueOnce(Error("oof"));
        await expect(doInstall()).rejects.toBeDefined();
    });

    it("Does not restore cache if useCache is false", async () => {
        await expect(doInstall()).resolves.toBeUndefined();
        expect(restoreMATLABMock).toHaveBeenCalledTimes(0);
        expect(mpmSetupMock).toHaveBeenCalledTimes(1);
        expect(mpmInstallMock).toHaveBeenCalledTimes(1);
    });

    it("Does not install if useCache is true and there is cache hit", async () => {
        restoreMATLABMock.mockResolvedValue(true);
        await expect(
            install.install(platform, arch, release, products, true, "false"),
        ).resolves.toBeUndefined();
        expect(restoreMATLABMock).toHaveBeenCalledTimes(1);
        expect(mpmSetupMock).toHaveBeenCalledTimes(0);
        expect(mpmInstallMock).toHaveBeenCalledTimes(0);
    });

    it("Does install if useCache is true and there is no cache hit", async () => {
        restoreMATLABMock.mockResolvedValue(false);
        await expect(
            install.install(platform, arch, release, products, true, "false"),
        ).resolves.toBeUndefined();
        expect(restoreMATLABMock).toHaveBeenCalledTimes(1);
        expect(mpmSetupMock).toHaveBeenCalledTimes(1);
        expect(mpmInstallMock).toHaveBeenCalledTimes(1);
    });

    it("installs Intel version on Apple silicon prior to R2023b", async () => {
        matlabGetReleaseInfoMock.mockResolvedValue({
            name: "r2023a",
            version: "9.14.0",
            updateNumber: "latest",
        });
        await expect(
            install.install("darwin", "arm64", "r2023a", products, true, "true"),
        ).resolves.toBeUndefined();
        expect(matlabInstallSystemDependenciesMock).toHaveBeenCalledWith(
            "darwin",
            "arm64",
            "r2023a",
        );
        expect(matlabSetupBatchMock).toHaveBeenCalledWith("darwin", "x64");
        expect(mpmSetupMock).toHaveBeenCalledWith("darwin", "x64");
    });

    it("adds runtime path for Windows platform", async () => {
        await expect(
            install.install("win32", arch, release, products, useCache, "false"),
        ).resolves.toBeUndefined();
        expect(addPathMock).toHaveBeenCalledTimes(2);
        expect(addPathMock).toHaveBeenCalledWith(expect.stringContaining("bin"));
        expect(addPathMock).toHaveBeenCalledWith(expect.stringContaining("runtime"));
    });
});
