import { resolve } from 'path';
import * as core from '@actions/core';
import { cacheFile } from '@actions/tool-cache';
import {
  ConfigMap,
  LocalProgramArgs,
  LocalWorkspace,
  LocalWorkspaceOptions,
  PluginInfo,
  Stack,
} from '@pulumi/pulumi/automation';
import invariant from 'ts-invariant';
import YAML from 'yaml';
import { Commands, Config } from './config';
import { environmentVariables } from './libs/envs';
import { handlePullRequestMessage } from './libs/pr';
import * as pulumiCli from './libs/pulumi-cli';
import { login } from './login';

function downloadOnly(cmd: Commands): boolean {
  return cmd === 'install';
}

const disableCache = false;

export const runAction = async (config: Config): Promise<void> => {

  await pulumiCli.downloadCli(config.options.pulumiVersion);

  if(downloadOnly(config.command)) {
    core.info("Pulumi has been successfully installed.");
    return;
  }
  core.info('Pulumi is going forward anyway!');

  await login(config.cloudUrl, environmentVariables.PULUMI_ACCESS_TOKEN);

  const workDir = resolve(
    environmentVariables.GITHUB_WORKSPACE,
    config.workDir,
  );
  core.debug(`Working directory resolved at ${workDir}`);

  const stackArgs: LocalProgramArgs = {
    stackName: config.stackName,
    workDir: workDir,
  };

  const stackOpts: LocalWorkspaceOptions = {};
  if (config.secretsProvider != '') {
    stackOpts.secretsProvider = config.secretsProvider;
  }

  const stack = await (config.upsert
    ? LocalWorkspace.createOrSelectStack(stackArgs, stackOpts)
    : LocalWorkspace.selectStack(stackArgs, stackOpts));

  const projectSettings = await stack.workspace.projectSettings();
  const projectName = projectSettings.name;

  const onOutput = (msg: string) => {
    core.debug(msg);
    core.info(msg);
  };

  if (config.configMap != '') {
    const configMap: ConfigMap = YAML.parse(config.configMap);
    await stack.setAllConfig(configMap);
  }

  if (config.refresh) {
    core.startGroup(`Refresh stack on ${config.stackName}`);
    await stack.refresh({ onOutput });
    core.endGroup();
  }

  core.startGroup(`pulumi ${config.command} on ${config.stackName}`);

  const actions: Record<Commands, () => Promise<string>> = {
    up: () => stack.up({ onOutput, ...config.options }).then((r) => r.stdout),
    update: () =>
      stack.up({ onOutput, ...config.options }).then((r) => r.stdout),
    refresh: () =>
      stack.refresh({ onOutput, ...config.options }).then((r) => r.stdout),
    destroy: () =>
      stack.destroy({ onOutput, ...config.options }).then((r) => r.stdout),
    preview: async () => {
      const { stdout, stderr } = await stack.preview(config.options);
      onOutput(stdout);
      onOutput(stderr);
      return stdout;
    },
    install: () => Promise.reject("Unreachable code. If you encounter this error, please file a bug at https://github.com/pulumi/actions/issues/new/choose"), // unreachable.
  };

  core.debug(`Running action ${config.command}`);
  const output = await actions[config.command]();
  core.debug(`Done running action ${config.command}`);

  core.setOutput('output', output);

  const outputs = await stack.outputs();

  for (const [outKey, outExport] of Object.entries(outputs)) {
    core.setOutput(outKey, outExport.value);
    if (outExport.secret) {
      core.setSecret(outExport.value);
    }
  }

  if (config.commentOnPr && config.isPullRequest) {
    core.debug(`Commenting on pull request`);
    invariant(config.githubToken, 'github-token is missing.');
    handlePullRequestMessage(config, projectName, output);
  }

  if (config.remove && config.command === 'destroy') {
    stack.workspace.removeStack(stack.name)
  }
  
  if(!disableCache) {
    await cachePlugins(stack);
  }

  core.endGroup();  
};

// NB: Another approach would be to use cacheDir, which caches an
//     entire directory. Using cacheDir, it's harder to version
//     individual plugins separate from the whole directory.
const cachePlugins = async (stack: Stack): Promise<string[]> => {
  const plugins = await stack.workspace.listPlugins();
  const cacheAll = plugins.map((plugin: PluginInfo) => {
    return cacheFile(plugin.path, plugin.name, plugin.name, plugin.version);
  });
  return Promise.all(cacheAll);
};