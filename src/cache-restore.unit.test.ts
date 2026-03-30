// Copyright 2023-2026 The MathWorks, Inc.

import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

jest.unstable_mockModule("@actions/cache", () => ({
    restoreCache: jest.fn(),
}));
jest.unstable_mockModule("@actions/core", () => ({
    saveState: jest.fn(),
    info: jest.fn(),
}));

const cache = await import("@actions/cache");
const core = await import("@actions/core");
const { restoreMATLAB } = await import("./cache-restore.js");

afterEach(() => {
    jest.resetAllMocks();
});

describe("cache-restore", () => {
    let restoreCacheMock: jest.Mock<typeof cache.restoreCache>;
    let saveStateMock: jest.Mock<typeof core.saveState>;

    const platform = "linux";
    const arch = "x64";
    const release = {
        name: "r2022b",
        version: "9.13.0",
        update: "latest",
        isPrerelease: false,
    };
    const products = ["MATLAB", "Parallel_Computing_Toolbox"];
    const location = "/path/to/matlab";

    beforeEach(() => {
        restoreCacheMock = cache.restoreCache as jest.Mock<typeof cache.restoreCache>;
        saveStateMock = core.saveState as jest.Mock<typeof core.saveState>;
    });

    it("returns true if cache is found", async () => {
        restoreCacheMock.mockResolvedValue("matched-cache-key");
        await expect(restoreMATLAB(release, platform, arch, products, location)).resolves.toBe(
            true,
        );
        expect(saveStateMock).toHaveBeenCalledTimes(4);
    });

    it("returns false if cache is not found", async () => {
        await expect(restoreMATLAB(release, platform, arch, products, location)).resolves.toBe(
            false,
        );
        expect(saveStateMock).toHaveBeenCalledTimes(3);
    });
});
