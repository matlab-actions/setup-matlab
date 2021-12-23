// Copyright 2020 The MathWorks, Inc.

import * as core from "@actions/core";
import * as install from "./install";
import * as script from "./script";
import * as exec from "@actions/exec";

jest.mock("@actions/core");
jest.mock("./script");

afterEach(() => {
    jest.resetAllMocks();
});

describe("install procedure", () => {
    let downloadAndRunScriptMock: jest.Mock<any, any>;

    // install() does not perform any logic itself on its parameters. Therefore
    // they can be held static for these unit tests
    const platform = "linux";
    const release = "latest";

    const execMock = exec.exec as jest.Mock;

    const doInstall = () => install.install(platform, release);

    beforeEach(() => {
        downloadAndRunScriptMock = script.downloadAndRunScript as jest.Mock;

        // Mock core.group to simply return the output of the func it gets from
        // the caller
        (core.group as jest.Mock).mockImplementation(async (_, func) => {
            return func();
        });
    });

    it("ideally works", async () => {
    //    downloadAndRunScriptMock.mockResolvedValue(undefined);
//
 //       await expect(doInstall()).resolves.toBeUndefined();
  //      expect(downloadAndRunScriptMock).toHaveBeenCalledTimes(2);
    });

    //it("rejects when the download fails", async () => {
      //  downloadAndRunScriptMock.mockRejectedValueOnce(Error("oof"));

        //await expect(doInstall()).rejects.toBeDefined();
    //    expect(downloadAndRunScriptMock).toHaveBeenCalledTimes(1);
      //  expect(core.group).toHaveBeenCalledTimes(1);
    //});

    //it("rejects when executing the command returns with a non-zero code", async () => {
      //  downloadAndRunScriptMock
        //    .mockResolvedValueOnce(undefined)
          //  .mockRejectedValueOnce(Error("oof"));
//
  //      await expect(doInstall()).rejects.toBeDefined();
    //    expect(downloadAndRunScriptMock).toHaveBeenCalledTimes(2);
      //  expect(core.group).toHaveBeenCalledTimes(2);
    //});
});
