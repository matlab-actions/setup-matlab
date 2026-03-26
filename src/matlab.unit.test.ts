// Copyright 2022-2024 The MathWorks, Inc.

import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import * as httpjs from "http";
import * as net from "net";
import * as path from "path";
import * as realFs from "fs";
import properties from "./properties.json" with { type: "json" };

const mockWriteFileSync = jest.fn();
const mockExistsSync = jest.fn();
const mockMkdirSync = jest.fn();
const mockSymlinkSync = jest.fn();
jest.unstable_mockModule("fs", () => ({
    ...realFs,
    default: {
        ...realFs,
        writeFileSync: mockWriteFileSync,
        existsSync: mockExistsSync,
        mkdirSync: mockMkdirSync,
        symlinkSync: mockSymlinkSync,
    },
    writeFileSync: mockWriteFileSync,
    existsSync: mockExistsSync,
    mkdirSync: mockMkdirSync,
    symlinkSync: mockSymlinkSync,
}));

jest.unstable_mockModule("@actions/core", () => ({
    info: jest.fn(),
    addPath: jest.fn(),
}));

jest.unstable_mockModule("@actions/exec", () => ({
    exec: jest.fn(),
}));

jest.unstable_mockModule("@actions/http-client", () => {
    const HttpClient = jest.fn().mockImplementation(() => ({}));
    HttpClient.prototype.get = jest.fn();
    return { HttpClient };
});

jest.unstable_mockModule("@actions/io", () => ({
    rmRF: jest.fn(),
}));
jest.unstable_mockModule("@actions/tool-cache", () => ({
    find: jest.fn(),
    cacheFile: jest.fn(),
    downloadTool: jest.fn(),
}));

jest.unstable_mockModule("./script.js", () => ({
    downloadAndRunScript: jest.fn(),
}));

const core = await import("@actions/core");
const exec = await import("@actions/exec");
const http = await import("@actions/http-client");
const tc = await import("@actions/tool-cache");
const script = await import("./script.js");
const matlab = await import("./matlab.js");

afterEach(() => {
    jest.resetAllMocks();
});

