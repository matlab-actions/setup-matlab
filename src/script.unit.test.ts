// Copyright 2020-2024 The MathWorks, Inc.

import { jest, describe, it, expect, afterEach, beforeAll } from "@jest/globals";

jest.unstable_mockModule("@actions/exec", () => ({
    exec: jest.fn(),
}));

jest.unstable_mockModule("@actions/io", () => ({
    which: jest.fn(),
    rmRF: jest.fn(),
}));

jest.unstable_mockModule("@actions/tool-cache", () => ({
    downloadTool: jest.fn(),
}));

const exec = await import("@actions/exec");
const io = await import("@actions/io");
const toolCache = await import("@actions/tool-cache");
const script = await import("./script.js");

afterEach(() => {
    jest.resetAllMocks();
});

describe("script downloader/runner", () => {
    const downloadToolMock = toolCache.downloadTool as jest.Mock<typeof toolCache.downloadTool>;
    const execMock = exec.exec as jest.Mock<typeof exec.exec>;

    const sampleUrl = "https://www.mathworks.com/";
    const samplePlatform = "linux";
    const doDownloadAndRunScript = () => script.downloadAndRunScript(samplePlatform, sampleUrl);

    it("ideally works", async () => {
        downloadToolMock.mockResolvedValue("nice");
        execMock.mockResolvedValue(0);

        await expect(doDownloadAndRunScript()).resolves.not.toThrow();
        expect(downloadToolMock).toHaveBeenCalledTimes(1);
        expect(execMock).toHaveBeenCalledTimes(1);
    });

    it("rejects when toolCache.downloadTool() fails", async () => {
        downloadToolMock.mockRejectedValue(new Error("failed"));

        await expect(script.downloadAndRunScript(samplePlatform, sampleUrl)).rejects.toBeDefined();
        expect(downloadToolMock).toHaveBeenCalledTimes(1);
        expect(execMock).not.toHaveBeenCalled();
    });

    it("rejects when the downloaded script fails", async () => {
        downloadToolMock.mockResolvedValue("nice");
        execMock.mockRejectedValue(new Error("oof"));

        await expect(script.downloadAndRunScript(samplePlatform, sampleUrl)).rejects.toBeDefined();
        expect(downloadToolMock).toHaveBeenCalledTimes(1);
        expect(execMock).toHaveBeenCalledTimes(1);
    });

    it("rejects when the downloaded script exits with non-zero code", async () => {
        downloadToolMock.mockResolvedValue("nice");
        execMock.mockResolvedValue(1);

        await expect(script.downloadAndRunScript(samplePlatform, sampleUrl)).rejects.toBeDefined();
        expect(downloadToolMock).toHaveBeenCalledTimes(1);
        expect(execMock).toHaveBeenCalledTimes(1);
    });
});

describe("install command generator", () => {
    const whichMock = io.which as jest.Mock<typeof io.which>;

    const scriptPath = "hello.sh";

    beforeAll(() => {
        jest.restoreAllMocks();
    });

    it("does not change the command on Windows", () => {
        const cmd = script.generateExecCommand("win32", scriptPath);
        expect(cmd).resolves.toEqual(`bash ${scriptPath}`);
    });

    ["darwin", "linux"].forEach((platform) => {
        it(`calls the command with sudo on ${platform}`, () => {
            whichMock.mockResolvedValue("path/to/sudo");
            const cmd = script.generateExecCommand(platform, scriptPath);
            expect(cmd).resolves.toEqual(`sudo -E bash ${scriptPath}`);
        });

        it(`calls the command without sudo on ${platform}`, () => {
            whichMock.mockResolvedValue("");
            const cmd = script.generateExecCommand(platform, scriptPath);
            expect(cmd).resolves.toEqual(`bash ${scriptPath}`);
        });
    });
});

describe("default install root", () => {
    const testCase = (platform: string, subdirectory: string) => {
        it(`sets correct install directory for ${platform}`, async () => {
            const installDir = script.defaultInstallRoot(platform, "matlab-batch");
            expect(installDir).toContain(subdirectory);
            expect(installDir).toContain("matlab-batch");
        });
    };

    testCase("win32", "Program Files");
    testCase("darwin", "opt");
    testCase("linux", "opt");
});
