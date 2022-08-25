// Copyright 2020-2022 The MathWorks, Inc.

import * as mpm from "./mpm";
import * as script from "./script";
import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";

jest.mock("@actions/exec");
jest.mock("@actions/tool-cache");
jest.mock("./script");

afterEach(() => {
    jest.resetAllMocks();
});

describe("setup mpm", () => {
    let tcDownloadToolMock: jest.Mock<any, any>;
    let execMock: jest.Mock<any, any>; 
    let defaultInstallRootMock: jest.Mock<any, any>;
    const platform = "linux";

    beforeEach(() => {
        tcDownloadToolMock = tc.downloadTool as jest.Mock;
        execMock = exec.exec as jest.Mock;
        defaultInstallRootMock = script.defaultInstallRoot as jest.Mock;
        process.env.RUNNER_TEMP = "/runner/workdir/tmp";
    });

    it("ideally works", async () => {
        tcDownloadToolMock.mockResolvedValue("/path/to/mpm");
        execMock.mockResolvedValue(0);
        await expect(mpm.setup(platform)).resolves.toBe("/path/to/mpm");
    });

    it("works without RUNNER_TEMP", async () => {
        process.env.RUNNER_TEMP = '';
        tcDownloadToolMock.mockResolvedValue("/path/to/mpm");
        defaultInstallRootMock.mockReturnValue("/path/to/install/root")
        execMock.mockResolvedValue(0);
        await expect(mpm.setup(platform)).resolves.toBe("/path/to/mpm");
    });

    it("rejects when the download fails", async () => {
        tcDownloadToolMock.mockRejectedValue(Error("oof"));
        execMock.mockResolvedValue(0);
        await expect(mpm.setup(platform)).rejects.toBeDefined();
    });

    it("rejects when the chmod fails", async () => {
        tcDownloadToolMock.mockResolvedValue("/path/to/mpm");
        execMock.mockResolvedValue(1);
        await expect(mpm.setup(platform)).rejects.toBeDefined();
    });

});

describe("mpm install", () => {
    let execMock: jest.Mock<any, any>;

    const mpmPath = "mpm";
    const release = "R2022a";
    const products = ["MATLAB", "Compiler"];
    const destination = "/opt/matlab"
    
    beforeEach(() => {
        execMock = exec.exec as jest.Mock;
    });

    it("ideally works", async () => {
        execMock.mockResolvedValue(0);
        await expect(mpm.install(mpmPath, release, products)).resolves.toBeUndefined();
    });

    it("does not install if products list is empty", async () => {
        await expect(mpm.install(mpmPath, release, [])).resolves.toBeUndefined();
        expect(execMock).toHaveBeenCalledTimes(0);
    });

    it("omits destination flag if destination is not supplied", async () => {
        const expectedMpmArgs = [
            "install",
            `--release=${release}`,
            "--products",
            "MATLAB Compiler",
        ]
        execMock.mockResolvedValue(0);

        await expect(mpm.install(mpmPath, release, products)).resolves.toBeUndefined();
        expect(execMock.mock.calls[0][1]).toMatchObject(expectedMpmArgs);
    });

    it("sets destination flag if destination is supplied", async () => {
        const expectedMpmArgs = [
            "install",
            `--release=${release}`,
            `--destination=${destination}`,
            "--products",
            "MATLAB Compiler",
        ]
        execMock.mockResolvedValue(0);

        await expect(mpm.install(mpmPath, release, products, destination)).resolves.toBeUndefined();
        expect(execMock.mock.calls[0][1]).toMatchObject(expectedMpmArgs);
    });

    it("rejects on failed install", async () => {
        execMock.mockResolvedValue(1);
        await expect(mpm.install(mpmPath, release, products)).rejects.toBeDefined();
    });
});
