# Action for Setting Up MATLAB

The [Setup MATLAB](#set-up-matlab) action enables you to run MATLAB&reg; code and Simulink&reg; models with a specific version of MATLAB. When you specify this action as part of your workflow, the action sets up your preferred MATLAB release (R2021a or later) on a Linux&reg;, Windows&reg;, or macOS&reg; virtual machine. If you do not specify a release, the action sets up the latest release of MATLAB.

## Usage Examples
Once you set up MATLAB on a runner, you can build and test your MATLAB project as part of your workflow. To execute code on the runner, include the [Run MATLAB Build](https://github.com/matlab-actions/run-build/), [Run MATLAB Tests](https://github.com/matlab-actions/run-tests/), or [Run MATLAB Command](https://github.com/matlab-actions/run-command/) action in your workflow.

### Run MATLAB Build on GitHub-Hosted Runner
Use a [GitHub-hosted runner](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners) to run a specific task and its depended-on tasks that are specified in a file named `buildfile.m` in the root of your repository. To run tasks using the MATLAB build tool, include the [Run MATLAB Build](https://github.com/matlab-actions/run-build/) action in your workflow. This action is supported in MATLAB R2022b and later.

```yaml
name: Run MATLAB Build on GitHub-Hosted Runner
on: [push]
jobs:
  my-job:
    name: Run MATLAB Build
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4
      - name: Set up MATLAB
        uses: matlab-actions/setup-matlab@v2
        with:
          products: Simulink Simulink_Test
      - name: Run build
        uses: matlab-actions/run-build@v2
        with:
          tasks: test
```

### Run MATLAB Tests on GitHub-Hosted Runner
Use a GitHub-hosted runner to run the tests in your [MATLAB project](https://www.mathworks.com/help/matlab/projects.html) and generate test results in JUnit-style XML format and code coverage results in Cobertura XML format. To run the tests and generate the artifacts, include the [Run MATLAB Tests](https://github.com/matlab-actions/run-tests/) action in your workflow.

```yaml
name: Run MATLAB Tests on GitHub-Hosted Runner
on: [push]
jobs:
  my-job:
    name: Run MATLAB Tests and Generate Artifacts
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4
      - name: Set up MATLAB
        uses: matlab-actions/setup-matlab@v2
      - name: Run tests and generate artifacts
        uses: matlab-actions/run-tests@v2
        with:
          test-results-junit: test-results/results.xml
          code-coverage-cobertura: code-coverage/coverage.xml
```

### Run MATLAB Script on GitHub-Hosted Runner
Use a GitHub-hosted runner to run the commands in a file named `myscript.m` in the root of your repository. To run the script, include the [Run MATLAB Command](https://github.com/matlab-actions/run-command/) action in your workflow.

```yaml
name: Run MATLAB Script on GitHub-Hosted Runner
on: [push]
jobs:
  my-job:
    name: Run MATLAB Script
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4
      - name: Set up MATLAB
        uses: matlab-actions/setup-matlab@v2
      - name: Run script
        uses: matlab-actions/run-command@v2
        with:
          command: myscript
```

## Set Up MATLAB
When you define your workflow in the `.github/workflows` directory of your repository, specify the **Setup MATLAB** action as `matlab-actions/setup-matlab@v2`. The action accepts optional inputs.

| Input     | Description |
|-----------|-------------|
| `release` | (Optional) MATLAB release to set up. You can specify R2020b or a later release. If you do not specify `release`, the action sets up the latest release of MATLAB.<br/>**Example**: `release: R2022a`
| `products` | (Optional) Space-separated list of products to install. If a product name contains white-space characters, replace them with underscores. For the full list of available products and their names, see [Products and Services](https://www.mathworks.com/products.html). By default, the task installs MATLAB. Public licensing is not available for transformation products, such as MATLAB Coder&trade; and MATLAB Compiler&trade;.<br/> **Example**: `products: Simulink`</br>**Example:** `products: Simulink Deep_Learning_Toolbox`
| `cache` | (Optional) Space-separated list of products to install. If a product name contains white-space characters, replace them with underscores. For the full list of available products and their names, see [Products and Services](https://www.mathworks.com/products.html). By default, the task installs MATLAB. Public licensing is not available for transformation products, such as MATLAB Coder&trade; and MATLAB Compiler&trade;.<br/> **Example**: `cache: true`

## Notes
When you use the **Setup MATLAB** action, you execute third-party code that is licensed under separate terms.

## See Also
- [Action for Running MATLAB Builds](https://github.com/matlab-actions/run-build/)
- [Action for Running MATLAB Tests](https://github.com/matlab-actions/run-tests/)
- [Action for Running MATLAB Commands](https://github.com/matlab-actions/run-command/)
- [Continuous Integration with MATLAB and Simulink](https://www.mathworks.com/solutions/continuous-integration.html)

## Contact Us
If you have any questions or suggestions, please contact MathWorks&reg; at [continuous-integration@mathworks.com](mailto:continuous-integration@mathworks.com).
