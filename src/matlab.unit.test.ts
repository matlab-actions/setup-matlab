// Copyright 2022 The MathWorks, Inc.

import * as core from "@actions/core";
import * as http from "@actions/http-client";
import * as tc from "@actions/tool-cache";
import * as matlab from "./matlab";
import * as script from "./script";

jest.mock("./script")
jest.mock("@actions/core");
jest.mock("@actions/http-client");
jest.mock("@actions/tool-cache");

afterEach(() => {
    jest.resetAllMocks();
});

describe("matlab tests", () => {
    const release = {
        name: "r2022b",
        version: "9.13.0",
        updateNumber: "Latest",
    }
    describe("toolcacheLocation", () => {
        let findMock: jest.Mock<any, any>;
        let cacheFileMock: jest.Mock<any, any>; 
        let infoMock: jest.Mock<any, any>;

        beforeEach(() => {
            findMock = tc.find as jest.Mock;
            cacheFileMock = tc.cacheFile as jest.Mock;
            infoMock = core.info as jest.Mock;
        });

        it("returns toolpath if in toolcache", async () => {
            findMock.mockReturnValue("/opt/hostedtoolcache/matlab/r2022b");
            await expect(matlab.toolcacheLocation(release)).resolves.toMatchObject(["/opt/hostedtoolcache/matlab/r2022b", true]);
            expect(infoMock).toHaveBeenCalledTimes(1);
        });
    
        it("creates cache and returns new path if not in toolcache", async () => {
            findMock.mockReturnValue("");
            cacheFileMock.mockReturnValue("/opt/hostedtoolcache/matlab/r2022b");
            await expect(matlab.toolcacheLocation(release)).resolves.toMatchObject(["/opt/hostedtoolcache/matlab/r2022b", false]);
        })    
    });

    describe("setupBatch", () => {
        let downloadAndRunScriptMock: jest.Mock<any, any>;
        let addPathMock: jest.Mock<any, any>;
        let tcCacheDirMock: jest.Mock<any, any>;
        let tcFindMock: jest.Mock<any, any>;
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
            // Mock MATLABReleaseInfo response from http client
            jest.spyOn(http.HttpClient.prototype, 'getJson').mockImplementation(async () => {
                return {
                    statusCode: 200,
                    result: {
                      latest: 'r2022b',
                      version: {
                        r2022b: '9.13.0',
                      }
                    },
                    headers: {}
                };
            })            
        });

        it("latest resolves", () => {
            expect(matlab.getReleaseInfo("latest")).resolves.toMatchObject(release);
        });

        it("case insensitive", () => {
            expect(matlab.getReleaseInfo("R2022b")).resolves.toMatchObject(release);
        });

        it("allows specifying update number", () => {
            const releaseWithUpdateNumber = {
                name: "r2022b",
                updateNumber: "u2",
                version: "9.13.0",
            }
            expect(matlab.getReleaseInfo("R2022bU2")).resolves.toMatchObject(releaseWithUpdateNumber);
        });

        it("rejects for unsupported release", () => {
            expect(matlab.getReleaseInfo("R2022c")).rejects.toBeDefined();
        });

        it("rejects if for bad http response", () => {
            jest.spyOn(http.HttpClient.prototype, 'getJson').mockImplementation(async () => {
                return {
                    statusCode: 400,
                    result: undefined,
                    headers: {}
                };
            })            
            expect(matlab.getReleaseInfo("R2022b")).rejects.toBeDefined();
        });
    });
});
