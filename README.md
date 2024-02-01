# Action for Setting Up MATLAB

The [Setup MATLAB](#set-up-matlab) action enables you to run MATLAB&reg; code and Simulink&reg; models with a specific version of MATLAB. When you specify this action as part of your workflow, the action sets up your preferred MATLAB release (R2021a or later) on a Linux&reg;, Windows&reg;, or macOS&reg; virtual machine. If you do not specify a release, the action sets up the latest release of MATLAB. As part of the setup process, the action prepends MATLAB to the system PATH environment variable.

## Usage Examples
Once you set up MATLAB on a runner, you can build and test your MATLAB project as part of your workflow. To execute code on the runner, include the [Run MATLAB Build](https://github.com/matlab-actions/run-build/), [Run MATLAB Tests](https://github.com/matlab-actions/run-tests/), or [Run MATLAB Command](https://github.com/matlab-actions/run-command/) action in your workflow.

### Run MATLAB Build on GitHub-Hosted Runner
Use a [GitHub&reg;-hosted runner](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners) to run a specific task and its depended-on tasks that are specified in a file named `buildfile.m` in the root of your repository. To run tasks using the MATLAB build tool, include the [Run MATLAB Build](https://github.com/matlab-actions/run-build/) action in your workflow. This action is supported in MATLAB R2022b and later.

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

### Specify MATLAB Version on Self-Hosted Runner
When you use the **Run MATLAB Build**, **Run MATLAB Tests**, or **Run MATLAB Command** action in your workflow, the self-hosted runner uses the topmost MATLAB version on the system path. The build fails if the runner cannot find any version of MATLAB on the path.

You can prepend your preferred version of MATLAB to the `PATH` environment variable of the runner. For example, prepend MATLAB R2023a to the path and use it to run your script. The step depends on your operating system and MATLAB root folder.

```YAML
name: Run MATLAB Script on Self-Hosted Runner
on: [push]
jobs:
  my-job:
    name: Run MATLAB Script
    runs-on: self-hosted
    steps:
      - name: Check out repository
        uses: actions/checkout@v3 
      - name: Prepend MATLAB to PATH on Windows (PowerShell)
        if: runner.os == 'Windows'
        run: echo "C:\Program Files\MATLAB\R2023a\bin" | Out-File -FilePath $env:GITHUB_PATH -Encoding utf8 -Append     
      - name: Prepend MATLAB to PATH on Linux
        if: runner.os == 'Linux'
        run: echo "/usr/local/MATLAB/R2023a/bin" >> $GITHUB_PATH
      - name: Prepend MATLAB to PATH on macOS
        if: runner.os == 'macOS'
        run: echo "/Applications/MATLAB_R2023a.app/bin" >> $GITHUB_PATH
      - name: Run script
        uses: matlab-actions/run-command@v1
        with:
          command: myscript
```

```
name: Run MATLAB Matrix Build on GitHub-Hosted Runner
on: [push]
jobs:
  my-job:
    name: Run MATLAB Build
    strategy:
      matrix:
        platform: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.platform }}
    steps:
      - name: Check out repository
        uses: actions/checkout@v3
      - name: Set up MATLAB
        uses: matlab-actions/setup-matlab@v2
      - name: Run build
        uses: matlab-actions/run-build@v2
        with:
          tasks: test
```


## Set Up MATLAB
When you define your workflow in the `.github/workflows` directory of your repository, specify the **Setup MATLAB** action as `matlab-actions/setup-matlab@v2`. The action accepts optional inputs.

| Input     | Description |
|-----------|-------------|
| `release` | <p>(Optional) MATLAB release to set up. You can specify R2021a or a later release. If you do not specify `release`, the action defaults to `latest`, which represents the latest release of MATLAB.<p/><p>**Example**: `release: R2023a`<br/>**Example**: `release: latest`</p>
| `products` | <p>(Optional) Products to set up in addition to MATLAB, specified as a list of product names separated by spaces. You can specify `products` to set up most MathWorks&reg; products and support packages. For example, `products: Deep_Learning_Toolbox` sets up Deep Learning Toolbox&trade; in addition to MATLAB.</p><p>The action uses [MATLAB Package Manager](https://github.com/mathworks-ref-arch/matlab-dockerfile/blob/main/MPM.md) (`mpm`) for installing products. For a list of supported products and their correctly formatted names, see [Product Installation Options](https://github.com/mathworks-ref-arch/matlab-dockerfile/blob/main/MPM.md#product-installation-options).</p> <p>:information_source: **Note:** If you use this input to set up transformation products, such as MATLAB Coder&trade; and MATLAB Compiler&trade;, the action does not automatically license such products for you.<p/><p>**Example**: `products: Simulink`</br>**Example:** `products: Simulink Deep_Learning_Toolbox`</p>
| `cache` | <p>(Optional) Option to enable caching with GitHub&reg; Actions, specified as `false` or `true`. By default, the value is `false` and the action does not store MATLAB and the specified products in a GitHub Actions cache for future use. For more information about caching with GitHub Actions, see [Caching dependencies to speed up workflows](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows).<p/><p>**Example**: `cache: true`</p>

## Notes
When you use the **Setup MATLAB** action, you execute third-party code that is licensed under separate terms.

## See Also
- [Action for Running MATLAB Builds](https://github.com/matlab-actions/run-build/)
- [Action for Running MATLAB Tests](https://github.com/matlab-actions/run-tests/)
- [Action for Running MATLAB Commands](https://github.com/matlab-actions/run-command/)
- [Continuous Integration with MATLAB and Simulink](https://www.mathworks.com/solutions/continuous-integration.html)

## Contact Us
If you have any questions or suggestions, please contact MathWorks&reg; at [continuous-integration@mathworks.com](mailto:continuous-integration@mathworks.com).