describe("matlab tests", () => {
    const release = {
        name: "r2022b",
        version: "2022.2.999",
        update: "",
        isPrerelease: false,
    };
    const platform = "linux";

    describe("toolcacheLocation", () => {
        let findMock: jest.Mock<typeof tc.find>;
        let cacheFileMock: jest.Mock<typeof tc.cacheFile>;
        let infoMock: jest.Mock<typeof core.info>;

        beforeEach(() => {
            findMock = tc.find as jest.Mock<typeof tc.find>;
            cacheFileMock = tc.cacheFile as jest.Mock<typeof tc.cacheFile>;
            infoMock = core.info as jest.Mock<typeof core.info>;
        });

        it("returns toolpath if in toolcache", async () => {
            findMock.mockReturnValue("/opt/hostedtoolcache/matlab/r2022b");
            await expect(matlab.getToolcacheDir(platform, release)).resolves.toEqual([
                "/opt/hostedtoolcache/matlab/r2022b",
                true,
            ]);
            expect(infoMock).toHaveBeenCalledTimes(1);
        });

        it("creates cache and returns default path for linux", async () => {
            findMock.mockReturnValue("");
            cacheFileMock.mockResolvedValue("/opt/hostedtoolcache/matlab/r2022b");
            await expect(matlab.getToolcacheDir(platform, release)).resolves.toEqual([
                "/opt/hostedtoolcache/matlab/r2022b",
                false,
            ]);
        });

        it("creates cache and returns default path for mac", async () => {
            findMock.mockReturnValue("");
            cacheFileMock.mockResolvedValue("/opt/hostedtoolcache/matlab/r2022b");
            await expect(matlab.getToolcacheDir("darwin", release)).resolves.toEqual([
                "/opt/hostedtoolcache/matlab/r2022b/MATLAB.app",
                false,
            ]);
        });

        describe("windows performance workaround", () => {
            let runnerEnv: string | undefined;
            let agentIsSelfHosted: string | undefined;
            let runnerToolcache: string | undefined;

            afterEach(() => {
                process.env["RUNNER_ENVIRONMENT"] = runnerEnv;
                process.env["AGENT_ISSELFHOSTED"] = agentIsSelfHosted;
                process.env["RUNNER_TOOL_CACHE"] = runnerToolcache;
            });

            beforeEach(() => {
                runnerEnv = process.env["RUNNER_ENVIRONMENT"];
                agentIsSelfHosted = process.env["AGENT_ISSELFHOSTED"];
                runnerToolcache = process.env["RUNNER_TOOL_CACHE"];

                process.env["RUNNER_TOOL_CACHE"] = "C:\\hostedtoolcache\\windows\\matlab\\r2022b";
                cacheFileMock.mockImplementation(() => Promise.resolve(process.env["RUNNER_TOOL_CACHE"] ?? ""));
                findMock.mockReturnValue("");
            });

            it("uses workaround if github-hosted", async () => {
                let expectedToolcacheDir = "D:\\hostedtoolcache\\windows\\matlab\\r2022b";

                // replicate github-hosted environment
                process.env["AGENT_ISSELFHOSTED"] = "0";
                process.env["RUNNER_ENVIRONMENT"] = "github-hosted";
                // mock & no-op fs operations
                mockExistsSync.mockReturnValue(true);

                await expect(matlab.getToolcacheDir("win32", release)).resolves.toEqual([
                    expectedToolcacheDir,
                    false,
                ]);
                expect(mockExistsSync).toHaveBeenCalledTimes(2);
                expect(mockMkdirSync).toHaveBeenCalledTimes(1);
                expect(mockSymlinkSync).toHaveBeenCalledTimes(2);
            });

            it("uses default toolcache directory if not github hosted", async () => {
                let expectedToolcacheDir = "C:\\hostedtoolcache\\windows\\matlab\\r2022b";
                process.env["AGENT_ISSELFHOSTED"] = "1";
                process.env["RUNNER_ENVIRONMENT"] = "self-hosted";
                await expect(matlab.getToolcacheDir("win32", release)).resolves.toEqual([
                    expectedToolcacheDir,
                    false,
                ]);
            });

            it("uses default toolcache directory toolcache directory is not defined", async () => {
                let expectedToolcacheDir = "C:\\hostedtoolcache\\windows\\matlab\\r2022b";
                process.env["RUNNER_TOOL_CACHE"] = "";
                cacheFileMock.mockResolvedValue(expectedToolcacheDir);
                await expect(matlab.getToolcacheDir("win32", release)).resolves.toEqual([
                    expectedToolcacheDir,
                    false,
                ]);
            });

            it("uses default toolcache directory if d: drive doesn't exist", async () => {
                mockExistsSync.mockReturnValue(false);
                let expectedToolcacheDir = "C:\\hostedtoolcache\\windows\\matlab\\r2022b";
                await expect(matlab.getToolcacheDir("win32", release)).resolves.toEqual([
                    expectedToolcacheDir,
                    false,
                ]);
            });

            it("uses default toolcache directory if c: drive doesn't exist", async () => {
                mockExistsSync.mockReturnValueOnce(true).mockReturnValue(false);
                let expectedToolcacheDir = "C:\\hostedtoolcache\\windows\\matlab\\r2022b";
                await expect(matlab.getToolcacheDir("win32", release)).resolves.toEqual([
                    expectedToolcacheDir,
                    false,
                ]);
            });
        });
    });

    describe("setupBatch", () => {
        let tcDownloadToolMock: jest.Mock<typeof tc.downloadTool>;
        let cacheFileMock: jest.Mock<typeof tc.cacheFile>;
        let execMock: jest.Mock<typeof exec.exec>;
        const arch = "x64";
        const batchMockPath = path.join("path", "to", "matlab-batch");

        beforeEach(() => {
            tcDownloadToolMock = tc.downloadTool as jest.Mock<typeof tc.downloadTool>;
            cacheFileMock = tc.cacheFile as jest.Mock<typeof tc.cacheFile>;
            execMock = exec.exec as jest.Mock<typeof exec.exec>;
            process.env.RUNNER_TEMP = path.join("runner", "workdir", "tmp");

            tcDownloadToolMock.mockResolvedValue(batchMockPath);
            cacheFileMock.mockResolvedValue(batchMockPath);
            execMock.mockResolvedValue(0);
        });

        describe("test on all supported platforms", () => {
            it(`works on linux`, async () => {
                const platform = "linux";
                await expect(matlab.setupBatch(platform, arch)).resolves.toBeUndefined();
                expect(cacheFileMock).toHaveBeenCalledTimes(1);
            });

            it(`works on windows`, async () => {
                const platform = "win32";
                await expect(matlab.setupBatch(platform, arch)).resolves.toBeUndefined();
            });

            it(`works on mac`, async () => {
                const platform = "darwin";
                await expect(matlab.setupBatch(platform, arch)).resolves.toBeUndefined();
            });

            it(`works on mac with apple silicon`, async () => {
                const platform = "darwin";
                execMock.mockResolvedValue(0);
                await expect(matlab.setupBatch(platform, "arm64")).resolves.toBeUndefined();
            });
        });

        it("errors on unsupported platform", async () => {
            await expect(() => matlab.setupBatch("sunos", arch)).rejects.toBeDefined();
        });

        it("errors on unsupported architecture", async () => {
            const platform = "linux";
            await expect(() => matlab.setupBatch(platform, "x86")).rejects.toBeDefined();
        });

        it("works without RUNNER_TEMP", async () => {
            const platform = "linux";
            process.env.RUNNER_TEMP = "";
            await expect(matlab.setupBatch(platform, arch)).resolves.toBeUndefined();
        });

        it("rejects when the download fails", async () => {
            const platform = "linux";
            tcDownloadToolMock.mockRejectedValue(Error("oof"));
            await expect(matlab.setupBatch(platform, arch)).rejects.toBeDefined();
        });

        it("rejects when the chmod fails", async () => {
            const platform = "linux";
            execMock.mockResolvedValue(1);
            await expect(matlab.setupBatch(platform, arch)).rejects.toBeDefined();
        });
    });

    describe("getReleaseInfo", () => {
        beforeEach(() => {
            jest.spyOn(http.HttpClient.prototype, "get").mockImplementation(async () => {
                return {
                    message: new httpjs.IncomingMessage(new net.Socket()),
                    readBody: () => {
                        return Promise.resolve("r2022b");
                    },
                };
            });
        });

        it("latest-including-prereleases resolves", () => {
            expect(matlab.getReleaseInfo("latest")).resolves.toEqual(release);
        });

        it("prerelease-latest resolves", () => {
            const prereleaseName = "r2022bprerelease";
            const prerelease = {
                name: "r2022b",
                version: "2022.2.999-prerelease",
                update: "",
                isPrerelease: true,
            };
            jest.spyOn(http.HttpClient.prototype, "get").mockImplementation(async () => {
                return {
                    message: new httpjs.IncomingMessage(new net.Socket()),
                    readBody: () => {
                        return Promise.resolve(prereleaseName);
                    },
                };
            });
            expect(matlab.getReleaseInfo("latest-including-prerelease")).resolves.toEqual(
                prerelease,
            );
        });

        it("case insensitive", () => {
            expect(matlab.getReleaseInfo("R2022b")).resolves.toEqual(release);
        });

        it("Sets minor version according to a or b release", () => {
            const R2022aRelease = {
                name: "r2022a",
                update: "",
                version: "2022.1.999",
                isPrerelease: false,
            };
            expect(matlab.getReleaseInfo("R2022a")).resolves.toEqual(R2022aRelease);

            const R2022bRelease = {
                name: "r2022b",
                update: "",
                version: "2022.2.999",
                isPrerelease: false,
            };
            expect(matlab.getReleaseInfo("R2022b")).resolves.toEqual(R2022bRelease);
        });

        it("allows specifying update number", () => {
            const releaseWithUpdate = {
                name: "r2022b",
                update: "u2",
                version: "2022.2.2",
                isPrerelease: false,
            };
            expect(matlab.getReleaseInfo("R2022bU2")).resolves.toEqual(releaseWithUpdate);
        });

        it("displays message for invalid update level input format and uses latest", () => {
            expect(matlab.getReleaseInfo("r2022bUpdate1")).rejects.toBeDefined();
        });

        it("rejects for unsupported release", () => {
            expect(matlab.getReleaseInfo("R2022c")).rejects.toBeDefined();
        });

        it("rejects if for bad http response", () => {
            jest.spyOn(http.HttpClient.prototype, "get").mockImplementation(async () => {
                return {
                    message: new httpjs.IncomingMessage(new net.Socket()),
                    readBody: () => {
                        return Promise.reject("Bam!");
                    },
                };
            });
            expect(matlab.getReleaseInfo("latest")).rejects.toBeDefined();
        });
    });

    describe("installSystemDependencies", () => {
        let downloadAndRunScriptMock: jest.Mock<typeof script.downloadAndRunScript>;
        let tcDownloadToolMock: jest.Mock<typeof tc.downloadTool>;
        let execMock: jest.Mock<typeof exec.exec>;
        const arch = "x64";
        const release = "r2023b";

        beforeEach(() => {
            downloadAndRunScriptMock = script.downloadAndRunScript as jest.Mock<typeof script.downloadAndRunScript>;
            tcDownloadToolMock = tc.downloadTool as jest.Mock<typeof tc.downloadTool>;
            execMock = exec.exec as jest.Mock<typeof exec.exec>;
        });

        describe("test on all supported platforms", () => {
            it(`works on linux`, async () => {
                const platform = "linux";
                await expect(
                    matlab.installSystemDependencies(platform, arch, release),
                ).resolves.toBeUndefined();
                expect(downloadAndRunScriptMock).toHaveBeenCalledWith(
                    platform,
                    properties.matlabDepsUrl,
                    [release],
                );
            });

            it(`works on windows`, async () => {
                const platform = "win32";
                await expect(
                    matlab.installSystemDependencies(platform, arch, release),
                ).resolves.toBeUndefined();
            });

            it(`works on mac`, async () => {
                const platform = "darwin";
                await expect(
                    matlab.installSystemDependencies(platform, arch, release),
                ).resolves.toBeUndefined();
            });

            it(`works on mac with apple silicon`, async () => {
                const platform = "darwin";
                tcDownloadToolMock.mockResolvedValue("java.jdk");
                execMock.mockResolvedValue(0);
                await expect(
                    matlab.installSystemDependencies(platform, "arm64", release),
                ).resolves.toBeUndefined();
                expect(tcDownloadToolMock).toHaveBeenCalledWith(
                    properties.appleSiliconJdkUrl,
                    expect.anything(),
                );
                expect(execMock).toHaveBeenCalledWith(`sudo installer -pkg "java.jdk" -target /`);
            });

            it(`works on mac with apple silicon <R2023b`, async () => {
                const platform = "darwin";
                execMock.mockResolvedValue(0);
                await expect(
                    matlab.installSystemDependencies(platform, "arm64", "r2023a"),
                ).resolves.toBeUndefined();
                expect(execMock).toHaveBeenCalledWith(
                    `sudo softwareupdate --install-rosetta --agree-to-license`,
                );
            });
        });

        it("rejects when the apple silicon JDK download fails", async () => {
            const platform = "darwin";
            tcDownloadToolMock.mockRejectedValue(Error("oof"));
            await expect(
                matlab.installSystemDependencies(platform, "arm64", release),
            ).rejects.toBeDefined();
        });

        it("rejects when the apple silicon JDK fails to install", async () => {
            const platform = "darwin";
            tcDownloadToolMock.mockResolvedValue("java.jdk");
            execMock.mockResolvedValue(1);
            await expect(
                matlab.installSystemDependencies(platform, "arm64", release),
            ).rejects.toBeDefined();
        });
    });
});
