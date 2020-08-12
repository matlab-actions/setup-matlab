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
    let mockCoreGroup = core.group as jest.Mock;
    let mockExecExec = exec.exec as jest.Mock;

    let downloadInstallerSpy: jest.SpyInstance;
    let generateInstallCommandSpy: jest.SpyInstance;

    beforeEach(() => {
        downloadInstallerSpy = jest.spyOn(install, "downloadInstaller");
        generateInstallCommandSpy = jest.spyOn(install, "generateInstallCommand");
    });

    afterEach(() => {
        downloadInstallerSpy.mockRestore();
        generateInstallCommandSpy.mockRestore();
    });

    it("downloads yeah", async () => {
        downloadInstallerSpy = downloadInstallerSpy.mockImplementation(() => {
            console.log("oh");
            return Promise.resolve("hey");
        });
        generateInstallCommandSpy.mockReturnValue("fake command");
        const errorCode = 0;

        mockCoreGroup.mockImplementation((_, fn) => {
            fn();
        });

        mockExecExec.mockResolvedValue(errorCode);

        return install.install().then(() => {
            fail("should have failed");
        });
    });
});

describe("installer download", () => {
    let downloadToolMock = toolCache.downloadTool as jest.Mock;

    it("rejects when the download fails", async () => {
        const expectedError = Error("failed to download");

        downloadToolMock.mockRejectedValue(expectedError);

        return install
            .install()
            .then(() => {
                fail("should have thrown an error");
            })
            .catch((e) => {
                expect((e as Error).message).toContain(expectedError.message);
                expect(downloadToolMock).toHaveBeenCalledTimes(1);
            });
    });

    it("uses the link provided in properties.json", async () => {
        downloadToolMock.mockRejectedValue(null);

        return install
            .install()
            .then(() => {
                fail("invalid: mocked downloadTool should have failed");
            })
            .catch((e) => {
                expect(downloadToolMock).toHaveBeenCalledTimes(1);
                expect(downloadToolMock).toHaveBeenCalledWith(properties.ephemeralInstallerUrl);
            });
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
