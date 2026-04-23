// Copyright 2020-2026 The MathWorks, Inc.

import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { State } from "./install-state.js";

jest.unstable_mockModule("@actions/core", () => ({
    info: jest.fn(),
    group: jest.fn(),
    saveState: jest.fn(),
    addPath: jest.fn(),
    setOutput: jest.fn(),
}));

jest.unstable_mockModule("./matlab.js", () => ({
    installSystemDependencies: jest.fn(),
    getReleaseInfo: jest.fn(),
    getToolcacheDir: jest.fn(),
    setupBatch: jest.fn(),
    getSupportPackagesPath: jest.fn(),
}));

jest.unstable_mockModule("./mpm.js", () => ({
    setup: jest.fn(),
    install: jest.fn(),
}));

jest.unstable_mockModule("./cache-restore.js", () => ({
    restoreMATLAB: jest.fn(),
}));

const core = await import("@actions/core");
const matlab = await import("./matlab.js");
const mpm = await import("./mpm.js");
const cache = await import("./cache-restore.js");
const install = await import("./install.js");

afterEach(() => {
    jest.resetAllMocks();
    delete process.env["RUNNER_ENVIRONMENT"];
    delete process.env["AGENT_ISSELFHOSTED"];
});

describe("resolveInstallDependencies function", () => {
    let coreInfoMock: jest.Mock<typeof core.info>;

    beforeEach(() => {
        coreInfoMock = core.info as jest.Mock<typeof core.info>;
    });

    // for explicit 'true' should return true
    it("returns true when input is explicitly 'true'", () => {
        const result = install.resolveInstallDependencies("true");
        expect(result).toBe(true);
    });

    // for explicit 'false' should return false
    it("returns false when input is explicitly 'false'", () => {
        const result = install.resolveInstallDependencies("false");
        expect(result).toBe(false);
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
    });

    // for empty string should throw error for github hosted
    it("throws error for empty string input on github-hosted runner", () => {
        process.env["RUNNER_ENVIRONMENT"] = "github-hosted";
        process.env["AGENT_ISSELFHOSTED"] = "0";

        expect(() => {
            install.resolveInstallDependencies("");
        }).toThrow(
            'Invalid value for install-system-dependencies: "". Must be "auto", "true", or "false".',
        );
    });

    // for empty string should throw error for self hosted
    it("throws error for empty string input for self-hosted runner", () => {
        process.env["RUNNER_ENVIRONMENT"] = "self-hosted";
        process.env["AGENT_ISSELFHOSTED"] = "1";

        expect(() => {
            install.resolveInstallDependencies("");
        }).toThrow(
            'Invalid value for install-system-dependencies: "". Must be "auto", "true", or "false".',
        );
    });

    // for any invalid input should throw error
    it("throws error for invalid string input", () => {
        expect(() => {
            install.resolveInstallDependencies("invalid-value");
        }).toThrow(
            'Invalid value for install-system-dependencies: "invalid-value". Must be "auto", "true", or "false".',
        );
    });
});

