## Contributing

Verify changes by running tests and building locally with the following command:

```
npm run ci
```

## Creating a New Release

Familiarize yourself with the best practices for [releasing and maintaining GitHub actions](https://docs.github.com/en/actions/creating-actions/releasing-and-maintaining-actions).

Changes should be made on a new branch. The new branch should be merged to the main branch via a pull request. Ensure that all of the CI pipeline checks and tests have passed for your changes.

After the pull request has been approved and merged to main, follow the Github process for [creating a new release](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository). The release must follow semantic versioning (ex: vX.Y.Z). This will kick off a new pipeline execution, and the action will automatically be published to the GitHub Actions Marketplace if the pipeline finishes successfully. Check the [GitHub Marketplace](https://github.com/marketplace/actions/setup-matlab) and check the major version in the repository (ex: v1 for v1.0.0) to ensure that the new semantically versioned tag is available.

## Adding a Pre-Commit Hook

You can run all CI checks before each commit by adding a pre-commit hook. To do so, navigate to the repository root folder and run the following commands:

_bash (Linux/macOS)_

```sh
echo '#!/bin/sh' > .git/hooks/pre-commit
echo 'npm run ci' >> .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

_Command Prompt (Windows)_

```cmd
echo #!/bin/sh > .git\hooks\pre-commit
echo npm run ci >> .git\hooks\pre-commit
```

_PowerShell (Windows)_

```pwsh
Set-Content .git\hooks\pre-commit '#!/bin/sh'
Add-Content .git\hooks\pre-commit 'npm run ci'
```

> **Note:**
> Git hooks are not version-controlled, so you need to set up this hook for each fresh clone of the repository.
