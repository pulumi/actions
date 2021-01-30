// import { promises as fs } from 'fs';
import { makeConfig, Commands } from './config';
import * as pulumiCli from './libs/pulumi-cli';
import { invariant } from './libs/utils';
import { LocalWorkspace } from '@pulumi/pulumi/x/automation';
import * as core from '@actions/core';
import { exec } from './libs/exec';
import { resolve } from 'path';
import { environmentVariables } from './libs/envs';

const main = async () => {
  const config = await makeConfig();
  core.debug('Configuration is loaded.');

  invariant(pulumiCli.isAvailable(), 'Pulumi CLI is not available.');
  core.debug('Pulumi CLI is available');

  const workDir = resolve(environmentVariables.GITHUB_WORKSPACE, config.cwd);

  const res = await exec('ls -l');
  console.log(res);

  const res2 = await exec(`ls -l ${workDir}`);
  console.log(res2);

  // invariant(
  //   await fs.access(workDir),
  //   `Could not access working directory: ${workDir}`,
  // );

  const stack = await LocalWorkspace.selectStack({
    stackName: config.stackName,
    workDir: config.cwd,
  });
  console.log(stack);
  console.log('startGrouping', config.stackName);
  core.startGroup(config.stackName);
  console.log('startGrouping: E', config.stackName);

  const onOutput = (msg: string) => {
    console.log(msg);
    core.info(msg);
  };

  const actions: Record<Commands, () => Promise<unknown>> = {
    up: () => stack.up({ onOutput }),
    refresh: () => stack.refresh({ onOutput }),
    destroy: () => stack.destroy({ onOutput }),
    preview: async () => {
      const preview = await stack.up();
      onOutput(preview.stdout);
      onOutput(preview.stderr);
      console.log(preview.outputs);
      return preview;
    },
  };

  console.log(`Running action ${config.command}`, config);
  await actions[config.command]();
  console.log(`Done running action ${config.command}`, config);

  core.endGroup();
};

try {
  main().then(console.log);
} catch (e) {
  core.error(e.message);
}
