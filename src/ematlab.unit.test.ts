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
});
