// Copyright 2020-2022 The MathWorks, Inc.

import * as core from "@actions/core";
import * as install from "./install";
import * as matlab from "./matlab";
import * as mpm from "./mpm";
import * as script from "./script";

jest.mock("@actions/core");
jest.mock("./matlab");
jest.mock("./mpm");
jest.mock("./script");

afterEach(() => {
    jest.resetAllMocks();
});

describe("install procedure", () => {
    let downloadAndRunScriptMock: jest.Mock<any, any>;
    let matlabGetReleaseInfoMock: jest.Mock<any, any>;
    let matlabMakeToolcacheDirMock: jest.Mock<any, any>;
    let matlabSetupBatchMock: jest.Mock<any, any>;
    let mpmSetupMock: jest.Mock<any, any>;
    let mpmInstallMock: jest.Mock<any, any>;
    let addPathMock: jest.Mock<any, any>;
    let setOutputMock: jest.Mock<any, any>;

    const platform = "linux";
    const arch = "x64";
    const release = "latest";
    const releaseInfo = {
        name: "r2022b",
        version: "9.13.0",
        updateNumber: "latest"
    };
    const products = ["MATLAB", "Parallel_Computing_Toolbox"];

    const doInstall = () => install.install(platform, arch, release, products);

    beforeEach(() => {
        downloadAndRunScriptMock = script.downloadAndRunScript as jest.Mock;
        matlabGetReleaseInfoMock = matlab.getReleaseInfo as jest.Mock;
        matlabMakeToolcacheDirMock = matlab.makeToolcacheDir as jest.Mock;
        matlabSetupBatchMock = matlab.setupBatch as jest.Mock;
        mpmSetupMock = mpm.setup as jest.Mock;
        mpmInstallMock = mpm.install as jest.Mock;
        addPathMock = core.addPath as jest.Mock;
        setOutputMock = core.setOutput as jest.Mock;

        // Mock core.group to simply return the output of the func it gets from
        // the caller
        (core.group as jest.Mock).mockImplementation(async (_, func) => {
            return func();
        });
        matlabGetReleaseInfoMock.mockResolvedValue(releaseInfo);
        matlabMakeToolcacheDirMock.mockResolvedValue(["/opt/hostedtoolcache/MATLAB/9.13.0/x64", false]);
    });

    it("ideally works", async () => {
        await expect(doInstall()).resolves.toBeUndefined();
        expect(downloadAndRunScriptMock).toHaveBeenCalledTimes(1);
        expect(matlabSetupBatchMock).toHaveBeenCalledTimes(1);
        expect(mpmSetupMock).toHaveBeenCalledTimes(1);
        expect(mpmInstallMock).toHaveBeenCalledTimes(1);
        expect(addPathMock).toHaveBeenCalledTimes(1);
        expect(setOutputMock).toHaveBeenCalledTimes(1);
    });

    it("installs to MATLAB.app on mac", async () => {
        await expect(install.install("darwin", arch, release, products)).resolves.toBeUndefined();
        expect(mpmInstallMock.mock.calls[0][3]).toMatch("MATLAB.app");
    });

    ["darwin", "win32"].forEach((os) => {
        it(`does not run deps script on ${os}`, async () => { 
            await expect(install.install(os, arch, release, products)).resolves.toBeUndefined();
            expect(downloadAndRunScriptMock).toHaveBeenCalledTimes(0);
            expect(core.group).toHaveBeenCalledTimes(1);
            expect(matlabSetupBatchMock).toHaveBeenCalledTimes(1);
            expect(mpmSetupMock).toHaveBeenCalledTimes(1);
            expect(mpmInstallMock).toHaveBeenCalledTimes(1);
            expect(addPathMock).toHaveBeenCalledTimes(1);
            expect(setOutputMock).toHaveBeenCalledTimes(1);
        });
    });

    it("NoOp on existing install", async () => {
        matlabMakeToolcacheDirMock.mockResolvedValue(["/opt/hostedtoolcache/MATLAB/9.13.0/x64", true]);
        await expect(doInstall()).resolves.toBeUndefined();
        expect(mpmInstallMock).toHaveBeenCalledTimes(0);
        expect(addPathMock).toHaveBeenCalledTimes(1);
        expect(setOutputMock).toHaveBeenCalledTimes(1);
    });

    it("rejects for invalid MATLAB version", async () => {
        matlabGetReleaseInfoMock.mockRejectedValue(Error("oof"));
        await expect(doInstall()).rejects.toBeDefined();
    });

    it("rejects when the setup deps fails", async () => {
        downloadAndRunScriptMock.mockRejectedValueOnce(Error("oof"));
        await expect(doInstall()).rejects.toBeDefined();
    });

    it("rejects when the mpm install fails", async () => {
        mpmInstallMock.mockRejectedValue(Error("oof"));
        await expect(doInstall()).rejects.toBeDefined();
    });

    it("rejects when the matlab-batch install fails", async () => {
        matlabSetupBatchMock.mockRejectedValueOnce(Error("oof"));
        await expect(doInstall()).rejects.toBeDefined();
    });
});
