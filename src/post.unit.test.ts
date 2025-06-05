// Copyright 2025 The MathWorks, Inc.

import * as core from '@actions/core';
import { cacheMATLAB } from "./cache-save";
import { run } from "./post";

jest.mock("@actions/core");
jest.mock("./cache-save");

afterEach(() => {
    jest.resetAllMocks();
});

describe("post", () => {
    let getBooleanInputMock: jest.Mock;
    let getStateMock: jest.Mock;
    let cacheMATLABMock: jest.Mock;

    beforeEach(() => {
        getBooleanInputMock = core.getBooleanInput as jest.Mock;
        getStateMock = core.getState as jest.Mock;
        cacheMATLABMock = cacheMATLAB as jest.Mock;
    });

    it("caches MATLAB when cache true and install successful", async () => {
        getBooleanInputMock.mockReturnValueOnce(true);
        getStateMock.mockReturnValueOnce('true');
        await expect(run()).resolves.toBeUndefined();
        expect(cacheMATLABMock).toHaveBeenCalledTimes(1);
    });

    it("does not cache MATLAB when cache false", async () => {
        getBooleanInputMock.mockReturnValueOnce(false);
        getStateMock.mockReturnValueOnce('true');
        await expect(run()).resolves.toBeUndefined();
        expect(cacheMATLABMock).toHaveBeenCalledTimes(0);
    });

    it("does not cache MATLAB when install not successful", async () => {
        getBooleanInputMock.mockReturnValueOnce(true);
        await expect(run()).resolves.toBeUndefined();
        expect(cacheMATLABMock).toHaveBeenCalledTimes(0);
    });
});