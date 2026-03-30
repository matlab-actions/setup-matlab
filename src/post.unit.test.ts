// Copyright 2026-2026 The MathWorks, Inc.

import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

jest.unstable_mockModule("@actions/core", () => ({
    getBooleanInput: jest.fn(),
    getState: jest.fn(),
    error: jest.fn(),
}));
jest.unstable_mockModule("./cache-save.js", () => ({
    cacheMATLAB: jest.fn(),
}));

const core = await import("@actions/core");
const { cacheMATLAB } = await import("./cache-save.js");
const { run } = await import("./post.js");

afterEach(() => {
    jest.resetAllMocks();
});

describe("post", () => {
    let getBooleanInputMock: jest.Mock<typeof core.getBooleanInput>;
    let getStateMock: jest.Mock<typeof core.getState>;
    let cacheMATLABMock: jest.Mock<typeof cacheMATLAB>;

    beforeEach(() => {
        getBooleanInputMock = core.getBooleanInput as jest.Mock<typeof core.getBooleanInput>;
        getStateMock = core.getState as jest.Mock<typeof core.getState>;
        cacheMATLABMock = cacheMATLAB as jest.Mock<typeof cacheMATLAB>;
    });

    it("caches MATLAB when cache true and install successful", async () => {
        getBooleanInputMock.mockReturnValueOnce(true);
        getStateMock.mockReturnValueOnce("true");
        await expect(run()).resolves.toBeUndefined();
        expect(cacheMATLABMock).toHaveBeenCalledTimes(1);
    });

    it("does not cache MATLAB when cache false", async () => {
        getBooleanInputMock.mockReturnValueOnce(false);
        getStateMock.mockReturnValueOnce("true");
        await expect(run()).resolves.toBeUndefined();
        expect(cacheMATLABMock).toHaveBeenCalledTimes(0);
    });

    it("does not cache MATLAB when install not successful", async () => {
        getBooleanInputMock.mockReturnValueOnce(true);
        await expect(run()).resolves.toBeUndefined();
        expect(cacheMATLABMock).toHaveBeenCalledTimes(0);
    });
});
