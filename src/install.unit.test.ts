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
    const mockCoreGroup = core.group as jest.Mock;
    const mockExecExec = exec.exec as jest.Mock;
    const mockToolCacheDownloadTool = toolCache.downloadTool as jest.Mock;

    it("works", async () => {
        const mockDownloadTool = (toolCache.downloadTool as jest.Mock).mockResolvedValue(
            "fake script"
        );

        await expect(install.install()).resolves.toBeUndefined();
        expect(core.group).toHaveBeenCalled();
    });
});

describe("installer download", () => {
    let downloadToolMock = toolCache.downloadTool as jest.Mock;

    it("rejects when the download fails", async () => {
        const expectedError = Error("failed to download");

        downloadToolMock.mockRejectedValue(expectedError);

        await expect(install.install()).rejects.toThrowError(RegExp(expectedError.message + "$"));
        expect(downloadToolMock).toHaveBeenCalledTimes(1);
    });

    it("uses the link provided in properties.json", async () => {
        downloadToolMock.mockResolvedValue("nice");

        await expect(install.install()).resolves.toBeUndefined;
        expect(downloadToolMock).toHaveBeenCalledTimes(1);
        expect(downloadToolMock).toHaveBeenCalledWith(properties.ephemeralInstallerUrl);
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
