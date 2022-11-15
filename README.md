# Pulumi GitHub Actions

**PLEASE NOTE:** As of v3.1.0 of this GitHub Action, the end user no longer
needs to install the Pulumi CLI as part of their workflow!

Pulumi's GitHub Actions deploy apps and infrastructure to your cloud of choice,
using just your favorite language and GitHub. This includes previewing,
validating, and collaborating on proposed deployments in the context of Pull
Requests, and triggering deployments or promotions between different
environments by merging or directly committing code.

## Getting Started

```yaml
name: Pulumi
on:
  push:
    branches:
      - master
jobs:
  up:
    name: Preview
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: pulumi/actions@v3
        with:
          command: preview
          stack-name: org-name/stack-name
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```

This will check out the existing directory and run `pulumi preview`.

## Configuration

The action can be configured with the following arguments:

- `command` (required) - The command to run as part of the action. Accepted
  values are `up` (update), `refresh`, `destroy` and `preview`.

- `stack-name` (required) - The name of the stack that Pulumi will be operating
  on. Use the fully quaified org-name/stack-name when operating on a stack outside
  of your individual account.

- `work-dir` (optional) - The location of your Pulumi files. Defaults to `./`.

- `cloud-url` - (optional) - the Pulumi backend to login to. This would be the
  equivalent of what would be passed to the `pulumi login` command. The action
  will login to the appropriate backend on your behalf provided it is configured
  with the correct access credentials for that backend.

- `comment-on-pr` - (optional) If `true`, then the action will add the results
  of the Pulumi action to the PR

- `github-token` - (optional) A GitHub token that has access levels to allow the
  Action to comment on a PR. Defaults to `${{ github.token }}`

- `refresh` - (optional) If `true`, stack is refreshed before running the
  `command`.

- `secrets-provider` - (optional) The type of the provider that should be used
  to encrypt and decrypt secrets. Possible choices: `default`, `passphrase`,
  `awskms`, `azurekeyvault`, `gcpkms`, `hashivault`. e.g.
  `gcpkms://projects//locations/us-west1/keyRings/acmecorpsec/cryptoKeys/payroll `

- `color` - (optional) Colorize output. Choices are: always, never, raw, auto
  (default "auto").

### Extra options

- `parallel` - (optional) Allow P resource operations to run in parallel at once
  (1 for no parallelism). Defaults to unbounded.

- `message` - (optional) Optional message to associate with the update
  operation.

- `expect-no-changes` - (optional) Return an error if any changes occur during
  this update.

- `edit-pr-comment` - (optional) Edit previous PR comment instead of posting new
  one. **PLEASE NOTE:** that as of 3.2.0 of the Action, this now defaults to
  `true`. This is in an effort to reduce verbosity - if you want to have a
  comment per PR run, please ensure that you set this to `false`.

- `diff` - (optional) Display operation as a rich diff showing the overall
  change.

- `replace` - (optional) Specify resources to replace. Multiple resources can be
  specified one per line (example: `<value | string>,...`).

- `target` - (optional) Specify a single resource URN to update. Other resources
  will not be updated. Multiple resources can be specified one per line
  (example: `<value | string>,...`).

- `target-dependents` - (optional) Allows updating of dependent targets
  discovered but not specified in target.

- `config-map` - (optional) Configuration of the stack. Format Yaml string:
  `{<key | string>: {value: <value | string>, secret: <is_secret | boolean> },}`.

- `upsert` - (optional) Allows the creation of the specified stack if it
  currently doesn't exist. **PLEASE NOTE:** This will create a
  `Pulumi.<stack-name>.yaml` file that you will need to add back to source
  control as part of the action if you wish to perform any further tasks with
  that stack.
- `remove` - (optional) Removes the target stack if all resources are
  destroyed. Used only with `destroy` command.
- `pulumi-version` - (optional) Install a specific version of the Pulumi CLI.
  Defaults to "^3"

