# Action for Setting Up MATLAB

The [Setup MATLAB](#set-up-matlab) action enables you to set up MATLAB&reg; and other MathWorks&reg; products on a [GitHub&reg;-hosted](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners/about-github-hosted-runners) (Linux&reg;, Windows&reg;, or macOS) runner or [self-hosted](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners) UNIX&reg; (Linux or macOS) runner. When you specify this action as part of your workflow, the action sets up your preferred MATLAB release (R2021a or later) on the runner. If you do not specify a release, the action sets up the latest release of MATLAB. As part of the setup process, the action prepends MATLAB to the `PATH` system environment variable.

>**Note:** For GitHub-hosted runners, the **Setup MATLAB** action automatically includes the dependencies required to run MATLAB and other MathWorks products. However, if you are using a self-hosted runner, you must ensure that the required dependencies are available on your runner. For details, see [Required Software on Self-Hosted Runners](#required-software-on-self-hosted-runners).

## Examples
Once you set up MATLAB on a runner, you can build and test your MATLAB project as part of your workflow. To execute code on the runner, include the [Run MATLAB Build](https://github.com/matlab-actions/run-build/), [Run MATLAB Tests](https://github.com/matlab-actions/run-tests/), or [Run MATLAB Command](https://github.com/matlab-actions/run-command/) action in your workflow.

### Run Default Tasks in Build File
Using the latest release of MATLAB on a GitHub-hosted runner, run the default tasks in a build file named `buildfile.m` in the root of your repository as well as all the tasks on which they depend. To set up the latest release of MATLAB on the runner, specify the **Setup MATLAB** action in your workflow. To run the tasks, specify the [Run MATLAB Build](https://github.com/matlab-actions/run-build/) action.

```yaml
name: Run Default Tasks in Build File
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
      - name: Run build
        uses: matlab-actions/run-build@v2
```

### Run Tests in Parallel
Run your MATLAB and Simulink&reg; tests in parallel (requires Parallel Computing Toolbox&trade;) using the latest release of the required products on a GitHub-hosted runner. To set up the latest release of MATLAB, Simulink, Simulink Test, and Parallel Computing Toolbox on the runner, specify the **Setup MATLAB** action with its `products` input in your workflow. To run the tests in parallel, specify the [Run MATLAB Tests](https://github.com/matlab-actions/run-tests/) action with its `use-parallel` input specified as `true`.

```YAML
name: Run Tests in Parallel
on: [push]
jobs:
  my-job:
    name: Run MATLAB and Simulink Tests
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4
      - name: Set up products
        uses: matlab-actions/setup-matlab@v2
        with:
          products: >
            Simulink
            Simulink_Test
            Parallel_Computing_Toolbox
      - name: Run tests
        uses: matlab-actions/run-tests@v2
        with:
          use-parallel: true
``` 

### Run MATLAB Script
Using the latest release of MATLAB on a GitHub-hosted runner, run a script named `myscript.m` in the root of your repository. To set up the latest release of MATLAB on the runner, specify the **Setup MATLAB** action in your workflow. To run the script, specify the [Run MATLAB Command](https://github.com/matlab-actions/run-command/) action.

```yaml
name: Run MATLAB Script
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

### Use MATLAB Batch Licensing Token
When you define a workflow using the **Setup MATLAB** action, you need a [MATLAB batch licensing token](https://github.com/mathworks-ref-arch/matlab-dockerfile/blob/main/alternates/non-interactive/MATLAB-BATCH.md#matlab-batch-licensing-token) if your project is private or if your workflow uses transformation products, such as MATLAB Coder&trade; and MATLAB Compiler&trade;. Batch licensing tokens are strings that enable MATLAB to start in noninteractive environments. You can request a token by submitting the [MATLAB Batch Licensing Pilot](https://www.mathworks.com/support/batch-tokens.html) form. 

To use a MATLAB batch licensing token:

1. Set the token as a secret. For more information about secrets, see [Using secrets in GitHub Actions](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions).
2. Map the secret to an environment variable named `MLM_LICENSE_TOKEN` in your workflow. 

For example, define a workflow that runs the tests in your private project by using the latest release of MATLAB on a self-hosted UNIX runner:
- To set up the latest release of MATLAB on the self-hosted UNIX runner, specify the **Setup MATLAB** action in your workflow. (The runner must include all the dependencies required to run MATLAB.)
- To run the tests, specify the [Run MATLAB Tests](https://github.com/matlab-actions/run-tests/) action. License MATLAB to run the tests by mapping a secret to the `MLM_LICENSE_TOKEN` environment variable in your workflow. In this example, `MyToken` is the name of the secret that holds the batch licensing token.

```YAML
name: Use MATLAB Batch Licensing Token
on: [push]
env:
  MLM_LICENSE_TOKEN: ${{ secrets.MyToken }}
jobs:
  my-job:
    name: Run MATLAB Tests in Private Project
    runs-on: self-hosted
    steps:
      - name: Check out repository
        uses: actions/checkout@v4
      - name: Set up MATLAB
        uses: matlab-actions/setup-matlab@v2
      - name: Run tests
        uses: matlab-actions/run-tests@v2
```

### Build Across Multiple Platforms
The **Setup MATLAB** action supports the Linux, Windows, and macOS platforms. Define a matrix of job configurations to run a build using the MATLAB build tool on all the supported platforms. This workflow runs three jobs, one for each value in the variable `os`. For more information about matrices, see [Using a matrix for your jobs](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs). 

```YAML
name: Build Across Multiple Platforms
on: [push]
jobs:
  my-job:
    name: Run MATLAB Build
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - name: Check out repository
        uses: actions/checkout@v4
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
| `release` | <p>(Optional) MATLAB release to set up. You can specify R2021a or a later release. By default, the value of `release` is `latest`, which corresponds to the latest release of MATLAB.</p><p><ul><li>To set up the latest update of a release, specify only the release name, for example, `R2024a`.</li><li>To set up a specific update release, specify the release name with an update number suffix, for example, `R2024aU4`.</li><li>To set up a release without updates, specify the release name with an update 0 or general release suffix, for example, `R2024aU0` or `R2024aGR`.</li></ul></p><p>**Example**: `release: R2024a`<br/>**Example**: `release: latest`<br/>**Example**: `release: R2024aU4`</p>
| `products` | <p>(Optional) Products to set up in addition to MATLAB, specified as a list of product names separated by spaces. You can specify `products` to set up most MathWorks products and support packages. The action uses [MATLAB Package Manager](https://github.com/mathworks-ref-arch/matlab-dockerfile/blob/main/MPM.md) (`mpm`) to set up products.</p><p>For a list of supported products, open the input file for your preferred release from the [`mpm-input-files`](https://github.com/mathworks-ref-arch/matlab-dockerfile/tree/main/mpm-input-files) folder on GitHub. Specify products using the format shown in the input file, excluding the `#product.` prefix. For example, to set up Deep Learning Toolbox&trade; in addition to MATLAB, specify `products: Deep_Learning_Toolbox`.</p><p>For an example of how to use the `products` input, see [Run Tests in Parallel](#run-tests-in-parallel).</p><p>**Example**: `products: Simulink`<br/>**Example:** `products: Simulink Deep_Learning_Toolbox`</p>
| `cache` | <p>(Optional) Option to enable caching with GitHub Actions, specified as `false` or `true`. By default, the value is `false` and the action does not store MATLAB and the specified products in a GitHub Actions cache for future use. For more information about caching with GitHub Actions, see [Caching dependencies to speed up workflows](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows).</p><p>**Example**: `cache: true`</p>

#### Required Software on Self-Hosted Runners
Before using the **Setup MATLAB** action to set up MATLAB and other MathWorks products on a self-hosted UNIX runner, verify that the required software is installed on your runner.

##### Linux
If you are using a Linux runner, verify that the following software is installed on your runner:
- Third-party packages required to run the `mpm` command — To view the list of `mpm` dependencies, refer to the Linux section of [Get MATLAB Package Manager](https://www.mathworks.com/help/install/ug/get-mpm-os-command-line.html).
- All MATLAB dependencies — To view the list of MATLAB dependencies, go to the [MATLAB Dependencies](https://github.com/mathworks-ref-arch/container-images/tree/main/matlab-deps) repository on GitHub. Then, open the `<release>/<system>/base-dependencies.txt` file for your MATLAB release and your runner's operating system.

##### macOS
If you are using a macOS runner with an Apple silicon processor, verify that Java&reg; Runtime Environment (JRE&trade;) is installed on your runner. For information about this requirement and to get a compatible JRE version, see [MATLAB on Apple Silicon Macs](https://www.mathworks.com/support/requirements/apple-silicon.html).

>**Tip:** One convenient way to include the required dependencies on a self-hosted runner is to specify the [MATLAB Dependencies container image on Docker&reg; Hub](https://hub.docker.com/r/mathworks/matlab-deps) in your workflow.

#### Licensing
Product licensing for your workflow depends on your project visibility:

- Public project — The [Run MATLAB Build](https://github.com/matlab-actions/run-build/), [Run MATLAB Tests](https://github.com/matlab-actions/run-tests/), and [Run MATLAB Command](https://github.com/matlab-actions/run-command/) actions automatically license all products for you, except for transformation products, such as MATLAB Coder and MATLAB Compiler.
- Private project — The actions do not automatically license any products for you. 

To license products that are not automatically licensed, you can request a [MATLAB batch licensing token](https://github.com/mathworks-ref-arch/matlab-dockerfile/blob/main/alternates/non-interactive/MATLAB-BATCH.md#matlab-batch-licensing-token) by submitting the [MATLAB Batch Licensing Pilot](https://www.mathworks.com/support/batch-tokens.html) form. Batch licensing tokens are strings that enable MATLAB to start in noninteractive environments.

To use a MATLAB batch licensing token, first set it as a [secret](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions). Then, map the secret to an environment variable named `MLM_LICENSE_TOKEN` in your workflow. For an example, see [Use MATLAB Batch Licensing Token](#use-matlab-batch-licensing-token). 

## Notes
- The **Setup MATLAB** action automatically includes the [MATLAB batch licensing executable](https://github.com/mathworks-ref-arch/matlab-dockerfile/blob/main/alternates/non-interactive/MATLAB-BATCH.md) (`matlab-batch`). To use a MATLAB batch licensing token in a workflow that does not use this action, you must first download the executable and add it to the system path.
- Public project and MATLAB batch licensing do not support external language interfaces, including MATLAB Engine APIs for Python&reg;, Java, .NET, COM, C, C++, and Fortran. To use external language interfaces in your workflow, use a self-hosted runner that has a version of MATLAB licensed without a batch token.
- When you use the **Setup MATLAB** action, you execute third-party code that is licensed under separate terms.

## See Also
- [Action for Running MATLAB Builds](https://github.com/matlab-actions/run-build/)
- [Action for Running MATLAB Tests](https://github.com/matlab-actions/run-tests/)
- [Action for Running MATLAB Commands](https://github.com/matlab-actions/run-command/)
- [Continuous Integration with MATLAB and Simulink](https://www.mathworks.com/solutions/continuous-integration.html)

## Contact Us
If you have any questions or suggestions, contact MathWorks at [continuous-integration@mathworks.com](mailto:continuous-integration@mathworks.com).
