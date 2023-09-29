// Copyright 2023 The MathWorks, Inc.

import * as cache from "@actions/cache";
import * as core from "@actions/core";
import { restoreMATLAB } from "./cache-restore";

jest.mock("@actions/cache");
jest.mock("@actions/core");
jest.mock("@actions/tool-cache");

afterEach(() => {
    jest.resetAllMocks();
});

describe("cache-restore", () => {
    let restoreCacheMock: jest.Mock;
    let infoMock: jest.Mock;
    let saveStateMock: jest.Mock;

    const platform = "linux";
    const release = {
        name: "r2022b",
        version: "9.13.0",
        update: "latest"
    };
    const products = ["MATLAB", "Parallel_Computing_Toolbox"];

    beforeEach(() => {
        restoreCacheMock = cache.restoreCache as jest.Mock;
        infoMock = core.info as jest.Mock;
        saveStateMock = core.saveState as jest.Mock;
    });
    
    it("ideally works", async () => {
        await expect(restoreMATLAB(release, platform, products)).resolves.toBeUndefined();
        expect(restoreCacheMock).toHaveBeenCalledTimes(1);
        expect(infoMock).toHaveBeenCalledTimes(1);
    });

    it("does not save cache matched key if no cache is matched", async () => {
        await expect(restoreMATLAB(release, platform, products)).resolves.toBeUndefined();
        expect(saveStateMock).toHaveBeenCalledTimes(2);
    });

    it("saves cache matched key if cache is matched", async () => {
        restoreCacheMock.mockReturnValue("matched-cache-key");
        await expect(restoreMATLAB(release, platform, products)).resolves.toBeUndefined();
        expect(saveStateMock).toHaveBeenCalledTimes(3);
    });
})