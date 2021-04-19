import { resolve } from 'path';
import * as core from '@actions/core';
import { LocalProgramArgs, LocalWorkspace } from '@pulumi/pulumi/automation';
import { Commands, makeConfig } from './config';
import { environmentVariables } from './libs/envs';
import { addPullRequestMessage } from './libs/pr';
import * as pulumiCli from './libs/pulumi-cli';
import { invariant } from './libs/utils';

const main = async () => {
  const config = await makeConfig();
  core.debug('Configuration is loaded');

  invariant(pulumiCli.isAvailable(), 'Pulumi CLI is not available.');
  core.debug('Pulumi CLI is available');

  if (environmentVariables.PULUMI_ACCESS_TOKEN !== '') {
    core.debug(`Logging into to Pulumi`);
    await pulumiCli.run('login');
  } else if (config.cloudUrl) {
    core.debug(`Logging into to ${config.cloudUrl}`);
    await pulumiCli.run('login', config.cloudUrl);
  }

  const workDir = resolve(
    environmentVariables.GITHUB_WORKSPACE,
    config.workDir,
  );
  core.debug(`Working directory resolved at ${workDir}`);

  const stackArgs: LocalProgramArgs = {
    stackName: config.stackName,
    workDir: workDir,
  };

  const stack = await (config.upsert
    ? LocalWorkspace.createOrSelectStack(stackArgs)
    : LocalWorkspace.selectStack(stackArgs));

  const onOutput = (msg: string) => {
    core.debug(msg);
    core.info(msg);
  };

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

  if (config.commentOnPr) {
    core.debug(`Commenting on pull request`);
    invariant(config.githubToken, 'github-token is missing.');
    addPullRequestMessage(
      `#### :tropical_drink: \`${config.command}\`
\`\`\`
${output}
\`\`\``,
      config.githubToken,
    );
  }

  core.endGroup();
};

(async () => {
  try {
    await main();
  } catch (err) {
    if (err.message.stderr) {
      core.setFailed(err.message.stderr);
    } else {
      core.setFailed(err.message);
    }
  }
})();