By default, this action will try to authenticate Pulumi with the
[Pulumi SaaS](https://app.pulumi.com/). If you have not specified a
`PULUMI_ACCESS_TOKEN` then you will need to specify an alternative backend via
the `cloud-url` argument.

### Stack Outputs

[Stack outputs](https://www.pulumi.com/docs/intro/concepts/stack/#outputs) are
available when using this action. When creating a stack as follows:

```go
package main

import (
	random "github.com/pulumi/pulumi-random/sdk/v2/go/random"
	"github.com/pulumi/pulumi/sdk/v2/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		p, err := random.NewRandomPet(ctx, "my-user-name", &random.RandomPetArgs{})
		if err != nil {
			return err
		}
		ctx.Export("pet-name", p)
		return nil
	})
}
```

We can see that `pet-name` is an output. To get the value of this output in the
action, we would use code similar to the following:

```yaml
- uses: pulumi/actions@v3
  id: pulumi
  env:
    PULUMI_CONFIG_PASSPHRASE: ${{ secrets.PULUMI_CONFIG_PASSPHRASE }}
  with:
    command: up
    cloud-url: gs://my-bucket
    stack-name: org-name/stack-name
- run: echo "My pet name is ${{ steps.pulumi.outputs.pet-name }}"
```

the `pet-name` is available as a named output

```
Run echo "My pet name is pretty-finch"
```

### Referencing Sensitive Values

We suggest that any sensitive environment variables be referenced using
[GitHub Secrets](https://developer.github.com/actions/creating-workflows/storing-secrets/),
and consuming them using
[the `secrets` attribute](https://developer.github.com/actions/creating-workflows/workflow-configuration-options/#actions-attributes)
on your workflow's action.

## Example workflows

The Pulumi GitHub action uses the Pulumi
[Automation API](https://www.pulumi.com/blog/automation-api/) in order to
coordinate the Pulumi operations. This means that there is no supporting
functionality for npm or pip installs. This functionality should be deferred to
the correct GitHub Marketplace actions that support it.

- [NodeJS Runtime + Pulumi Managed Backend](examples/nodejs-pulumi.yaml)
- [Python Runtime + Pulumi Managed Backend](examples/python-pulumi.yaml)
- [Go Runtime + Pulumi Managed Backend](examples/go-pulumi.yaml)
- [DotNet Runtime + Pulumi Managed Backend](examples/dotnet-pulumi.yaml)
- [NodeJS Runtime + AWS S3 Self Managed Backend](examples/nodejs-aws.yaml)
- [NodeJS Runtime + Google GCS Self Managed Backend](examples/nodejs-google.yaml)
- [NodeJS Runtime + Azure Blob Self Managed Backend](examples/nodejs-azure.yaml)
- [NodeJS Runtime + Local File System Self Managed Backend](examples/nodejs-local.yaml)

## Migrating from GitHub Action v1 (and beyond)?

Here are some pointers when migrating from v1 to v2 of our GitHub Action.

- The following inputs have changed from environment variables to action inputs:

  - `PULUMI_ROOT` is now `work-dir`
  - `PULUMI_BACKEND_URL` is now `cloud-url`
  - `COMMENT_ON_PR` is now `comment-on-pr`
  - `GITHUB_TOKEN` is now `github-token`

- `IS_PR_WORKFLOW` is no longer a viable input. The action is able to understand
  if the workflow is a pull_request due to action type

- The action now runs natively, so the action workflow needs to have the correct
  environment configured. There are
  [sample workflows available](https://github.com/pulumi/actions/tree/master/.github/workflows).
  For examples, if you are running a NodeJS (for example) app then you need to
  ensure that your action has NodeJS available to it:

```yaml
- uses: actions/setup-node@v1
with:
  node-version: 14.x
```

- The action will no longer run
  `npm ci | npm install | pip3 install | pipenv install`. Please ensure that you
  are installing your dependencies before Pulumi commands are executed, e.g.:

```
- run: pip install -r requirements
  working-directory: infra
```

## Release Cadence

As of `v3.18`, we are intending to move to a monthly cadence for minor releases.
Minor releases will be published around the beginning of the month. We may cut a
patch release instead, if the changes are small enough not to warrant a minor
release. We will also cut patch releases periodically as needed to address bugs.

## Node 12 Support Ending 2022-12-07

We intend this action to work for all GitHub users, both SaaS users and GitHub
Enterprise users. As such, this action will continue to use Node 12 until all
maintained versions of GitHub Enterprise have Node 16 support. This date is
2022-12-07, when GitHub Enterprise v3.3 is sunset. After 2022-12-07, this action
will upgrade to Node 16, and will no longer run on GitHub Actions runners
without Node 16 support.
