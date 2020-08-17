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

        // Make sure that no actual exec is happening by mocking out exec.exec
    });

    it("ideally works", async () => {
        const downloadTool = toolCache.downloadTool as jest.Mock;
        downloadTool.mockResolvedValue("script");

        (exec.exec as jest.Mock).mockResolvedValue(0);

        await expect(install.install()).resolves.toBeUndefined();
        expect(downloadTool).toHaveBeenCalledTimes(2);
        expect(downloadTool).toHaveBeenNthCalledWith(1, properties.matlabDepsUrl);
        expect(downloadTool).toHaveBeenNthCalledWith(2, properties.ephemeralInstallerUrl);
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
