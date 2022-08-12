## Contributing

Verify changes by running tests and building locally with the following command:

```
npm run ci
```

## Creating a New Release

Familiarize yourself with the best practices for [releasing and maintaining GitHub actions](https://docs.github.com/en/actions/creating-actions/releasing-and-maintaining-actions).

Changes should be made on a new branch. The new branch should be merged to the main branch via a pull request. Ensure that all of the CI pipeline checks and tests have passed for your changes.

After the pull request has been approved and merged to main, follow the Github process for [creating a new release](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository). The release must follow semantic versioning (ex: vX.Y.Z). This will kick off a new pipeline execution, and the action will automatically be published to the GitHub Actions Marketplace if the pipeline finishes successfully. Check the [GitHub Marketplace](https://github.com/marketplace/actions/setup-matlab) and check the major version in the repository (ex: v1 for v1.0.0) to ensure that the new semantically versioned tag is available.
