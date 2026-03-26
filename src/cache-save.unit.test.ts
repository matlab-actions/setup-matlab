// Copyright 2023-2024 The MathWorks, Inc.

import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

jest.unstable_mockModule("@actions/cache", () => ({
    saveCache: jest.fn(),
}));
jest.unstable_mockModule("@actions/core", () => ({
    getState: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
}));

const cache = await import("@actions/cache");
const core = await import("@actions/core");
const { cacheMATLAB } = await import("./cache-save.js");

afterEach(() => {
    jest.resetAllMocks();
});

describe("cache-save", () => {
    let saveCacheMock: jest.Mock<typeof cache.saveCache>;
    let getStateMock: jest.Mock<typeof core.getState>;

    beforeEach(() => {
        saveCacheMock = cache.saveCache as jest.Mock<typeof cache.saveCache>;
        getStateMock = core.getState as jest.Mock<typeof core.getState>;
    });

    it("saves cache if key does not equal matched key", async () => {
        getStateMock.mockReturnValueOnce("matched-key").mockReturnValueOnce("primary-key");
        await expect(cacheMATLAB()).resolves.toBeUndefined();
        expect(saveCacheMock).toHaveBeenCalledTimes(1);
    });

    it("does not re-save cache if key equals matched key", async () => {
        getStateMock.mockReturnValueOnce("cache-key").mockReturnValueOnce("cache-key");
        await expect(cacheMATLAB()).resolves.toBeUndefined();
        expect(saveCacheMock).toHaveBeenCalledTimes(0);
    });
});
