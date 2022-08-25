// Copyright 2020-2022 The MathWorks, Inc.

import * as matlab from "./matlab";
import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";
import * as script from "./script";

jest.mock("@actions/core");
jest.mock("@actions/tool-cache");
jest.mock("./script");

afterEach(() => {
    jest.resetAllMocks();
});

// describe("toolcacheLocation", () => {
    
//     beforeEach(() => {
//     });

//     it("ideally works", async () => {
//         await expect(matlab.toolcacheLocation("r2022a")).resolves.toBe("");
//     });
// });

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