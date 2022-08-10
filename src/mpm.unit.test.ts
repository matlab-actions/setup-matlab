// Copyright 2022 The MathWorks, Inc.

import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as toolCache from "@actions/tool-cache";
import { JwkKeyExportOptions } from "crypto";

import * as mpm from "./mpm";
import * as script from "./script";

jest.mock("@actions/core");
jest.mock("@actions/exec");
jest.mock("@actions/tool-cache");
jest.mock("./script");

afterEach(() => {
    jest.resetAllMocks();
});

describe("mpm setup", () => {
    const release = "latest";
    const platform = "linux";

    const downloadAndRunScriptMock = script.downloadAndRunScript as jest.Mock;
    const downloadToolMock = toolCache.downloadTool as jest.Mock;
    const execMock = exec.exec as jest.Mock;
    const addPathMock = core.addPath as jest.Mock;

    beforeEach(() => {

        // Mock core.group to simply return the output of the func it gets from
        // the caller
        (core.group as jest.Mock).mockImplementation(async (_, func) => {
            return func();
        });
    });

    it("ideally works" , async () => {
        downloadAndRunScriptMock.mockResolvedValue(undefined);
        downloadToolMock.mockResolvedValue("/usr/local/bin/mpm");

        await expect(mpm.setup(platform, release)).resolves.toBeUndefined();
        expect(downloadAndRunScriptMock).toHaveBeenCalledTimes(2);
        expect(addPathMock).toHaveBeenCalledTimes(2);
        expect(downloadToolMock).toHaveBeenCalledTimes(1);
    });

    ["darwin", "win32"].forEach((os) => {
        it(`does not run deps script on ${os}`, async () => {
            downloadToolMock.mockResolvedValue("/usr/local/bin/mpm");
            downloadAndRunScriptMock.mockResolvedValue(undefined);

            await expect(mpm.setup(os, release)).resolves.toBeUndefined();
            expect(downloadAndRunScriptMock).toHaveBeenCalledTimes(1);
            expect(addPathMock).toHaveBeenCalledTimes(2);
            expect(downloadToolMock).toHaveBeenCalledTimes(1);
        });
    });

    it("rejects when the download fails", async () => {
        downloadAndRunScriptMock.mockRejectedValueOnce(Error("oh no!"));

        await expect(mpm.setup(platform, release)).rejects.toBeDefined();
        expect(downloadAndRunScriptMock).toHaveBeenCalledTimes(1);
        expect(core.group).toHaveBeenCalledTimes(1);
    });
});

describe("mpm install", () => {
    const location = "/opt/matlab";
    const release = "latest";
    const products = ["MATLAB", "Parallel_Compute_Toolbox"]

    const execMock = exec.exec as jest.Mock;

    beforeEach(() => {
        // Mock core.group to simply return the output of the func it gets from
        // the caller
        (core.group as jest.Mock).mockImplementation(async (_, func) => {
            return func();
        });
    });

    it("ideally works", async () => {
        execMock.mockResolvedValue(0);

        await expect(mpm.install(location, release, products)).resolves.toBeUndefined();
        expect(execMock).toHaveBeenCalledTimes(1);
    });
});
