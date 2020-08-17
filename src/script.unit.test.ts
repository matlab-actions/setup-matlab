import * as exec from "@actions/exec";
import * as toolCache from "@actions/tool-cache";

import * as script from "./script";

jest.mock("@actions/exec");
jest.mock("@actions/tool-cache");

afterEach(() => {
    jest.resetAllMocks();
});

describe("script downloader/runner", () => {
    const downloadToolMock = toolCache.downloadTool as jest.Mock;
    const execMock = exec.exec as jest.Mock;

    const sampleUrl = "https://www.mathworks.com/";
    const samplePlatform = "linux";

    //TODO: test the sucessful case

    it("rejects when toolCache.downloadTool() fails", async () => {
        downloadToolMock.mockRejectedValue(new Error("failed"));

        await expect(script.downloadAndRunScript(sampleUrl, samplePlatform)).rejects.toBeDefined();
        expect(downloadToolMock).toHaveBeenCalledTimes(1);
        expect(execMock).not.toHaveBeenCalled();
    });

    it("rejects when the downloaded script exits with non-zero code", async () => {
        downloadToolMock.mockResolvedValue("nice");
        execMock.mockRejectedValue(new Error("oof"));

        await expect(
            script.downloadAndRunScript(samplePlatform, samplePlatform)
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
        const cmd = script.generateExecCommand("win32", scriptPath);
        expect(cmd).toEqual(`bash ${scriptPath}`);
    });

    ["darwin", "linux"].forEach((platform) => {
        it(`calls the command with sudo on ${platform}`, () => {
            const cmd = script.generateExecCommand(platform, scriptPath);
            expect(cmd).toEqual(`sudo -E bash ${scriptPath}`);
        });
    });
});
