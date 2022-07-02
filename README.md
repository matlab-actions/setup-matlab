# Action for Setting Up MATLAB on GitHub-Hosted Runner

Before you run MATLAB&reg; code and Simulink&reg; models on a [GitHub&reg;-hosted](https://docs.github.com/en/free-pro-team@latest/actions/reference/specifications-for-github-hosted-runners) runner, first use the [Setup MATLAB](#set-up-matlab) action. The action sets up the specified MATLAB release on a Linux&reg; virtual machine. If you do not specify a release, the action sets up the latest release of MATLAB.

The **Setup MATLAB** action is not supported on [self-hosted](https://docs.github.com/en/free-pro-team@latest/actions/hosting-your-own-runners/about-self-hosted-runners) runners. Currently, it is available only for public projects. It does not set up transformation products, such as MATLAB Coder&trade; and MATLAB Compiler&trade;.

## Usage Examples
Once you set up MATLAB, you can use the runner to execute MATLAB scripts, functions, or statements. You also can use the runner to execute MATLAB and Simulink tests and generate artifacts. To execute code on the runner, include the [Run MATLAB Command](https://github.com/matlab-actions/run-command/) or [Run MATLAB Tests](https://github.com/matlab-actions/run-tests/) actions in your workflow.

### Run MATLAB Script on GitHub-Hosted Runner
Set up a GitHub-hosted runner to run the commands in a file named `myscript.m` in the root of your repository. To run the script, include the [Run MATLAB Command](https://github.com/matlab-actions/run-command/) action in your workflow.

```yaml
name: Run MATLAB Script on GitHub-Hosted Runner
on: [push]
jobs:
  my-job:
    name: Run MATLAB Script
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v3
      - name: Set up MATLAB
        uses: matlab-actions/setup-matlab@v1
      - name: Run script
        uses: matlab-actions/run-command@v1
        with:
          command: myscript
```

### Run MATLAB Tests on GitHub-Hosted Runner
Set up a GitHub-hosted runner to automatically run the tests in your [MATLAB project](https://www.mathworks.com/help/matlab/projects.html) and generate a JUnit test results report and a Cobertura code coverage report. To run the tests and generate the artifacts, include the [Run MATLAB Tests](https://github.com/matlab-actions/run-tests/) action in your workflow.

```yaml
name: Run MATLAB Tests on GitHub-Hosted Runner
on: [push]
jobs:
  my-job:
    name: Run MATLAB Tests and Generate Artifacts
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v3
      - name: Set up MATLAB
        uses: matlab-actions/setup-matlab@v1
      - name: Run tests and generate artifacts
        uses: matlab-actions/run-tests@v1
        with:
          test-results-junit: test-results/results.xml
          code-coverage-cobertura: code-coverage/coverage.xml
```

## Set Up MATLAB
When you define your workflow in the `.github/workflows` directory of your repository, specify the **Setup MATLAB** action as `matlab-actions/setup-matlab@v1`. The action accepts an optional input.

| Input     | Description |
|-----------|-------------|
| `release` | (Optional) MATLAB release to set up. You can specify R2020a or a later release. If you do not specify `release`, the action sets up the latest release of MATLAB.<br/>**Example**: `R2021a`

## Notes
When you use the **Setup MATLAB** action, you execute third-party code that is licensed under separate terms.

## See Also
- [Action for Running MATLAB Commands](https://github.com/matlab-actions/run-command/)
- [Action for Running MATLAB Tests](https://github.com/matlab-actions/run-tests/)
- [Continuous Integration with MATLAB and Simulink](https://www.mathworks.com/solutions/continuous-integration.html)

## Contact Us
If you have any questions or suggestions, please contact MathWorks&reg; at [continuous-integration@mathworks.com](mailto:continuous-integration@mathworks.com).
