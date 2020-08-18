// Copyright 2020 The MathWorks, Inc.

import * as install from "./install";
import * as script from "./script";
import * as core from "@actions/core";
import properties from "./properties.json";

jest.mock("@actions/core");
jest.mock("./script");

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
        const downloadAndRunScriptMock = script.downloadAndRunScript as jest.Mock;
        downloadAndRunScriptMock.mockResolvedValue(undefined);

        await expect(install.install()).resolves.toBeUndefined();
        expect(downloadAndRunScriptMock).toHaveBeenCalledTimes(2);
    });

    //TODO: work on the rest of these tests
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
