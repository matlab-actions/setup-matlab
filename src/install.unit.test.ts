// Copyright 2020 The MathWorks, Inc.

import * as install from "./install";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as toolCache from "@actions/tool-cache";
import properties from "./properties.json";

jest.mock("@actions/core");
jest.mock("@actions/exec");
jest.mock("@actions/tool-cache");

afterEach(() => {
    jest.resetAllMocks();
});

describe("install procedure", () => {
    beforeAll(() => {
        // Mock core.group to simply return the output of the func it gets from
        // the caller
        (core.group as jest.Mock).mockImplementation(async (_, func) => {
            return func();
        });
    });

    it("ideally works", async () => {
        (toolCache.downloadTool as jest.Mock).mockResolvedValue("test script");
        (exec.exec as jest.Mock).mockResolvedValue(0);

        await expect(install.install()).resolves.toBeUndefined();
        expect(toolCache.downloadTool).toHaveBeenCalledTimes(1);
        expect(core.group).toHaveBeenCalled();
    });

    it("rejects when the download fails", async () => {
        (toolCache.downloadTool as jest.Mock).mockRejectedValue(Error("failed for test"));

        await expect(install.install()).rejects.toThrowError();
        expect(core.group).not.toHaveBeenCalled();
        expect(exec.exec).not.toHaveBeenCalled();
    });

    it("rejects when executing the command returns with a non-zero code", async () => {
        (toolCache.downloadTool as jest.Mock).mockResolvedValue("test script");
        (exec.exec as jest.Mock).mockResolvedValue(1);

        return install
            .install()
            .then(() => {
                throw new Error("this should not have happened");
            })
            .catch((error) => {
                expect(error).toBeDefined();
                expect(toolCache.downloadTool).toHaveBeenCalledTimes(1);
                expect(core.group).toHaveBeenCalled();
            });
    });
});

describe("script downloader/runner", () => {
    const downloadToolMock = toolCache.downloadTool as jest.Mock;
    const execMock = exec.exec as jest.Mock;

    const sampleUrl = "https://www.mathworks.com/";
    const samplePlatform = "linux";

    //TODO: test the sucessful case

    it("rejects when toolCache.downloadTool() fails", async () => {
        downloadToolMock.mockRejectedValue(new Error("failed"));

        await expect(install.downloadAndRunScript(sampleUrl, samplePlatform)).rejects.toBeDefined();
        expect(downloadToolMock).toHaveBeenCalledTimes(1);
        expect(execMock).not.toHaveBeenCalled();
    });

    it("rejects when the downloaded script exits with non-zero code", async () => {
        downloadToolMock.mockResolvedValue("nice");
        execMock.mockRejectedValue(new Error("oof"));

        await expect(
            install.downloadAndRunScript(samplePlatform, samplePlatform)
        ).rejects.toBeDefined();
        expect(downloadToolMock).toHaveBeenCalledTimes(1);
        expect(execMock).toHaveBeenCalledTimes(1);
    });
});

describe("install command generator", () => {
    const scriptPath = "hello.sh";

    beforeAll(() => {
        jest.restoreAllMocks();
    });

    it("does not change the command on Windows", () => {
        const cmd = install.generateInstallCommand("win32", scriptPath);
        expect(cmd).toEqual(`bash ${scriptPath}`);
    });

    ["darwin", "linux"].forEach((platform) => {
        it(`calls the command with sudo on ${platform}`, () => {
            const cmd = install.generateInstallCommand(platform, scriptPath);
            expect(cmd).toEqual(`sudo -E bash ${scriptPath}`);
        });
    });
});
