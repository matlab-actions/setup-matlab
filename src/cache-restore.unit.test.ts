// Copyright 2023 The MathWorks, Inc.

import * as cache from "@actions/cache";
import * as core from "@actions/core";
import { restoreMATLAB } from "./cache-restore";

jest.mock("@actions/cache");
jest.mock("@actions/core");

afterEach(() => {
    jest.resetAllMocks();
});

describe("cache-restore", () => {
    let restoreCacheMock: jest.Mock;
    let saveStateMock: jest.Mock;

    const platform = "linux";
    const release = {
        name: "r2022b",
        version: "9.13.0",
        update: "latest"
    };
    const products = ["MATLAB", "Parallel_Computing_Toolbox"];
    const location = "/path/to/matlab";

    beforeEach(() => {
        restoreCacheMock = cache.restoreCache as jest.Mock;
        saveStateMock = core.saveState as jest.Mock;
    });
    
    it("returns true if cache is found", async () => {
        restoreCacheMock.mockReturnValue("matched-cache-key");
        await expect(restoreMATLAB(release, platform, products, location)).resolves.toBe(true);
        expect(saveStateMock).toHaveBeenCalledTimes(3);
    });


    it("returns false if cache is not found", async () => {
        await expect(restoreMATLAB(release, platform, products, location)).resolves.toBe(false);
        expect(saveStateMock).toHaveBeenCalledTimes(2);
    });
});
