// Copyright 2022-2026 The MathWorks, Inc.

import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import type { ExecOptions } from "@actions/exec";

jest.unstable_mockModule("@actions/core", () => ({}));

jest.unstable_mockModule("@actions/exec", () => ({
    exec: jest.fn(),
}));

jest.unstable_mockModule("@actions/tool-cache", () => ({
    downloadTool: jest.fn(),
    cacheFile: jest.fn(),
}));

jest.unstable_mockModule("@actions/io", () => ({
    rmRF: jest.fn(),
}));

jest.unstable_mockModule("./script.js", () => ({
    defaultInstallRoot: jest.fn(),
}));

const exec = await import("@actions/exec");
const tc = await import("@actions/tool-cache");
const io = await import("@actions/io");
const path = await import("path");
const mpm = await import("./mpm.js");
const script = await import("./script.js");

afterEach(() => {
    jest.resetAllMocks();
});

describe("setup mpm", () => {
    let tcDownloadToolMock: jest.Mock<typeof tc.downloadTool>;
    let tcCacheFileMock: jest.Mock<typeof tc.cacheFile>;
    let execMock: jest.Mock<typeof exec.exec>;
    let defaultInstallRootMock: jest.Mock<typeof script.defaultInstallRoot>;
    const arch = "x64";
    const mpmMockPath = path.join("path", "to", "mpm");

    beforeEach(() => {
        tcDownloadToolMock = tc.downloadTool as jest.Mock<typeof tc.downloadTool>;
        tcCacheFileMock = tc.cacheFile as jest.Mock<typeof tc.cacheFile>;
        execMock = exec.exec as jest.Mock<typeof exec.exec>;
        defaultInstallRootMock = script.defaultInstallRoot as jest.Mock<
            typeof script.defaultInstallRoot
        >;
        tcDownloadToolMock.mockResolvedValue(mpmMockPath);
        tcCacheFileMock.mockResolvedValue(mpmMockPath);
        process.env.RUNNER_TEMP = path.join("runner", "workdir", "tmp");
    });

    describe("test on all supported platforms", () => {
        it(`works on linux`, async () => {
            const platform = "linux";
            execMock.mockResolvedValue(0);
            await expect(mpm.setup(platform, arch)).resolves.toBe(mpmMockPath);
            expect(tcDownloadToolMock.mock.calls[0][0]).toContain("glnxa64");
        });

        it(`works on windows`, async () => {
            const platform = "win32";
            tcDownloadToolMock.mockResolvedValue(mpmMockPath);
            execMock.mockResolvedValue(0);
            await expect(mpm.setup(platform, arch)).resolves.toBe(path.join(mpmMockPath));
            expect(tcDownloadToolMock.mock.calls[0][0]).toContain("win64");
        });

        it(`works on mac`, async () => {
            const platform = "darwin";
            tcDownloadToolMock.mockResolvedValue(mpmMockPath);
            execMock.mockResolvedValue(0);
            await expect(mpm.setup(platform, arch)).resolves.toBe(path.join(mpmMockPath));
            expect(tcDownloadToolMock.mock.calls[0][0]).toContain("maci64");
        });

        it(`works on mac with apple silicon`, async () => {
            const platform = "darwin";
            execMock.mockResolvedValue(0);
            await expect(mpm.setup(platform, "arm64")).resolves.toBe(mpmMockPath);
            expect(tcDownloadToolMock.mock.calls[0][0]).toContain("maca64");
        });
    });

    it("errors on unsupported platform", async () => {
        await expect(() => mpm.setup("sunos", arch)).rejects.toBeDefined();
    });

    it("errors on unsupported architecture", async () => {
        const platform = "linux";
        await expect(() => mpm.setup(platform, "x86")).rejects.toBeDefined();
    });

    it("errors without RUNNER_TEMP", async () => {
        const platform = "linux";
        process.env.RUNNER_TEMP = "";
        tcDownloadToolMock.mockResolvedValue(mpmMockPath);
        defaultInstallRootMock.mockReturnValue(path.join("path", "to", "install", "root"));
        execMock.mockResolvedValue(0);
        await expect(mpm.setup(platform, arch)).rejects.toBeDefined();
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
    let execMock: jest.Mock<typeof exec.exec>;
    let rmRFMock: jest.Mock<typeof io.rmRF>;
    const mpmPath = "mpm";
    const releaseInfo = { name: "r2022b", version: "9.13.0", update: "", isPrerelease: false };
    const mpmRelease = "r2022b";
    beforeEach(() => {
        execMock = exec.exec as jest.Mock<typeof exec.exec>;
        rmRFMock = io.rmRF as jest.Mock<typeof io.rmRF>;
    });

    it("works with multiline products list", async () => {
        const destination = "/opt/matlab";
        const products = ["MATLAB", "Compiler"];
        const expectedMpmArgs = [
            "install",
            `--release=${mpmRelease}`,
            `--destination=${destination}`,
            "--products",
            "MATLAB",
            "Compiler",
        ];
        execMock.mockResolvedValue(0);

        await expect(
            mpm.install(mpmPath, releaseInfo, products, destination),
        ).resolves.toBeUndefined();
        expect(execMock.mock.calls[0][1]).toEqual(expectedMpmArgs);
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
        ];
        execMock.mockResolvedValue(0);

        await expect(
            mpm.install(mpmPath, releaseInfo, products, destination),
        ).resolves.toBeUndefined();
        expect(execMock.mock.calls[0][1]).toEqual(expectedMpmArgs);
    });

    it("works with prerelease", async () => {
        const prereleaseInfo = {
            name: "r2022b",
            version: "2022.2.999",
            update: "",
            isPrerelease: true,
        };
        const destination = "/opt/matlab";
        const products = ["MATLAB", "Compiler"];
        const expectedMpmArgs = [
            "install",
            `--release=${mpmRelease}`,
            `--destination=${destination}`,
            "--release-status=Prerelease",
            "--products",
            "MATLAB",
            "Compiler",
        ];
        execMock.mockResolvedValue(0);

        await expect(
            mpm.install(mpmPath, prereleaseInfo, products, destination),
        ).resolves.toBeUndefined();
        expect(execMock.mock.calls[0][1]).toEqual(expectedMpmArgs);
    });

    it("rejects and cleans on mpm rejection", async () => {
        const destination = "/opt/matlab";
        const products = ["MATLAB", "Compiler"];
        execMock.mockRejectedValue(1);
        await expect(
            mpm.install(mpmPath, releaseInfo, products, destination),
        ).rejects.toBeDefined();
        expect(rmRFMock).toHaveBeenCalledWith(destination);
    });

    it("rejects and cleans on failed install", async () => {
        const destination = "/opt/matlab";
        const products = ["MATLAB", "Compiler"];
        execMock.mockResolvedValue(1);
        await expect(
            mpm.install(mpmPath, releaseInfo, products, destination),
        ).rejects.toBeDefined();
        expect(rmRFMock).toHaveBeenCalledWith(destination);
    });

    it("does not reject when mpm exits non-zero but reports already installed", async () => {
        const destination = "/opt/matlab";
        const products = ["MATLAB", "Compiler"];

        // Simulate mpm writing the "already installed" message to stdout and returning non-zero
        execMock.mockImplementation((cmd: string, args?: string[], options?: ExecOptions) => {
            if (options && options.listeners && typeof options.listeners.stdout === "function") {
                options.listeners.stdout(
                    Buffer.from("All specified products are already installed."),
                );
            }
            return Promise.resolve(1);
        });

        await expect(
            mpm.install(mpmPath, releaseInfo, products, destination),
        ).resolves.toBeUndefined();
        expect(rmRFMock).not.toHaveBeenCalled();
    });
});
