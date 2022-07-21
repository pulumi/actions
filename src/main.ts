import { resolve } from 'path';
import * as core from '@actions/core';
import {
  ConfigMap,
  LocalProgramArgs,
  LocalWorkspace,
  LocalWorkspaceOptions,
} from '@pulumi/pulumi/automation';
import YAML from 'yaml';
import invariant from 'ts-invariant';
import { Commands, makeConfig } from './config';
import { environmentVariables } from './libs/envs';
import { handlePullRequestMessage } from './libs/pr';
import * as pulumiCli from './libs/pulumi-cli';

const main = async () => {
  const config = await makeConfig()
  core.debug('Configuration is loaded')

  await pulumiCli.downloadCli(config.version)

  if (environmentVariables.PULUMI_ACCESS_TOKEN !== '') {
    core.debug(`Logging into Pulumi`)
    await pulumiCli.run('login')
  } else if (config.cloudUrl) {
    core.debug(`Logging into ${config.cloudUrl}`)
    await pulumiCli.run('login', config.cloudUrl)
  }

  const workDir = resolve(
    environmentVariables.GITHUB_WORKSPACE,
    config.workDir,
  )
  core.debug(`Working directory resolved at ${workDir}`)

  const stackArgs: LocalProgramArgs = {
    stackName: config.stackName,
    workDir: workDir,
  }

  const stackOpts: LocalWorkspaceOptions = {}
  if (config.secretsProvider != '') {
    stackOpts.secretsProvider = config.secretsProvider
  }

  const stack =
    await (config.upsert
      ? LocalWorkspace.createOrSelectStack(stackArgs, stackOpts)
      : LocalWorkspace.selectStack(stackArgs, stackOpts))

  const onOutput = (msg: string) => {
    core.debug(msg)
    core.info(msg)
  }

  if (config.configMap != '') {
    const configMap: ConfigMap = YAML.parse(config.configMap)
    await stack.setAllConfig(configMap)
  }

  if (config.configMap != '') {
    const configMap: ConfigMap = YAML.parse(config.configMap);
    await stack.setAllConfig(configMap);
  }

  if (config.refresh) {
    core.startGroup(`Refresh stack on ${config.stackName}`)
    await stack.refresh({ onOutput })
    core.endGroup()
  }

  core.startGroup(`pulumi ${config.command} on ${config.stackName}`)

  const actions: Record<Commands, () => Promise<string>> = {
    up: () => stack.up({ onOutput, ...config.options }).then(r => r.stdout),
    update: () => stack.up({ onOutput, ...config.options }).then(r => r.stdout),
    refresh: () => stack.refresh({ onOutput, ...config.options }).then(r => r.stdout),
    destroy: () => stack.destroy({ onOutput, ...config.options }).then(r => r.stdout),
    preview: async () => {
      const { stdout, stderr } = await stack.preview(config.options)
      onOutput(stdout)
      onOutput(stderr)
      return stdout
    },
  }

  core.debug(`Running action ${config.command}`)
  const output = await actions[config.command]()
  core.debug(`Done running action ${config.command}`)

  core.setOutput('output', output)

  const outputs = await stack.outputs()

  for (const [outKey, outExport] of Object.entries(outputs)) {
    core.setOutput(outKey, outExport.value)
    if (outExport.secret) {
      core.setSecret(outExport.value)
    }
  }

  if (config.commentOnPr && config.isPullRequest) {
    core.debug(`Commenting on pull request`);
    invariant(config.githubToken, 'github-token is missing.');
    handlePullRequestMessage(config, output);
  }

  if (config.downsert && config.command === 'destroy') {
    stack.workspace.removeStack(stack.name)
  }

  core.endGroup()
}
;(async () => {
  try {
    await main()
  } catch (err) {
    if (err.message.stderr) {
      core.setFailed(err.message.stderr)
    } else {
      core.setFailed(err.message)
    }
  }
})()
