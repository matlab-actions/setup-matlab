import * as setup from "./index";
import * as install from "./install";
import * as core from "@actions/core";

describe("set MATLAB action", () => {
    let mockCoreSetFailed: jest.SpyInstance;

    beforeEach(() => {
        mockCoreSetFailed = jest.spyOn(core, "setFailed");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should not be implemented yet", async () => {
        await setup.run();
        expect(mockCoreSetFailed).toBeCalledWith("Not yet implemented!");
    });

    it.skip("errors when the install step errors out", async () => {
        const mockInstall = jest.spyOn(install, "install");
        const expectedErrorMessage = "It be like that sometimes";

        mockInstall.mockImplementation(
            (): Promise<void> => {
                throw new Error(expectedErrorMessage);
            }
        );

        await setup.run();

        expect(mockCoreSetFailed).toBeCalledWith(expectedErrorMessage);
    });
});
