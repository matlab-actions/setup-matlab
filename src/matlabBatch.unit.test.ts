// Copyright 2022 The MathWorks, Inc.

import * as matlabBatch from "./matlabBatch";

describe("matlab-batch", () => {
    const testCase = (platform: string, subdirectory: string) => {
        it(`sets correct install directory for ${platform}`, async () => {
            const installDir = matlabBatch.defaultInstallRoot(platform, "matlab-batch");
            expect(installDir).toContain(subdirectory);
        })
    };
    
    testCase("win32", 'Program Files');
    testCase("darwin", "opt");
    testCase("linux", "opt");
})