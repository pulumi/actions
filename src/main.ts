import { makeConfig, Commands } from './config';
import * as pulumiCli from './libs/pulumi-cli';
import { invariant } from './libs/utils';
import { LocalWorkspace } from '@pulumi/pulumi/x/automation';
import * as core from '@actions/core';

(async () => {
  const config = await makeConfig();

  invariant(pulumiCli.isAvailable(), 'Pulumi CLI is not available.');

  const stack = await LocalWorkspace.selectStack({
    stackName: config.stackName,
    workDir: config.cwd,
  });

  core.startGroup(config.stackName);

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

  await actions[config.command]();

  core.endGroup();
})();
