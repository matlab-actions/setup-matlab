// Copyright 2022 The MathWorks, Inc.

import * as core from "@actions/core";
import * as fs from "fs";
import * as ematlab from "./ematlab";

jest.mock("@actions/core");

afterEach(() => {
    jest.resetAllMocks();
});

describe("ephemeral matlab", () => {
    let addPathMock = core.addPath as jest.Mock;

    beforeEach(() => {
        addPathMock = core.addPath as jest.Mock;
        if (fs.existsSync(ematlab.rootFile)) {
            fs.unlinkSync(ematlab.rootFile);
        }
    });

    it("ideally works", async () => {
        fs.writeFileSync(ematlab.rootFile, "path/to/matlab");
        ematlab.addToPath();
        expect(addPathMock).toBeCalledWith("path/to/matlab/bin");
    });

    it("rejects when root file does not exist", async () => {
        expect(() => ematlab.addToPath()).toThrow();
    });

    it("adds --skip-activation flag if env vars are set", async () => {
        let env = {"MATHWORKS_ACCOUNT": "janedoe@mathworks.com", "MATHWORKS_TOKEN": "token123456"};
        let flag = ematlab.skipActivationFlag(env);
        expect(flag).toEqual("--skip-activation")
    })

    it("doesn't add --skip-activation flag if env vars are not set", async () => {
        let env = {};
        let flag = ematlab.skipActivationFlag(env);
        expect(flag).toEqual("")
    })
});
