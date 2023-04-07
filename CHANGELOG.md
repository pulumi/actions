# CHANGELOG

## HEAD (Unreleased)

- chore: add dist files to gitignore and forcebly commit them instead

--

## 4.1.1 (2023-03-31)

- fix: Improve error messages around failed Semver resolution.
  ([#898](https://github.com/pulumi/actions/pull/898))

## 4.1.0 (2023-03-08)

- feat: Support install-only mode similar to
  [setup-pulumi](https://github.com/marketplace/actions/setup-pulumi)
  ([#834](https://github.com/pulumi/actions/pull/834))

- fix: allow `comment-on-pr-number` to be used for `${{ github.event }}` types
  other than `pull_request`
  ([#803](https://github.com/pulumi/actions/issues/803))

- fix: Fix installation on Windows.
  ([#851](https://github.com/pulumi/actions/pull/851))

## 4.0.0 (2023-19-01)

- feat: Update Action runtime to NodeJS 16

## 3.21.0 (2023-19-01)

- feat: Add deletion of stack after destroy (remove flag)

## 3.20.0 (2022-11-10)

- feat: Always show login information

- fix: no output when applying

- fix: pull request comment body too big. Trims body when above 64k characters.

- Support for setting `comment-on-pr-number` when building
  [Reused Workflows](https://docs.github.com/en/actions/using-workflows/reusing-workflows).

- feat: Always show login information

- feat: Includes the project name in comments, eliminating conflicts when
  working with multiple projects in the same repository.
  ([#563](https://github.com/pulumi/actions/issues/563))

## 3.19.1 (2022-09-06)

- bug: Fix bug where `cloud-url` option was not respected. This change also
  enables using self-hosted Pulumi (_e.g._ an S3 bucket or Pulumi Business
  Critical self-hosted) [#719](https://github.com/pulumi/actions/pull/719)

## 3.19.0 (2022-08-10)

- feat: add configuration of Pulumi stack by `config-map` field

- enhancement: Add `pulumi-version` option to allow pinning the version of the
  CLI [PR](https://github.com/pulumi/actions/pull/661) fixes
  [#437 ](https://github.com/pulumi/actions/issues/437)

## 3.18.1 (2022-07-07)

- bug: Resolves a panic when using `comment-on-pr: true` when not running on an
  event of type `pull_request`.
  [#679](https://github.com/pulumi/actions/issues/679)

- revert runtime requirement from node 16 to node 12

## 3.18.0 (2022-07-01)

- Add support for colorized output
  [#662](https://github.com/pulumi/actions/pull/662)

- feat: add support for local policy packs
  [#658](https://github.com/pulumi/actions/pull/658)

- fix: update PR comments correctly when `edit-pr-comment` is true (fixes
  [#633](https://github.com/pulumi/actions/issues/633))

- bump runtime to node 16

## 3.17.0 (2022-05-25)

- Fixes errors when pull request comment body is too large by trimming the body
  when above 64k characters

## 3.16.0 (2022-02-09)

- Print the comments as a collapsed `<details>` section

## 3.15.0 (2022-01-04)

- Upgrade to Pulumi v3.21.0

## 3.14.0 (2021-12-22)

- Upgrade to Pulumi v3.20.0

## 3.13.0 (2021-12-03)

- Upgrade to Pulumi v3.19.0

## 3.12.1 (2021-11-15)

- Upgrade to Pulumi v3.17.1

## 3.12.0 (2021-11-5)

- Upgrade to Pulumi v3.17.0

## 3.11.0 (2021-10-28)

- Upgrade to Pulumi v3.16.0

## 3.10.0 (2021-10-12)

- Upgrade to Pulumi v3.14.0

## 3.9.1 (2021-09-29)

- Upgrade to Pulumi v3.13.2

## 3.9.0 (2021-09-27)

- Upgrade to Pulumi v3.13.0

## 3.8.0 (2021-08-26)

- Add support for arm64 architecture
- Upgrade to Pulumi v3.11.0

## 3.7.1 (2021-08-19)

- Upgrade to Pulumi v3.10.3

## 3.7.0 (2021-08-16)

- Upgrade to Pulumi v3.10.1

## 3.6.0 (2021-08-06)

- Add support for passing `secrets-manager` as part of the workspace options
  when interacting with a stack
- Upgrade to Pulumi v3.9.1 SDK

## 3.5.0 (2021-07-29)

- Upgrade to Pulumi v3.9.0 SDK

## 3.4.0 (2021-07-21)

- Upgrade to Pulumi v3.7.1 SDK

## 3.3.0 (2021-07-01)

- Upgrade to Pulumi v3.6.0 SDK
- Ensure that `edit-pr-comment` checks to ensure it has a comment to edit before
  trying to update

## 3.2.0 (2021-06-16)

- Upgrade to Pulumi v3.4.0 SDK
- Add ability to `edit-pr-comment` - this value currently defaults to `true`
  therefore it will always update the same comment to change this behaviour, set
  this value to false in your action
- Add `stack_name` and `command` to PR comment output

## 3.1.0 (2021-05-24)

- Edit previous PR comment instead of posting new one
  [#128](https://github.com/pulumi/actions/pull/148)
- Embed installation of Pulumi CLI
  [#211](https://github.com/pulumi/actions/pull/211)

## 3.0.0 (2021-04-19)

- Upgrade to Pulumi 3.0 **PLEASE NOTE:** This minimum version of the Pulumi CLI
  to work with this action has been updated to be 3.0.0. If this version
  requirement is not satisfied then the action will throw an error

## 2.3.0 (2021-04-15)

- Upgrade to v2.25.0 of Pulumi Automation API
  [#180](https://github.com/pulumi/actions/pull/180) **PLEASE NOTE:** This
  minimum version of the Pulumi CLI to work with this action has been updated to
  be 2.25.0

## 2.2.0 (2021-03-22)

- Add ability to refresh a stack by passing `refresh: true`
  [#128](https://github.com/pulumi/actions/pull/128)

## 2.1.0 (2021-03-17)

- Add ability to create stack if not already exists by passing `upsert: true`
  [#118](https://github.com/pulumi/actions/pull/118)
- Add ability to pass program options to the Pulumi CLI
  [#117](https://github.com/pulumi/actions/pull/117)
  - `parallel`
  - `message`
  - `expect-no-changes`
  - `diff`
  - `replace`
  - `target`
  - `target-dependents`
- Reject PRs with changes to the `dist/` folder to reduce any potential security
  issues [#119](https://github.com/pulumi/actions/pull/119)

## 2.0.1 (2021-02-26)

- Initial reworking of the Action to be TypeScript based
