// Copyright 2020-2022 The MathWorks, Inc.

import * as mpm from "./mpm";
import * as script from "./script";
import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";

jest.mock("@actions/exec");
jest.mock("@actions/tool-cache");
jest.mock("./script");

afterEach(() => {
    jest.resetAllMocks();
});

describe("setup mpm", () => {
    let tcDownloadToolMock: jest.Mock<any, any>;
    let tcExtractZipMock: jest.Mock<any, any>;
    let execMock: jest.Mock<any, any>; 
    let defaultInstallRootMock: jest.Mock<any, any>;
    const arch = "x64";

    beforeEach(() => {
        tcDownloadToolMock = tc.downloadTool as jest.Mock;
        tcExtractZipMock = tc.extractZip as jest.Mock;
        execMock = exec.exec as jest.Mock;
        defaultInstallRootMock = script.defaultInstallRoot as jest.Mock;
        process.env.RUNNER_TEMP = "/runner/workdir/tmp";
    });

    describe("test on all supported platforms", () => {
        it(`works on linux`, async () => {
            const platform = "linux";
            tcDownloadToolMock.mockResolvedValue("/path/to/mpm");
            execMock.mockResolvedValue(0);
            await expect(mpm.setup(platform, arch)).resolves.toBe("/path/to/mpm");
            expect(tcDownloadToolMock.mock.calls[0][0]).toContain("glnxa64");
        });
    
        it(`works on windows`, async () => {
            const platform = "win32";
            tcDownloadToolMock.mockResolvedValue("/path/to/zip");
            tcExtractZipMock.mockResolvedValue("/path/to/mpm");
            execMock.mockResolvedValue(0);
            await expect(mpm.setup(platform, arch)).resolves.toBe("/path/to/mpm/bin/win64/mpm.exe");
            expect(tcExtractZipMock).toHaveBeenCalledTimes(1);
            expect(tcDownloadToolMock.mock.calls[0][0]).toContain("win64");
        });
    });

    it("errors on unsupported platform", async () => {
        await expect(() => mpm.setup('sunos', arch)).rejects.toBeDefined();
    });

    it("errors on unsupported architecture", async () => {
        const platform = "linux";
        await expect(() => mpm.setup(platform, 'x86')).rejects.toBeDefined();
    });

    it("works without RUNNER_TEMP", async () => {
        const platform = "linux";
        process.env.RUNNER_TEMP = '';
        tcDownloadToolMock.mockResolvedValue("/path/to/mpm");
        defaultInstallRootMock.mockReturnValue("/path/to/install/root")
        execMock.mockResolvedValue(0);
        await expect(mpm.setup(platform, arch)).resolves.toBe("/path/to/mpm");
    });

    it("rejects when the download fails", async () => {
        const platform = "linux";
        tcDownloadToolMock.mockRejectedValue(Error("oof"));
        execMock.mockResolvedValue(0);
        await expect(mpm.setup(platform, arch)).rejects.toBeDefined();
    });

    it("rejects when the chmod fails", async () => {
        const platform = "linux";
        tcDownloadToolMock.mockResolvedValue("/path/to/mpm");
        execMock.mockResolvedValue(1);
        await expect(mpm.setup(platform, arch)).rejects.toBeDefined();
    });

});

describe("mpm install", () => {
    let execMock: jest.Mock<any, any>;

    const platform = "linux";
    const mpmPath = "mpm";
    const release = "R2022a";
    const products = ["MATLAB", "Compiler"];
    const destination = "/opt/matlab"
    
    beforeEach(() => {
        execMock = exec.exec as jest.Mock;
    });

    it("ideally works", async () => {
        execMock.mockResolvedValue(0);
        await expect(mpm.install(platform, mpmPath, release, products)).resolves.toBeUndefined();
    });

    it("omits destination flag if destination is not supplied", async () => {
        const expectedMpmArgs = [
            "install",
            `--release=${release}`,
            "--products",
            "MATLAB Compiler",
        ]
        execMock.mockResolvedValue(0);

        await expect(mpm.install(platform, mpmPath, release, products)).resolves.toBeUndefined();
        expect(execMock.mock.calls[0][1]).toMatchObject(expectedMpmArgs);
    });

    it("sets destination flag if destination is supplied", async () => {
        const expectedMpmArgs = [
            "install",
            `--release=${release}`,
            `--destination=${destination}`,
            "--products",
            "MATLAB Compiler",
        ]
        execMock.mockResolvedValue(0);

        await expect(mpm.install(platform, mpmPath, release, products, destination)).resolves.toBeUndefined();
        expect(execMock.mock.calls[0][1]).toMatchObject(expectedMpmArgs);
    });

    it("rejects on failed install", async () => {
        execMock.mockResolvedValue(1);
        await expect(mpm.install(platform, mpmPath, release, products)).rejects.toBeDefined();
    });
});
