# Action for Setting Up MATLAB

The [Setup MATLAB](#set-up-matlab) action enables you to set up MATLAB&reg; and other MathWorks&reg; products on a [GitHub&reg;-hosted](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners/about-github-hosted-runners) runner. When you specify this action as part of your workflow, the action sets up your preferred MATLAB release (R2021a or later) on a Linux&reg;, Windows&reg;, or macOS runner. If you do not specify a release, the action sets up the latest release of MATLAB. As part of the setup process, the action prepends MATLAB to the `PATH` system environment variable.

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
Run your MATLAB and Simulink tests in parallel (requires Parallel Computing Toolbox&trade;) using the latest release of the required products on a GitHub-hosted runner. To set up the latest release of MATLAB, Simulink, Simulink Test, and Parallel Computing Toolbox on the runner, specify the **Setup MATLAB** action with its `products` input in your workflow. To run the tests in parallel, specify the [Run MATLAB Tests](https://github.com/matlab-actions/run-tests/) action with its `use-parallel` input specified as `true`.

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
On a GitHub-hosted runner, you need a [MATLAB batch licensing token](https://github.com/mathworks-ref-arch/matlab-dockerfile/blob/main/alternates/non-interactive/MATLAB-BATCH.md#matlab-batch-licensing-token) if your project is private or if your workflow includes transformation products, such as MATLAB Coder&trade; and MATLAB Compiler&trade;. Batch licensing tokens are strings that enable MATLAB to start in noninteractive environments. You can request a token by submitting the [MATLAB Batch Licensing Pilot](https://www.mathworks.com/support/batch-tokens.html) form. 

To use a MATLAB batch licensing token:

1. Set the token as a secret. For more information about secrets, see [Using secrets in GitHub Actions](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions).
2. Map the secret to an environment variable named `MLM_LICENSE_TOKEN` in your workflow. 

For example, use the latest release of MATLAB on a GitHub-hosted runner to run the tests in your private project. To set up the latest release of MATLAB on the runner, specify the **Setup MATLAB** action in your workflow. To run the tests, specify the [Run MATLAB Tests](https://github.com/matlab-actions/run-tests/) action. In this example, `MyToken` is the name of the secret that holds the batch licensing token.

```YAML
name: Use MATLAB Batch Licensing Token
on: [push]
env:
  MLM_LICENSE_TOKEN: ${{ secrets.MyToken }}
jobs:
  my-job:
    name: Run MATLAB Tests in Private Project
    runs-on: ubuntu-latest
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
| `release` | <p>(Optional) MATLAB release to set up. You can specify R2021a or a later release. By default, the value of `release` is `latest`, which corresponds to the latest release of MATLAB.</p><p>**Example**: `release: R2023b`<br/>**Example**: `release: latest`<br/>**Example**: `release: R2024aU5`</p>
| `products` | <p>(Optional) Products to set up in addition to MATLAB, specified as a list of product names separated by spaces. You can specify `products` to set up most MathWorks products and support packages. For example, `products: Deep_Learning_Toolbox` sets up Deep Learning Toolbox&trade; in addition to MATLAB.</p><p>The action uses [MATLAB Package Manager](https://github.com/mathworks-ref-arch/matlab-dockerfile/blob/main/MPM.md) (`mpm`) to set up products. For a list of supported products and their formatted names, see [Product Installation Options](https://github.com/mathworks-ref-arch/matlab-dockerfile/blob/main/MPM.md#product-installation-options).</p><p>For an example of how to use the `products` input, see [Run Tests in Parallel](#run-tests-in-parallel).</p><p>**Example**: `products: Simulink`<br/>**Example:** `products: Simulink Deep_Learning_Toolbox`</p>
| `cache` | <p>(Optional) Option to enable caching with GitHub Actions, specified as `false` or `true`. By default, the value is `false` and the action does not store MATLAB and the specified products in a GitHub Actions cache for future use. For more information about caching with GitHub Actions, see [Caching dependencies to speed up workflows](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows).</p><p>**Example**: `cache: true`</p>

#### Licensing
Product licensing for your workflow depends on your project visibility as well as the type of products to set up:

- Public project — If your workflow does not include transformation products, such as MATLAB Coder and MATLAB Compiler, then the action automatically licenses any products that you set up. If your workflow includes transformation products, you can request a [MATLAB batch licensing token](https://github.com/mathworks-ref-arch/matlab-dockerfile/blob/main/alternates/non-interactive/MATLAB-BATCH.md#matlab-batch-licensing-token) by submitting the [MATLAB Batch Licensing Pilot](https://www.mathworks.com/support/batch-tokens.html) form.
- Private project — The action does not automatically license any products for you. You can request a batch licensing token by submitting the [MATLAB Batch Licensing Pilot](https://www.mathworks.com/support/batch-tokens.html) form.
  
To use a MATLAB batch licensing token, first set it as a [secret](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions). Then, map the secret to an environment variable named `MLM_LICENSE_TOKEN` in your workflow. For an example, see [Use MATLAB Batch Licensing Token](#use-matlab-batch-licensing-token). 

## Notes
- The **Setup MATLAB** action automatically includes the [MATLAB batch licensing executable](https://github.com/mathworks-ref-arch/matlab-dockerfile/blob/main/alternates/non-interactive/MATLAB-BATCH.md) (`matlab-batch`). To use a MATLAB batch licensing token in a workflow that does not use this action, you must first download the executable and add it to the system path.
- When you use the **Setup MATLAB** action, you execute third-party code that is licensed under separate terms.

## See Also
- [Action for Running MATLAB Builds](https://github.com/matlab-actions/run-build/)
- [Action for Running MATLAB Tests](https://github.com/matlab-actions/run-tests/)
- [Action for Running MATLAB Commands](https://github.com/matlab-actions/run-command/)
- [Continuous Integration with MATLAB and Simulink](https://www.mathworks.com/solutions/continuous-integration.html)

## Contact Us
If you have any questions or suggestions, contact MathWorks at [continuous-integration@mathworks.com](mailto:continuous-integration@mathworks.com).
