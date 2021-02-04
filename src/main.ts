import { makeConfig, Commands } from './config';
import * as pulumiCli from './libs/pulumi-cli';
import { invariant } from './libs/utils';
import { LocalWorkspace } from '@pulumi/pulumi/x/automation';
import * as core from '@actions/core';
import { resolve } from 'path';
import { environmentVariables } from './libs/envs';
import { addPullRequestMessage } from './libs/pr';

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

  const stack = await LocalWorkspace.selectStack({
    stackName: config.stackName,
    workDir: workDir,
  });

  core.startGroup(`pulumi ${config.command} on ${config.stackName}`);

  const onOutput = (msg: string) => {
    core.debug(msg);
    core.info(msg);
  };

  const actions: Record<Commands, () => Promise<string>> = {
    up: () => stack.up({ onOutput }).then((r) => r.stdout),
    refresh: () => stack.refresh({ onOutput }).then((r) => r.stdout),
    destroy: () => stack.destroy({ onOutput }).then((r) => r.stdout),
    preview: async () => {
      const preview = await stack.preview();
      preview.stdout && onOutput(preview.stdout);
      preview.stderr && onOutput(preview.stderr);
      return preview.stdout;
    },
  };

  core.debug(`Running action ${config.command}`);
  const output = await actions[config.command]();
  core.debug(`Done running action ${config.command}`);

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
