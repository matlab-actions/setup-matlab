// Copyright 2020-2022 The MathWorks, Inc.

import * as mpm from "./mpm";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";

jest.mock("@actions/core");
jest.mock("@actions/tool-cache");
jest.mock("@actions/exec");

afterEach(() => {
    jest.resetAllMocks();
});

describe("setup mpm", () => {
    let tcDownloadToolMock: jest.Mock<any, any>;
    let addPathMock: jest.Mock<any, any>;
    let execMock: jest.Mock<any, any>; 

    const platform = "linux";

    beforeEach(() => {
        tcDownloadToolMock = tc.downloadTool as jest.Mock;
        addPathMock = core.addPath as jest.Mock;
        execMock = exec.exec as jest.Mock;
    });

    it("ideally works", async () => {
        tcDownloadToolMock.mockResolvedValue("/path/to/mpm");
        addPathMock.mockResolvedValue(undefined);
        execMock.mockResolvedValue(0);
        await expect(mpm.setup(platform)).resolves.toBe("/path/to/mpm");
    });

    it("rejects when the download fails", async () => {
        tcDownloadToolMock.mockRejectedValue(Error("oof"));
        addPathMock.mockResolvedValue(undefined);

        await expect(mpm.setup(platform)).rejects.toBeDefined();
    });

});

describe("mpm install", () => {
    let execMock: jest.Mock<any, any>;

    const release = "R2022a";
    const products = ["MATLAB", "Compiler"];
    const location = "/opt/matlab";
    
    beforeEach(() => {
        execMock = exec.exec as jest.Mock;
    });

    it("ideally works", async () => {
        execMock.mockResolvedValue(0);
        await expect(mpm.install("mpm", release, products, location)).resolves.toBeUndefined();
    });

    it("rejects on failed install", async () => {
        execMock.mockResolvedValue(1);
        await expect(mpm.install("mpm", release, products, location)).rejects.toBeDefined();
    });
});
