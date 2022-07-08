# Contributing

We :heart: PRs! If you have something you'd like to contribute, please open an issue first. We're happy to talk with you about your pull request before you get started.

## Release Process

This section details the steps necessary to cut a new release. Suppose the latest release is `v3.18.1`, and you wish to cut `v.3.19.0`.

1. Checkout the default branch.

   ```bash
   $ git checkout master
   ```

2. Open up `CHANGELOG.md`. Create a new h2 with the release version and the date of the release. Move the release notes from the `HEAD` section under the new heading, and add a note in the `HEAD` section indicating that it is currently empty. 

   ```markdown
   # CHANGELOG

   ## HEAD (Unreleased)

   __(none)__

   ---

   ## 3.19.0 (2022-07-01)

   - feature: Add foobar support
   - bug: Fix XYZ

   ## 3.18.1 (2022-07-10)
   ...
   ```

3. Commit your changes to  `CHANGELOG.md`, and open a PR. Once your changes have been approved and status checks have passed, merge your PR into the default branch, `master`. 

4. Wait for status checks on the default branch to pass.

5. Navigate to the [Release page](https://github.com/pulumi/actions/releases) and select `Draft a new release`.

6. Make sure `Publish this Action to GitHub Marketplace` is checked (it should be checked by default).

7. Under the `Choose a tag` dropdown, enter in the name of your new tag, which should the release name, `v3.19.0`.

8. Under `Release Title`, enter the name of your release, v3.19.0

9. Press the button  `Geneate release notes`. Replace the section `What's New` with the changes you added to `CHANGELOG.md`.

10. Press the `Publish release` button.
