import * as core from "@actions/core";
import * as index from "./index";

jest.mock("@actions/core");

afterEach(() => {
    jest.resetAllMocks();
    delete process.env["RUNNER_ENVIRONMENT"];
    delete process.env["AGENT_ISSELFHOSTED"];
});

describe("resolveInstallDependencies function", () => {
    let coreInfoMock: jest.Mock;
    let coreWarningMock: jest.Mock;

    beforeEach(() => {
        coreInfoMock = core.info as jest.Mock;
        coreWarningMock = core.warning as jest.Mock;
    });

    // for explicit 'true' should return true
    it("returns true when input is explicitly 'true'", () => {
        const result = index.resolveInstallDependencies('true');
        expect(result).toBe(true);
        expect(coreInfoMock).toHaveBeenCalledWith('install-system-dependencies explicitly set to true');
        expect(coreWarningMock).not.toHaveBeenCalled();
    });

    // for explicit 'TRUE' (uppercase) should also return true
    it("returns true when input is 'TRUE' (case insensitive)", () => {
        const result = index.resolveInstallDependencies('TRUE');
        expect(result).toBe(true);
        expect(coreInfoMock).toHaveBeenCalledWith('install-system-dependencies explicitly set to true');
    });

    // for explicit 'false' should return false
    it("returns false when input is explicitly 'false'", () => {
        const result = index.resolveInstallDependencies('false');
        expect(result).toBe(false);
        expect(coreInfoMock).toHaveBeenCalledWith('install-system-dependencies explicitly set to false');
        expect(coreWarningMock).not.toHaveBeenCalled();
    });

    // for explicit 'FALSE' (uppercase) should also return false
    it("returns false when input is 'FALSE' (case insensitive)", () => {
        const result = index.resolveInstallDependencies('FALSE');
        expect(result).toBe(false);
        expect(coreInfoMock).toHaveBeenCalledWith('install-system-dependencies explicitly set to false');
    });

    // for 'auto' mode on GitHub-hosted runner should return true
    it("returns true for 'auto' on GitHub-hosted runner", () => {
        process.env["RUNNER_ENVIRONMENT"] = "github-hosted";
        process.env["AGENT_ISSELFHOSTED"] = "0";
        
        const result = index.resolveInstallDependencies('auto');
        expect(result).toBe(true);
        expect(coreInfoMock).toHaveBeenCalledWith('Auto-detected runner type: GitHub-hosted');
        expect(coreInfoMock).toHaveBeenCalledWith('System dependencies will be installed (auto mode)');
        expect(coreWarningMock).not.toHaveBeenCalled();
    });

    // for 'auto' mode on self-hosted runner should return false
    it("returns false for 'auto' on self-hosted runner", () => {
        process.env["RUNNER_ENVIRONMENT"] = "self-hosted";
        process.env["AGENT_ISSELFHOSTED"] = "1";
        
        const result = index.resolveInstallDependencies('auto');
        expect(result).toBe(false);
        expect(coreInfoMock).toHaveBeenCalledWith('Auto-detected runner type: self-hosted');
        expect(coreInfoMock).toHaveBeenCalledWith('System dependencies will not be installed (auto mode)');
        expect(coreWarningMock).not.toHaveBeenCalled();
    });

    // for empty string should behave like 'auto' on GitHub-hosted
    it("returns true for empty string on GitHub-hosted runner (defaults to auto)", () => {
        process.env["RUNNER_ENVIRONMENT"] = "github-hosted";
        process.env["AGENT_ISSELFHOSTED"] = "0";
        
        const result = index.resolveInstallDependencies('');
        expect(result).toBe(true);
        expect(coreInfoMock).toHaveBeenCalledWith('Auto-detected runner type: GitHub-hosted');
    });

    // for empty string should behave like 'auto' on self-hosted
    it("returns false for empty string on self-hosted runner (defaults to auto)", () => {
        process.env["RUNNER_ENVIRONMENT"] = "self-hosted";
        process.env["AGENT_ISSELFHOSTED"] = "1";
        
        const result = index.resolveInstallDependencies('');
        expect(result).toBe(false);
        expect(coreInfoMock).toHaveBeenCalledWith('Auto-detected runner type: self-hosted');
    });

    // 'AUTO' (uppercase) should work as 'auto' on GitHub-hosted
    it("returns true for 'AUTO' on GitHub-hosted runner (case insensitive)", () => {
        process.env["RUNNER_ENVIRONMENT"] = "github-hosted";
        process.env["AGENT_ISSELFHOSTED"] = "0";
        
        const result = index.resolveInstallDependencies('AUTO');
        expect(result).toBe(true);
    });

    // for any invalid input should return false with warning
    it("returns false for invalid input and logs warning", () => {
        const result = index.resolveInstallDependencies('invalid-value');
        expect(result).toBe(false);
        expect(coreWarningMock).toHaveBeenCalledWith('Invalid value for install-system-dependencies: invalid-value. Defaulting to false.');
        expect(coreInfoMock).not.toHaveBeenCalled();
    });

    // numeric invalid input test
    it("returns false for numeric input", () => {
        const result = index.resolveInstallDependencies('123');
        expect(result).toBe(false);
        expect(coreWarningMock).toHaveBeenCalledWith('Invalid value for install-system-dependencies: 123. Defaulting to false.');
    });


  //considering removing these
    // edge cases like where RUNNER_ENVIRONMENT is not set
    it("returns false for 'auto' when RUNNER_ENVIRONMENT is not set", () => {
        const result = index.resolveInstallDependencies('auto');
        // Should return false because isGitHubHosted will be false
        expect(result).toBe(false);
        expect(coreInfoMock).toHaveBeenCalledWith('Auto-detected runner type: self-hosted');
    });

    // edge case where AGENT_ISSELFHOSTED = "1" but RUNNER_ENVIRONMENT = "github-hosted"
    it("returns false when AGENT_ISSELFHOSTED is '1' even if RUNNER_ENVIRONMENT is 'github-hosted'", () => {
        process.env["RUNNER_ENVIRONMENT"] = "github-hosted";
        process.env["AGENT_ISSELFHOSTED"] = "1";  // Self-hosted indicator
        
        const result = index.resolveInstallDependencies('auto');
        // Should treat as self-hosted because AGENT_ISSELFHOSTED = "1"
        expect(result).toBe(false);
        expect(coreInfoMock).toHaveBeenCalledWith('Auto-detected runner type: self-hosted');
    });
});