describe("install procedure", () => {
    let matlabInstallSystemDependenciesMock: jest.Mock<typeof matlab.installSystemDependencies>;
    let matlabGetReleaseInfoMock: jest.Mock<typeof matlab.getReleaseInfo>;
    let matlabGetToolcacheDirMock: jest.Mock<typeof matlab.getToolcacheDir>;
    let matlabSetupBatchMock: jest.Mock<typeof matlab.setupBatch>;
    let mpmSetupMock: jest.Mock<typeof mpm.setup>;
    let mpmInstallMock: jest.Mock<typeof mpm.install>;
    let saveStateMock: jest.Mock<typeof core.saveState>;
    let addPathMock: jest.Mock<typeof core.addPath>;
    let setOutputMock: jest.Mock<typeof core.setOutput>;
    let restoreMATLABMock: jest.Mock<typeof cache.restoreMATLAB>;

    const runnerEnv = "github-hosted";
    const agentIsSelfHosted = "0";

    const platform = "linux";
    const arch = "x64";
    const release = "latest";
    const releaseInfo = {
        name: "r2022b",
        version: "9.13.0",
        update: "latest",
        isPrerelease: false,
    };
    const products = ["MATLAB", "Parallel_Computing_Toolbox"];
    const useCache = false;
    const installSystemDependencies = "true";

    const doInstall = () =>
        install.install(platform, arch, release, products, useCache, installSystemDependencies);

    beforeEach(() => {
        matlabInstallSystemDependenciesMock = matlab.installSystemDependencies as jest.Mock<
            typeof matlab.installSystemDependencies
        >;
        matlabGetReleaseInfoMock = matlab.getReleaseInfo as jest.Mock<typeof matlab.getReleaseInfo>;
        matlabGetToolcacheDirMock = matlab.getToolcacheDir as jest.Mock<
            typeof matlab.getToolcacheDir
        >;
        matlabSetupBatchMock = matlab.setupBatch as jest.Mock<typeof matlab.setupBatch>;
        mpmSetupMock = mpm.setup as jest.Mock<typeof mpm.setup>;
        mpmInstallMock = mpm.install as jest.Mock<typeof mpm.install>;
        saveStateMock = core.saveState as jest.Mock<typeof core.saveState>;
        addPathMock = core.addPath as jest.Mock<typeof core.addPath>;
        setOutputMock = core.setOutput as jest.Mock<typeof core.setOutput>;
        restoreMATLABMock = cache.restoreMATLAB as jest.Mock<typeof cache.restoreMATLAB>;

        // Mock core.group to simply return the output of the func it gets from
        // the caller
        (core.group as jest.Mock<typeof core.group>).mockImplementation(async (_, func) => {
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
            update: "latest",
            isPrerelease: false,
        });
        await expect(
            install.install(platform, arch, "r2020a", products, useCache, "true"),
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

    // for installSystemDependencies = false
    it("does not set up dependencies for self-hosted runners", async () => {
        process.env["RUNNER_ENVIRONMENT"] = "self-hosted";
        await expect(
            install.install(platform, arch, release, products, useCache, "false"),
        ).resolves.toBeUndefined();
        expect(matlabInstallSystemDependenciesMock).not.toHaveBeenCalled();
    });

    // install for self hosted if installSystemDependencies = true
    it("sets up dependencies for self-hosted runners when installSystemDependencies is true", async () => {
        process.env["RUNNER_ENVIRONMENT"] = "self-hosted";
        await expect(
            install.install(platform, arch, release, products, useCache, "true"),
        ).resolves.toBeUndefined();
        expect(matlabInstallSystemDependenciesMock).toHaveBeenCalled();
    });

    // does not install for github hosted if installSystemDependencies = false
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
            update: "latest",
            isPrerelease: false,
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

    describe("prerelease fallback to general release", () => {
        const prereleaseInfo = {
            name: "r2026a",
            version: "2026.1.999-prerelease",
            update: "",
            isPrerelease: true,
        };
        const grDestination = "/opt/hostedtoolcache/MATLAB/2026.1.999/x64";

        beforeEach(() => {
            matlabGetReleaseInfoMock.mockResolvedValue(prereleaseInfo);
        });

        it("retries with general release when prerelease install fails with unavailable release", async () => {
            mpmInstallMock
                .mockRejectedValueOnce(Error("Specified release is unavailable"))
                .mockResolvedValueOnce(undefined);
            matlabGetToolcacheDirMock
                .mockResolvedValueOnce([
                    "/opt/hostedtoolcache/MATLAB/2026.1.999-prerelease/x64",
                    false,
                ])
                .mockResolvedValueOnce([grDestination, false]);

            await expect(doInstall()).resolves.toBeUndefined();
            expect(mpmInstallMock).toHaveBeenCalledTimes(2);
            // Second call should be without prerelease
            const secondCall = mpmInstallMock.mock.calls[1];
            expect(secondCall[1]).toMatchObject({
                isPrerelease: false,
                version: "2026.1.999",
            });
            expect(saveStateMock).toHaveBeenCalledWith(State.InstallSuccessful, "true");
            expect(addPathMock).toHaveBeenCalledWith(expect.stringContaining(grDestination));
        });

        it("rejects when both prerelease and general release install fail", async () => {
            mpmInstallMock.mockRejectedValue(Error("Specified release is unavailable"));
            matlabGetToolcacheDirMock
                .mockResolvedValueOnce([
                    "/opt/hostedtoolcache/MATLAB/2026.1.999-prerelease/x64",
                    false,
                ])
                .mockResolvedValueOnce([grDestination, false]);

            await expect(doInstall()).rejects.toBeDefined();
            expect(mpmInstallMock).toHaveBeenCalledTimes(2);
            expect(saveStateMock).toHaveBeenCalledTimes(0);
        });

        it("does not retry for non-prerelease install failures", async () => {
            matlabGetReleaseInfoMock.mockResolvedValue(releaseInfo);
            mpmInstallMock.mockRejectedValue(Error("Specified release is unavailable"));
            await expect(doInstall()).rejects.toBeDefined();
            expect(mpmInstallMock).toHaveBeenCalledTimes(1);
        });

        it("does not retry prerelease install for other errors", async () => {
            mpmInstallMock.mockRejectedValue(Error("Script exited with non-zero code 1"));
            matlabGetToolcacheDirMock.mockResolvedValueOnce([
                "/opt/hostedtoolcache/MATLAB/2026.1.999-prerelease/x64",
                false,
            ]);

            await expect(doInstall()).rejects.toBeDefined();
            expect(mpmInstallMock).toHaveBeenCalledTimes(1);
        });
    });
});
