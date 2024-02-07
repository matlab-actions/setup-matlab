// Copyright 2023-2024 The MathWorks, Inc.

import * as core from '@actions/core';
import * as cache from '@actions/cache';
import { cacheMATLAB } from './cache-save';

jest.mock("@actions/cache");
jest.mock("@actions/core");

afterEach(() => {
    jest.resetAllMocks();
});

describe("cache-save", () => {
    let saveCacheMock: jest.Mock;
    let getStateMock: jest.Mock;

    beforeEach(() => {
        saveCacheMock = cache.saveCache as jest.Mock;
        getStateMock = core.getState as jest.Mock;
    });

    it("saves cache if key does not equal matched key", async () => {
        getStateMock.mockReturnValueOnce("matched-key").mockReturnValueOnce("primary-key")
        await expect(cacheMATLAB()).resolves.toBeUndefined();
        expect(saveCacheMock).toHaveBeenCalledTimes(1);
    });

    it("does not re-save cache if key equals matched key", async () => {
        getStateMock.mockReturnValueOnce("cache-key").mockReturnValueOnce("cache-key")
        await expect(cacheMATLAB()).resolves.toBeUndefined();
        expect(saveCacheMock).toHaveBeenCalledTimes(0);
    });
});
