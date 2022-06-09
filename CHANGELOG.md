# CHANGELOG

## HEAD (Unreleased)

- fix: update PR comments correctly when `edit-pr-comment` is true (fixes
  [#633](https://github.com/pulumi/actions/issues/633))

---

## 3.18.0 (2022-06-09)

- Add configuration of Pulumi stack by `configMap` field

## 3.17.0 (2022-05-25)

- Fixes errors when pull request comment body is too large by trimming the body
  when above 64k characters

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

- Upgrade to Pulumi 3.0  
  **PLEASE NOTE:** This minimum version of the Pulumi CLI to work with this
  action has been updated to be 3.0.0. If this version requirement is not
  satisfied then the action will throw an error

## 2.3.0 (2021-04-15)

- Upgrade to v2.25.0 of Pulumi Automation API
  [#180](https://github.com/pulumi/actions/pull/180)  
  **PLEASE NOTE:** This minimum version of the Pulumi CLI to work with this
  action has been updated to be 2.25.0

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
