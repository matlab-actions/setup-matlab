// Copyright 2020-2022 The MathWorks, Inc.

import * as core from "@actions/core";
import * as install from "./install";
import * as matlabBatch from "./matlabBatch";
import * as mpm from "./mpm";
import * as script from "./script";

jest.mock("@actions/core");
jest.mock("./matlabBatch");
jest.mock("./mpm");
jest.mock("./script");

afterEach(() => {
    jest.resetAllMocks();
});

describe("install procedure", () => {
    let downloadAndRunScriptMock: jest.Mock<any, any>;
    let matlabBatchSetupMock: jest.Mock<any, any>;
    let mpmSetupMock: jest.Mock<any, any>;
    let mpmInstallMock: jest.Mock<any, any>;
    
    const platform = "linux";
    const release = "latest";
    const products = ["MATLAB", "Parallel_Computing_Toolbox"];

    const doInstall = () => install.install(platform, release, products);

    beforeEach(() => {
        downloadAndRunScriptMock = script.downloadAndRunScript as jest.Mock;
        matlabBatchSetupMock = matlabBatch.setup as jest.Mock;
        mpmSetupMock = mpm.setup as jest.Mock;
        mpmInstallMock = mpm.install as jest.Mock;

        // Mock core.group to simply return the output of the func it gets from
        // the caller
        (core.group as jest.Mock).mockImplementation(async (_, func) => {
            return func();
        });
    });

    it("ideally works", async () => {
        await expect(doInstall()).resolves.toBeUndefined();
        expect(downloadAndRunScriptMock).toHaveBeenCalledTimes(1);
        expect(matlabBatchSetupMock).toHaveBeenCalledTimes(1);
        expect(mpmSetupMock).toHaveBeenCalledTimes(1);
        expect(mpmInstallMock).toHaveBeenCalledTimes(1);
    });

    ["darwin", "win32"].forEach((os) => {
        it(`does not run deps script on ${os}`, async () => {    
            await expect(install.install(os, release, products)).resolves.toBeUndefined();
            expect(downloadAndRunScriptMock).toHaveBeenCalledTimes(0);
            expect(matlabBatchSetupMock).toHaveBeenCalledTimes(1);
            expect(mpmSetupMock).toHaveBeenCalledTimes(1);
            expect(mpmInstallMock).toHaveBeenCalledTimes(1);
            expect(core.group).toHaveBeenCalledTimes(2);
        });
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
        matlabBatchSetupMock.mockRejectedValueOnce(Error("oof"));
        await expect(doInstall()).rejects.toBeDefined();
    });
});