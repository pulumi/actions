# Pulumi GitHub Actions

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
      - uses: pulumi/action-install-pulumi-cli@v1
      - uses: pulumi/actions@v2
        with:
          command: preview
          stack-name: dev
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```

This will check out the existing directory and run `pulumi preview`. It's
important to note that the action requires the `pulumi` binary to be available.
It will not install it for you. For further reference on installing the Pulumi
binary as part of GitHub Actions, please use our
[`action-install-pulumi-cli`](https://github.com/pulumi/action-install-pulumi-cli)
action.

## Configuration

The action can be configured with the following arguments:

- `command` (required) - The command to pass to the Pulumi CLI. Accepted values
  are `up` (update), `refresh`, `destroy` and `preview`. This command is the
  equivalent of running `pulumi <command>` if your terminal.

- `stack-name` (required) - The name of the stack that Pulumi will be operating
  on

- `work-dir` (optional) - The location of your Pulumi files. Defaults to `./`.

- `cloud-url` - (optional) - the Pulumi backend to login to. This would be the
  equivalent of what would be passed to the `pulumi login` command. The action
  will login to the appropriate backend on your behalf provided it is configured
  with the correct access credentials for that backend.

- `comment-on-pr` - (optional) If `true`, then the action will add the results
  of the Pulumi action to the PR

- `github-token` - (required if comment-on-pr) A GitHub token that has access
  levels to allow the Action to comment on a PR.

- `refresh` - (optional) If `true`, stack is refreshed before running the
  `command`.

### Extra options

- `parallel` - (optional) Allow P resource operations to run in parallel at once
  (1 for no parallelism). Defaults to unbounded.

- `message` - (optional) Optional message to associate with the update operation

- `expect-no-changes` - (optional) Return an error if any changes occur during
  this update

- `diff` - (optional) Display operation as a rich diff showing the overall
  change

- `replace` - (optional) Specify resources to replace. Multiple resources can be
  specified one per line

- `target` - (optional) Specify a single resource URN to update. Other resources
  will not be updated. Multiple resources can be specified one per line

- `target-dependents` - (optional) Allows updating of dependent targets
  discovered but not specified in target.
- `upsert` - (optiona) Allows the creation of the specified stack if it
  currently doesn't exist.  
  **PLEASE NOTE:** This will create a Pulumi.<stack-name>.yaml file that you
  will need to add back to source control as part of the action if you wish to
  perform any further tasks with that stack.

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
- uses: pulumi/actions@v2
  id: pulumi
  env:
    PULUMI_CONFIG_PASSPHRASE: ${{ secrets.PULUMI_CONFIG_PASSPHRASE }}
  with:
    command: up
    cloud-url: gs://my-bucket
    stack-name: dev
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

### Pulumi - NodeJS Runtime + Pulumi Managed Backend

```yaml
name: Pulumi
on:
  push:
    branches:
      - master
jobs:
  up:
    name: Update
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install pulumi
        uses: pulumi/action-install-pulumi-cli@v1.0.1
      - name: Setup Node
        uses: actions/setup-node@v1
        with:
          node-version: 14.x
      - run: npm install
      - uses: pulumi/actions@v2
        with:
          command: up
          stack-name: dev
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```

### Pulumi - Python Runtime + Pulumi Managed Backend

```yaml
name: Pulumi
on:
  push:
    branches:
      - master
jobs:
  up:
    name: Update
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.9
      - name: Install pulumi
        uses: pulumi/action-install-pulumi-cli@v1.0.1
      - run: pip install -r requirements.txt
      - uses: pulumi/actions@v2
        with:
          command: up
          stack-name: dev
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```

### Pulumi - Go Runtime + Pulumi Managed Backend

```yaml
name: Pulumi
on:
  push:
    branches:
      - master
jobs:
  up:
    name: Update
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-go@v2
        with:
          go-version: '1.15'
      - name: Install pulumi
        uses: pulumi/action-install-pulumi-cli@v1.0.1
      - run: go mod download
      - uses: pulumi/actions@v2
        with:
          command: up
          stack-name: dev
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```

### Pulumi - DotNet Runtime + Pulumi Managed Backend

```yaml
name: Pulumi
on:
  push:
    branches:
      - master
jobs:
  up:
    name: Update
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup DotNet
        uses: actions/setup-dotnet@v1
        with:
          dotnet-version: 3.1
      - name: Install pulumi
        uses: pulumi/action-install-pulumi-cli@v1.0.1
      - uses: pulumi/actions@v2
        with:
          command: up
          stack-name: dev
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```

### Pulumi - NodeJS Runtime + AWS S3 Self Managed Backend

```yaml
name: Pulumi
on:
  push:
    branches:
      - master
jobs:
  up:
    name: Update
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup DotNet
        uses: actions/setup-dotnet@v1
        with:
          dotnet-version: 3.1
      - name: Install pulumi
        uses: pulumi/action-install-pulumi-cli@v1.0.1
      - uses: pulumi/actions@v2
        with:
          command: up
          stack-name: dev
          cloud-url: s3://my-bucket-name
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: 'us-west-2'
```

### Pulumi - NodeJS Runtime + Google GCS Self Managed Backend

```yaml
name: Pulumi
on:
  push:
    branches:
      - master
jobs:
  up:
    name: Update
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-nodejs@v2
        with:
          node-version: 14.x
      - uses: google-github-actions/setup-gcloud@master
        with:
          service_account_key: ${{ secrets.GCP_KEY }}
          project_id: ${{ env.PROJECT_ID }}
          export_default_credentials: true
      - name: Install pulumi
        uses: pulumi/action-install-pulumi-cli@v1.0.1
      - uses: pulumi/actions@v2
        with:
          command: up
          stack-name: dev
          cloud-url: gs://my-bucket-name
```

### Pulumi - NodeJS Runtime + Azure Blob Self Managed Backend

```yaml
name: Pulumi
on:
  push:
    branches:
      - master
jobs:
  up:
    name: Update
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup DotNet
        uses: actions/setup-dotnet@v1
        with:
          dotnet-version: 3.1
      - name: Install pulumi
        uses: pulumi/action-install-pulumi-cli@v1.0.1
      - uses: pulumi/actions@v2
        with:
          command: up
          stack-name: dev
          cloud-url: azblob://my-blob-name-and-path
        env:
          AZURE_STORAGE_ACCOUNT: ${{ secrets.AZURE_STORAGE_ACCOUNT }}
          AZURE_STORAGE_KEY: ${{ secrets.AZURE_STORAGE_KEY }}
          AZURE_KEYVAULT_AUTH_VIA_CLI: true
```

### Pulumi - NodeJS Runtime + Local File System Self Managed Backend

```yaml
name: Pulumi
on:
  push:
    branches:
      - master
jobs:
  up:
    name: Update
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup DotNet
        uses: actions/setup-dotnet@v1
        with:
          dotnet-version: 3.1
      - name: Install pulumi
        uses: pulumi/action-install-pulumi-cli@v1.0.1
      - uses: pulumi/actions@v2
        with:
          command: up
          stack-name: dev
          cloud-url: file://~
```

## Migrating from GitHub Action v1?

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
