// Copyright 2022 The MathWorks, Inc.

import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";
import * as path from "path";
import * as mpm from "./mpm";
import * as script from "./script";

jest.mock("@actions/core");
jest.mock("@actions/exec");
jest.mock("@actions/tool-cache");
jest.mock("./script");

afterEach(() => {
    jest.resetAllMocks();
});

describe("setup mpm", () => {
    let tcDownloadToolMock: jest.Mock;
    let tcExtractZipMock: jest.Mock;
    let execMock: jest.Mock;
    let defaultInstallRootMock: jest.Mock;
    const arch = "x64";
    const mpmMockPath = path.join("path", "to", "mpm");
    const zipMockPath = path.join("path", "to", "zip");

    beforeEach(() => {
        tcDownloadToolMock = tc.downloadTool as jest.Mock;
        tcExtractZipMock = tc.extractZip as jest.Mock;
        execMock = exec.exec as jest.Mock;
        defaultInstallRootMock = script.defaultInstallRoot as jest.Mock;
        process.env.RUNNER_TEMP = path.join("runner", "workdir", "tmp");
    });

    describe("test on all supported platforms", () => {
        it(`works on linux`, async () => {
            const platform = "linux";
            tcDownloadToolMock.mockResolvedValue(mpmMockPath);
            execMock.mockResolvedValue(0);
            await expect(mpm.setup(platform, arch)).resolves.toBe(mpmMockPath);
            expect(tcDownloadToolMock.mock.calls[0][0]).toContain("glnxa64");
        });
    
        it(`works on windows`, async () => {
            const platform = "win32";
            tcDownloadToolMock.mockResolvedValue(zipMockPath);
            tcExtractZipMock.mockResolvedValue(mpmMockPath);
            execMock.mockResolvedValue(0);
            await expect(mpm.setup(platform, arch)).resolves.toBe(path.join(mpmMockPath, "bin", "win64", "mpm.exe"));
            expect(tcExtractZipMock).toHaveBeenCalledTimes(1);
            expect(tcDownloadToolMock.mock.calls[0][0]).toContain("win64");
        });

        it(`works on mac`, async () => {
            const platform = "darwin";
            tcDownloadToolMock.mockResolvedValue(zipMockPath);
            tcExtractZipMock.mockResolvedValue(mpmMockPath);
            execMock.mockResolvedValue(0);
            await expect(mpm.setup(platform, arch)).resolves.toBe(path.join(mpmMockPath, "bin", "maci64", "mpm"));
            expect(tcExtractZipMock).toHaveBeenCalledTimes(1);
            expect(tcDownloadToolMock.mock.calls[0][0]).toContain("maci64");
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
        tcDownloadToolMock.mockResolvedValue(mpmMockPath);
        defaultInstallRootMock.mockReturnValue(path.join("path", "to", "install", "root"));
        execMock.mockResolvedValue(0);
        await expect(mpm.setup(platform, arch)).resolves.toBe(mpmMockPath);
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
    let execMock: jest.Mock;
    const mpmPath = "mpm";
    const releaseInfo = {name: "r2022b", version: "9.13.0", update: ""};
    const mpmRelease = "r2022b"
    beforeEach(() => {
        execMock = exec.exec as jest.Mock;
    });

    it("works with multiline products list", async () => {
        const destination ="/opt/matlab";
        const products = ["MATLAB", "Compiler"];
        const expectedMpmArgs = [
            "install",
            `--release=${mpmRelease}`,
            `--destination=${destination}`,
            "--products",
            "MATLAB",
            "Compiler",
            "Parallel_Computing_Toolbox",
        ]
        execMock.mockResolvedValue(0);

        await expect(mpm.install(mpmPath, releaseInfo, products, destination)).resolves.toBeUndefined();
        expect(execMock.mock.calls[0][1]).toMatchObject(expectedMpmArgs);
    });

    it("works works with space separated products list", async () => {
        const destination = "/opt/matlab";
        const products = ["MATLAB Compiler"];
        const expectedMpmArgs = [
            "install",
            `--release=${mpmRelease}`,
            `--destination=${destination}`,
            "--products",
            "MATLAB",
            "Compiler",
            "Parallel_Computing_Toolbox",
        ]
        execMock.mockResolvedValue(0);

        await expect(mpm.install(mpmPath, releaseInfo, products, destination)).resolves.toBeUndefined();
        expect(execMock.mock.calls[0][1]).toMatchObject(expectedMpmArgs);
    });

    it("rejects on failed install", async () => {
        const destination = "/opt/matlab";
        const products = ["MATLAB", "Compiler"];
        execMock.mockResolvedValue(1);
        await expect(mpm.install(mpmPath, releaseInfo, products, destination)).rejects.toBeDefined();
    });
});
