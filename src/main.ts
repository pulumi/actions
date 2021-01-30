// import { promises as fs } from 'fs';
import { makeConfig, Commands } from './config';
import * as pulumiCli from './libs/pulumi-cli';
import { invariant } from './libs/utils';
import { LocalWorkspace } from '@pulumi/pulumi/x/automation';
import * as core from '@actions/core';
import { resolve } from 'path';
import { environmentVariables } from './libs/envs';

const main = async () => {
  const config = await makeConfig();
  core.debug('Configuration is loaded');

  invariant(pulumiCli.isAvailable(), 'Pulumi CLI is not available.');
  core.debug('Pulumi CLI is available');

  const workDir = resolve(environmentVariables.GITHUB_WORKSPACE, config.cwd);

  // invariant(
  //   await fs.access(workDir),
  //   `Could not access working directory: ${workDir}`,
  // );

  const stack = await LocalWorkspace.selectStack({
    stackName: config.stackName,
    workDir: workDir,
  });

  core.startGroup(`pulumi ${config.command} on ${config.stackName}`);

  const onOutput = (msg: string) => {
    core.debug(msg);
    core.info(msg);
  };

  const actions: Record<Commands, () => Promise<unknown>> = {
    up: () => stack.up({ onOutput }),
    refresh: () => stack.refresh({ onOutput }),
    destroy: () => stack.destroy({ onOutput }),
    preview: async () => {
      const preview = await stack.preview();
      preview.stdout && onOutput(preview.stdout);
      preview.stderr && onOutput(preview.stderr);
    },
  };

  core.debug(`Running action ${config.command}`);
  await actions[config.command]();
  core.debug(`Done running action ${config.command}`);

  core.endGroup();
};

(async () => {
  try {
    await main();
  } catch (err) {
    if (err.message.stderr) {
      core.setFailed(`eod: ${err.message.stderr}`);
    } else {
      core.setFailed(`eod: ${err.message}`);
    }
  }
})();
