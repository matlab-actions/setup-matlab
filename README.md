# Use MATLAB on a GitHub-Hosted Runner

This action enables you to run MATLAB®/Simulink® scripts, functions, and
statements as part of your build workflow on a GitHub-hosted runner.

Note: For self hosted runners, please install MATLAB/Simulink (see the
[documentation](https://www.mathworks.com/help/install/install-products.html)
for more information). Calling this action on a self-hosted runner is not
currently supported.

---

Use this action when you want to run MATLAB code in public projects that utilize
GitHub-hosted runners. The action installs the latest MATLAB release on a Linux
virtual machine and enables the runner to run MATLAB scripts, functions,
statements, and tests.

Currently, this action is available only for public projects and does not
include transformation products, such as MATLAB Coder™ and MATLAB Compiler™.

You can use this action `with`:
| Argument  | Description |
|-----------|-------------|
| `release` | (Optional) MATLAB release to install. You can specify R2020a or a later release. By default, the action installs the latest release of MATLAB. <br/> **Example**: `R2020a` <br/> **Default**: `latest`

## Example

```yaml
name: Sample workflow
on: [push]

jobs:
  my-job:
    name: Say hello from MATLAB
    runs-on: ubuntu-latest
    steps:
      - uses: mathworks/setup-matlab-action@v0
      - name: Run MATLAB from the system shell
        run: matlab -batch "disp('hello world')"
```
> **Note:** You can use this action in conjunction with the following actions to
> make launching MATLAB eaiser:
> - [Run MATLAB Command](https://github.com/mathworks/run-matlab-command-action/) 
> - [Run MATLAB Tests](https://github.com/mathworks/run-matlab-tests-action/)

## See also
- [Continuous Integration (CI) - MATLAB & Simulink](https://www.mathworks.com/help/matlab/continuous-integration.html)

## Contact Us
If you have any questions or suggestions, please contact MathWorks® at continuous-integration@mathworks.com.
