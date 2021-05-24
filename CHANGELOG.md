# CHANGELOG

## HEAD (Unreleased)

- Edit previous PR comment instead of posting new one
  [#128](https://github.com/pulumi/actions/pull/148)
- Embed installation of Pulumi CLI

---

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
