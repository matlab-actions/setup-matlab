// Copyright 2020-2022 The MathWorks, Inc.

import * as matlab from "./matlab";
import * as script from "./script";
import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";

jest.mock("./script")
jest.mock("@actions/core");
jest.mock("@actions/tool-cache");

afterEach(() => {
    jest.resetAllMocks();
});

describe("toolcacheLocation", () => {
    let findMock: jest.Mock<any, any>;
    let cacheFileMock: jest.Mock<any, any>; 
    let infoMock: jest.Mock<any, any>;
    const release = "r2022a"

    beforeEach(() => {
        findMock = tc.find as jest.Mock;
        cacheFileMock = tc.cacheFile as jest.Mock;
        infoMock = core.info as jest.Mock;
    });

    it("returns toolpath if in toolcache", async () => {
        findMock.mockReturnValue("/opt/hostedtoolcache/matlab/r2022a");
        await expect(matlab.toolcacheLocation(release)).resolves.toBe("/opt/hostedtoolcache/matlab/r2022a");
        expect(infoMock).toHaveBeenCalledTimes(1);
    });

    it("creates cache and returns new path if not in toolcache", async () => {
        findMock.mockReturnValue("");
        cacheFileMock.mockReturnValue("/opt/hostedtoolcache/matlab/r2022b");
        await expect(matlab.toolcacheLocation(release)).resolves.toBe("/opt/hostedtoolcache/matlab/r2022b");
    })
});

describe("setup matlab-batch", () => {
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

describe("process release", () => {
    it("latest resolves", () => {
        expect(matlab.processRelease("latest")).toBe("r2022b")
    })

    it("returns lowercase", () => {
        expect(matlab.processRelease("R2021a")).toBe("r2021a")
    })
})