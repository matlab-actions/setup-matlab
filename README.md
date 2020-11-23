# Set up MATLAB® on a GitHub-Hosted Runner

Use the Set Up MATLAB action when you want to run MATLAB code and Simulink®
models in public projects that utilize GitHub-hosted runners. The action
installs the specified MATLAB release on a Linux virtual machine. If you do not
specify a release, the action installs the latest release of MATLAB. You can
then use the runner to execute MATLAB scripts, functions, or statements. You
also can use the runner to execute MATLAB and Simulink tests and generate test
artifacts.

This action is not supported on self-hosted runners. If you want to run your
workflow on a self-hosted runner, make sure that MATLAB and the required
products are installed on the runner. For more information, see
https://www.mathworks.com/help/install/install-products.html.

Currently, this action is available only for public projects and does not
include transformation products, such as MATLAB Coder™ and MATLAB Compiler™.

**Note**: By running the code in this action, you will be executing third-party
code that is licensed under separate terms.

## Usage

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
      - uses: matlab-actions/setup-matlab@v0
      - name: Run MATLAB from the system shell
        run: matlab -batch "disp('hello world')"
```

You can use this action with the [Run MATLAB Command](https://github.com/matlab-actions/run-command/) and [Run MATLAB Tests](https://github.com/matlab-actions/run-tests/) actions to easily run MATLAB and Simulink as part of your build pipeline.

## See also
- [Run MATLAB Command](https://github.com/matlab-actions/run-command/)
- [Run MATLAB Tests](https://github.com/matlab-actions/run-tests/)
- [Continuous Integration - MATLAB & Simulink](https://www.mathworks.com/solutions/continuous-integration.html)

## Contact Us
If you have any questions or suggestions, please contact MathWorks® at continuous-integration@mathworks.com.
