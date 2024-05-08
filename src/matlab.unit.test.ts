// Copyright 2022-2024 The MathWorks, Inc.

import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as http from "@actions/http-client";
import * as httpjs from "http";
import * as net from "net";
import * as path from "path";
import * as tc from "@actions/tool-cache";
import * as matlab from "./matlab";
import * as script from "./script";
import fs from "fs";
import properties from "./properties.json";

jest.mock("http");
jest.mock("net");
jest.mock("@actions/core");
jest.mock("@actions/exec");
jest.mock("@actions/http-client");
jest.mock("@actions/tool-cache");
jest.mock("./script");

afterEach(() => {
    jest.resetAllMocks();
});

describe("matlab tests", () => {
    const release = {
        name: "r2022b",
        version: "2022.2.999",
        update: "",
        isPrerelease: false,
    }
    const platform = "linux";
    
    describe("toolcacheLocation", () => {
        let findMock: jest.Mock;
        let cacheFileMock: jest.Mock;
        let infoMock: jest.Mock;

        beforeEach(() => {
            findMock = tc.find as jest.Mock;
            cacheFileMock = tc.cacheFile as jest.Mock;
            infoMock = core.info as jest.Mock;
        });

        it("returns toolpath if in toolcache", async () => {
            findMock.mockReturnValue("/opt/hostedtoolcache/matlab/r2022b");
            await expect(matlab.getToolcacheDir(platform, release)).resolves.toMatchObject(["/opt/hostedtoolcache/matlab/r2022b", true]);
            expect(infoMock).toHaveBeenCalledTimes(1);
        });
    
        it("creates cache and returns default path for linux", async () => {
            findMock.mockReturnValue("");
            cacheFileMock.mockReturnValue("/opt/hostedtoolcache/matlab/r2022b");
            await expect(matlab.getToolcacheDir(platform, release)).resolves.toMatchObject(["/opt/hostedtoolcache/matlab/r2022b", false]);
        });

        it("creates cache and returns default path for mac", async () => {
            findMock.mockReturnValue("");
            cacheFileMock.mockReturnValue("/opt/hostedtoolcache/matlab/r2022b");
            await expect(matlab.getToolcacheDir("darwin", release)).resolves.toMatchObject(["/opt/hostedtoolcache/matlab/r2022b/MATLAB.app", false]);
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
                cacheFileMock.mockImplementation(() => process.env["RUNNER_TOOL_CACHE"]);
                findMock.mockReturnValue("");
            });

            it("uses workaround if github-hosted", async () => {
                let expectedToolcacheDir = "D:\\hostedtoolcache\\windows\\matlab\\r2022b";

                // replicate github-hosted environment
                process.env["AGENT_ISSELFHOSTED"] = "0";
                process.env["RUNNER_ENVIRONMENT"] = "github-hosted";
                // mock & no-op fs operations
                let existsSyncSpy = jest.spyOn(fs, "existsSync").mockReturnValue(true);
                let mkdirSyncSpy = jest.spyOn(fs, "mkdirSync").mockImplementation(() => "");
                let symlinkSyncSpy = jest.spyOn(fs, "symlinkSync").mockImplementation(() => {});

                await expect(matlab.getToolcacheDir("win32", release)).resolves.toMatchObject([expectedToolcacheDir, false]);
                expect(existsSyncSpy).toHaveBeenCalledTimes(2);
                expect(mkdirSyncSpy).toHaveBeenCalledTimes(1);
                expect(symlinkSyncSpy).toHaveBeenCalledTimes(2);
            });

            it("uses default toolcache directory if not github hosted", async () => {
                let expectedToolcacheDir = "C:\\hostedtoolcache\\windows\\matlab\\r2022b";
                process.env["AGENT_ISSELFHOSTED"] = "1";
                process.env["RUNNER_ENVIRONMENT"] = "self-hosted";
                await expect(matlab.getToolcacheDir("win32", release)).resolves.toMatchObject([expectedToolcacheDir, false]);
            });

            it("uses default toolcache directory toolcache directory is not defined", async () => {
                let expectedToolcacheDir = "C:\\hostedtoolcache\\windows\\matlab\\r2022b";
                process.env["RUNNER_TOOL_CACHE"] = '';
                cacheFileMock.mockReturnValue(expectedToolcacheDir);
                await expect(matlab.getToolcacheDir("win32", release)).resolves.toMatchObject([expectedToolcacheDir, false]);
            });

            it("uses default toolcache directory if d: drive doesn't exist", async () => {
                jest.spyOn(fs, "existsSync").mockReturnValue(false);
                let expectedToolcacheDir = "C:\\hostedtoolcache\\windows\\matlab\\r2022b";
                await expect(matlab.getToolcacheDir("win32", release)).resolves.toMatchObject([expectedToolcacheDir, false]);
            });

            it("uses default toolcache directory if c: drive doesn't exist", async () => {
                jest.spyOn(fs, "existsSync").mockReturnValueOnce(true).mockReturnValue(false);
                let expectedToolcacheDir = "C:\\hostedtoolcache\\windows\\matlab\\r2022b";
                await expect(matlab.getToolcacheDir("win32", release)).resolves.toMatchObject([expectedToolcacheDir, false]);

            });
        });
    });

    describe("setupBatch", () => {
        let tcDownloadToolMock: jest.Mock;
        let cacheFileMock: jest.Mock;
        let execMock: jest.Mock;
        const arch = "x64";
        const batchMockPath = path.join("path", "to", "matlab-batch");
    
        beforeEach(() => {
            tcDownloadToolMock = tc.downloadTool as jest.Mock;
            cacheFileMock = tc.cacheFile as jest.Mock;
            execMock = exec.exec as jest.Mock;
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
            await expect(() => matlab.setupBatch('sunos', arch)).rejects.toBeDefined();
        });
    
        it("errors on unsupported architecture", async () => {
            const platform = "linux";
            await expect(() => matlab.setupBatch(platform, 'x86')).rejects.toBeDefined();
        });
    
        it("works without RUNNER_TEMP", async () => {
            const platform = "linux";
            process.env.RUNNER_TEMP = '';
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
            jest.spyOn(http.HttpClient.prototype, 'get').mockImplementation(async () => {
                return {
                    message: new httpjs.IncomingMessage(new net.Socket()),
                    readBody: () => {return Promise.resolve("r2022b")}
                };
            })            
        });

        it("latest-including-prereleases resolves", () => {
            expect(matlab.getReleaseInfo("latest")).resolves.toMatchObject(release);
        });

        it("prerelease-latest resolves", () => {
            const prereleaseName = "r2022bprerelease"
            const prerelease = {
                name: "r2022b",
                version: "2022.2.999-prerelease",
                update: "",
                isPrerelease: true,
            }
            jest.spyOn(http.HttpClient.prototype, 'get').mockImplementation(async () => {
                return {
                    message: new httpjs.IncomingMessage(new net.Socket()),
                    readBody: () => {return Promise.resolve(prereleaseName)}
                };
            })            
            expect(matlab.getReleaseInfo("latest-including-prerelease")).resolves.toMatchObject(prerelease);
        });

        it("case insensitive", () => {
            expect(matlab.getReleaseInfo("R2022b")).resolves.toMatchObject(release);
        });

        it("Sets minor version according to a or b release", () => {
            const R2022aRelease = {
                name: "r2022a",
                update: "",
                version: "2022.1.999",
                isPrerelease: false,
            }
            expect(matlab.getReleaseInfo("R2022a")).resolves.toMatchObject(R2022aRelease);

            const R2022bRelease = {
                name: "r2022b",
                update: "",
                version: "2022.2.999",
                isPrerelease: false,
            }
            expect(matlab.getReleaseInfo("R2022b")).resolves.toMatchObject(R2022bRelease);
        });

        it("allows specifying update number", () => {
            const releaseWithUpdate = {
                name: "r2022b",
                update: "u2",
                version: "2022.2.2",
            }
            expect(matlab.getReleaseInfo("R2022bU2")).resolves.toMatchObject(releaseWithUpdate);
        });

        it("displays message for invalid update level input format and uses latest", () => {
            expect(matlab.getReleaseInfo("r2022bUpdate1")).rejects.toBeDefined();
        });

        it("rejects for unsupported release", () => {
            expect(matlab.getReleaseInfo("R2022c")).rejects.toBeDefined();
        });

        it("rejects if for bad http response", () => {
            jest.spyOn(http.HttpClient.prototype, 'get').mockImplementation(async () => {
                return {
                    message: new httpjs.IncomingMessage(new net.Socket()),
                    readBody: () => {return Promise.reject("Bam!")}
                };
            })            
            expect(matlab.getReleaseInfo("latest")).rejects.toBeDefined();
        });
    });

    describe("installSystemDependencies", () => {
        let downloadAndRunScriptMock: jest.Mock;
        let tcDownloadToolMock: jest.Mock;
        let execMock: jest.Mock;
        const arch = "x64";
        const release = "r2023b";

        beforeEach(() => {
            downloadAndRunScriptMock = script.downloadAndRunScript as jest.Mock;
            tcDownloadToolMock = tc.downloadTool as jest.Mock;
            execMock = exec.exec as jest.Mock;
        });

        describe("test on all supported platforms", () => {
            it(`works on linux`, async () => {
                const platform = "linux";
                await expect(
                    matlab.installSystemDependencies(platform, arch, release)
                ).resolves.toBeUndefined();
                expect(downloadAndRunScriptMock).toHaveBeenCalledWith(
                    platform,
                    properties.matlabDepsUrl,
                    [release]
                );
            });

            it(`works on windows`, async () => {
                const platform = "win32";
                await expect(
                    matlab.installSystemDependencies(platform, arch, release)
                ).resolves.toBeUndefined();
            });

            it(`works on mac`, async () => {
                const platform = "darwin";
                await expect(
                    matlab.installSystemDependencies(platform, arch, release)
                ).resolves.toBeUndefined();
            });

            it(`works on mac with apple silicon`, async () => {
                const platform = "darwin";
                tcDownloadToolMock.mockResolvedValue("java.jdk");
                execMock.mockResolvedValue(0);
                await expect(
                    matlab.installSystemDependencies(platform, "arm64", release)
                ).resolves.toBeUndefined();
                expect(tcDownloadToolMock).toHaveBeenCalledWith(properties.appleSiliconJdkUrl, expect.anything());
                expect(execMock).toHaveBeenCalledWith(`sudo installer -pkg "java.jdk" -target /`);
            });

            it(`works on mac with apple silicon <R2023b`, async () => {
                const platform = "darwin";
                execMock.mockResolvedValue(0);
                await expect(
                    matlab.installSystemDependencies(platform, "arm64", "r2023a")
                ).resolves.toBeUndefined();
                expect(execMock).toHaveBeenCalledWith(`sudo softwareupdate --install-rosetta --agree-to-license`);
            });
        });

        it("rejects when the apple silicon JDK download fails", async () => {
            const platform = "darwin";
            tcDownloadToolMock.mockRejectedValue(Error("oof"));
            await expect(
                matlab.installSystemDependencies(platform, "arm64", release)
            ).rejects.toBeDefined();
        });

        it("rejects when the apple silicon JDK fails to install", async () => {
            const platform = "darwin";
            tcDownloadToolMock.mockResolvedValue("java.jdk");
            execMock.mockResolvedValue(1);
            await expect(
                matlab.installSystemDependencies(platform, "arm64", release)
            ).rejects.toBeDefined();
        });
    });
});
