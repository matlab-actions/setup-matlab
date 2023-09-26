// Copyright 2022 The MathWorks, Inc.

import * as core from "@actions/core";
import * as http from "@actions/http-client";
import * as httpjs from "http";
import * as net from 'net';
import * as tc from "@actions/tool-cache";
import * as matlab from "./matlab";
import * as script from "./script";

jest.mock("./script");
jest.mock("http");
jest.mock("net");
jest.mock("@actions/core");
jest.mock("@actions/http-client");
jest.mock("@actions/tool-cache");

afterEach(() => {
    jest.resetAllMocks();
});

describe("matlab tests", () => {
    const release = {
        name: "r2022b",
        version: "2022.2.999",
        update: "",
    }
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
            await expect(matlab.makeToolcacheDir(release)).resolves.toMatchObject(["/opt/hostedtoolcache/matlab/r2022b", true]);
            expect(infoMock).toHaveBeenCalledTimes(1);
        });
    
        it("creates cache and returns new path if not in toolcache", async () => {
            findMock.mockReturnValue("");
            cacheFileMock.mockReturnValue("/opt/hostedtoolcache/matlab/r2022b");
            await expect(matlab.makeToolcacheDir(release)).resolves.toMatchObject(["/opt/hostedtoolcache/matlab/r2022b", false]);
        })    
    });

    describe("setupBatch", () => {
        let downloadAndRunScriptMock: jest.Mock;
        let addPathMock: jest.Mock;
        let tcCacheDirMock: jest.Mock;
        let tcFindMock: jest.Mock;
        const platform = "linux";

        beforeEach(() => {
            downloadAndRunScriptMock = script.downloadAndRunScript as jest.Mock;
            addPathMock = core.addPath as jest.Mock;
            tcCacheDirMock = tc.cacheDir as jest.Mock;
            tcFindMock = tc.find as jest.Mock;
        });

        it("ideally works", async () => {
            downloadAndRunScriptMock.mockResolvedValue(undefined);
            await expect(matlab.setupBatch(platform)).resolves.toBeUndefined();
            expect(downloadAndRunScriptMock).toHaveBeenCalledTimes(1);
            expect(addPathMock).toHaveBeenCalledTimes(1);
        });

        it("rejects when the download fails", async () => {
            tcFindMock.mockReturnValue("");
            downloadAndRunScriptMock.mockRejectedValueOnce(Error("oof"));

            await expect(matlab.setupBatch(platform)).rejects.toBeDefined();
            expect(downloadAndRunScriptMock).toHaveBeenCalledTimes(1);
            expect(addPathMock).toHaveBeenCalledTimes(0);
            expect(tcCacheDirMock).toHaveBeenCalledTimes(0);
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

        it("latest resolves", () => {
            expect(matlab.getReleaseInfo("latest")).resolves.toMatchObject(release);
        });

        it("case insensitive", () => {
            expect(matlab.getReleaseInfo("R2022b")).resolves.toMatchObject(release);
        });

        it("Sets minor version according to a or b release", () => {
            const R2022aRelease = {
                name: "r2022a",
                update: "",
                version: "2022.1.999",
            }
            expect(matlab.getReleaseInfo("R2022a")).resolves.toMatchObject(R2022aRelease);

            const R2022bRelease = {
                name: "r2022b",
                update: "",
                version: "2022.2.999",
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
});
