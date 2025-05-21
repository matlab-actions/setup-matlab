// Copyright 2020-2025 The MathWorks, Inc.

import * as core from "@actions/core";
import * as cache from "./cache-restore";
import * as install from "./install";
import * as matlab from "./matlab";
import * as mpm from "./mpm";
import { State } from './install-state';

jest.mock("@actions/core");
jest.mock("./matlab");
jest.mock("./mpm");
jest.mock("./cache-restore");

afterEach(() => {
    jest.resetAllMocks();
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
        updateNumber: "latest"
    };
    const products = ["MATLAB", "Parallel_Computing_Toolbox"];
    const useCache = false;

    const doInstall = () => install.install(platform, arch, release, products, useCache);

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
        matlabGetToolcacheDirMock.mockResolvedValue(["/opt/hostedtoolcache/MATLAB/9.13.0/x64", false]);

        process.env["RUNNER_ENVIRONMENT"] = runnerEnv;
        process.env["AGENT_ISSELFHOSTED"] = agentIsSelfHosted;
    });

    it("ideally works", async () => {
        await expect(doInstall()).resolves.toBeUndefined();
        expect(matlabInstallSystemDependenciesMock).toHaveBeenCalledTimes(1);
        expect(matlabSetupBatchMock).toHaveBeenCalledTimes(1);
        expect(mpmSetupMock).toHaveBeenCalledTimes(1);
        expect(mpmInstallMock).toHaveBeenCalledTimes(1);
        expect(saveStateMock).toHaveBeenCalledWith(State.InstallSuccessful, 'true');
        expect(addPathMock).toHaveBeenCalledTimes(1);
        expect(setOutputMock).toHaveBeenCalledTimes(1);
    });

    it("NoOp on existing install", async () => {
        matlabGetToolcacheDirMock.mockResolvedValue(["/opt/hostedtoolcache/MATLAB/9.13.0/x64", true]);
        await expect(doInstall()).resolves.toBeUndefined();
        expect(mpmInstallMock).toHaveBeenCalledTimes(0);
        expect(saveStateMock).toHaveBeenCalledTimes(0);
        expect(addPathMock).toHaveBeenCalledTimes(1);
        expect(setOutputMock).toHaveBeenCalledTimes(1);
    });

    it("rejects for unsupported MATLAB release", async () => {
        matlabGetReleaseInfoMock.mockResolvedValue({
            name: "r2020a",
            version: "9.8.0",
            updateNumber: "latest"    
        });
        await expect(install.install(platform, arch, "r2020a", products, useCache)).rejects.toBeDefined();
    });

    it("rejects for invalid MATLAB version", async () => {
        matlabGetReleaseInfoMock.mockRejectedValue(Error("oof"));
        await expect(doInstall()).rejects.toBeDefined();
    });

    it("sets up dependencies for github-hosted runners", async () => {
        await doInstall();
        expect(matlabInstallSystemDependenciesMock).toHaveBeenCalled();
    });

    it("does not set up dependencies for self-hosted runners", async () => {
        process.env["RUNNER_ENVIRONMENT"] = "self-hosted";
        await doInstall();
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
        await expect(install.install(platform, arch, release, products, true)).resolves.toBeUndefined();
        expect(restoreMATLABMock).toHaveBeenCalledTimes(1);
        expect(mpmSetupMock).toHaveBeenCalledTimes(0);
        expect(mpmInstallMock).toHaveBeenCalledTimes(0);
    });

    it("Does install if useCache is true and there is no cache hit", async () => {
        restoreMATLABMock.mockResolvedValue(false);
        await expect(install.install(platform, arch, release, products, true)).resolves.toBeUndefined();
        expect(restoreMATLABMock).toHaveBeenCalledTimes(1);
        expect(mpmSetupMock).toHaveBeenCalledTimes(1);
        expect(mpmInstallMock).toHaveBeenCalledTimes(1);
    });

    it("installs Intel version on Apple silicon prior to R2023b", async () => {
        matlabGetReleaseInfoMock.mockResolvedValue({
            name: "r2023a",
            version: "9.14.0",
            updateNumber: "latest"    
        });
        await expect(install.install("darwin", "arm64", "r2023a", products, true)).resolves.toBeUndefined();
        expect(matlabInstallSystemDependenciesMock).toHaveBeenCalledWith("darwin", "arm64", "r2023a");
        expect(matlabSetupBatchMock).toHaveBeenCalledWith("darwin", "x64");
        expect(mpmSetupMock).toHaveBeenCalledWith("darwin", "x64");
    });

    it("adds runtime path for Windows platform", async () => {
        await expect(install.install("win32", arch, release, products, useCache)).resolves.toBeUndefined();
        expect(addPathMock).toHaveBeenCalledTimes(2);
        expect(addPathMock).toHaveBeenCalledWith(expect.stringContaining("bin"));
        expect(addPathMock).toHaveBeenCalledWith(expect.stringContaining("runtime"));
    });

});
