# Pulumi GitHub Actions

Pulumi's GitHub Actions deploy apps and infrastructure to your cloud of choice, using just your favorite language
and GitHub. This includes previewing, validating, and collaborating on proposed deployments in the context of Pull
Requests, and triggering deployments or promotions between different environments by merging or directly committing code.

**Note**: This repository contains samples and additional documentation for using Pulumi's [Github Action](https://github.com/marketplace/actions/install-pulumi-cli).
Currently, this is a Docker container based action. If you're looking for the code that builds that container, [you'll find it
here](https://github.com/pulumi/pulumi/tree/master/docker/actions).

## Getting Started

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
      - uses: pulumi/actions@v1
        with:
          command: up
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```

This will check out the existing directory and run `pulumi up`. The full list of configuration values can be found below.

## Configuring pulumi-action

The pulumi-action can be configured in 2 ways:

* Command Arg
* Environment Variables

### Command Arg

This argument is a required argument. This is the command to pass to the Pulumi CLI. It can include the values `preview`,
`up`, `destroy` etc. This command is the equivalent of running `pulumi <command>` if your terminal.

### Environment Variables

There are a number of Environment Variables that can be set to interact with the action:

* By default, Pulumi will try to connect to the [Pulumi SaaS](https://app.pulumi.com/). For this to happen, the GitHub Action needs
to be passed a `PULUMI_ACCESS_TOKEN`.

* If you want to specify an [alternative Pulumi backend](https://www.pulumi.com/docs/intro/concepts/state/#to-a-self-managed-backend) then
you can do so with the `PULUMI_BACKEND_URL` env var.
  
* If you want to specify a specific stack for Pulumi to use then you can set `PULUMI_STACK_NAME`, othewise Pulumi will try and use

* If the Pulumi project is not in the current repo root then set `PULUMI_ROOT` to specify a directory path to the project.

* If your action is running as part of a pull request workflow then you can tell Pulumi to take the ref of the target 
  branch i.e. a PR to master will use the master branch as the target for a preview, then you can set `IS_PR_WORKFLOW: true`. 

* If you would like the action to write back to the PR then you can do so by setting:
  `COMMENT_ON_PR: 1` on the action. This will also require `GITHUB_TOKEN` to be set as an environment variable

* If you would like to use a specific yarn workspace set `USE_YARN_WORKSPACE`.

## Referencing Sensitive Values

We suggest that any sensitive environment variables be referenced using using
[GitHub Secrets](https://developer.github.com/actions/creating-workflows/storing-secrets/), and consuming
them using [the `secrets` attribute](
https://developer.github.com/actions/creating-workflows/workflow-configuration-options/#actions-attributes)
on your workflow's action.

## Example workflows

### Master Builds

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
      - uses: actions/checkout@v1
      - uses: pulumi/actions@v0.0.2
        with:
          command: up
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```

### Pull Request Builds

```yaml
name: Pulumi
on:
  - pull_request
jobs:
  preview:
    name: Preview
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: pulumi/actions@v0.0.2
        with:
          command: preview
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          IS_PR_WORKFLOW: true
          COMMENT_ON_PR: 1
```

## Sample Interactions with a number of Cloud Providers

Below are some quick tips on using Pulumi's GitHub Actions support with your cloud provider.

> If your cloud of choice isn't listed, that doesn't necessarily mean Pulumi doesn't support it; please see
> [Pulumi's Cloud Providers page](https://www.pulumi.com/docs/intro/cloud-providers/) for more documentation on the individual
> providers available.

### Amazon Web Services (AWS)

For AWS, you'll need to create or use or use an existing IAM user for your action. Please see
[the Pulumi documentation page](https://pulumi.io/quickstart/aws/setup.html#environment-variables) for pointers
to the relevant AWS documentation for doing this.

As soon as you have an AWS user in hand, you'll set the environment variables `AWS_ACCESS_KEY_ID` and
`AWS_SECRET_ACCESS_KEY` using GitHub Secrets, and then consume them in your action:

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
      - uses: pulumi/actions@v1
        with:
          command: up
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```

Failure to configure this correctly will lead to an error message.

### Microsoft Azure

For Azure, you'll need to create or use an existing Azure Service Principal for your action. Please see
[the Pulumi documentation page](https://pulumi.io/quickstart/azure/setup.html#service-principal-authentication) for
pointers to the relevant Azure documentation for doing this.

As soon as you have a service principal in hand, you'll set the environment variables `ARM_SUBSCRIPTION_ID`,
`ARM_CLIENT_ID`, `ARM_CLIENT_SECRET`, and `ARM_TENANT_ID` using GitHub Secrets, and consume them in your action:

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
      - uses: pulumi/actions@v1
        with:
          command: up
        env:
          ARM_SUBSCRIPTION_ID: ${{ secrets.ARM_SUBSCRIPTION_ID }}
          ARM_CLIENT_ID: ${{ secrets.ARM_CLIENT_ID }}
          ARM_CLIENT_SECRET: ${{ secrets.ARM_CLIENT_SECRET }}
          ARM_TENANT_ID: ${{ secrets.ARM_TENANT_ID }}
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```

Failure to configure this correctly will lead to the error message `Error building AzureRM Client: Azure CLI
Authorization Profile was not found. Please ensure the Azure CLI is installed and then log-in with 'az login'`.

### Google Cloud Platform

For GCP, you'll need to create or use or use an existing service account key. Please see
[the Pulumi documentation page](https://pulumi.io/quickstart/gcp/setup.html) for pointers
to the relevant GCP documentation for doing this.

As soon as you have credentials in hand, you'll set the environment variable `GOOGLE_CREDENTIALS` to contain the
credentials JSON using GitHub Secrets, and then consume it in your action:

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
      - uses: pulumi/actions@v1
        with:
          command: up
        env:
          GOOGLE_CREDENTIALS: ${{ secrets.GOOGLE_CREDENTIALS }}
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```

Failure to configure this correctly will lead to an error message.
