// Copyright 2023 The MathWorks, Inc.

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

    it("no ops if useCache is false", async () => {
        await expect(cacheMATLAB('false')).resolves.toBeUndefined();
        expect(saveCacheMock).toHaveBeenCalledTimes(0);
    });

    it("saves cache if useCache is true and key does not equal matched key", async () => {
        getStateMock.mockReturnValueOnce("matched-key").mockReturnValueOnce("primary-key")
        await expect(cacheMATLAB('true')).resolves.toBeUndefined();
        expect(saveCacheMock).toHaveBeenCalledTimes(1);
    });

    it("does not re-save cache if useCache is true and key equals matched key", async () => {
        getStateMock.mockReturnValueOnce("cache-key").mockReturnValueOnce("cache-key")
        await expect(cacheMATLAB('true')).resolves.toBeUndefined();
        expect(saveCacheMock).toHaveBeenCalledTimes(0);
    });
});
